<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';
</script>

<svelte:head><title>{page.status} — NodAI</title></svelte:head>

<div class="mx-auto flex max-w-2xl flex-col px-6 py-28 md:py-36">
	<p class="font-mono text-7xl font-semibold text-accent md:text-8xl">{page.status}</p>
	<h1 class="mt-8 text-3xl font-semibold md:text-4xl">
		{page.error?.message ?? 'Something went wrong.'}
	</h1>
	<p class="mt-4 leading-relaxed text-fg-muted">
		The page you asked for is not here. Head back and try again.
	</p>
	<div class="mt-10">
		<Button href="/">Back to home</Button>
	</div>
</div>
