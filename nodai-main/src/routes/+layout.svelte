<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import Footer from '$lib/components/Footer.svelte';
	import Nav from '$lib/components/Nav.svelte';
	import ProgressBar from '$lib/components/ProgressBar.svelte';

	let { data, children } = $props();
	let { supabase, session } = $derived(data);

	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<ProgressBar />

<div class="flex min-h-screen flex-col bg-ink">
	<Nav signedIn={!!session} />
	<main class="flex-1">
		<!-- Keyed on the path so each navigation replays the enter animation. -->
		{#key page.url.pathname}
			<div class="page-enter">
				{@render children()}
			</div>
		{/key}
	</main>
	<Footer />
</div>
