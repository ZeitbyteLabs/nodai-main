<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { INSTALL_URLS, WalletState, type WalletKind } from '$lib/wallet.svelte';
	import Alert from './Alert.svelte';
	import Button from './Button.svelte';
	import Panel from './Panel.svelte';

	let { address = null }: { address?: string | null } = $props();

	// Seeded once; the wallet state owns the address after the first connect.
	const wallet = new WalletState(untrack(() => address));

	let sol = $state<number | null>(null);
	let balanceUnavailable = $state(false);

	async function loadBalance() {
		if (!wallet.address) {
			sol = null;
			return;
		}

		const response = await fetch('/api/wallet/balance');
		if (!response.ok) {
			balanceUnavailable = true;
			return;
		}

		const body = await response.json();
		sol = body.sol;
		balanceUnavailable = !!body.unavailable;
	}

	onMount(() => {
		wallet.refresh();
		loadBalance();
	});

	async function connect(kind: WalletKind) {
		const result = await wallet.connect(kind);
		if (result) await loadBalance();
	}

	async function disconnect() {
		await wallet.disconnect();
		sol = null;
	}

	function truncate(value: string) {
		return `${value.slice(0, 6)}…${value.slice(-6)}`;
	}
</script>

<Panel label="Solana wallet">
	{#snippet actions()}
		{#if wallet.address}
			<span class="flex items-center gap-2 text-xs text-fg-muted">
				<span class="size-2 rounded-full bg-success"></span>
				Devnet
			</span>
		{/if}
	{/snippet}

	{#if wallet.address}
		<div class="flex flex-col gap-6">
			<div>
				<p class="mono-label">Address</p>
				<p class="mt-2 font-mono text-lg break-all text-fg">{truncate(wallet.address)}</p>
			</div>

			<div
				class="grid grid-cols-2 divide-x divide-line overflow-hidden rounded-xl border
					border-line"
			>
				<div class="cell-interactive p-4">
					<p class="mono-label">SOL balance</p>
					<p class="mt-2 font-mono text-xl text-fg">
						{#if balanceUnavailable}
							<span class="text-base text-fg-subtle">Unavailable</span>
						{:else if sol === null}
							<span class="text-base text-fg-subtle">Loading…</span>
						{:else}
							{sol.toFixed(4)}
						{/if}
					</p>
				</div>
				<div class="cell-interactive p-4">
					<p class="mono-label">Cluster</p>
					<p class="mt-2 font-mono text-xl text-fg">Devnet</p>
				</div>
			</div>

			{#if wallet.error}
				<Alert>{wallet.error}</Alert>
			{/if}

			<div class="flex gap-3">
				<Button variant="secondary" size="sm" onclick={loadBalance}>Refresh balance</Button>
				<Button variant="ghost" size="sm" onclick={disconnect}>Disconnect</Button>
			</div>
		</div>
	{:else}
		<div class="flex flex-col gap-5">
			<p class="leading-relaxed text-fg-muted">
				Link a Solana wallet so the network can credit your NOD rewards. Read-only — NodAI never
				takes custody of your keys.
			</p>

			{#if wallet.error}
				<Alert>{wallet.error}</Alert>
			{/if}

			{#if wallet.available.length > 0}
				<div class="flex flex-wrap gap-3">
					{#each wallet.available as detected (detected.kind)}
						<Button size="md" onclick={() => connect(detected.kind)} disabled={wallet.connecting}>
							{wallet.connecting ? 'Connecting…' : `Connect ${detected.name}`}
						</Button>
					{/each}
				</div>
			{:else}
				<div class="rounded-xl border border-line bg-surface-2 p-5">
					<p class="text-[0.9375rem] text-fg-muted">
						No Solana wallet detected in this browser. Install one, then reload this page.
					</p>
					<div class="mt-4 flex gap-4 text-[0.9375rem]">
						<a
							href={INSTALL_URLS.phantom}
							target="_blank"
							rel="noreferrer"
							class="text-accent-fg underline underline-offset-4 hover:text-fg"
						>
							Get Phantom
						</a>
						<a
							href={INSTALL_URLS.backpack}
							target="_blank"
							rel="noreferrer"
							class="text-accent-fg underline underline-offset-4 hover:text-fg"
						>
							Get Backpack
						</a>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</Panel>
