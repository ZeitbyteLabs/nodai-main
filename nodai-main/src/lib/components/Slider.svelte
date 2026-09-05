<script lang="ts">
	import { Slider } from 'bits-ui';

	let {
		id,
		label,
		value = $bindable(0),
		min = 0,
		max = 100,
		step = 1,
		display,
		disabled = false
	}: {
		id: string;
		label: string;
		value?: number;
		min?: number;
		max?: number;
		step?: number;
		display?: string;
		disabled?: boolean;
	} = $props();
</script>

<div class="flex flex-col gap-3">
	<div class="flex items-baseline justify-between">
		<span class="mono-label">{label}</span>
		<span class="font-mono text-[0.9375rem] text-fg">{display ?? value}</span>
	</div>

	<Slider.Root
		type="single"
		bind:value
		{min}
		{max}
		{step}
		{disabled}
		{id}
		class="relative flex h-5 w-full touch-none items-center select-none data-disabled:opacity-40"
	>
		{#snippet children({ thumbItems })}
			<span class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-surface-3">
				<Slider.Range class="absolute h-full rounded-full bg-accent" />
			</span>
			{#each thumbItems as thumb (thumb.index)}
				<Slider.Thumb
					index={thumb.index}
					class="block size-4 rounded-full border border-accent-hover bg-accent
						transition-[transform,background-color,box-shadow] duration-200 ease-out-quart
						hover:scale-125 hover:bg-accent-hover
						hover:shadow-[0_0_0_6px_var(--color-accent-wash)] focus-visible:outline-2
						focus-visible:outline-offset-2 focus-visible:outline-accent-hover
						active:scale-110"
				/>
			{/each}
		{/snippet}
	</Slider.Root>
</div>
