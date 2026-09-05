import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import { newAuthToken } from '$lib/server/nodes';
import type { RequestHandler } from './$types';

/**
 * Registers a new GPU node and returns its credentials once.
 * The auth token is shown only at registration — store it on the node machine.
 */
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}));
	const label = typeof body?.label === 'string' ? body.label.trim().slice(0, 64) : null;

	const authToken = newAuthToken();
	const admin = createAdminClient();

	const { data: node, error: insertError } = await admin
		.from('nodes')
		.insert({
			auth_token: authToken,
			label: label || null,
			status: 'pending'
		})
		.select('id, status, label, created_at')
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
			created_at: node.created_at
		},
		{ status: 201 }
	);
};
