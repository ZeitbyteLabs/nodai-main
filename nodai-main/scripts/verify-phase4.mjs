#!/usr/bin/env node
/**
 * Phase 4 verification: register a GPU node, heartbeat, queue a job,
 * pull it, and complete it through the node API.
 *
 * Requires:
 *   - nodai-main/.env configured
 *   - 0004_nodes.sql and 0005_host_earnings.sql applied in Supabase
 *   - dev server running (default http://localhost:5173)
 *
 * Usage: node scripts/verify-phase4.mjs [origin]
 */
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';

const origin = process.argv[2] ?? 'http://localhost:5173';

const env = Object.fromEntries(
	readFileSync(new URL('../.env', import.meta.url), 'utf8')
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

function nodeHeaders(token) {
	return { authorization: `Bearer ${token}`, 'content-type': 'application/json' };
}

let nodeId = null;
let authToken = null;
let jobId = null;
let userId = null;
let hostId = null;
let keyId = null;

function issueApiKey() {
	const secret = randomBytes(32).toString('hex');
	const key = `nod_${secret}`;
	return {
		key,
		hash: createHash('sha256').update(key).digest('hex'),
		prefix: key.slice(0, 12)
	};
}

try {
	const hostEmail = `host.${Date.now()}@nodai-check.dev`;
	const host = await fetch(`${BASE}/auth/v1/admin/users`, {
		method: 'POST',
		headers: admin,
		body: JSON.stringify({ email: hostEmail, password: 'NodePass12345', email_confirm: true })
	}).then((r) => r.json());
	hostId = host.id;
	check('seed host user', !!hostId);

	await fetch(`${BASE}/rest/v1/profiles`, {
		method: 'POST',
		headers: { ...admin, Prefer: 'resolution=merge-duplicates' },
		body: JSON.stringify({ id: hostId, email: hostEmail })
	});

	const issued = issueApiKey();
	const insertedKey = await fetch(`${BASE}/rest/v1/api_keys`, {
		method: 'POST',
		headers: { ...admin, Prefer: 'return=representation' },
		body: JSON.stringify({
			user_id: hostId,
			name: 'verify',
			key_hash: issued.hash,
			key_prefix: issued.prefix
		})
	}).then((r) => r.json());
	keyId = insertedKey[0]?.id ?? insertedKey.id;
	check('seed host API key', !!keyId);

	// --- 4.1 Register -------------------------------------------------------
	const register = await fetch(`${origin}/api/nodes/register`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', 'x-nodai-key': issued.key },
		body: JSON.stringify({ label: 'verify-phase4' })
	});
	const regBody = await register.json();
	check('POST /api/nodes/register', register.status === 201 && !!regBody.auth_token);
	nodeId = regBody.node_id;
	authToken = regBody.auth_token;
	if (!authToken) throw new Error('registration failed');

	// --- 4.2 Heartbeat ------------------------------------------------------
	const heartbeat = await fetch(`${origin}/api/nodes/heartbeat`, {
		method: 'POST',
		headers: nodeHeaders(authToken),
		body: JSON.stringify({ status: 'online' })
	});
	const hbBody = await heartbeat.json();
	check(
		'POST /api/nodes/heartbeat',
		heartbeat.status === 200 && hbBody.status === 'online',
		JSON.stringify(hbBody).slice(0, 120)
	);

	// --- Seed a user + queued job -------------------------------------------
	const email = `node.${Date.now()}@nodai-check.dev`;
	const user = await fetch(`${BASE}/auth/v1/admin/users`, {
		method: 'POST',
		headers: admin,
		body: JSON.stringify({ email, password: 'NodePass12345', email_confirm: true })
	}).then((r) => r.json());
	userId = user.id;
	check('seed user for queued job', !!userId);

	const model = await fetch(`${BASE}/rest/v1/models?select=id&limit=1`, { headers: admin }).then((r) =>
		r.json()
	);
	const modelId = model[0]?.id;
	check('load model id', !!modelId);

	const job = await fetch(`${BASE}/rest/v1/inference_jobs`, {
		method: 'POST',
		headers: { ...admin, Prefer: 'return=representation' },
		body: JSON.stringify({
			user_id: userId,
			model_id: modelId,
			prompt: 'Say hello in one word.',
			status: 'queued',
			temperature: 0.7,
			max_tokens: 32
		})
	}).then((r) => r.json());
	jobId = job[0]?.id ?? job.id;
	check('seed queued job', !!jobId);

	// --- 4.3 Pull job -------------------------------------------------------
	const next = await fetch(`${origin}/api/nodes/jobs/next`, {
		method: 'POST',
		headers: nodeHeaders(authToken)
	});
	const nextBody = await next.json();
	check(
		'POST /api/nodes/jobs/next returns job',
		next.status === 200 && nextBody.job?.id === jobId,
		JSON.stringify(nextBody).slice(0, 160)
	);

	// --- 4.3 Complete job ---------------------------------------------------
	const complete = await fetch(`${origin}/api/nodes/jobs/${jobId}/complete`, {
		method: 'POST',
		headers: nodeHeaders(authToken),
		body: JSON.stringify({
			response: 'Hello',
			tokens_used: 12,
			latency_ms: 450,
			status: 'completed'
		})
	});
	const doneBody = await complete.json();
	check(
		'POST /api/nodes/jobs/:id/complete',
		complete.status === 200 && doneBody.status === 'completed',
		JSON.stringify(doneBody).slice(0, 120)
	);

	const stored = await fetch(
		`${BASE}/rest/v1/inference_jobs?id=eq.${jobId}&select=status,response,node_id`,
		{ headers: admin }
	).then((r) => r.json());
	check(
		'job recorded as completed',
		stored[0]?.status === 'completed' && stored[0]?.response === 'Hello',
		JSON.stringify(stored[0])
	);
	check('job linked to node', stored[0]?.node_id === nodeId);
	check('complete pays host', doneBody.host_reward === 0.005);

	const hostRewards = await fetch(
		`${BASE}/rest/v1/transactions?user_id=eq.${hostId}&type=eq.reward&job_id=eq.${jobId}&select=amount`,
		{ headers: admin }
	).then((r) => r.json());
	check('host reward row', Number(hostRewards[0]?.amount) === 0.005);

	const userRewards = await fetch(
		`${BASE}/rest/v1/transactions?user_id=eq.${userId}&type=eq.reward&job_id=eq.${jobId}&select=id`,
		{ headers: admin }
	).then((r) => r.json());
	check('job user did not earn', (userRewards ?? []).length === 0);

	// --- Public node list ---------------------------------------------------
	const list = await fetch(`${origin}/api/nodes`);
	const listBody = await list.json();
	check(
		'GET /api/nodes lists registered node',
		list.status === 200 && listBody.nodes?.some((n) => n.id === nodeId),
		`count ${listBody.nodes?.length ?? 0}`
	);
} finally {
	if (jobId) {
		await fetch(`${BASE}/rest/v1/inference_jobs?id=eq.${jobId}`, {
			method: 'DELETE',
			headers: admin
		});
	}
	if (nodeId) {
		await fetch(`${BASE}/rest/v1/nodes?id=eq.${nodeId}`, { method: 'DELETE', headers: admin });
	}
	if (keyId) {
		await fetch(`${BASE}/rest/v1/api_keys?id=eq.${keyId}`, { method: 'DELETE', headers: admin });
	}
	if (userId) {
		await fetch(`${BASE}/auth/v1/admin/users/${userId}`, { method: 'DELETE', headers: admin });
	}
	if (hostId) {
		await fetch(`${BASE}/auth/v1/admin/users/${hostId}`, { method: 'DELETE', headers: admin });
	}
	console.log('      cleaned up probe node, job, keys, and users');
}

console.log(failures === 0 ? '\nPhase 4 API passed.' : `\n${failures} Phase 4 check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
