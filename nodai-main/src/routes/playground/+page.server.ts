import { error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import { markStaleNodesOffline } from '$lib/server/nodes';
import type { Model, Profile } from '$lib/types/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) error(401, 'Not signed in.');

	const admin = createAdminClient();
	await markStaleNodesOffline();

	const [{ data: models }, { data: profile }, { data: nodes }] = await Promise.all([
		admin.from('models').select('*').eq('is_active', true).order('created_at', { ascending: true }),
		supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
		admin.from('nodes').select('id, status').eq('status', 'online')
	]);

	return {
		models: (models ?? []) as Model[],
		balance: Number((profile as Profile | null)?.nod_balance ?? 0),
		onlineNodes: nodes?.length ?? 0
	};
};
