import { json, error } from '@sveltejs/kit';
import { apiKeyFailure, createApiKey, listApiKeys } from '$lib/server/api-keys';
import type { RequestHandler } from './$types';

/** Lists the signed-in user's API keys (prefixes only). */
export const GET: RequestHandler = async ({ locals: { user } }) => {
	if (!user) error(401, 'Sign in to view API keys.');
	return json({ keys: await listApiKeys(user.id) });
};

/** Creates a host API key. The full secret is returned once. */
export const POST: RequestHandler = async ({ request, locals: { user } }) => {
	if (!user) error(401, 'Sign in to create an API key.');

	const body = await request.json().catch(() => ({}));
	const name = typeof body?.name === 'string' ? body.name : 'GPU host';

	try {
		const created = await createApiKey(user.id, name);
		return json(created, { status: 201 });
	} catch (cause) {
		apiKeyFailure(cause);
	}
};
