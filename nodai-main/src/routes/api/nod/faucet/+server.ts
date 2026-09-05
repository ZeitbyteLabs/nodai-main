import { json, error } from '@sveltejs/kit';
import { NOD } from '$lib/config';
import { createAdminClient } from '$lib/server/supabase-admin';
import { cluster } from '$lib/server/solana';
import type { RequestHandler } from './$types';

/**
 * Devnet-only top-up for the off-chain inference credit, so testing does not
 * stall once the starter grant runs out. The hourly cooldown is enforced in
 * the database function, not here.
 */
export const POST: RequestHandler = async ({ locals: { user } }) => {
	if (!user) error(401, 'Sign in to use the faucet.');

	if (cluster() !== 'devnet') {
		error(403, 'The faucet is only available on devnet.');
	}

	const admin = createAdminClient();

	const { data, error: rpcError } = await admin.rpc('grant_test_nod', {
		p_user_id: user.id,
		p_amount: NOD.faucetAmount
	});

	if (rpcError) {
		if (rpcError.message.includes('FAUCET_COOLDOWN')) {
			error(429, 'The faucet can only be used once an hour.');
		}
		error(500, 'Could not top up your balance.');
	}

	return json({ balance: Number(data), granted: NOD.faucetAmount });
};
