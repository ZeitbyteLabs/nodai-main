import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const password = String(form.get('password') ?? '');

		if (!email || !password) {
			return fail(400, { email, message: 'Email and password are both required.' });
		}

		if (password.length < 8) {
			return fail(400, { email, message: 'Use at least 8 characters for your password.' });
		}

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: { emailRedirectTo: `${url.origin}/auth/confirm` }
		});

		if (error) {
			return fail(400, { email, message: error.message });
		}

		// No session means the project requires email confirmation first.
		if (!data.session) {
			return { checkEmail: true, email };
		}

		redirect(303, '/dashboard');
	}
};
