import { json } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import { validateUsername } from '$lib/username';
import type { RequestHandler } from './$types';

/** Public username availability check for sign-up. */
export const GET: RequestHandler = async ({ url }) => {
	const raw = url.searchParams.get('username') ?? '';
	const validation = validateUsername(raw);

	if (!validation.ok) {
		return json({
			available: false,
			username: raw.trim().toLowerCase(),
			reason: validation.error
		});
	}

	const admin = createAdminClient();
	const { data, error } = await admin
		.from('profiles')
		.select('id')
		.eq('username', validation.normalized)
		.maybeSingle();

	if (error) {
		return json(
			{ available: false, username: validation.normalized, reason: 'Could not check username.' },
			{ status: 500 }
		);
	}

	return json({
		available: !data,
		username: validation.normalized,
		reason: data ? 'That username is already taken.' : null
	});
};
