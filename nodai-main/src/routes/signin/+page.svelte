<script lang="ts">
	import { enhance } from '$app/forms';
	import Alert from '$lib/components/Alert.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import Button from '$lib/components/Button.svelte';
	import Field from '$lib/components/Field.svelte';

	let { data, form } = $props();

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);

	$effect(() => {
		if (form?.email) email = form.email;
	});
</script>

<svelte:head><title>Sign in — NodAI</title></svelte:head>

<AuthShell title="Sign in" subtitle="Welcome back to the network.">
	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
			};
		}}
		class="flex flex-col gap-5"
	>
		<input type="hidden" name="redirectTo" value={data.redirectTo} />

		{#if form?.message}
			<Alert>{form.message}</Alert>
		{/if}

		<Field
			id="email"
			name="email"
			label="Email"
			type="email"
			bind:value={email}
			autocomplete="email"
			placeholder="you@example.com"
			required
		/>

		<Field
			id="password"
			name="password"
			label="Password"
			type="password"
			bind:value={password}
			autocomplete="current-password"
			placeholder="Your password"
			required
		/>

		<Button type="submit" size="lg" full disabled={submitting}>
			{submitting ? 'Signing in…' : 'Sign in'}
		</Button>
	</form>

	{#snippet footer()}
		New to NodAI?
		<a href="/signup" class="text-accent-fg underline underline-offset-4 hover:text-fg">
			Create an account
		</a>
	{/snippet}
</AuthShell>
