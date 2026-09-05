import { json, error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import { authenticateNode, markStaleNodesOffline, nodeAuthFailure } from '$lib/server/nodes';
import type { RequestHandler } from './$types';

/** Pulls the next queued job for this node (round-robin via pull). */
export const POST: RequestHandler = async ({ request }) => {
	let node;
	try {
		node = await authenticateNode(request);
	} catch (cause) {
		nodeAuthFailure(cause);
	}

	const admin = createAdminClient();

	// Implicit heartbeat — a node that is pulling work is alive.
	await admin
		.from('nodes')
		.update({
			status: 'online',
			last_heartbeat: new Date().toISOString()
		})
		.eq('id', node.id);

	await markStaleNodesOffline();

	const { data: rows, error: claimError } = await admin.rpc('claim_next_job', {
		p_node_id: node.id
	});

	if (claimError) {
		error(500, 'Could not claim the next job.');
	}

	const job = rows?.[0];
	if (!job) {
		return json({ job: null });
	}

	return json({
		job: {
			id: job.job_id,
			user_id: job.user_id,
			model_id: job.model_id,
			prompt: job.prompt,
			temperature: Number(job.temperature),
			max_tokens: job.max_tokens,
			vllm_model_name: job.vllm_model_name
		}
	});
};
