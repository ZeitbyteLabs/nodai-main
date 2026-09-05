import { error } from '@sveltejs/kit';
import { cluster } from '$lib/server/solana-config';
import type { Profile, Transaction } from '$lib/types/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) error(401, 'Not signed in.');

	let { data: profile } = await supabase
		.from('profiles')
		.select('*')
		.eq('id', user.id)
		.maybeSingle();

	// Fallback for accounts created before the auth trigger existed.
	if (!profile) {
		const { data: created } = await supabase
			.from('profiles')
			.insert({ id: user.id, email: user.email ?? '' })
			.select('*')
			.maybeSingle();
		profile = created;
	}

	const [{ count: runCount }, { data: transactions }] = await Promise.all([
		supabase
			.from('inference_jobs')
			.select('id', { count: 'exact', head: true })
			.eq('user_id', user.id),
		supabase
			.from('transactions')
			.select('*')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(8)
	]);

	return {
		profile: (profile ?? null) as Profile | null,
		email: user.email ?? '',
		runCount: runCount ?? 0,
		transactions: (transactions ?? []) as Transaction[],
		cluster: cluster()
	};
};
