<script lang="ts">
	import { onMount } from 'svelte';
	import {
		ArrowRight,
		Box,
		ChevronDown,
		Cpu,
		Gift,
		Sparkles,
		Wallet,
		Zap
	} from '@lucide/svelte';
	import { NOD } from '$lib/config';
	import Button from '$lib/components/Button.svelte';
	import HeroNetwork from '$lib/components/HeroNetwork.svelte';

	let { data } = $props();

	const steps = [
		{
			n: '01',
			title: 'Share models',
			body: 'Publish open models with a clear licence and a readable model card. Your work stays yours.',
			detail:
				'The catalogue starts with one production model. Contributors keep ownership; NodAI records the licence so anyone can check the terms before they run it.'
		},
		{
			n: '02',
			title: 'Run AI',
			body: 'Send a prompt. A community GPU on someone\'s machine answers it. NodAI does not rent cloud GPUs.',
			detail:
				'The playground queues a job. A PC running nodai-node pulls it, runs the model locally, and sends the answer back. Each run costs a fixed amount of NOD.'
		},
		{
			n: '03',
			title: 'Earn NOD',
			body: 'GPU hosts earn NOD for every job their machine completes. Claim it to a Solana wallet.',
			detail:
				`Users spend ${NOD.costPerInference} NOD per run. The host who answers it earns ${NOD.hostRewardPerJob} NOD. Claim from the dashboard.`
		}
	];

	const facts = $derived([
		{ label: 'Model', value: data.models[0]?.name ?? 'Qwen3.8-27B' },
		{ label: 'Context', value: '262K tokens' },
		{ label: 'Licence', value: data.models[0]?.license ?? 'Apache-2.0' },
		{ label: 'Network', value: 'Solana Devnet' }
	]);

	const personas = [
		{
			icon: Sparkles,
			title: 'Researchers',
			body: 'Test a real open model in seconds. Keep a receipt for every run — tokens, latency, and NOD movement.'
		},
		{
			icon: Box,
			title: 'Model authors',
			body: 'Put a licensed model on the network with a readable card. People run it; you stay credited for the work.'
		},
		{
			icon: Cpu,
			title: 'GPU operators',
			body: 'Create an API key on the dashboard, start nodai-node, and earn NOD for every job your GPU finishes.'
		}
	];

	const faqs = [
		{
			q: 'What is NOD?',
			a: 'NOD is the network credit for running inference and recording rewards. On this MVP it lives on Solana devnet and has no monetary value.'
		},
		{
			q: 'How much does a run cost?',
			a: `Each playground run costs ${NOD.costPerInference} NOD. The GPU host who completes it earns ${NOD.hostRewardPerJob} NOD, claimable from their dashboard.`
		},
		{
			q: 'Do I need a wallet to start?',
			a: 'No. Sign up, get test credit, and run inference immediately. Hosts connect Phantom when they want to claim earnings on-chain.'
		},
		{
			q: 'Is the model actually running?',
			a: 'Yes — when a community GPU is online. Prompts wait in a queue until someone\'s PC running nodai-node picks them up. There is no NodAI-owned cloud GPU.'
		},
		{
			q: 'Can I attach my own GPU?',
			a: 'Yes. Sign in, create an API key on the dashboard, start vLLM, then run nodai-node start and paste the key.'
		}
	];

	const examples = [
		'Explain how a transformer attention head works, in plain language.',
		'Write a short model card for an open 27B language model.',
		'Draft a checklist for publishing a model with a clear licence.',
		'Summarise why contributor-owned compute matters for open AI.'
	];

	let activeStep = $state(0);
	let openFaq = $state<number | null>(0);
	let runs = $state(8);
	let exampleIndex = $state(0);
	let typed = $state('');
	let nodesOnline = $state<number | null>(null);

	const spend = $derived(runs * NOD.costPerInference);
	const earn = $derived(runs * NOD.hostRewardPerJob);
	const fee = $derived(runs * NOD.feePerInference);
	const featured = $derived(data.models[0] ?? null);
	const startHref = $derived(data.signedIn ? '/playground' : '/signup');
	const startLabel = $derived(data.signedIn ? 'Open playground' : 'Get started');

	onMount(() => {
		let i = 0;
		let deleting = false;
		let pause = 0;

		const timer = setInterval(() => {
			const target = examples[exampleIndex];
			if (pause > 0) {
				pause -= 1;
				return;
			}
			if (!deleting) {
				typed = target.slice(0, i + 1);
				i += 1;
				if (i >= target.length) {
					deleting = true;
					pause = 18;
				}
			} else {
				typed = target.slice(0, i);
				i -= 1;
				if (i <= 0) {
					deleting = false;
					exampleIndex = (exampleIndex + 1) % examples.length;
				}
			}
		}, 38);

		fetch('/api/nodes')
			.then((response) => (response.ok ? response.json() : null))
			.then((body) => {
				if (!body?.nodes) return;
				nodesOnline = body.nodes.filter((node: { status: string }) => node.status === 'online')
					.length;
			})
			.catch(() => {
				nodesOnline = 0;
			});

		return () => clearInterval(timer);
	});
</script>

<svelte:head>
	<title>NodAI — The Open AI Network</title>
	<meta
		name="description"
		content="NodAI is an open, local-first AI network. Share models, run AI, and earn NOD for the work you contribute."
	/>
</svelte:head>

<!-- Hero -->
<section class="relative overflow-hidden border-b border-line">
	<div class="pointer-events-none absolute inset-0">
		<HeroNetwork />
		<div class="absolute inset-0 bg-ink/55"></div>
		<div
			class="absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_bottom,transparent,var(--color-ink))]"
		></div>
	</div>

	<div class="relative mx-auto max-w-6xl px-6 py-24 md:py-36">
		<p class="mb-8 mono-label">Open · Local-first · Contributor-owned</p>

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
			<Button href={startHref} size="lg">
				{startLabel}
				<ArrowRight class="size-4" />
			</Button>
			<a
				href="/models"
				class="border-b border-line-strong pb-1 text-base text-fg-muted transition-colors hover:border-accent hover:text-fg"
			>
				Browse models
			</a>
		</div>

		<div class="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-4">
			<div class="bg-ink/70 p-5">
				<p class="mono-label">Live model</p>
				<p class="mt-2 font-mono text-lg text-fg">{featured?.name ?? 'Coming online'}</p>
			</div>
			<div class="bg-ink/70 p-5">
				<p class="mono-label">Catalogue</p>
				<p class="mt-2 font-mono text-lg text-fg">{data.models.length} active</p>
			</div>
			<div class="bg-ink/70 p-5">
				<p class="mono-label">GPU nodes</p>
				<p class="mt-2 font-mono text-lg text-fg">
					{nodesOnline === null ? '…' : `${nodesOnline} online`}
				</p>
			</div>
			<div class="bg-ink/70 p-5">
				<p class="mono-label">Run cost</p>
				<p class="mt-2 font-mono text-lg text-fg">{NOD.costPerInference} NOD</p>
			</div>
		</div>
	</div>
</section>

<!-- How it works -->
<section class="border-b border-line">
	<div class="mx-auto max-w-6xl px-6 py-16 md:py-24">
		<p class="mono-label">How it works</p>
		<h2 class="mt-4 max-w-2xl text-3xl font-semibold md:text-4xl">Three moves. One loop.</h2>
		<p class="mt-4 max-w-2xl leading-relaxed text-fg-muted">
			Pick a step to see what actually happens under the hood. Nothing here is a waitlist pitch —
			each piece is already wired.
		</p>

		<div class="mt-10 grid gap-8 lg:grid-cols-[1fr_1.1fr]">
			<div class="flex flex-col gap-3">
				{#each steps as step, index (step.n)}
					<button
						type="button"
						class="rounded-2xl border px-5 py-5 text-left transition-colors duration-200
							ease-out-quart {activeStep === index
							? 'border-accent-line bg-accent-wash'
							: 'border-line bg-surface hover:border-line-strong hover:bg-surface-2'}"
						onclick={() => (activeStep = index)}
						aria-pressed={activeStep === index}
					>
						<span
							class="mono-label {activeStep === index ? 'text-accent-fg' : ''}"
						>
							{step.n}
						</span>
						<h3 class="mt-2 text-xl font-semibold">{step.title}</h3>
						<p class="mt-2 text-[0.9375rem] leading-relaxed text-fg-muted">{step.body}</p>
					</button>
				{/each}
			</div>

			<div class="rounded-2xl border border-line bg-surface p-8 md:p-10">
				<p class="mono-label">Detail</p>
				<h3 class="mt-4 text-2xl font-semibold">{steps[activeStep].title}</h3>
				<p class="mt-4 leading-relaxed text-fg-muted">{steps[activeStep].detail}</p>
				<div class="mt-8">
					<Button href={activeStep === 2 ? '/dashboard' : startHref} variant="secondary">
						{activeStep === 2 ? 'Open dashboard' : startLabel}
					</Button>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Prompt studio -->
<section class="border-b border-line">
	<div class="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
		<div>
			<p class="mono-label">Playground</p>
			<h2 class="mt-4 text-3xl font-semibold md:text-4xl">Send a real prompt.</h2>
			<p class="mt-4 leading-relaxed text-fg-muted">
				These are starter prompts — take one into the playground. A community GPU answers when
				someone is hosting.
			</p>
			<div class="mt-8 flex flex-wrap gap-3">
				<Button href={startHref}>
					<Zap class="size-4" />
					Run this prompt
				</Button>
				<Button href="/guide" variant="ghost">Read the guide</Button>
			</div>
		</div>

		<div class="rounded-2xl border border-line bg-surface p-6 md:p-8">
			<div class="flex items-center justify-between gap-3">
				<span class="mono-label">Example</span>
				<span class="font-mono text-xs text-accent-fg">streaming ready</span>
			</div>
			<p class="mt-6 min-h-28 font-mono text-[0.9375rem] leading-relaxed text-fg">
				{typed}<span class="ml-0.5 inline-block h-4 w-px animate-pulse bg-accent-fg align-[-2px]"
				></span>
			</p>
			<div class="mt-6 flex flex-wrap gap-2">
				{#each examples as example, index (example)}
					<button
						type="button"
						class="rounded-full border px-3 py-1 font-mono text-xs transition-colors
							{exampleIndex === index
							? 'border-accent-line bg-accent-wash text-accent-fg'
							: 'border-line text-fg-muted hover:border-line-strong hover:text-fg'}"
						onclick={() => {
							exampleIndex = index;
							typed = example;
						}}
					>
						0{index + 1}
					</button>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Live model -->
<section class="border-b border-line">
	<div class="mx-auto grid max-w-6xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28">
		<div>
			<p class="mono-label">Running now</p>
			<h2 class="mt-5 text-3xl font-semibold md:text-4xl">
				{featured ? `${featured.name}. Fully working.` : 'One model. Fully working.'}
			</h2>
			<p class="mt-5 leading-relaxed text-fg-muted">
				{featured?.description ??
					'One catalogue model. Jobs run on community GPUs — not a NodAI cloud box. Sign up, queue a prompt, and a host answers it.'}
			</p>
			<div class="mt-8">
				<Button href={data.signedIn ? '/playground' : '/signup'} variant="secondary">
					{data.signedIn ? 'Run inference' : 'Create an account'}
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-2 overflow-hidden rounded-2xl border border-line bg-surface">
			{#each facts as fact (fact.label)}
				<div class="border-r border-b cell-interactive border-line p-6">
					<p class="mono-label">{fact.label}</p>
					<p class="mt-3 font-mono text-lg text-fg">{fact.value}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Economy -->
<section class="border-b border-line">
	<div class="mx-auto max-w-6xl px-6 py-16 md:py-24">
		<p class="mono-label">Economy</p>
		<h2 class="mt-4 text-3xl font-semibold md:text-4xl">The maths is public.</h2>
		<p class="mt-4 max-w-2xl leading-relaxed text-fg-muted">
			Drag the slider to see a day of hosting. Users pay for runs. GPU hosts earn. The rest is
			the platform fee.
		</p>

		<div class="mt-10 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
			<div class="rounded-2xl border border-line bg-surface p-6 md:p-8">
				<label for="runs" class="flex items-center justify-between gap-4">
					<span class="text-fg">Jobs your GPU completes</span>
					<span class="font-mono text-accent-fg">{runs}</span>
				</label>
				<input
					id="runs"
					type="range"
					min="1"
					max="40"
					bind:value={runs}
					class="mt-5 w-full accent-accent"
				/>
				<div class="mt-8 grid grid-cols-3 gap-4">
					<div>
						<p class="mono-label">Users spend</p>
						<p class="mt-2 font-mono text-xl text-fg">{spend.toFixed(3)}</p>
					</div>
					<div>
						<p class="mono-label">You earn</p>
						<p class="mt-2 font-mono text-xl text-success">{earn.toFixed(3)}</p>
					</div>
					<div>
						<p class="mono-label">Platform</p>
						<p class="mt-2 font-mono text-xl text-fg">{fee.toFixed(3)}</p>
					</div>
				</div>
			</div>

			<div class="flex flex-col justify-between gap-6 rounded-2xl border border-line bg-surface p-6 md:p-8">
				<div class="flex flex-col gap-4 text-[0.9375rem] leading-relaxed text-fg-muted">
					<p class="flex items-start gap-3">
						<Wallet class="mt-0.5 size-4 shrink-0 text-accent-fg" />
						Connect Phantom when you want NOD in a wallet, not just as run credit.
					</p>
					<p class="flex items-start gap-3">
						<Gift class="mt-0.5 size-4 shrink-0 text-accent-fg" />
						Claim is a real devnet transaction. Activity keeps the explorer link.
					</p>
				</div>
				<Button href="/dashboard" variant="secondary">Check your balance</Button>
			</div>
		</div>
	</div>
</section>

<!-- Who it's for -->
<section class="border-b border-line">
	<div class="mx-auto max-w-6xl px-6 py-16 md:py-24">
		<p class="mono-label">Who it's for</p>
		<h2 class="mt-4 text-3xl font-semibold md:text-4xl">Built for the people doing the work.</h2>
		<div class="mt-10 grid gap-4 md:grid-cols-3">
			{#each personas as persona (persona.title)}
				{@const Icon = persona.icon}
				<article class="card-interactive rounded-2xl border border-line bg-surface p-6 md:p-7">
					<Icon class="size-5 text-accent-fg" />
					<h3 class="mt-5 text-xl font-semibold">{persona.title}</h3>
					<p class="mt-3 leading-relaxed text-fg-muted">{persona.body}</p>
				</article>
			{/each}
		</div>
	</div>
</section>

<!-- FAQ -->
<section class="border-b border-line">
	<div class="mx-auto max-w-3xl px-6 py-16 md:py-24">
		<p class="mono-label">Questions</p>
		<h2 class="mt-4 text-3xl font-semibold md:text-4xl">Straight answers.</h2>
		<div class="mt-10 divide-y divide-line border-y border-line">
			{#each faqs as faq, index (faq.q)}
				<div>
					<button
						type="button"
						class="flex w-full items-center justify-between gap-4 py-5 text-left"
						onclick={() => (openFaq = openFaq === index ? null : index)}
						aria-expanded={openFaq === index}
					>
						<span class="text-lg font-semibold">{faq.q}</span>
						<ChevronDown
							class="size-5 shrink-0 text-fg-muted transition-transform duration-200
								{openFaq === index ? 'rotate-180 text-accent-fg' : ''}"
						/>
					</button>
					{#if openFaq === index}
						<p class="animate-rise pb-5 leading-relaxed text-fg-muted">{faq.a}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- Closing CTA -->
<section>
	<div class="mx-auto max-w-6xl px-6 py-20 md:py-28">
		<div class="card-interactive rounded-3xl border border-line bg-surface p-10 md:p-16">
			<h2 class="max-w-2xl text-3xl leading-tight font-semibold md:text-5xl">
				This community has value. Did you get paid?
			</h2>
			<p class="mt-6 max-w-xl leading-relaxed text-fg-muted">
				Contribution records and reward rules are public from day one. Devnet NOD is for testing and
				carries no monetary value.
			</p>
			<div class="mt-10 flex flex-wrap gap-4">
				<Button href={startHref} size="lg">{startLabel}</Button>
				<Button href="/models" variant="secondary" size="lg">See the model</Button>
			</div>
		</div>
	</div>
</section>
