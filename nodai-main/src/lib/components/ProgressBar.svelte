<script lang="ts">
	import { navigating } from '$app/state';
	import { progress } from '$lib/progress.svelte';

	/**
	 * Thin accent bar pinned to the top of the viewport. It eases toward 90%
	 * while work is outstanding, then snaps to full and fades — so the length
	 * never implies a progress figure we do not actually have.
	 */

	let value = $state(0);
	let visible = $state(false);

	const busy = $derived(!!navigating.to || progress.busy);

	$effect(() => {
		if (busy) {
			visible = true;
			value = 12;

			const interval = setInterval(() => {
				if (value < 90) value += (90 - value) * 0.14;
			}, 170);

			return () => clearInterval(interval);
		}

		value = 100;
		const timeout = setTimeout(() => {
			visible = false;
			value = 0;
		}, 300);

		return () => clearTimeout(timeout);
	});
</script>

<div
	aria-hidden="true"
	class="pointer-events-none fixed inset-x-0 top-0 z-100 h-[3px] transition-opacity duration-300
		ease-out-quart"
	style:opacity={visible ? 1 : 0}
>
	<div
		class="h-full rounded-r-full bg-accent transition-[width] duration-200 ease-out-quart"
		style:width="{value}%"
		style:box-shadow="0 0 10px 1px var(--color-accent-hover)"
	></div>
</div>
