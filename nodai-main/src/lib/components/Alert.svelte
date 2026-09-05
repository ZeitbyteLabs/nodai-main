<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tone = 'error',
		children
	}: {
		tone?: 'error' | 'info';
		children: Snippet;
	} = $props();

	const tones = {
		error: 'border-danger bg-danger-wash text-danger',
		info: 'border-accent-line bg-accent-wash text-accent-fg'
	};
</script>

<div class="border px-4 py-3 text-[0.9375rem] {tones[tone]}">
	{@render children()}
</div>
