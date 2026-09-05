import { fail, redirect } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import { validateUsername } from '$lib/username';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, url, locals: { supabase } }) => {
		const form = await request.formData();
		const email = String(form.get('email') ?? '').trim();
		const usernameRaw = String(form.get('username') ?? '').trim();
		const password = String(form.get('password') ?? '');
		const confirmPassword = String(form.get('confirmPassword') ?? '');

		const fields = { email, username: usernameRaw, password, confirmPassword };

		if (!email || !usernameRaw || !password || !confirmPassword) {
			return fail(400, { ...fields, message: 'All fields are required.' });
		}

		const usernameValidation = validateUsername(usernameRaw);
		if (!usernameValidation.ok) {
			return fail(400, { ...fields, message: usernameValidation.error });
		}

		if (password.length < 8) {
			return fail(400, { ...fields, message: 'Use at least 8 characters for your password.' });
		}

		if (password !== confirmPassword) {
			return fail(400, { ...fields, message: 'Passwords do not match.' });
		}

		const admin = createAdminClient();
		const { data: existing } = await admin
			.from('profiles')
			.select('id')
			.eq('username', usernameValidation.normalized)
			.maybeSingle();

		if (existing) {
			return fail(400, { ...fields, message: 'That username is already taken.' });
		}

		const { data, error } = await supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${url.origin}/auth/confirm`,
				data: { username: usernameValidation.normalized }
			}
		});

		if (error) {
			return fail(400, { ...fields, message: error.message });
		}

		// No session means the project requires email confirmation first.
		if (!data.session) {
			return { checkEmail: true, email, username: usernameValidation.normalized };
		}

		redirect(303, '/dashboard');
	}
};
