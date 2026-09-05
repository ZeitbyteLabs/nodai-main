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
	log(`Node ${config.nodeId.slice(0, 8)}… online`);
	log(`Platform: ${config.platformUrl}`);
	log(`vLLM:     ${config.vllmUrl}`);

	const health = await checkVllm(config);
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
				await sendHeartbeat(config);
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

		log(`Job ${job.id.slice(0, 8)}… — "${job.prompt.slice(0, 48)}${job.prompt.length > 48 ? '…' : ''}"`);

		try {
			const result = await runInference(config, job);
			await completeJob(config, job.id, {
				response: result.response,
				tokens_used: result.tokensUsed,
				latency_ms: result.latencyMs,
				status: 'completed'
			});
			log(
				`Completed in ${result.latencyMs}ms` +
					(result.tokensUsed ? ` (${result.tokensUsed} tokens)` : '')
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

export async function runForever() {
	const config = loadConfig();
	await runWorker(config);
}
