import { configPath, loadConfig, maskToken, resolvePlatformUrl, resolveVllmUrl, saveConfig } from './config.mjs';
import { listNodes, registerNode } from './platform.mjs';
import { checkVllm } from './vllm.mjs';
import { runForever, runOnce } from './run.mjs';

function usage() {
	console.log(`
NodAI GPU Node CLI

Usage:
  nodai-node register --platform <url> --label <name> [--vllm <url>]
  nodai-node run              Start the worker loop (heartbeat + jobs)
  nodai-node run --once       Process one job then exit
  nodai-node status           Check platform + vLLM connectivity
  nodai-node config           Show saved config

Environment:
  NODAI_PLATFORM_URL   Platform base URL (default http://localhost:5173)
  VLLM_API_URL         Local vLLM URL (default http://127.0.0.1:8000)
  VLLM_API_KEY         Optional vLLM API key

Config is saved to ./.nodai/node.json
`);
}

function parseArgs(argv) {
	const args = argv.slice(2);
	const command = args[0];
	const flags = {};

	for (let i = 1; i < args.length; i += 1) {
		const arg = args[i];
		if (arg === '--once') {
			flags.once = true;
			continue;
		}
		if (arg.startsWith('--')) {
			const key = arg.slice(2);
			const value = args[i + 1];
			if (value && !value.startsWith('--')) {
				flags[key] = value;
				i += 1;
			} else {
				flags[key] = true;
			}
		}
	}

	return { command, flags };
}

async function cmdRegister(flags) {
	const platformUrl = resolvePlatformUrl(flags.platform);
	const vllmUrl = resolveVllmUrl(flags.vllm);
	const label = flags.label ? String(flags.label) : null;

	if (!label) {
		throw new Error('--label is required.');
	}

	console.log(`Registering with ${platformUrl}…`);
	const body = await registerNode(platformUrl, label);

	const path = saveConfig({
		platformUrl,
		vllmUrl,
		vllmApiKey: flags['vllm-key'] ?? process.env.VLLM_API_KEY ?? '',
		nodeId: body.node_id,
		authToken: body.auth_token,
		label: body.label ?? label
	});

	console.log('');
	console.log('Node registered.');
	console.log(`  node_id:    ${body.node_id}`);
	console.log(`  auth_token: ${body.auth_token}`);
	console.log(`  config:     ${path}`);
	console.log('');
	console.log('Start the worker with: nodai-node run');
}

async function cmdStatus(flags) {
	const platformUrl = resolvePlatformUrl(flags.platform);

	try {
		const config = loadConfig();
		console.log('Config:     ', configPath());
		console.log('Node ID:    ', config.nodeId);
		console.log('Token:      ', maskToken(config.authToken));
		console.log('Platform:   ', config.platformUrl);
		console.log('vLLM:       ', config.vllmUrl);

		const vllm = await checkVllm(config);
		console.log('vLLM status:  OK');
		console.log('vLLM models: ', vllm.models.join(', ') || 'none');

		const nodes = await listNodes(config.platformUrl);
		const self = nodes.nodes?.find((n) => n.id === config.nodeId);
		console.log('Node status: ', self?.status ?? 'unknown');
	} catch (error) {
		if (error.message.includes('No node config')) {
			const nodes = await listNodes(platformUrl);
			console.log(`Platform ${platformUrl}: OK (${nodes.nodes?.length ?? 0} nodes)`);
			throw error;
		}
		throw error;
	}
}

function cmdConfig() {
	const config = loadConfig();
	console.log(JSON.stringify({ ...config, authToken: maskToken(config.authToken) }, null, 2));
}

export async function runCli(argv) {
	const { command, flags } = parseArgs(argv);

	switch (command) {
		case 'register':
			await cmdRegister(flags);
			break;
		case 'run':
			if (flags.once) await runOnce();
			else await runForever();
			break;
		case 'status':
			await cmdStatus(flags);
			break;
		case 'config':
			cmdConfig();
			break;
		case 'help':
		case '--help':
		case '-h':
		case undefined:
			usage();
			break;
		default:
			throw new Error(`Unknown command: ${command}`);
	}
}
