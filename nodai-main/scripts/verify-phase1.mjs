/**
 * Phase 1 verification: exercises the auth trigger and every RLS policy
 * against the live Supabase project, then cleans up after itself.
 *
 * Usage: node scripts/verify-phase1.mjs
 */
import { readFileSync } from 'node:fs';

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
const ANON = env.PUBLIC_SUPABASE_ANON_KEY;
const SERVICE = env.SUPABASE_SERVICE_ROLE_KEY;

const email = `probe.${Date.now()}@nodai-check.dev`;
const password = 'ProbePass12345';
const admin = { apikey: SERVICE, Authorization: `Bearer ${SERVICE}`, 'content-type': 'application/json' };

let failures = 0;
function check(label, ok, detail = '') {
	if (!ok) failures++;
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
}

const user = await fetch(`${BASE}/auth/v1/admin/users`, {
	method: 'POST',
	headers: admin,
	body: JSON.stringify({ email, password, email_confirm: true })
}).then((r) => r.json());

check('create auth user', !!user.id, user.id ?? JSON.stringify(user).slice(0, 160));
if (!user.id) process.exit(1);

try {
	const profiles = await fetch(`${BASE}/rest/v1/profiles?id=eq.${user.id}&select=*`, {
		headers: admin
	}).then((r) => r.json());
	check(
		'trigger created profile',
		Array.isArray(profiles) && profiles.length === 1,
		JSON.stringify(profiles[0] ?? profiles)
	);

	const session = await fetch(`${BASE}/auth/v1/token?grant_type=password`, {
		method: 'POST',
		headers: { apikey: ANON, 'content-type': 'application/json' },
		body: JSON.stringify({ email, password })
	}).then((r) => r.json());
	check('password sign-in', !!session.access_token);
	if (!session.access_token) process.exit(1);

	const asUser = {
		apikey: ANON,
		Authorization: `Bearer ${session.access_token}`,
		'content-type': 'application/json'
	};

	const own = await fetch(`${BASE}/rest/v1/profiles?select=id,email`, { headers: asUser }).then(
		(r) => r.json()
	);
	check('RLS: reads only own profile', own.length === 1 && own[0].id === user.id);

	const updated = await fetch(`${BASE}/rest/v1/profiles?id=eq.${user.id}`, {
		method: 'PATCH',
		headers: { ...asUser, Prefer: 'return=representation' },
		body: JSON.stringify({ wallet_address: '6dLpDbLrpb5cVvLRVfLpBW4pTZ8b2GYY6VvS8sRHhqQm' })
	}).then((r) => r.json());
	check('RLS: updates own wallet_address', updated[0]?.wallet_address?.startsWith('6dLpDb'));

	const nodes = await fetch(`${BASE}/rest/v1/nodes?select=*`, { headers: asUser }).then((r) =>
		r.json()
	);
	check('RLS: nodes table hidden from users', Array.isArray(nodes) && nodes.length === 0);

	const models = await fetch(`${BASE}/rest/v1/models?select=name`, {
		headers: { apikey: ANON }
	}).then((r) => r.json());
	check('anon can read models', models.length >= 1, JSON.stringify(models));

	const jobs = await fetch(`${BASE}/rest/v1/inference_jobs`, {
		method: 'POST',
		headers: { ...asUser, Prefer: 'return=representation' },
		body: JSON.stringify({ user_id: user.id, prompt: 'phase 1 probe' })
	});
	check('RLS: user can insert own inference job', jobs.status === 201, `status ${jobs.status}`);

	const foreign = await fetch(`${BASE}/rest/v1/transactions`, {
		method: 'POST',
		headers: asUser,
		body: JSON.stringify({ user_id: user.id, type: 'reward', amount: 999 })
	});
	check('RLS: user cannot mint transactions', foreign.status >= 400, `status ${foreign.status}`);
} finally {
	const cleanup = await fetch(`${BASE}/auth/v1/admin/users/${user.id}`, {
		method: 'DELETE',
		headers: admin
	});
	check('cleanup probe user', cleanup.ok, `status ${cleanup.status}`);
}

console.log(failures === 0 ? '\nAll Phase 1 checks passed.' : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
