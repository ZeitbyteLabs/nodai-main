<script lang="ts">
	import { enhance } from '$app/forms';
	import Alert from '$lib/components/Alert.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import Button from '$lib/components/Button.svelte';
	import Field from '$lib/components/Field.svelte';

	let { form } = $props();

	let email = $state('');
	let password = $state('');
	let submitting = $state(false);

	$effect(() => {
		if (form?.email) email = form.email;
	});
</script>

<svelte:head><title>Create account — NodAI</title></svelte:head>

<AuthShell
	title="Create your account"
	subtitle="Email and a password. That is the whole sign-up."
>
	{#if form?.checkEmail}
		<Alert tone="info">
			Check <span class="font-mono">{form.email}</span> for a confirmation link, then sign in.
		</Alert>
	{:else}
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
				autocomplete="new-password"
				placeholder="At least 8 characters"
				hint="Minimum 8 characters."
				required
			/>

			<Button type="submit" size="lg" full disabled={submitting}>
				{submitting ? 'Creating account…' : 'Create account'}
			</Button>
		</form>
	{/if}

	{#snippet footer()}
		Already have an account?
		<a href="/signin" class="text-accent-fg underline underline-offset-4 hover:text-fg">Sign in</a>
	{/snippet}
</AuthShell>
