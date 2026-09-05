<script lang="ts">
	import { page } from '$app/state';
	import { LINKS } from '$lib/config';
	import Button from './Button.svelte';
	import Logo from './Logo.svelte';

	let { signedIn = false }: { signedIn?: boolean } = $props();

	const internal = [
		{ href: '/models', label: 'Models' },
		{ href: '/dashboard', label: 'Dashboard' }
	];

	const external = [
		{ href: LINKS.github, label: 'GitHub' },
		{ href: LINKS.discord, label: 'Discord' }
	];
</script>

<header class="sticky top-0 z-50 border-b border-line bg-ink/95 backdrop-blur">
	<nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
		<div class="flex items-center gap-8">
			<a href="/" class="transition-opacity hover:opacity-80"><Logo /></a>

			<div class="hidden items-center gap-1 md:flex">
				{#each internal as link (link.href)}
					<a
						href={link.href}
						class="border border-transparent px-3 py-1.5 text-[0.9375rem] transition-colors
							{page.url.pathname.startsWith(link.href)
							? 'border-line-strong bg-surface-2 text-fg'
							: 'text-fg-muted hover:text-fg'}"
					>
						{link.label}
					</a>
				{/each}
				{#each external as link (link.href)}
					<a
						href={link.href}
						target="_blank"
						rel="noreferrer"
						class="px-3 py-1.5 text-[0.9375rem] text-fg-muted transition-colors hover:text-fg"
					>
						{link.label}
					</a>
				{/each}
			</div>
		</div>

		<div class="flex items-center gap-2">
			{#if signedIn}
				<form method="POST" action="/signout">
					<Button variant="ghost" size="sm" type="submit">Sign out</Button>
				</form>
				<Button href="/dashboard" size="sm">Dashboard</Button>
			{:else}
				<Button href="/signin" variant="ghost" size="sm">Sign in</Button>
				<Button href="/signup" size="sm">Get started</Button>
			{/if}
		</div>
	</nav>
</header>
