/**
 * Full browser-style flow against a running server: sign in through the real
 * form action, keep cookies, load the protected dashboard, link a wallet via
 * the API, then unlink and sign out.
 *
 * Usage: node scripts/verify-flow.mjs [origin]
 */
import { readFileSync } from 'node:fs';

const origin = process.argv[2] ?? 'http://localhost:5180';

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

const email = `flow.${Date.now()}@nodai-check.dev`;
const password = 'FlowPass12345';
const WALLET = '6dLpDbLrpb5cVvLRVfLpBW4pTZ8b2GYY6VvS8sRHhqQm';

let failures = 0;
function check(label, ok, detail = '') {
	if (!ok) failures++;
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`);
}

// Minimal cookie jar so the server session behaves like a real browser.
const jar = new Map();
function store(response) {
	for (const raw of response.headers.getSetCookie?.() ?? []) {
		const [pair] = raw.split(';');
		const i = pair.indexOf('=');
		const name = pair.slice(0, i).trim();
		const value = pair.slice(i + 1).trim();
		if (value === '' || /Max-Age=0/i.test(raw)) jar.delete(name);
		else jar.set(name, value);
	}
}
const cookieHeader = () =>
	[...jar].map(([name, value]) => `${name}=${value}`).join('; ');

async function visit(path, init = {}) {
	const response = await fetch(origin + path, {
		...init,
		redirect: 'manual',
		headers: { ...(init.headers ?? {}), cookie: cookieHeader() }
	});
	store(response);
	return response;
}

const user = await fetch(`${BASE}/auth/v1/admin/users`, {
	method: 'POST',
	headers: admin,
	body: JSON.stringify({ email, password, email_confirm: true })
}).then((r) => r.json());
check('seed confirmed user', !!user.id);
if (!user.id) process.exit(1);

try {
	// Protected route bounces an anonymous visitor.
	const guard = await visit('/dashboard');
	check(
		'anonymous /dashboard redirects',
		guard.status === 303 && (guard.headers.get('location') ?? '').includes('/signin'),
		`${guard.status} -> ${guard.headers.get('location')}`
	);

	// Sign in through the actual SvelteKit form action. The accept header
	// matters: without it SvelteKit answers with a JSON redirect envelope
	// instead of a real 303, which is not what a browser form does.
	const body = new URLSearchParams({ email, password, redirectTo: '/dashboard' });
	const signin = await visit('/signin', {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
			accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
		},
		body
	});
	check(
		'sign-in form action redirects',
		signin.status === 303 && signin.headers.get('location') === '/dashboard',
		`${signin.status} -> ${signin.headers.get('location')}`
	);
	check('session cookie issued', [...jar.keys()].some((k) => k.includes('auth-token')));

	// Dashboard renders the signed-in user's own data.
	const dashboard = await visit('/dashboard');
	const html = await dashboard.text();
	check('dashboard returns 200', dashboard.status === 200, `status ${dashboard.status}`);
	check('dashboard shows the account email', html.includes(email));
	check('dashboard shows NOD balance block', html.includes('NOD balance'));
	check('dashboard shows wallet panel', html.includes('Solana wallet'));

	// Signed-in users are pushed off the auth pages.
	const bounce = await visit('/signin');
	check('signed-in /signin redirects to dashboard', bounce.status === 303, `status ${bounce.status}`);

	// Link a wallet through the API the browser uses.
	const link = await visit('/api/wallet', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ wallet_address: WALLET })
	});
	check('POST /api/wallet links wallet', link.status === 200, `status ${link.status}`);

	const stored = await fetch(`${BASE}/rest/v1/profiles?id=eq.${user.id}&select=wallet_address`, {
		headers: admin
	}).then((r) => r.json());
	check('wallet persisted to profiles', stored[0]?.wallet_address === WALLET);

	// Invalid addresses are rejected.
	const bad = await visit('/api/wallet', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ wallet_address: 'not-a-real-address' })
	});
	check('invalid address rejected', bad.status === 400, `status ${bad.status}`);

	// Balance endpoint answers for a linked wallet.
	const balance = await visit('/api/wallet/balance');
	const balanceBody = await balance.json();
	check(
		'GET /api/wallet/balance responds',
		balance.status === 200 && 'sol' in balanceBody,
		JSON.stringify(balanceBody)
	);

	const unlink = await visit('/api/wallet', { method: 'DELETE' });
	check('DELETE /api/wallet unlinks', unlink.status === 200, `status ${unlink.status}`);

	// Sign out clears the session.
	const signout = await visit('/signout', { method: 'POST' });
	check('sign-out redirects', signout.status === 303, `status ${signout.status}`);

	const after = await visit('/dashboard');
	check('dashboard protected again after sign-out', after.status === 303, `status ${after.status}`);
} finally {
	await fetch(`${BASE}/auth/v1/admin/users/${user.id}`, { method: 'DELETE', headers: admin });
	console.log('      cleaned up probe user');
}

console.log(failures === 0 ? '\nFull flow passed.' : `\n${failures} flow check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
