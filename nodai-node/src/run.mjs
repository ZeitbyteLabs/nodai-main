import { loadConfig } from './config.mjs';
import { completeJob, pullNextJob, sendHeartbeat } from './platform.mjs';
import { checkVllm, runInference } from './vllm.mjs';

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function log(message) {
	const time = new Date().toISOString().slice(11, 19);
	console.log(`[${time}] ${message}`);
}

/**
 * Main worker loop: heartbeat, pull jobs, run vLLM, submit results.
 */
export async function runWorker(config, { once = false } = {}) {
	log(`${config.label ?? 'This PC'} is online`);
	log(`Website: ${config.platformUrl}`);
	log(`Local AI: ${config.vllmUrl}`);

	const health = await checkVllm(config);
	const servedModel = health.models[0] ?? '';
	log(`vLLM models: ${health.models.join(', ') || 'none'}`);

	let lastHeartbeat = 0;
	let running = true;

	const shutdown = () => {
		if (!running) return;
		running = false;
		log('Shutting down…');
	};

	process.on('SIGINT', shutdown);
	process.on('SIGTERM', shutdown);

	while (running) {
		const now = Date.now();

		if (now - lastHeartbeat >= config.heartbeatIntervalMs) {
			try {
				await sendHeartbeat(config, servedModel);
				lastHeartbeat = now;
			} catch (error) {
				log(`Heartbeat failed: ${error.message}`);
			}
		}

		let job = null;
		try {
			const body = await pullNextJob(config);
			job = body.job;
		} catch (error) {
			log(`Pull failed: ${error.message}`);
			await sleep(config.pollIntervalMs);
			continue;
		}

		if (!job) {
			if (once) break;
			await sleep(config.pollIntervalMs);
			continue;
		}

		log(`Got a job — running it on your GPU…`);

		try {
			const result = await runInference(config, job);
			const completed = await completeJob(config, job.id, {
				response: result.response,
				tokens_used: result.tokensUsed,
				completion_tokens: result.completionTokens,
				prompt_tokens: result.promptTokens,
				latency_ms: result.latencyMs,
				status: 'completed'
			});
			const tokenLabel = result.completionTokens ?? result.tokensUsed;
			log(
				`Done. Sent the answer back` +
					(tokenLabel ? ` (${tokenLabel} output tokens)` : '') +
					(typeof completed?.host_reward === 'number' && completed.host_reward > 0
						? ` · host earned ${completed.host_reward} NOD`
						: '')
			);
		} catch (error) {
			log(`Job failed: ${error.message}`);
			try {
				await completeJob(config, job.id, { status: 'failed', response: '' });
			} catch (completeError) {
				log(`Could not report failure: ${completeError.message}`);
			}
		}

		if (once) break;
	}

	log('Stopped.');
}

export async function runOnce() {
	const config = loadConfig();
	await runWorker(config, { once: true });
}

export async function runForever(config = loadConfig()) {
	await runWorker(config);
}
