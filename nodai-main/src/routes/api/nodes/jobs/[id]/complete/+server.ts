import { json, error } from '@sveltejs/kit';
import { refundReservedJob, settleCompletedJob } from '$lib/server/billing';
import { createAdminClient } from '$lib/server/supabase-admin';
import { authenticateNode, nodeAuthFailure } from '$lib/server/nodes';
import type { RequestHandler } from './$types';

/** Submits a finished job from a GPU node. */
export const POST: RequestHandler = async ({ request, params }) => {
	let node;
	try {
		node = await authenticateNode(request);
	} catch (cause) {
		nodeAuthFailure(cause);
	}

	const body = await request.json().catch(() => null);
	const response = typeof body?.response === 'string' ? body.response.trim() : '';
	const totalTokens = Number.isFinite(body?.tokens_used) ? Number(body.tokens_used) : null;
	const completionTokens = Number.isFinite(body?.completion_tokens)
		? Number(body.completion_tokens)
		: totalTokens;
	const latencyMs = Number.isFinite(body?.latency_ms) ? Number(body.latency_ms) : null;
	const failed = body?.status === 'failed' || !response;

	const admin = createAdminClient();

	const { data: userId, error: completeError } = await admin.rpc('complete_node_job', {
		p_node_id: node.id,
		p_job_id: params.id,
		p_response: response,
		p_tokens_used: completionTokens ?? totalTokens,
		p_latency_ms: latencyMs,
		p_status: failed ? 'failed' : 'completed'
	});

	if (completeError) {
		if (completeError.message.includes('JOB_NOT_FOUND')) {
			error(404, 'Job not found or not assigned to this node.');
		}
		error(500, 'Could not complete the job.');
	}

	if (failed) {
		const { refunded } = await refundReservedJob(userId, params.id);
		return json({ job_id: params.id, status: 'failed', refunded: refunded > 0 });
	}

	const { data: job } = await admin
		.from('inference_jobs')
		.select('max_tokens')
		.eq('id', params.id)
		.maybeSingle();

	const settled = await settleCompletedJob({
		userId,
		jobId: params.id,
		hostId: node.owner_id,
		maxTokens: job?.max_tokens ?? null,
		completionTokens,
		totalTokens
	});

	return json({
		job_id: params.id,
		status: 'completed',
		tokens_used: settled.tokens,
		cost: settled.billed,
		host_reward: settled.hostReward
	});
};
