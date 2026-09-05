<script lang="ts">
	import { Dialog } from 'bits-ui';
	import { NOD, SITE } from '$lib/config';
	import Button from './Button.svelte';

	let { open = $bindable(false) }: { open?: boolean } = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay class="fixed inset-0 z-50 bg-ink/80 backdrop-blur-sm" />
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2
				-translate-y-1/2 rounded-2xl border border-line bg-surface p-6 shadow-xl
				focus:outline-none md:p-8"
		>
			<Dialog.Title class="text-2xl font-semibold text-fg">{SITE.name}</Dialog.Title>
			<Dialog.Description class="mt-2 text-fg-muted">
				{SITE.tagline}
			</Dialog.Description>

			<div class="mt-6 space-y-4 text-[0.9375rem] leading-relaxed text-fg-muted">
				<p>
					NodAI is an open network for sharing models, running AI, and earning NOD. Inference
					runs on community GPUs — we do not rent RunPod or AWS for the model. Everything is
					recorded so the maths is checkable.
				</p>

				<ol class="space-y-3">
					<li class="flex gap-3">
						<span class="font-mono text-accent-fg">1</span>
						<span><strong class="text-fg">Share models</strong> — publish open models with a clear licence.</span>
					</li>
					<li class="flex gap-3">
						<span class="font-mono text-accent-fg">2</span>
						<span><strong class="text-fg">Run AI</strong> — send a prompt; a community GPU answers it.</span>
					</li>
					<li class="flex gap-3">
						<span class="font-mono text-accent-fg">3</span>
						<span><strong class="text-fg">Earn NOD</strong> — hosts earn {NOD.hostRewardPerJob} NOD per job their GPU completes. Users pay {NOD.costPerInference} NOD to run.</span>
					</li>
				</ol>

				<p>
					Your dashboard balance pays for runs. GPU hosts connect a wallet and claim earnings
					on Solana.
				</p>
			</div>

			<div class="mt-8 flex flex-wrap justify-end gap-3">
				<Button href="/guide" variant="ghost" size="sm">User guide</Button>
				<Dialog.Close>
					<Button variant="secondary" size="sm">Got it</Button>
				</Dialog.Close>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
