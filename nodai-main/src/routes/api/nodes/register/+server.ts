import { json } from '@sveltejs/kit';
import { authenticateApiKey, apiKeyFailure, extractApiKey } from '$lib/server/api-keys';
import { createAdminClient } from '$lib/server/supabase-admin';
import { newAuthToken } from '$lib/server/nodes';
import type { RequestHandler } from './$types';

/**
 * Registers a GPU node owned by the account that issued the API key.
 * The node auth token is shown only at registration — store it on the machine.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}));
	const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 64) : null;
	const servedModel =
		typeof body?.served_model === 'string' ? body.served_model.trim().slice(0, 128) : null;

	let key;
	try {
		key = await authenticateApiKey(extractApiKey(request, body));
	} catch (cause) {
		apiKeyFailure(cause);
	}

	const authToken = newAuthToken();
	const admin = createAdminClient();

	const { data: node, error: insertError } = await admin
		.from('nodes')
		.insert({
			auth_token: authToken,
			label: label || null,
			status: 'pending',
			owner_id: key.user_id,
			api_key_id: key.id,
			served_model: servedModel
		})
		.select('id, status, label, created_at, owner_id, served_model')
		.single();

	if (insertError || !node) {
		return json({ message: 'Could not register node.' }, { status: 500 });
	}

	return json(
		{
			node_id: node.id,
			auth_token: authToken,
			status: node.status,
			label: node.label,
			owner_id: node.owner_id,
			served_model: node.served_model,
			created_at: node.created_at
		},
		{ status: 201 }
	);
};
