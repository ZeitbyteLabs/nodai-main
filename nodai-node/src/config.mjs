import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const CONFIG_DIR = '.nodai';
const CONFIG_FILE = 'node.json';

const defaults = {
	platformUrl: 'https://nodai-main.vercel.app',
	vllmUrl: 'http://127.0.0.1:8000',
	vllmApiKey: '',
	pollIntervalMs: 3000,
	heartbeatIntervalMs: 30000
};

function configPath(cwd = process.cwd()) {
	return join(cwd, CONFIG_DIR, CONFIG_FILE);
}

export function existsConfig(cwd = process.cwd()) {
	return existsSync(configPath(cwd));
}

/** Loads node config from ./.nodai/node.json */
export function loadConfig(cwd = process.cwd()) {
	const path = configPath(cwd);
	if (!existsSync(path)) {
		throw new Error(
			`No node config at ${path}. Run: nodai-node register --platform <url> --label <name>`
		);
	}

	const raw = JSON.parse(readFileSync(path, 'utf8'));
	return normalizeConfig(raw);
}

/** Saves registration credentials to ./.nodai/node.json */
export function saveConfig(config, cwd = process.cwd()) {
	const path = configPath(cwd);
	mkdirSync(dirname(path), { recursive: true });
	writeFileSync(path, JSON.stringify(normalizeConfig(config), null, 2) + '\n', 'utf8');
	return path;
}

export function normalizeConfig(raw) {
	const platformUrl = String(raw.platformUrl ?? defaults.platformUrl)
		.trim()
		.replace(/\/+$/, '');
	const vllmUrl = String(raw.vllmUrl ?? defaults.vllmUrl)
		.trim()
		.replace(/\/+$/, '');

	return {
		platformUrl,
		vllmUrl,
		vllmApiKey: String(raw.vllmApiKey ?? defaults.vllmApiKey).trim(),
		nodeId: String(raw.nodeId ?? '').trim(),
		authToken: String(raw.authToken ?? '').trim(),
		label: raw.label ? String(raw.label).trim() : null,
		pollIntervalMs: Number(raw.pollIntervalMs ?? defaults.pollIntervalMs),
		heartbeatIntervalMs: Number(raw.heartbeatIntervalMs ?? defaults.heartbeatIntervalMs)
	};
}

export function maskToken(token) {
	if (!token) return '—';
	if (token.length <= 12) return '***';
	return `${token.slice(0, 6)}…${token.slice(-4)}`;
}

export function resolvePlatformUrl(flag) {
	return (flag ?? process.env.NODAI_PLATFORM_URL ?? defaults.platformUrl)
		.trim()
		.replace(/\/+$/, '');
}

export function resolveVllmUrl(flag) {
	return (flag ?? process.env.VLLM_API_URL ?? defaults.vllmUrl).trim().replace(/\/+$/, '');
}

export { defaults, configPath };
