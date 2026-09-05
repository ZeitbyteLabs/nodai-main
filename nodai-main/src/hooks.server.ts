import { createServerClient } from '@supabase/ssr';
import { redirect, type Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import type { Database } from '$lib/types/database';

/** Routes that require an authenticated session. */
const PROTECTED_PREFIXES = ['/dashboard', '/playground', '/account'];

/** Routes an authenticated user should be bounced away from. */
const AUTH_ONLY_PREFIXES = ['/signin', '/signup'];

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient<Database>(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					for (const { name, value, options } of cookiesToSet) {
						event.cookies.set(name, value, { ...options, path: '/' });
					}
				}
			}
		}
	);

	/**
	 * getSession() alone is not trustworthy on the server because the JWT is not
	 * validated, so we verify the user against Supabase before returning it.
	 */
	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();

		if (!session) return { session: null, user: null };

		const {
			data: { user },
			error
		} = await event.locals.supabase.auth.getUser();

		if (error) return { session: null, user: null };

		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders: (name) =>
			name === 'content-range' || name === 'x-supabase-api-version'
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	const path = event.url.pathname;

	if (!session && PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix))) {
		redirect(303, `/signin?redirectTo=${encodeURIComponent(path)}`);
	}

	if (session && AUTH_ONLY_PREFIXES.some((prefix) => path.startsWith(prefix))) {
		redirect(303, '/dashboard');
	}

	return resolve(event);
};

export const handle = sequence(supabase, authGuard);
