import { json, error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import { authenticateNode, markStaleNodesOffline, nodeAuthFailure } from '$lib/server/nodes';
import type { RequestHandler } from './$types';

/** Keeps a node alive and marks it online. */
export const POST: RequestHandler = async ({ request }) => {
	let node;
	try {
		node = await authenticateNode(request);
	} catch (cause) {
		nodeAuthFailure(cause);
	}

	const body = await request.json().catch(() => ({}));
	const requestedStatus = body?.status === 'offline' ? 'offline' : 'online';

	const admin = createAdminClient();

	const { data: updated, error: updateError } = await admin
		.from('nodes')
		.update({
			status: requestedStatus,
			last_heartbeat: new Date().toISOString()
		})
		.eq('id', node.id)
		.select('id, status, last_heartbeat')
		.single();

	if (updateError || !updated) {
		error(500, 'Could not update heartbeat.');
	}

	await markStaleNodesOffline();

	return json({
		node_id: updated.id,
		status: updated.status,
		last_heartbeat: updated.last_heartbeat
	});
};
