import type { Model } from '$lib/types/database';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	const { data, error } = await supabase
		.from('models')
		.select('*')
		.eq('is_active', true)
		.order('created_at', { ascending: true });

	return {
		models: (data ?? []) as Model[],
		unavailable: !!error,
		signedIn: !!session
	};
};
