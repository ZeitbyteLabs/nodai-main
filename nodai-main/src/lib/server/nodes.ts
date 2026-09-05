import { error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import type { NodeRecord, NodeStatus } from '$lib/types/database';
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

export type HostedNode = {
	id: string;
	label: string | null;
	status: NodeStatus;
	served_model: string | null;
	last_heartbeat: string | null;
	created_at: string;
	jobs_completed: number;
	earned: number;
};

export type HostedJob = {
	id: string;
	status: string;
	tokens_used: number | null;
	latency_ms: number | null;
	created_at: string;
	completed_at: string | null;
	node_id: string | null;
	model_id: string | null;
};

/** Nodes owned by a host plus completed-job and earnings totals. */
export async function listOwnedNodes(ownerId: string): Promise<{
	nodes: HostedNode[];
	jobs: HostedJob[];
}> {
	const admin = createAdminClient();

	const { data: nodes } = await admin
		.from('nodes')
		.select('id, label, status, served_model, last_heartbeat, created_at')
		.eq('owner_id', ownerId)
		.order('created_at', { ascending: false });

	if (!nodes?.length) return { nodes: [], jobs: [] };

	const ids = nodes.map((node) => node.id);
	const { data: jobs } = await admin
		.from('inference_jobs')
		.select('id, node_id')
		.in('node_id', ids)
		.eq('status', 'completed');

	const jobIds = (jobs ?? []).map((job) => job.id);
	const counts = new Map<string, number>();
	for (const job of jobs ?? []) {
		if (!job.node_id) continue;
		counts.set(job.node_id, (counts.get(job.node_id) ?? 0) + 1);
	}

	const earned = new Map<string, number>();
	if (jobIds.length > 0) {
		const { data: rewards } = await admin
			.from('transactions')
			.select('job_id, amount')
			.eq('user_id', ownerId)
			.eq('type', 'reward')
			.in('job_id', jobIds);

		const jobToNode = new Map((jobs ?? []).map((job) => [job.id, job.node_id]));
		for (const row of rewards ?? []) {
			const nodeId = jobToNode.get(row.job_id ?? '');
			if (!nodeId) continue;
			earned.set(nodeId, (earned.get(nodeId) ?? 0) + Number(row.amount));
		}
	}

	const { data: recent } = await admin
		.from('inference_jobs')
		.select('id, status, tokens_used, latency_ms, created_at, completed_at, node_id, model_id')
		.in('node_id', ids)
		.order('created_at', { ascending: false })
		.limit(8);

	return {
		nodes: nodes.map((node) => ({
			...node,
			jobs_completed: counts.get(node.id) ?? 0,
			earned: Number((earned.get(node.id) ?? 0).toFixed(9))
		})),
		jobs: recent ?? []
	};
}

/** Maps NodeAuthError to a SvelteKit HTTP error. */
export function nodeAuthFailure(cause: unknown): never {
	if (cause instanceof NodeAuthError) error(cause.status, cause.message);
	throw cause;
}
