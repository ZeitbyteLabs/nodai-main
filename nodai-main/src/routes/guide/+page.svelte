<script lang="ts">
	import { INFERENCE_LIMITS, NOD, LINKS } from '$lib/config';
	import { reserveForMaxTokens } from '$lib/pricing';
	import Button from '$lib/components/Button.svelte';
	import Panel from '$lib/components/Panel.svelte';
</script>

<svelte:head>
	<title>User guide — NodAI</title>
	<meta
		name="description"
		content="How to sign up, run inference, host a GPU, and claim NOD on NodAI."
	/>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16 md:py-20">
	<header class="border-b border-line pb-10">
		<p class="mono-label">Guide</p>
		<h1 class="mt-4 text-4xl font-semibold md:text-5xl">Using NodAI</h1>
		<p class="mt-4 leading-relaxed text-fg-muted">
			Everything you need to go from a new account to your first inference run — or to host a
			GPU and earn NOD.
		</p>
	</header>

	<div class="mt-10 flex flex-col gap-8">
		<Panel label="1 · Create an account">
			<div class="flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-fg-muted">
				<p>
					Sign up with email and password, pick a username, and confirm your email if prompted.
					Once signed in, your dashboard shows your balance and activity.
				</p>
				<Button href="/signup" size="sm" variant="secondary">Create account</Button>
			</div>
		</Panel>

		<Panel label="2 · Get NOD credit">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				You pay by <strong class="text-fg">output tokens</strong> —
				<span class="font-mono text-fg">{NOD.pricePer1kOutputTokens} NOD</span> per 1,000 tokens
				(minimum <span class="font-mono text-fg">{NOD.minCharge} NOD</span>). A typical run with
				{INFERENCE_LIMITS.defaultMaxTokens} max tokens reserves
				<span class="font-mono text-fg">{reserveForMaxTokens(INFERENCE_LIMITS.defaultMaxTokens)} NOD</span>;
				unused reserve is refunded. On the dashboard, tap <strong class="text-fg">Get NOD</strong>
				for test credit. Your balance pays for runs; it is separate from on-chain NOD in your wallet.
			</p>
		</Panel>

		<Panel label="3 · Run inference">
			<div class="flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-fg-muted">
				<p>
					Open the playground, write a prompt, adjust temperature and max tokens if you like, then
					press <strong class="text-fg">Run</strong>. The job waits until a community GPU running
					nodai-node picks it up. If none are online, it stays queued.
				</p>
				<p>
					Running a prompt spends credit. It does not earn NOD. GPU hosts earn
					<span class="font-mono text-fg">{NOD.hostShare * 100}%</span> of the settled token cost
					when their machine completes the job.
				</p>
				<Button href="/playground" size="sm" variant="secondary">Open playground</Button>
			</div>
		</Panel>

		<Panel label="4 · Connect a wallet and claim">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				Install Phantom (or another supported wallet), connect it on the dashboard, then press
				<strong class="text-fg">Claim NOD</strong> to move host earnings to your wallet on Solana
				devnet. Devnet NOD is for testing only and has no monetary value.
			</p>
		</Panel>

		<Panel label="5 · Browse models">
			<div class="flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-fg-muted">
				<p>
					The models page lists what is currently served on the network — licence, target model
					name, and status. NodAI launches with one production model; more arrive as contributors
					join.
				</p>
				<Button href="/models" size="sm" variant="secondary">View models</Button>
			</div>
		</Panel>

		<Panel label="6 · Host a GPU">
			<div class="flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-fg-muted">
				<p>
					NodAI does not run a cloud GPU. Sign in, create an API key on the dashboard, start
					vLLM, then <span class="font-mono text-fg">nodai-node start</span> and paste the key.
					Your nodes and earnings appear on that same dashboard.
				</p>
				<Button href="/host" size="sm" variant="secondary">Host a GPU</Button>
			</div>
		</Panel>
	</div>

	<p class="mt-12 text-sm text-fg-subtle">
		For full API details, see the
		<a
			href="{LINKS.github}/blob/main/public-docs/API.md"
			target="_blank"
			rel="noreferrer"
			class="underline underline-offset-4 hover:text-fg"
		>
			API reference
		</a>
		in <span class="font-mono">public-docs/</span>.
	</p>
</div>
