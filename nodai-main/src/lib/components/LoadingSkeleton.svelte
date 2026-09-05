<script lang="ts">
	let {
		class: className = '',
		lines = 1
	}: {
		class?: string;
		lines?: number;
	} = $props();
</script>

<div class="flex flex-col gap-2 {className}" aria-hidden="true">
	{#each Array(lines) as _, i (i)}
		<div
			class="skeleton h-4 rounded-md {i === lines - 1 && lines > 1 ? 'w-2/3' : 'w-full'}"
		></div>
	{/each}
</div>
