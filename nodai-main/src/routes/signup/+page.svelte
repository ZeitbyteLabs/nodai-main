<script lang="ts">
	import { enhance } from '$app/forms';
	import Alert from '$lib/components/Alert.svelte';
	import AuthShell from '$lib/components/AuthShell.svelte';
	import Button from '$lib/components/Button.svelte';
	import Field from '$lib/components/Field.svelte';
	import { validateUsername } from '$lib/username';

	let { form } = $props();

	let email = $state('');
	let username = $state('');
	let password = $state('');
	let confirmPassword = $state('');
	let submitting = $state(false);

	type UsernameState = 'idle' | 'checking' | 'available' | 'unavailable';

	let usernameState = $state<UsernameState>('idle');
	let usernameHint = $state('');

	const passwordsMatch = $derived(!confirmPassword || password === confirmPassword);
	const passwordMismatch = $derived(Boolean(confirmPassword) && password !== confirmPassword);

	const canSubmit = $derived(
		!submitting &&
			email.trim().length > 0 &&
			password.length >= 8 &&
			password === confirmPassword &&
			usernameState === 'available'
	);

	$effect(() => {
		if (form?.email) email = form.email;
		if (form?.username) username = form.username;
	});

	$effect(() => {
		const value = username;

		if (!value.trim()) {
			usernameState = 'idle';
			usernameHint = '';
			return;
		}

		const validation = validateUsername(value);
		if (!validation.ok) {
			usernameState = 'unavailable';
			usernameHint = validation.error;
			return;
		}

		usernameState = 'checking';
		usernameHint = 'Checking availability…';

		const timeout = setTimeout(async () => {
			try {
				const response = await fetch(
					`/api/username/check?username=${encodeURIComponent(validation.normalized)}`
				);
				const result = await response.json();

				if (username.trim().toLowerCase() !== validation.normalized) return;

				if (result.available) {
					usernameState = 'available';
					usernameHint = `@${result.username} is available.`;
				} else {
					usernameState = 'unavailable';
					usernameHint = result.reason ?? 'That username is not available.';
				}
			} catch {
				if (username.trim().toLowerCase() !== validation.normalized) return;
				usernameState = 'unavailable';
				usernameHint = 'Could not check username. Try again.';
			}
		}, 450);

		return () => clearTimeout(timeout);
	});

	function usernameFieldError() {
		if (usernameState === 'unavailable') return usernameHint;
		return '';
	}

	function usernameFieldHint() {
		if (usernameState === 'checking') return usernameHint;
		if (usernameState === 'idle') return '3–24 characters. Letters, numbers, underscores.';
		return '';
	}

	function usernameFieldHintClass() {
		if (usernameState === 'available') return 'text-success';
		return '';
	}
</script>

<svelte:head><title>Create account — NodAI</title></svelte:head>

<AuthShell title="Create your account" subtitle="Pick a username, set a password, and you are in.">
	{#if form?.checkEmail}
		<Alert tone="info">
			Check <span class="font-mono">{form.email}</span> for a confirmation link, then sign in as
			<span class="font-mono">@{form.username}</span>.
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
				id="username"
				name="username"
				label="Username"
				type="text"
				bind:value={username}
				autocomplete="username"
				placeholder="yourname"
				spellcheck={false}
				autocapitalize="off"
				error={usernameFieldError()}
				hint={usernameState === 'available' ? usernameHint : usernameFieldHint()}
				hintClass={usernameFieldHintClass()}
				required
			/>

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

			<Field
				id="confirmPassword"
				name="confirmPassword"
				label="Confirm password"
				type="password"
				bind:value={confirmPassword}
				autocomplete="new-password"
				placeholder="Retype your password"
				error={passwordMismatch ? 'Passwords do not match.' : ''}
				hint={passwordsMatch && confirmPassword ? 'Passwords match.' : ''}
				hintClass={passwordsMatch && confirmPassword ? 'text-success' : ''}
				required
			/>

			<Button type="submit" size="lg" full disabled={!canSubmit}>
				{submitting ? 'Creating account…' : 'Create account'}
			</Button>
		</form>
	{/if}

	{#snippet footer()}
		Already have an account?
		<a href="/signin" class="text-accent-fg underline underline-offset-4 hover:text-fg">Sign in</a>
	{/snippet}
</AuthShell>
