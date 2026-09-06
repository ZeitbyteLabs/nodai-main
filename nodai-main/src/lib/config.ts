export const SITE = {
	name: 'NodAI',
	tagline: 'The Open AI Network. Share Models. Run AI. Earn NOD.'
};

/** Optional public links — set PUBLIC_GITHUB_URL / PUBLIC_DISCORD_URL in .env. */
export const LINKS = {
	github:
		import.meta.env.PUBLIC_GITHUB_URL?.trim() ?? 'https://github.com/ZeitbyteLabs/nodai-main',
	discord: import.meta.env.PUBLIC_DISCORD_URL?.trim() ?? ''
};

/** Token pricing — users pay for output tokens; hosts earn a share. */
export const NOD = {
	/** NOD charged per 1,000 output (completion) tokens. */
	pricePer1kOutputTokens: 0.02,
	/** Floor so a tiny reply still covers ledger dust. */
	minCharge: 0.001,
	/** Fraction of the user's settled cost paid to the GPU host. */
	hostShare: 0.5,
	/** Devnet faucet top-up for the off-chain inference credit. */
	faucetAmount: 1
};

/** Bounds enforced on both the playground controls and the API. */
export const INFERENCE_LIMITS = {
	maxPromptChars: 8000,
	minTemperature: 0,
	maxTemperature: 2,
	defaultTemperature: 0.7,
	minMaxTokens: 16,
	maxMaxTokens: 2048,
	defaultMaxTokens: 512
};
