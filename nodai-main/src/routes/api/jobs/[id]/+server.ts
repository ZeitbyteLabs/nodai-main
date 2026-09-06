import { error, json } from '@sveltejs/kit';
import { priceForOutputTokens, reserveForMaxTokens } from '$lib/pricing';
import { createAdminClient } from '$lib/server/supabase-admin';
import type { RequestHandler } from './$types';

/** Poll a queued job. Only the owner can read it. */
export const GET: RequestHandler = async ({ params, locals: { user } }) => {
	if (!user) error(401, 'Sign in to view a job.');

	const admin = createAdminClient();
	const { data: job } = await admin
		.from('inference_jobs')
		.select('id, status, response, tokens_used, latency_ms, max_tokens, created_at, completed_at')
		.eq('id', params.id)
		.eq('user_id', user.id)
		.maybeSingle();

	if (!job) error(404, 'Job not found.');

	const [{ data: profile }, { data: consumption }] = await Promise.all([
		admin.from('profiles').select('nod_balance').eq('id', user.id).maybeSingle(),
		admin
			.from('transactions')
			.select('amount, status')
			.eq('job_id', job.id)
			.eq('type', 'consumption')
			.maybeSingle()
	]);

	const reserved = Number(consumption?.amount ?? reserveForMaxTokens(job.max_tokens));
	const settled =
		job.status === 'completed'
			? Number(consumption?.status === 'confirmed' ? consumption.amount : priceForOutputTokens(job.tokens_used ?? 0))
			: reserved;

	return json({
		job_id: job.id,
		status: job.status,
		response: job.response,
		tokens_used: job.tokens_used,
		latency_ms: job.latency_ms,
		max_tokens: job.max_tokens,
		reserved,
		cost: job.status === 'failed' ? 0 : settled,
		balance: Number(profile?.nod_balance ?? 0),
		created_at: job.created_at,
		completed_at: job.completed_at
	});
};
