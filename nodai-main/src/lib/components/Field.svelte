<script lang="ts">
	import { Label } from 'bits-ui';

	let {
		id,
		label,
		type = 'text',
		value = $bindable(''),
		hint = '',
		error = '',
		...rest
	}: {
		id: string;
		label: string;
		type?: string;
		value?: string;
		hint?: string;
		error?: string;
		[key: string]: unknown;
	} = $props();
</script>

<div class="flex flex-col gap-2">
	<Label.Root for={id} class="mono-label">{label}</Label.Root>
	<input
		{id}
		{type}
		bind:value
		class="h-12 w-full rounded-none border px-3.5 text-[0.9375rem] text-fg outline-none
			{error ? 'border-danger' : 'border-line'} bg-surface-2 focus:border-accent"
		{...rest}
	/>
	{#if error}
		<p class="text-sm text-danger">{error}</p>
	{:else if hint}
		<p class="text-sm text-fg-subtle">{hint}</p>
	{/if}
</div>
