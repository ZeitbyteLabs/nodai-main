import { json, error } from '@sveltejs/kit';
import {
	cluster,
	explorerAddressUrl,
	isNodTokenConfigured
} from '$lib/server/solana-config';
import { readNodBalance } from '$lib/server/solana';
import type { RequestHandler } from './$types';

/**
 * NOD position for the signed-in user: the off-chain credit that pays for
 * inference, the on-chain token balance, and anything still owed to them.
 */
export const GET: RequestHandler = async ({ locals: { supabase, user } }) => {
	if (!user) error(401, 'Not signed in.');

	const [{ data: profile }, { data: pending }] = await Promise.all([
		supabase.from('profiles').select('wallet_address, nod_balance').eq('id', user.id).maybeSingle(),
		supabase
			.from('transactions')
			.select('amount')
			.eq('user_id', user.id)
			.eq('type', 'reward')
			.eq('status', 'pending')
	]);

	// Rewards accrue in 0.005 steps, so sum then round to the mint's precision.
	const pendingReward = Number(
		(pending ?? []).reduce((total, row) => total + Number(row.amount), 0).toFixed(9)
	);

	const base = {
		cluster: cluster(),
		credit: Number(profile?.nod_balance ?? 0),
		pendingReward,
		walletLinked: !!profile?.wallet_address,
		configured: isNodTokenConfigured()
	};

	if (!base.configured || !profile?.wallet_address) {
		return json({ ...base, onChain: null, mint: null, explorer: null });
	}

	try {
		const { balance, mint } = await readNodBalance(profile.wallet_address);
		return json({
			...base,
			onChain: balance,
			mint,
			explorer: explorerAddressUrl(profile.wallet_address)
		});
	} catch (cause) {
		console.error('/api/nod/balance:', cause instanceof Error ? cause.message : cause);
		return json({
			...base,
			onChain: null,
			mint: null,
			explorer: explorerAddressUrl(profile.wallet_address)
		});
	}
};
