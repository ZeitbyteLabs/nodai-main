<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		Box,
		Code,
		Info,
		KeyRound,
		LayoutDashboard,
		LogIn,
		LogOut,
		Menu,
		MessageCircle,
		Sparkles,
		User,
		X
	} from '@lucide/svelte';
	import { DropdownMenu } from 'bits-ui';
	import { LINKS } from '$lib/config';
	import AboutModal from './AboutModal.svelte';
	import Button from './Button.svelte';
	import Logo from './Logo.svelte';

	let { signedIn = false }: { signedIn?: boolean } = $props();

	let mobileOpen = $state(false);
	let aboutOpen = $state(false);
	let signOutForm = $state<HTMLFormElement | null>(null);

	const internal = [
		{ href: '/models', label: 'Models', icon: Box },
		{ href: '/playground', label: 'Playground', icon: Sparkles },
		{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }
	];

	const external = [
		{ href: LINKS.github, label: 'GitHub', icon: Code },
		{ href: LINKS.discord, label: 'Discord', icon: MessageCircle }
	].filter((link) => link.href.length > 0);

	function linkClass(href: string) {
		return page.url.pathname.startsWith(href)
			? 'border-line-strong bg-surface-2 text-fg'
			: 'border-transparent text-fg-muted hover:bg-surface-2 hover:text-fg';
	}

	function closeMobile() {
		mobileOpen = false;
	}

	function openAbout() {
		closeMobile();
		aboutOpen = true;
	}

	function signOut() {
		signOutForm?.requestSubmit();
	}
</script>

<form bind:this={signOutForm} action="/signout" method="POST" class="hidden"></form>
<AboutModal bind:open={aboutOpen} />

<header class="sticky top-0 z-50 border-b border-line bg-ink/95 backdrop-blur">
	<nav class="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
		<div class="flex min-w-0 items-center gap-4 md:gap-8">
			<a
				href="/"
				class="shrink-0 rounded-lg transition-transform duration-200 ease-out-quart hover:scale-[1.03]"
				onclick={closeMobile}
			>
				<Logo />
			</a>

			<div class="hidden items-center gap-1 md:flex">
				{#each internal as link (link.href)}
					{@const Icon = link.icon}
					<a
						href={link.href}
						class="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[0.9375rem]
							transition-[color,background-color,border-color] duration-200 ease-out-quart
							{linkClass(link.href)}"
					>
						<Icon class="size-4 shrink-0" />
						{link.label}
					</a>
				{/each}
				{#each external as link (link.href)}
					{@const Icon = link.icon}
					<a
						href={link.href}
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-[0.9375rem]
							text-fg-muted transition-[color,background-color] duration-200 ease-out-quart
							hover:bg-surface-2 hover:text-fg"
					>
						<Icon class="size-4 shrink-0" />
						{link.label}
					</a>
				{/each}
			</div>
		</div>

		<div class="flex items-center gap-2">
			{#if signedIn}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="inline-flex size-9 items-center justify-center rounded-lg border
							border-line-strong bg-surface-2 text-fg transition-colors
							hover:border-accent hover:bg-surface-3 focus-visible:outline-none
							focus-visible:ring-2 focus-visible:ring-accent"
						aria-label="Account menu"
					>
						<User class="size-4" />
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							class="z-50 min-w-44 rounded-xl border border-line bg-surface p-1
								shadow-lg focus:outline-none"
							sideOffset={8}
							align="end"
						>
							<DropdownMenu.Item
								class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm
									text-fg outline-none transition-colors hover:bg-surface-2
									focus:bg-surface-2"
								onSelect={() => goto('/account/password')}
							>
								<KeyRound class="size-4 text-fg-muted" />
								Change password
							</DropdownMenu.Item>
							<DropdownMenu.Item
								class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm
									text-fg outline-none transition-colors hover:bg-surface-2
									focus:bg-surface-2"
								onSelect={openAbout}
							>
								<Info class="size-4 text-fg-muted" />
								About NodAI
							</DropdownMenu.Item>
							<DropdownMenu.Separator class="my-1 h-px bg-line" />
							<DropdownMenu.Item
								class="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm
									text-danger outline-none transition-colors hover:bg-danger-wash
									focus:bg-danger-wash"
								onSelect={signOut}
							>
								<LogOut class="size-4" />
								Log out
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			{:else}
				<div class="hidden items-center gap-2 sm:flex">
					<Button href="/signin" variant="ghost" size="sm">
						<LogIn class="size-4" />
						Sign in
					</Button>
					<Button href="/signup" size="sm">Get started</Button>
				</div>
			{/if}

			<button
				type="button"
				class="inline-flex size-9 items-center justify-center rounded-lg border
					border-line-strong bg-surface-2 text-fg transition-colors hover:bg-surface-3
					md:hidden"
				aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
				aria-expanded={mobileOpen}
				onclick={() => (mobileOpen = !mobileOpen)}
			>
				{#if mobileOpen}
					<X class="size-5" />
				{:else}
					<Menu class="size-5" />
				{/if}
			</button>
		</div>
	</nav>

	{#if mobileOpen}
		<div class="border-t border-line bg-ink md:hidden">
			<div class="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
				{#each internal as link (link.href)}
					{@const Icon = link.icon}
					<a
						href={link.href}
						class="inline-flex items-center gap-3 rounded-lg border px-4 py-3 text-[0.9375rem]
							transition-colors {linkClass(link.href)}"
						onclick={closeMobile}
					>
						<Icon class="size-4 shrink-0" />
						{link.label}
					</a>
				{/each}
				{#each external as link (link.href)}
					{@const Icon = link.icon}
					<a
						href={link.href}
						target="_blank"
						rel="noreferrer"
						class="inline-flex items-center gap-3 rounded-lg px-4 py-3 text-[0.9375rem]
							text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
						onclick={closeMobile}
					>
						<Icon class="size-4 shrink-0" />
						{link.label}
					</a>
				{/each}

				{#if signedIn}
					<div class="mt-2 border-t border-line pt-2">
						<a
							href="/account/password"
							class="inline-flex w-full items-center gap-3 rounded-lg px-4 py-3 text-[0.9375rem]
								text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
							onclick={closeMobile}
						>
							<KeyRound class="size-4" />
							Change password
						</a>
						<button
							type="button"
							class="inline-flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left
								text-[0.9375rem] text-fg-muted transition-colors hover:bg-surface-2
								hover:text-fg"
							onclick={openAbout}
						>
							<Info class="size-4" />
							About NodAI
						</button>
						<button
							type="button"
							class="inline-flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left
								text-[0.9375rem] text-danger transition-colors hover:bg-danger-wash"
							onclick={() => {
								closeMobile();
								signOut();
							}}
						>
							<LogOut class="size-4" />
							Log out
						</button>
					</div>
				{:else}
					<div class="mt-2 flex flex-col gap-2 border-t border-line pt-4">
						<Button href="/signin" variant="secondary" full onclick={closeMobile}>
							<LogIn class="size-4" />
							Sign in
						</Button>
						<Button href="/signup" full onclick={closeMobile}>Get started</Button>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</header>
