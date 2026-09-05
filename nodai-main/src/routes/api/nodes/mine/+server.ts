import { json, error } from '@sveltejs/kit';
import { listOwnedNodes } from '$lib/server/nodes';
import type { RequestHandler } from './$types';

/** GPU nodes owned by the signed-in host, with job and earnings totals. */
export const GET: RequestHandler = async ({ locals: { user } }) => {
	if (!user) error(401, 'Sign in to view your nodes.');
	return json(await listOwnedNodes(user.id));
};
