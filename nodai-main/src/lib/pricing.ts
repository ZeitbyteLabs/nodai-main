import { NOD } from './config';

/** Rounds to the NOD mint's 9 decimal places. */
export function roundNod(amount: number) {
	return Number(Math.max(0, amount).toFixed(9));
}

/** NOD charged for a number of output (completion) tokens. */
export function priceForOutputTokens(tokens: number) {
	const count = Number.isFinite(tokens) ? Math.max(0, Math.round(tokens)) : 0;
	const raw = (count / 1000) * NOD.pricePer1kOutputTokens;
	return roundNod(Math.max(NOD.minCharge, raw));
}

/** Amount reserved when a job is queued — worst case = max_tokens. */
export function reserveForMaxTokens(maxTokens: number) {
	return priceForOutputTokens(maxTokens);
}

/** Host share of what the user actually paid. */
export function hostRewardForCost(cost: number) {
	return roundNod(cost * NOD.hostShare);
}

export function platformFeeForCost(cost: number) {
	return roundNod(cost - hostRewardForCost(cost));
}

/**
 * Tokens we bill on. Prefer completion tokens; fall back to total.
 * Capped at max_tokens so a node cannot inflate usage.
 */
export function billedOutputTokens(input: {
	completion?: number | null;
	total?: number | null;
	maxTokens?: number | null;
}) {
	const raw =
		Number.isFinite(input.completion) && (input.completion ?? 0) > 0
			? Math.round(input.completion as number)
			: Number.isFinite(input.total) && (input.total ?? 0) > 0
				? Math.round(input.total as number)
				: 0;
	const cap = Number.isFinite(input.maxTokens) && (input.maxTokens ?? 0) > 0
		? Math.round(input.maxTokens as number)
		: raw;
	if (raw <= 0) return 0;
	return Math.min(raw, cap || raw);
}
