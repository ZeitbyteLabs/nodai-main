import { env } from '$env/dynamic/private';

/**
 * Minimal client for a vLLM OpenAI-compatible server.
 *
 * Read from dynamic env so the endpoint can be pointed at a new GPU box
 * without rebuilding the app.
 */

export type StreamOptions = {
	model: string;
	prompt: string;
	temperature: number;
	maxTokens: number;
	signal?: AbortSignal;
};

export type Usage = {
	promptTokens: number;
	completionTokens: number;
	totalTokens: number;
};

export class VllmError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'VllmError';
	}
}

function baseUrl() {
	return (env.VLLM_API_URL ?? '').trim().replace(/\/+$/, '');
}

export function isVllmConfigured() {
	return baseUrl().length > 0;
}

function authHeaders(contentType?: string): Record<string, string> {
	const headers: Record<string, string> = {};
	if (contentType) headers['content-type'] = contentType;
	const apiKey = (env.VLLM_API_KEY ?? '').trim();
	if (apiKey) headers.authorization = `Bearer ${apiKey}`;
	return headers;
}

/** Model IDs currently loaded on the vLLM server. */
export async function listServedModels(): Promise<string[]> {
	const url = baseUrl();
	if (!url) return [];

	try {
		const response = await fetch(`${url}/v1/models`, {
			headers: authHeaders(),
			signal: AbortSignal.timeout(4000)
		});
		if (!response.ok) return [];

		const body = (await response.json()) as { data?: { id?: string }[] };
		return (body.data ?? []).map((entry) => entry.id).filter((id): id is string => !!id);
	} catch {
		return [];
	}
}

/**
 * Pick the model name to send to vLLM. Prefers the configured DB name, then
 * VLLM_MODEL env override, then the only loaded model (single-server dev).
 */
export async function resolveModelName(configured: string): Promise<string> {
	const served = await listServedModels();
	if (served.length === 0) {
		throw new VllmError('Inference server returned no loaded models.', 502);
	}

	const override = (env.VLLM_MODEL ?? '').trim();
	if (override) {
		if (served.includes(override)) return override;
		throw new VllmError(
			`VLLM_MODEL "${override}" is not loaded. Available: ${served.join(', ')}.`,
			502
		);
	}

	if (served.includes(configured)) return configured;

	if (served.length === 1) return served[0]!;

	throw new VllmError(
		`Model "${configured}" is not loaded on the inference server. Available: ${served.join(', ')}.`,
		502
	);
}

/**
 * Opens a streaming chat completion. The upstream request is awaited here so
 * connection failures surface before the caller commits to a response stream.
 */
export async function openCompletionStream({
	model,
	prompt,
	temperature,
	maxTokens,
	signal
}: StreamOptions) {
	const url = baseUrl();
	if (!url) throw new VllmError('Inference endpoint is not configured.', 503);

	const resolvedModel = await resolveModelName(model);

	let response: Response;
	try {
		response = await fetch(`${url}/v1/chat/completions`, {
			method: 'POST',
			headers: authHeaders('application/json'),
			signal,
			body: JSON.stringify({
				model: resolvedModel,
				messages: [{ role: 'user', content: prompt }],
				temperature,
				max_tokens: maxTokens,
				stream: true,
				stream_options: { include_usage: true }
			})
		});
	} catch {
		throw new VllmError('Could not reach the inference server.', 502);
	}

	if (!response.ok || !response.body) {
		const detail = await response.text().catch(() => '');
		const message =
			response.status === 401 || response.status === 403
				? 'Inference server rejected the API key.'
				: `Inference server returned ${response.status}. ${detail.slice(0, 200)}`.trim();
		throw new VllmError(message, 502);
	}

	return response.body;
}

export type StreamChunk = { type: 'delta'; text: string } | { type: 'usage'; usage: Usage };

/** Parses an OpenAI-style `text/event-stream` body into text deltas and usage. */
export async function* parseCompletionStream(
	body: ReadableStream<Uint8Array>
): AsyncGenerator<StreamChunk> {
	const reader = body.getReader();
	const decoder = new TextDecoder();
	let buffer = '';

	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) break;

			buffer += decoder.decode(value, { stream: true });

			// SSE events are separated by a blank line.
			let boundary = buffer.indexOf('\n\n');
			while (boundary !== -1) {
				const rawEvent = buffer.slice(0, boundary);
				buffer = buffer.slice(boundary + 2);
				boundary = buffer.indexOf('\n\n');

				for (const line of rawEvent.split('\n')) {
					if (!line.startsWith('data:')) continue;

					const payload = line.slice(5).trim();
					if (!payload || payload === '[DONE]') continue;

					let parsed: {
						choices?: { delta?: { content?: string | null } }[];
						usage?: {
							prompt_tokens?: number;
							completion_tokens?: number;
							total_tokens?: number;
						} | null;
					};

					try {
						parsed = JSON.parse(payload);
					} catch {
						continue;
					}

					const text = parsed.choices?.[0]?.delta?.content;
					if (text) yield { type: 'delta', text };

					if (parsed.usage) {
						yield {
							type: 'usage',
							usage: {
								promptTokens: parsed.usage.prompt_tokens ?? 0,
								completionTokens: parsed.usage.completion_tokens ?? 0,
								totalTokens: parsed.usage.total_tokens ?? 0
							}
						};
					}
				}
			}
		}
	} finally {
		reader.releaseLock();
	}
}

/** Liveness probe used by the playground to show endpoint status. */
export async function checkHealth(): Promise<boolean> {
	const models = await listServedModels();
	return models.length > 0;
}
