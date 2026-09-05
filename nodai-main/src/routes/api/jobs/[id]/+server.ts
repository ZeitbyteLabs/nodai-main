import { error, json } from '@sveltejs/kit';
import { NOD } from '$lib/config';
import { createAdminClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

/** Poll a queued job. Only the owner can read it. */
export const GET: RequestHandler = async ({ params, locals: { user } }) => {
	if (!user) error(401, 'Sign in to view a job.');

	const admin = createAdminClient();
	const { data: job } = await admin
		.from('inference_jobs')
		.select('id, status, response, tokens_used, latency_ms, created_at, completed_at')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.maybeSingle();

	if (!job) error(404, 'Job not found.');

	const { data: profile } = await admin
		.from('profiles')
		.select('nod_balance')
		.eq('id', user.id)
		.maybeSingle();

	return json({
		job_id: job.id,
		status: job.status,
		response: job.response,
		tokens_used: job.tokens_used,
		latency_ms: job.latency_ms,
		cost: NOD.costPerInference,
		balance: Number(profile?.nod_balance ?? 0),
		created_at: job.created_at,
		completed_at: job.completed_at
	});
};
