import { json, error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import { explorerTxUrl, isNodTokenConfigured } from '$lib/server/solana-config';
import { SolanaError, transferNod } from '$lib/server/solana';
import type { RequestHandler } from './$types';

/**
 * Settles every pending reward for the caller with one on-chain transfer.
 *
 * Rewards are recorded the moment a run finishes but paid out here, so a slow
 * or unavailable RPC can never block inference. Claiming is idempotent: the
 * rows are only marked confirmed after the transfer lands.
 */
export const POST: RequestHandler = async ({ locals: { supabase, user } }) => {
	if (!user) error(401, 'Sign in to claim rewards.');

	if (!isNodTokenConfigured()) {
		error(503, 'On-chain rewards are not configured yet. Set NOD_MINT_ADDRESS.');
	}

	const { data: profile } = await supabase
		.from('profiles')
		.select('wallet_address')
		.eq('id', user.id)
		.maybeSingle();

	if (!profile?.wallet_address) {
		error(409, 'Link a Solana wallet before claiming rewards.');
	}

	const admin = createAdminClient();

	const { data: pending } = await admin
		.from('transactions')
		.select('id, amount')
		.eq('user_id', user.id)
		.eq('type', 'reward')
		.eq('status', 'pending')
		.order('created_at', { ascending: true })
		.limit(500);

	if (!pending || pending.length === 0) {
		return json({ claimed: 0, count: 0, signature: null, explorer: null });
	}

	const ids = pending.map((row) => row.id);
	const total = Number(pending.reduce((sum, row) => sum + Number(row.amount), 0).toFixed(9));

	let signature: string;
	try {
		signature = await transferNod(profile.wallet_address, total);
	} catch (cause) {
		if (cause instanceof SolanaError) error(cause.status, cause.message);
		error(502, 'Could not settle rewards on-chain. Try again shortly.');
	}

	const { data: settled } = await admin.rpc('settle_rewards', {
		p_user_id: user.id,
		p_ids: ids,
		p_signature: signature
	});

	return json({
		claimed: total,
		count: Number(settled ?? ids.length),
		signature,
		explorer: explorerTxUrl(signature)
	});
};
