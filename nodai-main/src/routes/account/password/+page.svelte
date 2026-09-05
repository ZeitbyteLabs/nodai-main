<script lang="ts">
	import { enhance } from '$app/forms';
	import Alert from '$lib/components/Alert.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import Button from '$lib/components/Button.svelte';
	import Field from '$lib/components/Field.svelte';

	let { form } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);

	const passwordsMatch = $derived(!confirmPassword || password === confirmPassword);
	const passwordMismatch = $derived(Boolean(confirmPassword) && password !== confirmPassword);
	const canSubmit = $derived(password.length >= 8 && password === confirmPassword && !submitting);
</script>

<svelte:head><title>Change password — NodAI</title></svelte:head>

<AuthShell title="Change password" subtitle="Pick a new password for your account.">
	<form
		method="POST"
		use:enhance={() => {
			submitting = true;
			return async ({ update }) => {
				await update();
				submitting = false;
				if (!form?.message) {
					password = '';
					confirmPassword = '';
				}
			};
		}}
		class="flex flex-col gap-5"
	>
		{#if form?.message}
			<Alert tone={form.success ? 'info' : undefined}>{form.message}</Alert>
		{/if}

		<Field
			id="password"
			name="password"
			label="New password"
			type="password"
			bind:value={password}
			autocomplete="new-password"
			placeholder="At least 8 characters"
			required
		/>

		<Field
			id="confirmPassword"
			name="confirmPassword"
			label="Confirm password"
			type="password"
			bind:value={confirmPassword}
			autocomplete="new-password"
			placeholder="Retype your password"
			error={passwordMismatch ? 'Passwords do not match.' : ''}
		/>

		<div class="flex flex-wrap gap-3 pt-2">
			<Button type="submit" disabled={!canSubmit}>
				{submitting ? 'Saving…' : 'Update password'}
			</Button>
			<Button href="/dashboard" variant="ghost">Cancel</Button>
		</div>
	</form>
</AuthShell>
