<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { invalidateAll } from '$app/navigation';
	import { Gift, Plus, Wallet } from '@lucide/svelte';
	import { NOD } from '$lib/config';
	import { progress } from '$lib/progress.svelte';
	import { INSTALL_URLS, WalletState, type WalletKind } from '$lib/wallet.svelte';
	import Alert from './Alert.svelte';
	import Button from './Button.svelte';
	import Panel from './Panel.svelte';

	let { address = null }: { address?: string | null } = $props();

	const wallet = new WalletState(untrack(() => address));

	type NodState = {
		credit: number;
		pendingReward: number;
		walletLinked: boolean;
		configured: boolean;
		onChain: number | null;
		unavailable?: boolean;
	};

	let nod = $state<NodState | null>(null);
	let loading = $state(true);
	let claiming = $state(false);
	let message = $state('');
	let errorMessage = $state('');

	async function loadNod() {
		const response = await fetch('/api/nod/balance');
		if (!response.ok) {
			loading = false;
			return;
		}
		nod = await response.json();
		loading = false;
	}

	onMount(() => {
		wallet.refresh();
		loadNod();
	});

	async function connect(kind: WalletKind) {
		const result = await wallet.connect(kind);
		if (result) await loadNod();
	}

	async function disconnect() {
		await wallet.disconnect();
		await loadNod();
	}

	async function claim() {
		claiming = true;
		message = '';
		errorMessage = '';

		try {
			await progress.track(async () => {
				const response = await fetch('/api/nod/claim', { method: 'POST' });
				const body = await response.json().catch(() => null);

				if (!response.ok) {
					errorMessage = body?.message ?? 'Could not claim NOD.';
					return;
				}

				if (body.count === 0) {
					message = 'Nothing to claim yet.';
					return;
				}

				message = `Claimed ${Number(body.claimed).toFixed(3)} NOD.`;
				await loadNod();
				await invalidateAll();
			});
		} finally {
			claiming = false;
		}
	}

	async function topUp() {
		message = '';
		errorMessage = '';

		await progress.track(async () => {
			const response = await fetch('/api/nod/faucet', { method: 'POST' });
			const body = await response.json().catch(() => null);

			if (!response.ok) {
				errorMessage = body?.message ?? 'Could not add NOD.';
				return;
			}

			message = `Added ${Number(body.granted).toFixed(2)} NOD.`;
			await loadNod();
			await invalidateAll();
		});
	}

	const canClaim = $derived(
		!!nod?.configured && !!wallet.address && (nod?.pendingReward ?? 0) > 0 && !claiming
	);

	function truncate(value: string) {
		return `${value.slice(0, 6)}…${value.slice(-4)}`;
	}
</script>

<Panel label="NOD">
	<div class="flex flex-col gap-6">
		<div
			class="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line"
		>
			<div class="cell-interactive p-4">
				<p class="mono-label">Balance</p>
				<p class="mt-2 font-mono text-xl text-fg">
					{#if loading}
						<span class="text-base text-fg-subtle">…</span>
					{:else}
						{(nod?.credit ?? 0).toFixed(3)}
					{/if}
				</p>
				<p class="mt-1 text-xs text-fg-subtle">for runs</p>
			</div>
			<div class="cell-interactive p-4">
				<p class="mono-label">In wallet</p>
				<p class="mt-2 font-mono text-xl text-fg">
					{#if loading}
						<span class="text-base text-fg-subtle">…</span>
					{:else if nod?.onChain === null}
						<span class="text-base text-fg-subtle">0.000</span>
					{:else}
						{(nod?.onChain ?? 0).toFixed(3)}
					{/if}
				</p>
				<p class="mt-1 text-xs text-fg-subtle">claimed</p>
			</div>
			<div class="cell-interactive p-4">
				<p class="mono-label">To claim</p>
				<p
					class="mt-2 font-mono text-xl {(nod?.pendingReward ?? 0) > 0
						? 'text-accent-fg'
						: 'text-fg'}"
				>
					{#if loading}
						<span class="text-base text-fg-subtle">…</span>
					{:else}
						{(nod?.pendingReward ?? 0).toFixed(3)}
					{/if}
				</p>
				<p class="mt-1 text-xs text-fg-subtle">from runs</p>
			</div>
		</div>

		<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
			Each run costs {NOD.costPerInference} NOD and earns {NOD.rewardPerInference} NOD.
		</p>

		{#if wallet.address}
			<div
				class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line
					bg-surface-2 px-4 py-3"
			>
				<div class="flex items-center gap-2 text-sm text-fg-muted">
					<Wallet class="size-4 shrink-0" />
					<span class="font-mono text-fg">{truncate(wallet.address)}</span>
				</div>
				<Button variant="ghost" size="sm" onclick={disconnect}>Disconnect</Button>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#if wallet.available.length > 0}
					<div class="flex flex-wrap gap-3">
						{#each wallet.available as detected (detected.kind)}
							<Button size="sm" onclick={() => connect(detected.kind)} disabled={wallet.connecting}>
								<Wallet class="size-4" />
								{wallet.connecting ? 'Connecting…' : `Connect ${detected.name}`}
							</Button>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-fg-muted">
						Install
						<a
							href={INSTALL_URLS.phantom}
							target="_blank"
							rel="noreferrer"
							class="text-accent-fg underline underline-offset-4 hover:text-fg"
						>
							Phantom
						</a>
						to claim NOD rewards.
					</p>
				{/if}
			</div>
		{/if}

		{#if !loading && !nod?.configured}
			<Alert tone="info">NOD rewards are not available yet.</Alert>
		{:else if !loading && !wallet.address}
			<Alert tone="info">Connect a wallet to claim your earned NOD.</Alert>
		{:else if nod?.unavailable}
			<Alert>Could not load wallet balance. Try again shortly.</Alert>
		{/if}

		{#if wallet.error}
			<Alert>{wallet.error}</Alert>
		{/if}

		{#if message}
			<Alert tone="info">{message}</Alert>
		{/if}

		{#if errorMessage}
			<Alert>{errorMessage}</Alert>
		{/if}

		<div class="flex flex-wrap gap-3">
			<Button size="sm" onclick={claim} disabled={!canClaim}>
				<Gift class="size-4" />
				{claiming ? 'Claiming…' : 'Claim NOD'}
			</Button>
			<Button variant="secondary" size="sm" onclick={topUp}>
				<Plus class="size-4" />
				Get NOD
			</Button>
		</div>
	</div>
</Panel>
