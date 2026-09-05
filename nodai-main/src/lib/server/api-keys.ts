import { createHash, randomBytes } from 'node:crypto';
import { error } from '@sveltejs/kit';
import { createAdminClient } from '$lib/server/supabase-admin';
import type { ApiKey } from '$lib/types/database';

export const API_KEY_PREFIX = 'nod_';
const MAX_ACTIVE_KEYS = 8;

export class ApiKeyError extends Error {
	constructor(
		message: string,
		readonly status: number
	) {
		super(message);
		this.name = 'ApiKeyError';
	}
}

export function hashApiKey(key: string) {
	return createHash('sha256').update(key.trim()).digest('hex');
}

export function newApiKeySecret() {
	const secret = randomBytes(32).toString('hex');
	const key = `${API_KEY_PREFIX}${secret}`;
	return {
		key,
		hash: hashApiKey(key),
		prefix: key.slice(0, 12)
	};
}

export function extractApiKey(request: Request, body?: { api_key?: unknown }) {
	const header = request.headers.get('x-nodai-key')?.trim();
	if (header) return header;

	const auth = request.headers.get('authorization') ?? '';
	const bearer = auth.match(/^Bearer\s+(\S+)/i)?.[1]?.trim() ?? '';
	if (bearer.startsWith(API_KEY_PREFIX)) return bearer;

	if (typeof body?.api_key === 'string') return body.api_key.trim();
	return '';
}

export function isApiKeyFormat(value: string) {
	return value.startsWith(API_KEY_PREFIX) && value.length > API_KEY_PREFIX.length + 16;
}

export type ResolvedApiKey = ApiKey & { user_id: string };

/** Looks up a live (not revoked) dashboard API key. */
export async function authenticateApiKey(raw: string): Promise<ResolvedApiKey> {
	const key = raw.trim();
	if (!isApiKeyFormat(key)) {
		throw new ApiKeyError('Invalid API key. Create one on the dashboard.', 401);
	}

	const admin = createAdminClient();
	const { data } = await admin
		.from('api_keys')
		.select('*')
		.eq('key_hash', hashApiKey(key))
		.is('revoked_at', null)
		.maybeSingle();

	if (!data) throw new ApiKeyError('Invalid or revoked API key.', 401);

	await admin
		.from('api_keys')
		.update({ last_used_at: new Date().toISOString() })
		.eq('id', data.id);

	return data as ResolvedApiKey;
}

export async function createApiKey(userId: string, name: string) {
	const admin = createAdminClient();

	const { count } = await admin
		.from('api_keys')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', userId)
		.is('revoked_at', null);

	if ((count ?? 0) >= MAX_ACTIVE_KEYS) {
		throw new ApiKeyError(`You can have at most ${MAX_ACTIVE_KEYS} active API keys.`, 409);
	}

	const issued = newApiKeySecret();
	const label = name.trim().slice(0, 48) || 'GPU host';

	const { data, error: insertError } = await admin
		.from('api_keys')
		.insert({
			user_id: userId,
			name: label,
			key_hash: issued.hash,
			key_prefix: issued.prefix
		})
		.select('id, name, key_prefix, created_at')
		.single();

	if (insertError || !data) {
		throw new ApiKeyError('Could not create API key.', 500);
	}

	return { ...data, key: issued.key };
}

export async function listApiKeys(userId: string) {
	const admin = createAdminClient();
	const { data } = await admin
		.from('api_keys')
		.select('id, name, key_prefix, last_used_at, revoked_at, created_at')
		.eq('user_id', userId)
		.order('created_at', { ascending: false });

	return data ?? [];
}

export async function revokeApiKey(userId: string, keyId: string) {
	const admin = createAdminClient();
	const { data } = await admin
		.from('api_keys')
		.update({ revoked_at: new Date().toISOString() })
		.eq('id', keyId)
		.eq('user_id', userId)
		.is('revoked_at', null)
		.select('id')
		.maybeSingle();

	if (!data) throw new ApiKeyError('API key not found.', 404);
}

export function apiKeyFailure(cause: unknown): never {
	if (cause instanceof ApiKeyError) error(cause.status, cause.message);
	throw cause;
}
