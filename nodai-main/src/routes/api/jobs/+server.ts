import { error, json } from '@sveltejs/kit';
import { INFERENCE_LIMITS } from '$lib/config';
import { reserveForMaxTokens } from '$lib/pricing';
import { createAdminClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

function clamp(value: number, min: number, max: number) {
	return Math.min(max, Math.max(min, value));
}

/**
 * Queues an inference job for a GPU node to pick up.
 * Reserves NOD for max_tokens up front; unused reserve is refunded on complete.
 */
export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) error(401, 'Sign in to queue a job.');

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
	const reserved = reserveForMaxTokens(maxTokens);

	const admin = createAdminClient();

	const { data: model } = await admin
		.from('models')
		.select('id, is_active')
		.eq('id', modelId)
		.maybeSingle();

	if (!model || !model.is_active) error(404, 'That model is not available.');

	const { data: balanceAfterDebit, error: debitError } = await admin.rpc('debit_nod', {
		p_user_id: user.id,
		p_amount: reserved
	});

	if (debitError) {
		if (debitError.message.includes('INSUFFICIENT_NOD_BALANCE')) {
			error(402, `Not enough NOD. This run reserves up to ${reserved} NOD.`);
		}
		error(500, 'Could not reserve NOD for this job.');
	}

	const { data: job, error: jobError } = await admin
		.from('inference_jobs')
		.insert({
			user_id: user.id,
			model_id: model.id,
			prompt,
			temperature,
			max_tokens: maxTokens,
			status: 'queued'
		})
		.select('id, status, created_at')
		.single();

	if (jobError || !job) {
		await admin.rpc('credit_nod', { p_user_id: user.id, p_amount: reserved });
		error(500, 'Could not queue the job.');
	}

	await admin.from('transactions').insert({
		user_id: user.id,
		type: 'consumption',
		amount: reserved,
		status: 'confirmed',
		job_id: job.id
	});

	return json(
		{
			job_id: job.id,
			status: job.status,
			reserved,
			cost: reserved,
			max_tokens: maxTokens,
			balance: Number(balanceAfterDebit),
			created_at: job.created_at
		},
		{ status: 201 }
	);
};
