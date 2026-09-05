import { error } from '@sveltejs/kit';
import { NOD, INFERENCE_LIMITS } from '$lib/config';
import { createAdminClient } from '$lib/server/supabase-admin';
import {
	VllmError,
	isVllmConfigured,
	openCompletionStream,
	parseCompletionStream
} from '$lib/server/vllm';
import type { RequestHandler } from './$types';

/** Server-sent event frame. */
function sse(payload: unknown) {
	return `data: ${JSON.stringify(payload)}\n\n`;
}

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) error(401, 'Sign in to run inference.');
	if (!isVllmConfigured()) {
		error(503, 'Inference endpoint is not configured yet. Set VLLM_API_URL.');
	}

	const body = await request.json().catch(() => null);
	const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
	const modelId = typeof body?.model_id === 'string' ? body.model_id : '';

	if (!prompt) error(400, 'A prompt is required.');
	if (prompt.length > INFERENCE_LIMITS.maxPromptChars) {
		error(400, `Prompt must be under ${INFERENCE_LIMITS.maxPromptChars} characters.`);
	}
	if (!modelId) error(400, 'A model_id is required.');

	const temperature = clamp(
		Number.isFinite(body?.temperature)
			? Number(body.temperature)
			: INFERENCE_LIMITS.defaultTemperature,
		INFERENCE_LIMITS.minTemperature,
		INFERENCE_LIMITS.maxTemperature
	);
	const maxTokens = Math.round(
		clamp(
			Number.isFinite(body?.max_tokens)
				? Number(body.max_tokens)
				: INFERENCE_LIMITS.defaultMaxTokens,
			INFERENCE_LIMITS.minMaxTokens,
			INFERENCE_LIMITS.maxMaxTokens
		)
	);

	const admin = createAdminClient();

	const { data: model } = await admin
		.from('models')
		.select('id, vllm_model_name, is_active')
		.eq('id', modelId)
		.maybeSingle();

	if (!model || !model.is_active) error(404, 'That model is not available.');
	if (!model.vllm_model_name) error(503, 'That model has no inference target configured.');

	// --- Charge before running so a run can never be free. -------------------
	const { data: balanceAfterDebit, error: debitError } = await admin.rpc('debit_nod', {
		p_user_id: user.id,
		p_amount: NOD.costPerInference
	});

	if (debitError) {
		if (debitError.message.includes('INSUFFICIENT_NOD_BALANCE')) {
			error(402, `Not enough NOD. Each run costs ${NOD.costPerInference} NOD.`);
		}
		error(500, 'Could not reserve NOD for this run.');
	}

	const { data: job } = await admin
		.from('inference_jobs')
		.insert({
			user_id: user.id,
			model_id: model.id,
			prompt,
			status: 'running'
		})
		.select('id')
		.single();

	const { data: consumption } = await admin
		.from('transactions')
		.insert({
			user_id: user.id,
			type: 'consumption',
			amount: NOD.costPerInference,
			status: 'confirmed',
			job_id: job?.id ?? null
		})
		.select('id')
		.single();

	/** Undo the charge and mark the job failed when the run never produced output. */
	async function refund() {
		await admin.rpc('credit_nod', { p_user_id: user!.id, p_amount: NOD.costPerInference });
		if (consumption?.id) {
			await admin.from('transactions').update({ status: 'failed' }).eq('id', consumption.id);
		}
		if (job?.id) {
			await admin
				.from('inference_jobs')
				.update({ status: 'failed', completed_at: new Date().toISOString() })
				.eq('id', job.id);
		}
	}

	const startedAt = Date.now();

	let upstream: ReadableStream<Uint8Array>;
	try {
		upstream = await openCompletionStream({
			model: model.vllm_model_name,
			prompt,
			temperature,
			maxTokens
		});
	} catch (cause) {
		await refund();
		const status = cause instanceof VllmError ? cause.status : 502;
		const message = cause instanceof VllmError ? cause.message : 'Inference failed.';
		error(status, message);
	}

	const encoder = new TextEncoder();

	const stream = new ReadableStream<Uint8Array>({
		async start(controller) {
			let text = '';
			let promptTokens = 0;
			let completionTokens = 0;

			const send = (payload: unknown) => controller.enqueue(encoder.encode(sse(payload)));

			send({
				type: 'start',
				job_id: job?.id ?? null,
				cost: NOD.costPerInference,
				balance: Number(balanceAfterDebit)
			});

			try {
				for await (const chunk of parseCompletionStream(upstream)) {
					if (chunk.type === 'delta') {
						text += chunk.text;
						send({ type: 'delta', text: chunk.text });
					} else {
						promptTokens = chunk.usage.promptTokens;
						completionTokens = chunk.usage.completionTokens;
					}
				}
			} catch {
				await refund();
				send({ type: 'error', message: 'The inference stream was interrupted. NOD refunded.' });
				controller.close();
				return;
			}

			const latencyMs = Date.now() - startedAt;

			// vLLM only reports usage when the stream completes cleanly.
			const tokensUsed = promptTokens + completionTokens;

			if (!text) {
				await refund();
				send({ type: 'error', message: 'The model returned no output. NOD refunded.' });
				controller.close();
				return;
			}

			if (job?.id) {
				await admin
					.from('inference_jobs')
					.update({
						response: text,
						tokens_used: tokensUsed || null,
						latency_ms: latencyMs,
						status: 'completed',
						completed_at: new Date().toISOString()
					})
					.eq('id', job.id);
			}

			// Phase 3: the run earns an on-chain reward and the platform takes a
			// fee. The reward is recorded as pending here and settled by
			// /api/nod/claim, so a slow RPC never stalls the response stream.
			let rewardPending = false;
			if (job?.id) {
				const { error: rewardError } = await admin.rpc('record_run_rewards', {
					p_user_id: user!.id,
					p_job_id: job.id,
					p_reward: NOD.rewardPerInference,
					p_fee: NOD.feePerInference
				});
				rewardPending = !rewardError;
			}

			send({
				type: 'done',
				tokens_used: tokensUsed,
				prompt_tokens: promptTokens,
				completion_tokens: completionTokens,
				latency_ms: latencyMs,
				balance: Number(balanceAfterDebit),
				reward: rewardPending ? NOD.rewardPerInference : 0,
				fee: rewardPending ? NOD.feePerInference : 0
			});
			controller.close();
		}
	});

	return new Response(stream, {
		headers: {
			'content-type': 'text/event-stream',
			'cache-control': 'no-cache, no-transform',
			connection: 'keep-alive'
		}
	});
};
