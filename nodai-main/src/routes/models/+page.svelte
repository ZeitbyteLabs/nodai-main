<script lang="ts">
	import Alert from '$lib/components/Alert.svelte';
	import Button from '$lib/components/Button.svelte';

	let { data } = $props();
</script>

<svelte:head><title>Models — NodAI</title></svelte:head>

<div class="mx-auto max-w-6xl px-6 py-16 md:py-20">
	<header class="border-b border-line pb-10">
		<p class="mono-label">Models</p>
		<h1 class="mt-4 text-4xl font-semibold md:text-5xl">Available on the network</h1>
		<p class="mt-4 max-w-2xl leading-relaxed text-fg-muted">
			NodAI launches with one production model served on real hardware. More arrive as the
			contributor hub opens up.
		</p>
	</header>

	{#if data.unavailable}
		<div class="mt-10">
			<Alert>The model catalogue is temporarily unavailable. Try again shortly.</Alert>
		</div>
	{:else if data.models.length === 0}
		<p class="mt-16 text-center text-fg-subtle">No models published yet.</p>
	{:else}
		<div class="mt-10 flex flex-col gap-px bg-line">
			{#each data.models as model (model.id)}
				<article
					class="flex flex-col gap-6 bg-surface p-7 md:flex-row md:items-center md:justify-between"
				>
					<div class="max-w-2xl">
						<h2 class="text-2xl font-semibold md:text-3xl">{model.name}</h2>
						{#if model.description}
							<p class="mt-3 leading-relaxed text-fg-muted">{model.description}</p>
						{/if}
						<div class="mt-5 flex flex-wrap items-center gap-2">
							{#if model.license}
								<span class="border border-line-strong px-2.5 py-1 font-mono text-xs text-fg-muted">
									{model.license}
								</span>
							{/if}
							{#if model.vllm_model_name}
								<span class="border border-line-strong px-2.5 py-1 font-mono text-xs text-fg-muted">
									{model.vllm_model_name}
								</span>
							{/if}
							<span class="border border-accent-line bg-accent-wash px-2.5 py-1 font-mono text-xs text-accent-fg">
								Active
							</span>
						</div>
					</div>

					<div class="shrink-0">
						{#if data.signedIn}
							<Button href="/dashboard" variant="secondary">Open dashboard</Button>
						{:else}
							<Button href="/signup">Get started</Button>
						{/if}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>
