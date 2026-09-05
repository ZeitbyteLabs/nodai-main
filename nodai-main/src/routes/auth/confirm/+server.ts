import { redirect } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';
import type { RequestHandler } from './$types';

/** Handles the link Supabase emails after sign-up. */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type') as EmailOtpType | null;
	const next = url.searchParams.get('next') ?? '/dashboard';

	if (!tokenHash || !type) {
		redirect(303, '/signin?error=invalid_link');
	}

	const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

	if (error) {
		redirect(303, '/signin?error=expired_link');
	}

	redirect(303, next);
};
