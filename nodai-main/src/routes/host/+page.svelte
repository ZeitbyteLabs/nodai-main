<script lang="ts">
	import Button from '$lib/components/Button.svelte';
	import Panel from '$lib/components/Panel.svelte';

	const liveUrl = 'https://nodai-main.vercel.app';
</script>

<svelte:head>
	<title>Host a GPU — NodAI</title>
	<meta
		name="description"
		content="Connect a home GPU to NodAI with the nodai-node CLI. No cloud account required."
	/>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16 md:py-20">
	<header class="border-b border-line pb-10">
		<p class="mono-label">Host</p>
		<h1 class="mt-4 text-4xl font-semibold md:text-5xl">Connect your GPU</h1>
		<p class="mt-4 leading-relaxed text-fg-muted">
			NodAI does not rent cloud GPUs. Your computer runs the model. The website only sends jobs and
			records rewards.
		</p>
	</header>

	<div class="mt-10 flex flex-col gap-8">
		<Panel label="What you need">
			<ul class="list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed text-fg-muted">
				<li>A PC with an NVIDIA GPU (8 GB+ VRAM is comfortable; 24 GB is better for 27B models)</li>
				<li><a href="https://nodejs.org" class="underline underline-offset-4" target="_blank" rel="noreferrer">Node.js 18+</a> installed</li>
				<li>vLLM (or any OpenAI-compatible server) running on this machine</li>
			</ul>
		</Panel>

		<Panel label="1 · Start the model on your PC">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				In a terminal on the GPU machine, serve the same model the catalogue lists (Qwen). Example:
			</p>
			<pre
				class="mt-4 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-fg">vllm serve Qwen/Qwen3.8-27B --host 127.0.0.1 --port 8000</pre>
			<p class="mt-4 text-sm text-fg-subtle">
				Leave this running. The node CLI talks to <span class="font-mono">http://127.0.0.1:8000</span>
				on the same computer — you do not open ports to the internet.
			</p>
		</Panel>

		<Panel label="2 · Install the node app">
			<pre
				class="overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-fg">git clone https://github.com/ZeitbyteLabs/nodai-main.git
cd nodai-main/nodai-node
npm install
npm link</pre>
		</Panel>

		<Panel label="3 · Connect to the live site">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				One command. It asks a few questions, registers this PC, then waits for jobs.
			</p>
			<pre
				class="mt-4 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-fg">nodai-node start --platform {liveUrl}</pre>
			<p class="mt-4 text-sm text-fg-subtle">
				When it says the node is online, open the playground on another tab (or phone) and run a
				prompt. This PC should pick it up within a few seconds.
			</p>
		</Panel>

		<Panel label="Useful commands">
			<div class="space-y-2 font-mono text-sm text-fg">
				<p>nodai-node start</p>
				<p>nodai-node status</p>
				<p>nodai-node stop <span class="text-fg-subtle"># Ctrl+C in the start window</span></p>
			</div>
		</Panel>
	</div>

	<div class="mt-10 flex flex-wrap gap-3">
		<Button href="/playground" variant="secondary">Open playground</Button>
		<Button href="/guide" variant="ghost">User guide</Button>
	</div>
</div>
