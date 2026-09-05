import { error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import { checkHealth, isVllmConfigured } from '$lib/server/vllm';
import type { Model, Profile } from '$lib/types/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
	if (!user) error(401, 'Not signed in.');

	const admin = createAdminClient();

	const [{ data: models }, { data: profile }, endpointConfigured] = await Promise.all([
		admin.from('models').select('*').eq('is_active', true).order('created_at', { ascending: true }),
		supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
		Promise.resolve(isVllmConfigured())
	]);

	// Only probe the GPU box when there is an endpoint to probe.
	const endpointOnline = endpointConfigured ? await checkHealth() : false;

	return {
		models: (models ?? []) as Model[],
		balance: Number((profile as Profile | null)?.nod_balance ?? 0),
		endpointConfigured,
		endpointOnline
	};
};
