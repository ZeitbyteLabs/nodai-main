import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { user } }) => {
	if (!user) redirect(303, '/signin');
};

export const actions: Actions = {
	default: async ({ request, locals: { supabase } }) => {
		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		const confirmPassword = String(form.get('confirmPassword') ?? '');

		if (!password || !confirmPassword) {
			return fail(400, { message: 'Both fields are required.', success: false });
		}

		if (password.length < 8) {
			return fail(400, { message: 'Use at least 8 characters.', success: false });
		}

		if (password !== confirmPassword) {
			return fail(400, { message: 'Passwords do not match.', success: false });
		}

		const { error } = await supabase.auth.updateUser({ password });

		if (error) {
			return fail(400, { message: error.message, success: false });
		}

		return { message: 'Password updated.', success: true };
	}
};
