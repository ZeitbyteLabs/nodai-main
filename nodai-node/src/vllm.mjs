/** Minimal OpenAI-compatible client for a local vLLM server. */

function headers(apiKey) {
	const h = { 'content-type': 'application/json' };
	if (apiKey) h.authorization = `Bearer ${apiKey}`;
	return h;
}

export async function checkVllm(config) {
	const response = await fetch(`${config.vllmUrl}/v1/models`, {
		headers: headers(config.vllmApiKey),
		signal: AbortSignal.timeout(5000)
	});

	if (!response.ok) {
		throw new Error(`vLLM health check failed (${response.status}).`);
	}

	const body = await response.json();
	const models = (body.data ?? []).map((m) => m.id);
	return { ok: true, models };
}

/**
 * Runs a chat completion against local vLLM.
 * Uses the model name from the job, falling back to the first served model.
 */
export async function runInference(config, job) {
	const started = Date.now();

	let model = job.vllm_model_name;
	if (!model) {
		const health = await checkVllm(config);
		model = health.models[0];
	}
	if (!model) throw new Error('No model available on vLLM.');

	const response = await fetch(`${config.vllmUrl}/v1/chat/completions`, {
		method: 'POST',
		headers: headers(config.vllmApiKey),
		signal: AbortSignal.timeout(300_000),
		body: JSON.stringify({
			model,
			messages: [{ role: 'user', content: job.prompt }],
			temperature: job.temperature ?? 0.7,
			max_tokens: job.max_tokens ?? 512,
			stream: false
		})
	});

	const body = await response.json().catch(() => null);
	if (!response.ok) {
		const detail = body?.error?.message ?? JSON.stringify(body)?.slice(0, 200);
		throw new Error(`vLLM inference failed (${response.status}): ${detail}`);
	}

	const text = body?.choices?.[0]?.message?.content?.trim() ?? '';
	const usage = body?.usage ?? {};
	const promptTokens = Number.isFinite(usage.prompt_tokens) ? Number(usage.prompt_tokens) : null;
	const completionTokens = Number.isFinite(usage.completion_tokens)
		? Number(usage.completion_tokens)
		: null;
	const totalTokens = Number.isFinite(usage.total_tokens) ? Number(usage.total_tokens) : null;

	return {
		response: text,
		promptTokens,
		completionTokens,
		tokensUsed: completionTokens ?? totalTokens,
		latencyMs: Date.now() - started,
		model
	};
}
