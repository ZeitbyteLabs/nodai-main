<script lang="ts">
	let { compact = false }: { compact?: boolean } = $props();
</script>

<span class="flex items-center gap-2.5">
	<span
		class="grid size-8 shrink-0 grid-cols-2 grid-rows-2 gap-px overflow-hidden rounded-lg
			bg-line-strong p-px"
	>
		<span class="rounded-tl-md bg-accent"></span>
		<span class="rounded-tr-md bg-ink"></span>
		<span class="rounded-bl-md bg-ink"></span>
		<span class="rounded-br-md bg-accent"></span>
	</span>
	{#if !compact}
		<span class="text-lg font-semibold tracking-tight text-fg">NodAI</span>
	{/if}
</span>
