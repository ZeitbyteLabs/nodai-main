<script lang="ts">
	import Button from '$lib/components/Button.svelte';

	const steps = [
		{
			n: '01',
			title: 'Share models',
			body: 'Publish open models with a clear licence and a readable model card. Your work stays yours.'
		},
		{
			n: '02',
			title: 'Run AI',
			body: 'Send a prompt and get a real response from a real model. No queues, no sales call.'
		},
		{
			n: '03',
			title: 'Earn NOD',
			body: 'Every run is recorded and rewarded. The ledger is public, so you can check the maths.'
		}
	];

	const facts = [
		{ label: 'Model', value: 'Qwen3.8-27B' },
		{ label: 'Context', value: '262K tokens' },
		{ label: 'Licence', value: 'Apache-2.0' },
		{ label: 'Network', value: 'Solana Devnet' }
	];
</script>

<svelte:head>
	<title>NodAI — The Open AI Network</title>
	<meta
		name="description"
		content="NodAI is an open, local-first AI network. Share models, run AI, and earn NOD for the work you contribute."
	/>
</svelte:head>

<!-- Hero -->
<section class="border-b border-line">
	<div class="mx-auto max-w-6xl px-6 py-24 md:py-36">
		<p class="mono-label mb-8">Open · Local-first · Contributor-owned</p>

		<h1 class="max-w-4xl text-5xl leading-[0.95] font-semibold sm:text-6xl md:text-7xl">
			The Open AI Network.<br />
			<span class="text-fg-muted">Share Models. Run AI.</span><br />
			<span class="text-accent-fg">Earn NOD.</span>
		</h1>

		<p class="mt-10 max-w-2xl text-lg leading-relaxed text-fg-muted md:text-xl">
			An open network for the people who actually build AI. Publish a model, run inference on it,
			and get credited for every contribution — transparently, in the open.
		</p>

		<div class="mt-12 flex flex-wrap items-center gap-4">
			<Button href="/signup" size="lg">Get started</Button>
			<a
				href="/models"
				class="border-b border-line-strong pb-1 text-base text-fg-muted transition-colors hover:border-accent hover:text-fg"
			>
				Browse models
			</a>
		</div>
	</div>
</section>

<!-- How it works -->
<section class="border-b border-line">
	<div class="mx-auto max-w-6xl px-6">
		<div class="grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
			{#each steps as step (step.n)}
				<article class="px-0 py-12 md:px-8 md:py-16 md:first:pl-0 md:last:pr-0">
					<span class="mono-label">{step.n}</span>
					<h2 class="mt-5 text-2xl font-semibold md:text-3xl">{step.title}</h2>
					<p class="mt-4 leading-relaxed text-fg-muted">{step.body}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- Live model -->
<section class="border-b border-line">
	<div class="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
		<div>
			<p class="mono-label">Running now</p>
			<h2 class="mt-5 text-3xl font-semibold md:text-4xl">One model. Fully working.</h2>
			<p class="mt-5 leading-relaxed text-fg-muted">
				NodAI launches with a single production model served on real hardware. Not a waitlist, not
				a demo video — sign up and send it a prompt.
			</p>
			<div class="mt-8">
				<Button href="/signup" variant="secondary">Create an account</Button>
			</div>
		</div>

		<div class="grid grid-cols-2 border-t border-l border-line bg-surface">
			{#each facts as fact (fact.label)}
				<div class="border-r border-b border-line p-6">
					<p class="mono-label">{fact.label}</p>
					<p class="mt-3 font-mono text-lg text-fg">{fact.value}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Closing CTA -->
<section>
	<div class="mx-auto max-w-6xl px-6 py-20 md:py-28">
		<div class="border border-line bg-surface p-10 md:p-16">
			<h2 class="max-w-2xl text-3xl leading-tight font-semibold md:text-5xl">
				This community has value. Did you get paid?
			</h2>
			<p class="mt-6 max-w-xl leading-relaxed text-fg-muted">
				Contribution records and reward rules are public from day one. Devnet NOD is for testing
				and carries no monetary value.
			</p>
			<div class="mt-10">
				<Button href="/signup" size="lg">Get started</Button>
			</div>
		</div>
	</div>
</section>
