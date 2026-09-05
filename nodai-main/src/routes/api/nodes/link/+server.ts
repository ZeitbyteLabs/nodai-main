import { json, error } from '@sveltejs/kit';
import { authenticateApiKey, apiKeyFailure, extractApiKey } from '$lib/server/api-keys';
import { authenticateNode, nodeAuthFailure } from '$lib/server/nodes';
import { createAdminClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

/**
 * Attaches an already-registered node to the account that owns the API key.
 * Used when a host created a node before they had a key.
 */
export const POST: RequestHandler = async ({ request }) => {
	let node;
	try {
		node = await authenticateNode(request);
	} catch (cause) {
		nodeAuthFailure(cause);
	}

	const body = await request.json().catch(() => ({}));

	let key;
	try {
		key = await authenticateApiKey(extractApiKey(request, body));
	} catch (cause) {
		apiKeyFailure(cause);
	}

	if (node.owner_id && node.owner_id !== key.user_id) {
		error(409, 'This node is already linked to another account.');
	}

	const admin = createAdminClient();
	const { data: updated, error: updateError } = await admin
		.from('nodes')
		.update({
			owner_id: key.user_id,
			api_key_id: key.id
		})
		.eq('id', node.id)
		.select('id, label, owner_id, status')
		.single();

	if (updateError || !updated) {
		error(500, 'Could not link this node.');
	}

	return json({
		node_id: updated.id,
		label: updated.label,
		owner_id: updated.owner_id,
		status: updated.status,
		linked: true
	});
};
