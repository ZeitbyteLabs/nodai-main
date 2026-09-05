import { json, error } from '@sveltejs/kit';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { SOLANA_RPC_URL } from '$env/static/private';
import type { RequestHandler } from './$types';

/**
 * Read-only SOL balance for the caller's linked wallet. Proxied through the
 * server so the RPC endpoint never reaches the browser.
 */
export const GET: RequestHandler = async ({ locals: { supabase, user } }) => {
	if (!user) error(401, 'Not signed in.');

	const { data: profile } = await supabase
		.from('profiles')
		.select('wallet_address')
		.eq('id', user.id)
		.single();

	if (!profile?.wallet_address) return json({ sol: null });

	try {
		const connection = new Connection(SOLANA_RPC_URL, 'confirmed');
		const lamports = await connection.getBalance(new PublicKey(profile.wallet_address));
		return json({ sol: lamports / LAMPORTS_PER_SOL });
	} catch {
		return json({ sol: null, unavailable: true });
	}
};
