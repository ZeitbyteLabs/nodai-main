<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		subtitle,
		footer,
		children
	}: {
		title: string;
		subtitle: string;
		footer?: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="mx-auto flex max-w-md flex-col px-6 py-20 md:py-28">
	<h1 class="text-4xl font-semibold md:text-5xl">{title}</h1>
	<p class="mt-4 leading-relaxed text-fg-muted">{subtitle}</p>

	<div class="mt-10 border border-line bg-surface p-7">
		{@render children()}
	</div>

	{#if footer}
		<div class="mt-6 text-[0.9375rem] text-fg-muted">
			{@render footer()}
		</div>
	{/if}
</div>
