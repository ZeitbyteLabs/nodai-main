import { error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import type { NodeRecord } from '$lib/types/database';
import { randomBytes } from 'node:crypto';

export class NodeAuthError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'NodeAuthError';
	}
}

function bearerToken(request: Request) {
	const header = request.headers.get('authorization') ?? '';
	const match = header.match(/^Bearer\s+(.+)$/i);
	return match?.[1]?.trim() ?? '';
}

/** Resolves a GPU node from its bearer token. */
export async function authenticateNode(request: Request): Promise<NodeRecord> {
	const token = bearerToken(request);
	if (!token) throw new NodeAuthError('Missing node auth token.', 401);

	const admin = createAdminClient();
	const { data: node } = await admin
		.from('nodes')
		.select('*')
		.eq('auth_token', token)
		.maybeSingle();

	if (!node) throw new NodeAuthError('Invalid node auth token.', 401);

	return node as NodeRecord;
}

/** Marks nodes offline when their heartbeat is older than 60 seconds. */
export async function markStaleNodesOffline() {
	const admin = createAdminClient();
	await admin.rpc('mark_stale_nodes_offline', { p_seconds: 60 });
}

export function newAuthToken() {
	return randomBytes(32).toString('hex');
}

/** Maps NodeAuthError to a SvelteKit HTTP error. */
export function nodeAuthFailure(cause: unknown): never {
	if (cause instanceof NodeAuthError) error(cause.status, cause.message);
	throw cause;
}
