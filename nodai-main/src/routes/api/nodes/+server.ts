import { json, error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import { markStaleNodesOffline } from '$lib/server/nodes';
import type { RequestHandler } from './$types';

/** Public read-only view of registered GPU nodes (no auth tokens). */
export const GET: RequestHandler = async () => {
	const admin = createAdminClient();
	await markStaleNodesOffline();

	const { data: nodes } = await admin
		.from('nodes')
		.select('id, label, status, last_heartbeat, created_at')
		.order('created_at', { ascending: false });

	return json({ nodes: nodes ?? [] });
};
