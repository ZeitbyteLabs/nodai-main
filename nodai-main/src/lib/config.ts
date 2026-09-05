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

/** Phase 2 pricing — hardcoded per the MVP spec. */
export const NOD = {
	costPerInference: 0.01,
	rewardPerInference: 0.005,
	feePerInference: 0.005,
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
