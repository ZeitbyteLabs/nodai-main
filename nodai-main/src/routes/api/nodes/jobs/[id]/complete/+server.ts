import { json, error } from '@sveltejs/kit';
import { NOD } from '$lib/config';
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
	const tokensUsed = Number.isFinite(body?.tokens_used) ? Number(body.tokens_used) : null;
	const latencyMs = Number.isFinite(body?.latency_ms) ? Number(body.latency_ms) : null;
	const failed = body?.status === 'failed' || !response;

	const admin = createAdminClient();

	const { data: userId, error: completeError } = await admin.rpc('complete_node_job', {
		p_node_id: node.id,
		p_job_id: params.id,
		p_response: response,
		p_tokens_used: tokensUsed,
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
		// Refund the user's inference credit when the node run fails.
		await admin.rpc('credit_nod', { p_user_id: userId, p_amount: NOD.costPerInference });
		await admin
			.from('transactions')
			.update({ status: 'failed' })
			.eq('job_id', params.id)
			.eq('type', 'consumption');

		return json({ job_id: params.id, status: 'failed', refunded: true });
	}

	await admin.rpc('record_run_rewards', {
		p_user_id: userId,
		p_job_id: params.id,
		p_reward: NOD.rewardPerInference,
		p_fee: NOD.feePerInference
	});

	return json({
		job_id: params.id,
		status: 'completed',
		reward: NOD.rewardPerInference
	});
};
