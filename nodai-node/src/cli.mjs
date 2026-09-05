import { hostname } from 'node:os';
import {
	configPath,
	existsConfig,
	loadConfig,
	maskToken,
	resolvePlatformUrl,
	resolveVllmUrl,
	saveConfig
} from './config.mjs';
import { linkNode, listNodes, registerNode } from './platform.mjs';
import { ask, say } from './prompt.mjs';
import { checkVllm } from './vllm.mjs';
import { runForever, runOnce } from './run.mjs';

function usage() {
	say(`
NodAI GPU Node — connect THIS computer to NodAI

One command for most people:
  nodai-node start

That asks a few questions, registers this PC, and waits for jobs.

Other commands:
  nodai-node start --platform https://nodai-main.vercel.app --api-key nod_…
  nodai-node status
  nodai-node setup
  nodai-node run              (already registered)
  nodai-node run --once

Local AI server (vLLM) must already be running on this machine.
Default: http://127.0.0.1:8000
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

async function collectSetup(flags) {
	const platformUrl = resolvePlatformUrl(
		flags.platform ?? (await ask('NodAI website', resolvePlatformUrl()))
	);
	const label =
		(flags.label ? String(flags.label) : '') ||
		(await ask('Name for this PC', hostname().slice(0, 24) || 'home-gpu'));
	const vllmUrl = resolveVllmUrl(flags.vllm ?? (await ask('Local AI server', resolveVllmUrl())));
	const vllmApiKey = flags['vllm-key'] ?? process.env.VLLM_API_KEY ?? (await ask('vLLM API key (blank if none)', ''));
	const apiKey =
		flags['api-key'] ??
		process.env.NODAI_API_KEY ??
		(await ask('NodAI API key (from dashboard)', ''));

	if (!label) throw new Error('A name for this PC is required.');
	if (!apiKey || !String(apiKey).startsWith('nod_')) {
		throw new Error(
			'A dashboard API key is required (starts with nod_). Create one under Dashboard → Your GPUs.'
		);
	}

	return { platformUrl, label, vllmUrl, vllmApiKey, apiKey: String(apiKey).trim() };
}

async function cmdSetup(flags) {
	say('');
	say('NodAI Node setup');
	say('This PC will run AI jobs. NodAI does not use a cloud GPU.');
	say('');

	const answers = await collectSetup(flags);

	say(`Checking ${answers.vllmUrl}…`);
	let health;
	try {
		health = await checkVllm(answers);
		say(`Local AI server OK — ${health.models.join(', ') || 'model ready'}`);
	} catch {
		say('Could not reach the local AI server. Start vLLM first, then try again.');
		say('Example: vllm serve Qwen/Qwen3.8-27B --host 127.0.0.1 --port 8000');
		throw new Error('Local AI server is not running.');
	}

	say(`Registering with ${answers.platformUrl}…`);
	const body = await registerNode(
		answers.platformUrl,
		answers.label,
		answers.apiKey,
		health.models[0]
	);

	const path = saveConfig({
		platformUrl: answers.platformUrl,
		vllmUrl: answers.vllmUrl,
		vllmApiKey: answers.vllmApiKey,
		apiKey: answers.apiKey,
		nodeId: body.node_id,
		authToken: body.auth_token,
		label: body.label ?? answers.label
	});

	say('');
	say('This PC is registered.');
	say(`  name:    ${body.label ?? answers.label}`);
	say(`  node:    ${body.node_id}`);
	say(`  saved:   ${path}`);
	say('');
	return loadConfig();
}

async function cmdStart(flags) {
	let config = existsConfig() && !flags.fresh ? loadConfig() : await cmdSetup(flags);

	const incomingKey = flags['api-key'] ?? process.env.NODAI_API_KEY;
	if (incomingKey && String(incomingKey).startsWith('nod_')) {
		config = { ...config, apiKey: String(incomingKey).trim() };
		saveConfig(config);
	}

	if (!config.apiKey && process.stdin.isTTY) {
		const pasted = await ask('NodAI API key to earn on this account (Enter to skip)', '');
		if (pasted.startsWith('nod_')) {
			config = { ...config, apiKey: pasted };
			saveConfig(config);
		}
	}

	if (config.apiKey && config.authToken) {
		try {
			await linkNode(config);
			say('This PC is linked to your dashboard account.');
		} catch (error) {
			if (!String(error.message).includes('already linked')) {
				say(`Could not link API key: ${error.message}`);
			}
		}
	}

	say('Starting. Leave this window open. Press Ctrl+C to stop.');
	say('');
	if (flags.once) await runOnce();
	else await runForever(config);
}

async function cmdRegister(flags) {
	if (!flags.label && !process.stdin.isTTY) {
		throw new Error('Pass --label my-pc  (or run: nodai-node start)');
	}
	await cmdSetup(flags);
	say('Start the worker with: nodai-node start');
}

async function cmdStatus(flags) {
	const platformUrl = resolvePlatformUrl(flags.platform);

	try {
		const config = loadConfig();
		say(`Saved file:  ${configPath()}`);
		say(`PC name:     ${config.label ?? '—'}`);
		say(`Node ID:     ${config.nodeId}`);
		say(`Token:       ${maskToken(config.authToken)}`);
		say(`API key:     ${maskToken(config.apiKey)}`);
		say(`Website:     ${config.platformUrl}`);
		say(`Local AI:    ${config.vllmUrl}`);

		const vllm = await checkVllm(config);
		say(`Local AI:    OK (${vllm.models.join(', ') || 'ready'})`);

		const nodes = await listNodes(config.platformUrl);
		const self = nodes.nodes?.find((n) => n.id === config.nodeId);
		say(`On website:  ${self?.status ?? 'unknown'}`);
	} catch (error) {
		if (error.message.includes('No node config')) {
			const nodes = await listNodes(platformUrl);
			say(`Website ${platformUrl}: OK (${nodes.nodes?.length ?? 0} nodes)`);
			throw error;
		}
		throw error;
	}
}

function cmdConfig() {
	const config = loadConfig();
	say(
		JSON.stringify(
			{ ...config, authToken: maskToken(config.authToken), apiKey: maskToken(config.apiKey) },
			null,
			2
		)
	);
}

export async function runCli(argv) {
	const { command, flags } = parseArgs(argv);

	switch (command) {
		case 'start':
			await cmdStart(flags);
			break;
		case 'setup':
			await cmdSetup(flags);
			break;
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
			usage();
			break;
		case undefined:
			if (existsConfig()) await cmdStart(flags);
			else usage();
			break;
		default:
			throw new Error(`Unknown command: ${command}. Try: nodai-node start`);
	}
}
