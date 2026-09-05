#!/usr/bin/env node
/**
 * End-to-end test for nodai-node CLI against a running platform + mock vLLM.
 *
 * Usage: node scripts/verify-node-cli.mjs [platformOrigin]
 */
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const CLI = join(ROOT, '../bin/nodai-node.mjs');
const WORK = join(ROOT, '../.verify-work');
const origin = process.argv[2] ?? 'http://localhost:5173';

const env = Object.fromEntries(
	readFileSync(new URL('../../nodai-main/.env', import.meta.url), 'utf8')
		.split('\n')
		.filter((line) => line.includes('=') && !line.trim().startsWith('#'))
		.map((line) => {
			const i = line.indexOf('=');
			return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
		})
);

const BASE = env.PUBLIC_SUPABASE_URL;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;
const admin = {
	apikey: SERVICE,
	Authorization: `Bearer ${SERVICE}`,
	'content-type': 'application/json'
};

let failures = 0;
function check(label, ok, detail = '') {
	if (!ok) failures++;
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
}

function runNode(args, cwd = WORK) {
	return new Promise((resolve, reject) => {
		const child = spawn(process.execPath, [CLI, ...args], {
			cwd,
			stdio: ['ignore', 'pipe', 'pipe'],
			env: { ...process.env, VLLM_API_URL: 'http://127.0.0.1:9999' }
		});
		let stdout = '';
		let stderr = '';
		child.stdout.on('data', (d) => (stdout += d));
		child.stderr.on('data', (d) => (stderr += d));
		child.on('close', (code) => resolve({ code, stdout, stderr }));
		child.on('error', reject);
	});
}

/** Tiny vLLM stand-in for the worker loop. */
function startMockVllm() {
	const server = createServer((req, res) => {
		if (req.method === 'GET' && req.url === '/v1/models') {
			res.writeHead(200, { 'content-type': 'application/json' });
			res.end(JSON.stringify({ data: [{ id: 'Qwen/Qwen3.8-27B' }] }));
			return;
		}

		if (req.method === 'POST' && req.url === '/v1/chat/completions') {
			res.writeHead(200, { 'content-type': 'application/json' });
			res.end(
				JSON.stringify({
					choices: [{ message: { content: 'Hello from mock vLLM' } }],
					usage: { total_tokens: 15, prompt_tokens: 5, completion_tokens: 10 }
				})
			);
			return;
		}

		res.writeHead(404);
		res.end();
	});

	return new Promise((resolve) => {
		server.listen(9999, '127.0.0.1', () => resolve(server));
	});
}

rmSync(WORK, { recursive: true, force: true });
mkdirSync(join(WORK, '.nodai'), { recursive: true });

let mockServer;
let userId;
let jobId;
let nodeId;

try {
	mockServer = await startMockVllm();

	const reg = await runNode([
		'register',
		'--platform',
		origin,
		'--label',
		'cli-verify',
		'--vllm',
		'http://127.0.0.1:9999'
	]);
	check('cli register exits 0', reg.code === 0, reg.stderr.trim());
	check('cli register prints node_id', reg.stdout.includes('node_id'));

	const status = await runNode(['status']);
	check('cli status exits 0', status.code === 0, status.stderr.trim());
	check('cli status sees vLLM', status.stdout.includes('vLLM status:  OK'));

	const email = `cli.${Date.now()}@nodai-check.dev`;
	const user = await fetch(`${BASE}/auth/v1/admin/users`, {
		method: 'POST',
		headers: admin,
		body: JSON.stringify({ email, password: 'CliPass12345', email_confirm: true })
	}).then((r) => r.json());
	userId = user.id;

	const model = await fetch(`${BASE}/rest/v1/models?select=id&limit=1`, { headers: admin }).then(
		(r) => r.json()
	);

	const job = await fetch(`${BASE}/rest/v1/inference_jobs`, {
		method: 'POST',
		headers: { ...admin, Prefer: 'return=representation' },
		body: JSON.stringify({
			user_id: userId,
			model_id: model[0].id,
			prompt: 'Say hi',
			status: 'queued',
			temperature: 0.7,
			max_tokens: 32
		})
	}).then((r) => r.json());
	jobId = job[0]?.id ?? job.id;

	const worker = await runNode(['run', '--once']);
	check('cli run --once exits 0', worker.code === 0, worker.stderr.trim());
	check('cli processed job', worker.stdout.includes('Completed'));

	const stored = await fetch(
		`${BASE}/rest/v1/inference_jobs?id=eq.${jobId}&select=status,response`,
		{ headers: admin }
	).then((r) => r.json());
	check('job completed via CLI', stored[0]?.status === 'completed');
	check('response recorded', stored[0]?.response === 'Hello from mock vLLM');
} finally {
	mockServer?.close();
	if (jobId) {
		await fetch(`${BASE}/rest/v1/inference_jobs?id=eq.${jobId}`, {
			method: 'DELETE',
			headers: admin
		});
	}
	if (nodeId) {
		await fetch(`${BASE}/rest/v1/nodes?id=eq.${nodeId}`, { method: 'DELETE', headers: admin });
	} else {
		const config = JSON.parse(readFileSync(join(WORK, '.nodai/node.json'), 'utf8'));
		await fetch(`${BASE}/rest/v1/nodes?id=eq.${config.nodeId}`, {
			method: 'DELETE',
			headers: admin
		});
	}
	if (userId) {
		await fetch(`${BASE}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: admin });
	}
	rmSync(WORK, { recursive: true, force: true });
	console.log('      cleaned up');
}

console.log(failures === 0 ? '\nNode CLI passed.' : `\n${failures} CLI check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
