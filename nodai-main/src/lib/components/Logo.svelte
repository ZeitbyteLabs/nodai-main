<script lang="ts">
	let { compact = false }: { compact?: boolean } = $props();
</script>

<span class="flex items-center gap-2.5">
	<span class="grid size-8 shrink-0 grid-cols-2 grid-rows-2 gap-px bg-line-strong p-px">
		<span class="bg-accent"></span>
		<span class="bg-ink"></span>
		<span class="bg-ink"></span>
		<span class="bg-accent"></span>
	</span>
	{#if !compact}
		<span class="text-lg font-semibold tracking-tight text-fg">NodAI</span>
	{/if}
</span>
