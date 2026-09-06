import { createAdminClient } from '$lib/server/supabase-admin';
import {
	billedOutputTokens,
	hostRewardForCost,
	priceForOutputTokens,
	reserveForMaxTokens,
	roundNod
} from '$lib/pricing';

async function consumptionForJob(
	admin: ReturnType<typeof createAdminClient>,
	jobId: string
) {
	const { data } = await admin
		.from('transactions')
		.select('id, amount, status')
		.eq('job_id', jobId)
		.eq('type', 'consumption')
		.maybeSingle();
	return data;
}

/** Refund the reserved NOD when a node fails the run. */
export async function refundReservedJob(userId: string, jobId: string) {
	const admin = createAdminClient();
	const consumption = await consumptionForJob(admin, jobId);
	const reserved = Number(consumption?.amount ?? 0);

	if (reserved > 0 && consumption?.status !== 'failed') {
		await admin.rpc('credit_nod', { p_user_id: userId, p_amount: reserved });
	}

	if (consumption) {
		await admin.from('transactions').update({ status: 'failed' }).eq('id', consumption.id);
	}

	return { refunded: reserved };
}

/**
 * After a successful run: bill actual output tokens, refund unused reserve,
 * pay the host their share.
 */
export async function settleCompletedJob(input: {
	userId: string;
	jobId: string;
	hostId: string | null;
	maxTokens: number | null;
	completionTokens: number | null;
	totalTokens: number | null;
}) {
	const admin = createAdminClient();
	const tokens = billedOutputTokens({
		completion: input.completionTokens,
		total: input.totalTokens,
		maxTokens: input.maxTokens
	});
	const billed = priceForOutputTokens(tokens);
	const consumption = await consumptionForJob(admin, input.jobId);
	const reserved = Number(consumption?.amount ?? reserveForMaxTokens(input.maxTokens ?? tokens));
	const refund = roundNod(Math.max(0, reserved - billed));

	if (consumption && refund > 0) {
		await admin.rpc('credit_nod', { p_user_id: input.userId, p_amount: refund });
	}

	if (consumption) {
		await admin
			.from('transactions')
			.update({ amount: billed, status: 'confirmed' })
			.eq('id', consumption.id);
	}

	const hostReward = input.hostId ? hostRewardForCost(billed) : 0;
	if (input.hostId && hostReward > 0) {
		await admin.rpc('record_run_rewards', {
			p_user_id: input.hostId,
			p_job_id: input.jobId,
			p_reward: hostReward,
			p_fee: 0
		});
	}

	return { billed, refund, tokens, hostReward };
}
