import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	return { redirectTo: url.searchParams.get('redirectTo') ?? '/dashboard' };
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const redirectTo = String(form.get('redirectTo') ?? '/dashboard');

		if (!email || !password) {
			return fail(400, { email, message: 'Email and password are both required.' });
		}

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(400, { email, message: error.message });
		}

		// Only allow same-origin destinations.
		redirect(303, redirectTo.startsWith('/') ? redirectTo : '/dashboard');
	}
};
