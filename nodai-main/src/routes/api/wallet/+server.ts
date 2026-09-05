import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

async function isValidSolanaAddress(address: string) {
	const { PublicKey } = await import('@solana/web3.js');
	try {
		new PublicKey(address);
		return true;
	} catch {
		return false;
	}
}

/** Persist the connected wallet address on the caller's profile. */
export const POST: RequestHandler = async ({ request, locals: { supabase, user } }) => {
	if (!user) error(401, 'Not signed in.');

	const body = await request.json().catch(() => null);
	const address = body?.wallet_address;

	if (typeof address !== 'string') error(400, 'wallet_address is required.');

	if (!(await isValidSolanaAddress(address))) {
		error(400, 'That is not a valid Solana address.');
	}

	const { error: updateError } = await supabase
		.from('profiles')
		.update({ wallet_address: address })
		.eq('id', user.id);

	if (updateError) {
		if (updateError.code === '23505') {
			error(409, 'That wallet is already linked to another NodAI account.');
		}
		error(500, updateError.message);
	}

	return json({ wallet_address: address });
};

/** Unlink the wallet from the caller's profile. */
export const DELETE: RequestHandler = async ({ locals: { supabase, user } }) => {
	if (!user) error(401, 'Not signed in.');

	const { error: updateError } = await supabase
		.from('profiles')
		.update({ wallet_address: null })
		.eq('id', user.id);

	if (updateError) error(500, updateError.message);

	return json({ wallet_address: null });
};
