<script lang="ts">
	import { NOD, LINKS } from '$lib/config';
	import Button from '$lib/components/Button.svelte';
	import Panel from '$lib/components/Panel.svelte';
</script>

<svelte:head>
	<title>User guide — NodAI</title>
	<meta
		name="description"
		content="How to sign up, run inference, earn NOD, and connect a wallet on NodAI."
	/>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16 md:py-20">
	<header class="border-b border-line pb-10">
		<p class="mono-label">Guide</p>
		<h1 class="mt-4 text-4xl font-semibold md:text-5xl">Using NodAI</h1>
		<p class="mt-4 leading-relaxed text-fg-muted">
			Everything you need to go from a new account to your first inference run and NOD reward.
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
				Each inference run costs <span class="font-mono text-fg">{NOD.costPerInference} NOD</span>.
				On the dashboard, tap <strong class="text-fg">Get NOD</strong> to add test credit for devnet
				testing. Your balance pays for runs; it is separate from on-chain NOD in your wallet.
			</p>
		</Panel>

		<Panel label="3 · Run inference">
			<div class="flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-fg-muted">
				<p>
					Open the playground, write a prompt, adjust temperature and max tokens if you like, then
					press <strong class="text-fg">Run</strong>. The response streams in real time from the
					network's GPU.
				</p>
				<p>
					Each completed run earns
					<span class="font-mono text-fg">{NOD.rewardPerInference} NOD</span> as a pending reward on
					your dashboard.
				</p>
				<Button href="/playground" size="sm" variant="secondary">Open playground</Button>
			</div>
		</Panel>

		<Panel label="4 · Connect a wallet and claim">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				Install Phantom (or another supported wallet), connect it on the dashboard, then press
				<strong class="text-fg">Claim NOD</strong> to move earned rewards to your wallet on Solana
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
