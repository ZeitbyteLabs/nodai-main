<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/Button.svelte';

	const copy: Record<number, { title: string; body: string }> = {
		404: {
			title: 'Page not found',
			body: 'The page you asked for does not exist or may have moved.'
		},
		401: {
			title: 'Sign in required',
			body: 'You need an account to view this page.'
		},
		403: {
			title: 'Access denied',
			body: 'You do not have permission to view this page.'
		},
		500: {
			title: 'Something went wrong',
			body: 'An unexpected error occurred. Try again in a moment.'
		},
		503: {
			title: 'Service unavailable',
			body: 'A required service is temporarily offline. Try again shortly.'
		}
	};

	const status = $derived(page.status);
	const fallback = $derived(copy[status] ?? copy[500]);
	const message = $derived(page.error?.message ?? fallback.title);
</script>

<svelte:head><title>{status} — NodAI</title></svelte:head>

<div class="mx-auto flex max-w-2xl flex-col px-6 py-28 md:py-36">
	<p class="font-mono text-7xl font-semibold text-accent md:text-8xl">{status}</p>
	<h1 class="mt-8 text-3xl font-semibold md:text-4xl">{message}</h1>
	<p class="mt-4 leading-relaxed text-fg-muted">{fallback.body}</p>
	<div class="mt-10 flex flex-wrap gap-3">
		<Button href="/">Back to home</Button>
		{#if status === 401}
			<Button href="/signin" variant="secondary">Sign in</Button>
		{:else if status === 404}
			<Button href="/dashboard" variant="secondary">Dashboard</Button>
		{/if}
	</div>
</div>
