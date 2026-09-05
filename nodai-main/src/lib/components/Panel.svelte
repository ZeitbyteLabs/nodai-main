<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		label = '',
		class: className = '',
		padded = true,
		actions,
		children
	}: {
		label?: string;
		class?: string;
		padded?: boolean;
		actions?: Snippet;
		children: Snippet;
	} = $props();
</script>

<section class="border border-line bg-surface {className}">
	{#if label || actions}
		<header class="flex h-12 items-center justify-between border-b border-line px-5">
			<span class="mono-label">{label}</span>
			{#if actions}{@render actions()}{/if}
		</header>
	{/if}
	<div class={padded ? 'p-5' : ''}>
		{@render children()}
	</div>
</section>
