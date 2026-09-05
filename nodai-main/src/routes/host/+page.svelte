<script lang="ts">
	import { NOD } from '$lib/config';
	import Button from '$lib/components/Button.svelte';
	import Panel from '$lib/components/Panel.svelte';

	const liveUrl = 'https://nodai-main.vercel.app';
</script>

<svelte:head>
	<title>Host a GPU — NodAI</title>
	<meta
		name="description"
		content="Install vLLM, download a model, and connect your home GPU to NodAI with nodai-node."
	/>
</svelte:head>

<div class="mx-auto max-w-3xl px-6 py-16 md:py-20">
	<header class="border-b border-line pb-10">
		<p class="mono-label">Host</p>
		<h1 class="mt-4 text-4xl font-semibold md:text-5xl">Connect your GPU</h1>
		<p class="mt-4 leading-relaxed text-fg-muted">
			Your PC runs the AI model with vLLM. NodAI only sends jobs. You earn
			<span class="font-mono text-fg">{NOD.hostRewardPerJob} NOD</span> per completed job on the
			account that owns your API key.
		</p>
	</header>

	<div class="mt-10 flex flex-col gap-8">
		<Panel label="What you need">
			<ul class="list-disc space-y-2 pl-5 text-[0.9375rem] leading-relaxed text-fg-muted">
				<li>NVIDIA GPU — 8 GB+ VRAM (small models); 24 GB+ for Qwen3.8-27B</li>
				<li>Linux or WSL2 on Windows (vLLM works best on Linux)</li>
				<li>
					<a
						href="https://www.nvidia.com/drivers"
						class="underline underline-offset-4"
						target="_blank"
						rel="noreferrer">NVIDIA drivers</a
					>
					up to date
				</li>
				<li>
					<a
						href="https://www.python.org/downloads/"
						class="underline underline-offset-4"
						target="_blank"
						rel="noreferrer">Python 3.10–3.12</a
					>
				</li>
				<li>
					<a
						href="https://nodejs.org"
						class="underline underline-offset-4"
						target="_blank"
						rel="noreferrer">Node.js 18+</a
					>
					(for nodai-node)
				</li>
				<li>~60 GB free disk for the 27B model (~15 GB for a 7B test model)</li>
			</ul>
		</Panel>

		<Panel label="Step 1 · Create an API key">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				Sign in on the account that should earn NOD. On the dashboard, under
				<strong class="text-fg">Your GPUs</strong>, click <strong class="text-fg">New key</strong>
				and copy the <span class="font-mono text-fg">nod_…</span> secret. You will paste it into
				the node app. Use a <strong class="text-fg">different</strong> account than the one that
				runs prompts if you are testing both sides.
			</p>
			<div class="mt-4">
				<Button href="/dashboard" size="sm" variant="secondary">Open dashboard</Button>
			</div>
		</Panel>

		<Panel label="Step 2 · Install vLLM">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				vLLM is the program that loads a model and answers prompts. Install it once in a Python
				environment:
			</p>
			<pre
				class="mt-4 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-fg">nvidia-smi

python3 -m venv ~/nodai-gpu/venv
source ~/nodai-gpu/venv/bin/activate   # Windows WSL: same command in Ubuntu

pip install --upgrade pip
pip install vllm</pre>
			<p class="mt-4 text-sm text-fg-subtle">
				On Windows, use
				<a
					href="https://learn.microsoft.com/en-us/windows/wsl/install"
					class="underline underline-offset-4"
					target="_blank"
					rel="noreferrer">WSL2 + Ubuntu</a
				> — vLLM does not run on native Windows.
			</p>
		</Panel>

		<Panel label="Step 3 · Download and serve a model">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				The first time you run <span class="font-mono text-fg">vllm serve</span>, it downloads weights
				from Hugging Face into <span class="font-mono">~/.cache/huggingface/</span>. Leave this
				terminal open.
			</p>
			<p class="mt-4 text-sm font-medium text-fg">Catalogue model (24 GB+ VRAM):</p>
			<pre
				class="mt-2 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-fg">vllm serve Qwen/Qwen3.8-27B \
  --host 127.0.0.1 \
  --port 8000 \
  --max-model-len 8192</pre>
			<p class="mt-4 text-sm font-medium text-fg">Smaller test model (8–12 GB VRAM):</p>
			<pre
				class="mt-2 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-fg">vllm serve Qwen/Qwen2.5-7B-Instruct \
  --host 127.0.0.1 \
  --port 8000 \
  --max-model-len 8192</pre>
			<p class="mt-4 text-sm text-fg-subtle">
				If download fails, create a free Hugging Face account and run
				<span class="font-mono">pip install huggingface_hub && huggingface-cli login</span>, then try
				again.
			</p>
		</Panel>

		<Panel label="Step 4 · Test vLLM">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				In a new terminal on the same PC:
			</p>
			<pre
				class="mt-4 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-fg">curl http://127.0.0.1:8000/v1/models</pre>
			<p class="mt-4 text-sm text-fg-subtle">
				You should see JSON listing the model. If this works, vLLM is ready for nodai-node.
			</p>
		</Panel>

		<Panel label="Step 5 · Install nodai-node">
			<pre
				class="overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-fg">git clone https://github.com/ZeitbyteLabs/nodai-main.git
cd nodai-main/nodai-node
npm install
npm link</pre>
		</Panel>

		<Panel label="Step 6 · Connect to NodAI">
			<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
				With vLLM still running, start the node and paste your API key when asked:
			</p>
			<pre
				class="mt-4 overflow-x-auto rounded-xl border border-line bg-surface-2 p-4 font-mono text-sm text-fg">nodai-node start --platform {liveUrl}</pre>
			<p class="mt-4 text-[0.9375rem] leading-relaxed text-fg-muted">
				Local AI server = <span class="font-mono">http://127.0.0.1:8000</span>. When this PC is
				online it shows on <strong class="text-fg">Your GPUs</strong>. Run a prompt from another
				account and watch this window pick up the job — the host account earns NOD.
			</p>
		</Panel>

		<Panel label="Troubleshooting">
			<ul class="list-disc space-y-2 pl-5 text-sm leading-relaxed text-fg-muted">
				<li><strong class="text-fg">Out of memory</strong> — use the 7B model instead of 27B.</li>
				<li>
					<strong class="text-fg">Local AI not running</strong> — start vLLM first; test with curl
					above.
				</li>
				<li>
					<strong class="text-fg">Stuck on Queued</strong> — keep nodai-node running; check
					Dashboard → Your GPUs shows your node online.
				</li>
				<li>
					<strong class="text-fg">Full guide</strong> —
					<a
						href="https://github.com/ZeitbyteLabs/nodai-main/blob/main/public-docs/NodeGuide.md"
						class="underline underline-offset-4"
						target="_blank"
						rel="noreferrer">NodeGuide.md</a
					>
					on GitHub.
				</li>
			</ul>
		</Panel>

		<Panel label="Commands">
			<div class="space-y-2 font-mono text-sm text-fg">
				<p>nodai-node start</p>
				<p>nodai-node status</p>
				<p>Stop: Ctrl+C in the start window</p>
			</div>
		</Panel>
	</div>

	<div class="mt-10 flex flex-wrap gap-3">
		<Button href="/playground" variant="secondary">Open playground</Button>
		<Button href="/guide" variant="ghost">User guide</Button>
	</div>
</div>
