const RESERVED = new Set(['admin', 'api', 'nodai', 'root', 'support', 'www']);

export type UsernameValidation = { ok: true; normalized: string } | { ok: false; error: string };

/** Normalize and validate a username before signup or availability checks. */
export function validateUsername(raw: string): UsernameValidation {
	const normalized = raw.trim().toLowerCase();

	if (normalized.length < 3) {
		return { ok: false, error: 'Use at least 3 characters.' };
	}

	if (normalized.length > 24) {
		return { ok: false, error: 'Maximum 24 characters.' };
	}

	if (!/^[a-z][a-z0-9_]*$/.test(normalized)) {
		return {
			ok: false,
			error: 'Letters, numbers, and underscores only. Must start with a letter.'
		};
	}

	if (RESERVED.has(normalized)) {
		return { ok: false, error: 'That username is reserved.' };
	}

	return { ok: true, normalized };
}
