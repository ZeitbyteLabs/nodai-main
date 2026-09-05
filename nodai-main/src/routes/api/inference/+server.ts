import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

/** Direct platform GPU inference is gone. Jobs go to community nodes. */
export const POST: RequestHandler = async () => {
	error(410, 'Platform inference is retired. Use POST /api/jobs — a community GPU picks it up.');
};
