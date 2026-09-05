import type { Model } from '$lib/types/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	const { data } = await supabase
		.from('models')
		.select('id, name, description, license, vllm_model_name')
		.eq('is_active', true)
		.order('created_at', { ascending: true });

	return {
		models: (data ?? []) as Pick<
			Model,
			'id' | 'name' | 'description' | 'license' | 'vllm_model_name'
		>[],
		signedIn: !!session
	};
};
