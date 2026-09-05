<script lang="ts">
	import { untrack } from 'svelte';
	import { INFERENCE_LIMITS, NOD } from '$lib/config';
	import { progress } from '$lib/progress.svelte';
	import Alert from '$lib/components/Alert.svelte';
	import Button from '$lib/components/Button.svelte';
	import Panel from '$lib/components/Panel.svelte';
	import Slider from '$lib/components/Slider.svelte';

	let { data } = $props();

	let modelId = $state(untrack(() => data.models[0]?.id ?? ''));
	let prompt = $state('');
	let temperature = $state(INFERENCE_LIMITS.defaultTemperature);
	let maxTokens = $state(INFERENCE_LIMITS.defaultMaxTokens);

	let running = $state(false);
	let output = $state('');
	let errorMessage = $state('');

	// Seeded from the server, then kept in sync by the inference stream.
	let balance = $state(untrack(() => data.balance));

	let tokensUsed = $state<number | null>(null);
	let latencyMs = $state<number | null>(null);
	let earned = $state<number | null>(null);

	let controller: AbortController | null = null;

	const selectedModel = $derived(data.models.find((m) => m.id === modelId) ?? null);
	const canRun = $derived(
		!running &&
			prompt.trim().length > 0 &&
			!!modelId &&
			data.models.length > 0 &&
			balance >= NOD.costPerInference &&
			data.endpointConfigured &&
			data.endpointOnline
	);

	const metrics = $derived([
		{ label: 'Tokens', value: tokensUsed === null ? '—' : String(tokensUsed) },
		{ label: 'Latency', value: latencyMs === null ? '—' : `${latencyMs} ms` },
		{ label: 'Earned', value: earned === null ? '—' : `${earned.toFixed(3)} NOD` },
		{ label: 'Balance', value: balance.toFixed(3) }
	]);

	async function run() {
		if (!canRun) return;

		running = true;
		output = '';
		errorMessage = '';
		tokensUsed = null;
		latencyMs = null;
		earned = null;

		controller = new AbortController();
		progress.start();

		try {
			const response = await fetch('/api/inference', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				signal: controller.signal,
				body: JSON.stringify({
					prompt,
					model_id: modelId,
					temperature,
					max_tokens: maxTokens
				})
			});

			if (!response.ok || !response.body) {
				const detail = await response.json().catch(() => null);
				errorMessage = detail?.message ?? `Request failed (${response.status}).`;
				return;
			}

			const reader = response.body.getReader();
			const decoder = new TextDecoder();
			let buffer = '';

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				buffer += decoder.decode(value, { stream: true });

				let boundary = buffer.indexOf('\n\n');
				while (boundary !== -1) {
					const frame = buffer.slice(0, boundary);
					buffer = buffer.slice(boundary + 2);
					boundary = buffer.indexOf('\n\n');

					if (!frame.startsWith('data:')) continue;

					let event: Record<string, unknown>;
					try {
						event = JSON.parse(frame.slice(5).trim());
					} catch {
						continue;
					}

					if (event.type === 'start' || event.type === 'done') {
						if (typeof event.balance === 'number') balance = event.balance;
					}
					if (event.type === 'delta' && typeof event.text === 'string') {
						output += event.text;
					}
					if (event.type === 'done') {
						tokensUsed = typeof event.tokens_used === 'number' ? event.tokens_used : null;
						latencyMs = typeof event.latency_ms === 'number' ? event.latency_ms : null;
						earned = typeof event.reward === 'number' ? event.reward : null;
					}
					if (event.type === 'error' && typeof event.message === 'string') {
						errorMessage = event.message;
						balance += NOD.costPerInference;
					}
				}
			}
		} catch (cause) {
			if ((cause as Error)?.name !== 'AbortError') {
				errorMessage = 'The connection dropped before the run finished.';
			}
		} finally {
			running = false;
			controller = null;
			progress.done();
		}
	}

	function stop() {
		controller?.abort();
	}
</script>

<svelte:head><title>Playground — NodAI</title></svelte:head>

<div class="mx-auto max-w-6xl px-6 py-16 md:py-20">
	<header class="border-b border-line pb-10">
		<p class="mono-label">Playground</p>
		<h1 class="mt-4 text-4xl font-semibold md:text-5xl">Run inference</h1>
		<p class="mt-4 max-w-2xl leading-relaxed text-fg-muted">
			Real inference on real hardware. Each run costs {NOD.costPerInference} NOD and earns
			{NOD.rewardPerInference} NOD back as an on-chain reward you can claim from the dashboard.
		</p>
	</header>

	{#if data.models.length === 0}
		<div class="mt-10">
			<Alert>
				No models are available yet. Check back once a model has been published to the network.
			</Alert>
		</div>
	{:else if !data.endpointConfigured}
		<div class="mt-10">
			<Alert>
				No inference endpoint is configured. Set <span class="font-mono">VLLM_API_URL</span> to a running
				vLLM server, then reload.
			</Alert>
		</div>
	{:else if !data.endpointOnline}
		<div class="mt-10">
			<Alert>
				The inference server is not responding. It may still be loading the model — large models
				take several minutes on first start.
			</Alert>
		</div>
	{/if}

	{#if data.models.length > 0}
	<!-- Metrics strip -->
	<div class="mt-10 grid grid-cols-2 overflow-hidden rounded-2xl border border-line md:grid-cols-4">
		{#each metrics as metric (metric.label)}
			<div class="border-r border-b cell-interactive border-line p-6 last:border-r-0">
				<p class="mono-label">{metric.label}</p>
				<p class="mt-3 font-mono text-2xl text-fg md:text-3xl">{metric.value}</p>
			</div>
		{/each}
	</div>

	<div class="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
		<!-- Prompt + output -->
		<div class="flex flex-col gap-8">
			<Panel label="Prompt">
				{#snippet actions()}
					<span class="font-mono text-xs text-fg-subtle">
						{prompt.length} / {INFERENCE_LIMITS.maxPromptChars}
					</span>
				{/snippet}

				<div class="flex flex-col gap-5">
					<textarea
						bind:value={prompt}
						rows="6"
						maxlength={INFERENCE_LIMITS.maxPromptChars}
						disabled={running}
						placeholder="Write a poem about AI"
						class="w-full resize-y rounded-xl border border-line bg-surface-2 p-4
							text-[0.9375rem] leading-relaxed text-fg outline-none
							placeholder:text-fg-subtle hover:border-line-strong focus:border-accent
							disabled:opacity-50"></textarea>

					{#if errorMessage}
						<Alert>{errorMessage}</Alert>
					{/if}

					{#if earned !== null && earned > 0}
						<Alert tone="info">
							Earned {earned.toFixed(3)} NOD. Claim it on the
							<a
								href="/dashboard"
								class="underline underline-offset-4 transition-colors hover:text-fg"
							>
								dashboard
							</a>.
						</Alert>
					{/if}

					{#if balance < NOD.costPerInference}
						<Alert>
							Not enough NOD to run inference. Each run costs {NOD.costPerInference} NOD — top up test
							credit on the
							<a
								href="/dashboard"
								class="underline underline-offset-4 transition-colors hover:text-fg"
							>
								dashboard
							</a>.
						</Alert>
					{/if}

					<div class="flex flex-wrap gap-3">
						<Button size="lg" onclick={run} disabled={!canRun}>
							{running ? 'Running…' : 'Run'}
						</Button>
						{#if running}
							<Button size="lg" variant="secondary" onclick={stop}>Stop</Button>
						{/if}
					</div>
				</div>
			</Panel>

			<Panel label="Response" padded={!output}>
				{#snippet actions()}
					{#if running}
						<span class="flex items-center gap-2 font-mono text-xs text-accent-fg">
							<span class="size-2 animate-pulse rounded-full bg-accent"></span>
							Streaming
						</span>
					{/if}
				{/snippet}

				{#if output}
					<pre
						class="overflow-x-auto p-5 font-mono text-[0.9375rem] leading-relaxed
						whitespace-pre-wrap text-fg">{output}</pre>
				{:else}
					<p class="py-10 text-center text-fg-subtle">
						{running ? 'Waiting for the first token…' : 'Run a prompt to see the response here.'}
					</p>
				{/if}
			</Panel>
		</div>

		<!-- Controls -->
		<div class="flex flex-col gap-8">
			<Panel label="Model">
				<div class="flex flex-col gap-5">
					<select
						bind:value={modelId}
						disabled={running || data.models.length <= 1}
						class="h-12 w-full rounded-lg border border-line bg-surface-2 px-3.5
							text-[0.9375rem] text-fg outline-none hover:border-line-strong
							focus:border-accent disabled:opacity-70"
					>
						{#each data.models as model (model.id)}
							<option value={model.id}>{model.name}</option>
						{/each}
					</select>

					{#if selectedModel}
						<dl class="flex flex-col divide-y divide-line border-t border-line">
							<div class="flex items-baseline justify-between gap-4 py-3">
								<dt class="text-sm text-fg-muted">License</dt>
								<dd class="font-mono text-sm text-fg">{selectedModel.license ?? '—'}</dd>
							</div>
							<div class="flex flex-col gap-1 py-3">
								<dt class="text-sm text-fg-muted">Target</dt>
								<dd class="font-mono text-sm break-all text-fg">
									{selectedModel.vllm_model_name ?? '—'}
								</dd>
							</div>
						</dl>
					{/if}
				</div>
			</Panel>

			<Panel label="Parameters">
				<div class="flex flex-col gap-8">
					<Slider
						id="temperature"
						label="Temperature"
						bind:value={temperature}
						min={INFERENCE_LIMITS.minTemperature}
						max={INFERENCE_LIMITS.maxTemperature}
						step={0.05}
						display={temperature.toFixed(2)}
						disabled={running}
					/>
					<Slider
						id="max-tokens"
						label="Max tokens"
						bind:value={maxTokens}
						min={INFERENCE_LIMITS.minMaxTokens}
						max={INFERENCE_LIMITS.maxMaxTokens}
						step={16}
						disabled={running}
					/>
				</div>
			</Panel>
		</div>
	</div>
	{/if}
</div>
