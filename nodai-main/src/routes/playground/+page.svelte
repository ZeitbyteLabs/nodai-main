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
	let phase = $state<'idle' | 'queued' | 'running' | 'done'>('idle');
	let output = $state('');
	let errorMessage = $state('');
	let balance = $state(untrack(() => data.balance));
	let tokensUsed = $state<number | null>(null);
	let latencyMs = $state<number | null>(null);
	let cost = $state<number | null>(null);

	let cancelled = false;

	const selectedModel = $derived(data.models.find((m) => m.id === modelId) ?? null);
	const canRun = $derived(
		!running &&
			prompt.trim().length > 0 &&
			!!modelId &&
			data.models.length > 0 &&
			balance >= NOD.costPerInference
	);

	const metrics = $derived([
		{ label: 'Tokens', value: tokensUsed === null ? '—' : String(tokensUsed) },
		{ label: 'Latency', value: latencyMs === null ? '—' : `${latencyMs} ms` },
		{ label: 'Cost', value: cost === null ? '—' : `${cost.toFixed(3)} NOD` },
		{ label: 'Balance', value: balance.toFixed(3) }
	]);

	const waitCopy = $derived(
		phase === 'queued'
			? data.onlineNodes > 0
				? 'Waiting for a community GPU to pick up the job…'
				: 'Queued. No GPU is online yet — start nodai-node on a machine, or wait.'
			: phase === 'running'
				? 'A community GPU is running your prompt…'
				: 'Run a prompt. A community GPU answers it.'
	);

	async function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function pollJob(jobId: string) {
		const deadline = Date.now() + 5 * 60 * 1000;

		while (!cancelled && Date.now() < deadline) {
			const response = await fetch(`/api/jobs/${jobId}`);
			const body = await response.json().catch(() => null);

			if (!response.ok) {
				throw new Error(body?.message ?? `Could not read job (${response.status}).`);
			}

			if (typeof body.balance === 'number') balance = body.balance;

			if (body.status === 'running') phase = 'running';

			if (body.status === 'completed') {
				output = typeof body.response === 'string' ? body.response : '';
				tokensUsed = typeof body.tokens_used === 'number' ? body.tokens_used : null;
				latencyMs = typeof body.latency_ms === 'number' ? body.latency_ms : null;
				cost = typeof body.cost === 'number' ? body.cost : NOD.costPerInference;
				phase = 'done';
				return;
			}

			if (body.status === 'failed') {
				throw new Error('The GPU node failed this run. Your NOD was refunded.');
			}

			await sleep(1500);
		}

		if (cancelled) return;
		throw new Error('No GPU finished this job in time. It stays queued — keep a node running.');
	}

	async function run() {
		if (!canRun) return;

		running = true;
		cancelled = false;
		output = '';
		errorMessage = '';
		tokensUsed = null;
		latencyMs = null;
		cost = null;
		phase = 'queued';
		progress.start();

		try {
			const queued = await fetch('/api/jobs', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					prompt,
					model_id: modelId,
					temperature,
					max_tokens: maxTokens
				})
			});

			const detail = await queued.json().catch(() => null);

			if (!queued.ok) {
				errorMessage = detail?.message ?? `Request failed (${queued.status}).`;
				phase = 'idle';
				return;
			}

			if (typeof detail.balance === 'number') balance = detail.balance;
			await pollJob(detail.job_id);
		} catch (cause) {
			if (!cancelled) {
				errorMessage = cause instanceof Error ? cause.message : 'The run failed.';
			}
			phase = 'idle';
		} finally {
			running = false;
			progress.done();
		}
	}

	function stop() {
		cancelled = true;
		running = false;
		phase = 'idle';
		progress.done();
	}
</script>

<svelte:head><title>Playground — NodAI</title></svelte:head>

<div class="mx-auto max-w-6xl px-6 py-16 md:py-20">
	<header class="border-b border-line pb-10">
		<p class="mono-label">Playground</p>
		<h1 class="mt-4 text-4xl font-semibold md:text-5xl">Run inference</h1>
		<p class="mt-4 max-w-2xl leading-relaxed text-fg-muted">
			Jobs go to community GPUs — NodAI does not run a cloud GPU. Each run costs
			{NOD.costPerInference} NOD. Hosts earn {NOD.hostRewardPerJob} NOD for completing it.
		</p>
	</header>

	{#if data.models.length === 0}
		<div class="mt-10">
			<Alert>
				No models are available yet. Check back once a model has been published to the network.
			</Alert>
		</div>
	{:else if data.onlineNodes === 0}
		<div class="mt-10">
			<Alert tone="info">
				No community GPU is online right now. You can still queue a run — it waits until someone
				starts
				<a href="/host" class="underline underline-offset-4 hover:text-fg">nodai-node</a>
				on their machine.
			</Alert>
		</div>
	{/if}

	{#if data.models.length > 0}
		<div class="mt-10 grid grid-cols-2 overflow-hidden rounded-2xl border border-line md:grid-cols-4">
			{#each metrics as metric (metric.label)}
				<div class="border-r border-b cell-interactive border-line p-6 last:border-r-0">
					<p class="mono-label">{metric.label}</p>
					<p class="mt-3 font-mono text-2xl text-fg md:text-3xl">{metric.value}</p>
				</div>
			{/each}
		</div>

		<div class="mt-8 grid gap-8 lg:grid-cols-[1fr_20rem]">
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
								disabled:opacity-50"
						></textarea>

						{#if errorMessage}
							<Alert>{errorMessage}</Alert>
						{/if}

						{#if balance < NOD.costPerInference}
							<Alert>
								Not enough NOD to run inference. Each run costs {NOD.costPerInference} NOD — top up
								test credit on the
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
								{running ? 'Waiting…' : 'Run'}
							</Button>
							{#if running}
								<Button size="lg" variant="secondary" onclick={stop}>Stop waiting</Button>
							{/if}
						</div>
					</div>
				</Panel>

				<Panel label="Response" padded={!output}>
					{#snippet actions()}
						{#if running}
							<span class="flex items-center gap-2 font-mono text-xs text-accent-fg">
								<span class="size-2 animate-pulse rounded-full bg-accent"></span>
								{phase === 'running' ? 'On a GPU' : 'Queued'}
							</span>
						{/if}
					{/snippet}

					{#if output}
						<pre
							class="overflow-x-auto p-5 font-mono text-[0.9375rem] leading-relaxed
							whitespace-pre-wrap text-fg">{output}</pre>
					{:else}
						<p class="py-10 text-center text-fg-subtle">{waitCopy}</p>
					{/if}
				</Panel>
			</div>

			<div class="flex flex-col gap-8">
				<Panel label="Network">
					<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
						<span class="font-mono text-fg">{data.onlineNodes}</span>
						community GPU{data.onlineNodes === 1 ? '' : 's'} online.
					</p>
					<p class="mt-3 text-sm text-fg-subtle">
						Have a GPU?
						<a href="/host" class="text-accent-fg underline underline-offset-4 hover:text-fg">
							Connect it
						</a>.
					</p>
				</Panel>

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
