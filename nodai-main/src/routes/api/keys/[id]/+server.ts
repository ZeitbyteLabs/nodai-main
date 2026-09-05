import { json, error } from '@sveltejs/kit';
import { apiKeyFailure, revokeApiKey } from '$lib/server/api-keys';
import type { RequestHandler } from './$types';

/** Revokes a dashboard API key. Existing nodes stay online. */
export const DELETE: RequestHandler = async ({ params, locals: { user } }) => {
	if (!user) error(401, 'Sign in to revoke an API key.');

	try {
		await revokeApiKey(user.id, params.id);
		return json({ revoked: true });
	} catch (cause) {
		apiKeyFailure(cause);
	}
};
