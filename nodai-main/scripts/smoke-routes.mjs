/**
 * Hits every Phase 1 route on a running dev/preview server and reports the
 * status plus a marker string that proves the page actually rendered.
 *
 * Usage: node scripts/smoke-routes.mjs [origin]
 */
const origin = process.argv[2] ?? 'http://localhost:5174';

const routes = [
	{ path: '/', expect: 'The Open AI Network', status: 200 },
	{ path: '/models', expect: 'Available on the network', status: 200 },
	{ path: '/signup', expect: 'Create your account', status: 200 },
	{ path: '/signin', expect: 'Sign in', status: 200 },
	{ path: '/dashboard', expect: 'Sign in', status: 200, note: 'redirects to /signin' },
	{ path: '/nope', expect: '404', status: 404 }
];

let failures = 0;

for (const route of routes) {
	const response = await fetch(origin + route.path, { redirect: 'follow' });
	const body = await response.text();
	const statusOk = response.status === route.status;
	const bodyOk = body.includes(route.expect);
	const ok = statusOk && bodyOk;
	if (!ok) failures++;

	console.log(
		`${ok ? 'PASS' : 'FAIL'}  ${route.path.padEnd(11)} ${String(response.status).padEnd(4)}` +
			`${bodyOk ? '' : ` (missing "${route.expect}")`}${route.note ? `  — ${route.note}` : ''}`
	);
}

// Unauthenticated API access must be rejected.
for (const [method, path] of [
	['POST', '/api/wallet'],
	['GET', '/api/wallet/balance']
]) {
	const response = await fetch(origin + path, {
		method,
		headers: { 'content-type': 'application/json' },
		body: method === 'POST' ? JSON.stringify({ wallet_address: 'x' }) : undefined
	});
	const ok = response.status === 401;
	if (!ok) failures++;
	console.log(`${ok ? 'PASS' : 'FAIL'}  ${method} ${path} rejects anonymous  (${response.status})`);
}

console.log(failures === 0 ? '\nAll routes healthy.' : `\n${failures} route check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
