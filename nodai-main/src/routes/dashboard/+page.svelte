<script lang="ts">
	import { ArrowUpRight, LayoutDashboard, Sparkles } from '@lucide/svelte';
	import Button from '$lib/components/Button.svelte';
	import HostPanel from '$lib/components/HostPanel.svelte';
	import NodPanel from '$lib/components/NodPanel.svelte';
	import NodesPanel from '$lib/components/NodesPanel.svelte';
	import Panel from '$lib/components/Panel.svelte';

	let { data } = $props();

	function explorerTx(signature: string) {
		return `https://explorer.solana.com/tx/${signature}?cluster=${data.cluster}`;
	}

	const displayName = $derived(data.profile?.username ?? data.email.split('@')[0]);

	const typeLabels: Record<string, string> = {
		consumption: 'Run',
		reward: 'Host reward',
		fee: 'Fee',
		grant: 'Top-up'
	};
</script>

<svelte:head><title>Dashboard — NodAI</title></svelte:head>

<div class="mx-auto max-w-4xl px-6 py-12 md:py-16">
	<header
		class="flex flex-col gap-5 border-b border-line pb-8 sm:flex-row sm:items-center
			sm:justify-between"
	>
		<div>
			<div class="flex items-center gap-2 text-fg-muted">
				<LayoutDashboard class="size-5" />
				<p class="mono-label">Dashboard</p>
			</div>
			<h1 class="mt-3 text-3xl font-semibold md:text-4xl">{displayName}</h1>
			<p class="mt-2 text-sm text-fg-muted">
				{data.runCount} run{data.runCount === 1 ? '' : 's'} · {data.transactions.length} transaction{data.transactions.length === 1 ? '' : 's'}
			</p>
		</div>
		<Button href="/playground" size="lg">
			<Sparkles class="size-4" />
			Run inference
		</Button>
	</header>

	<div class="mt-8 grid gap-8 lg:grid-cols-2">
		<NodPanel address={data.profile?.wallet_address ?? null} />
		<HostPanel />
	</div>

	<div class="mt-8">
		<NodesPanel />
	</div>

	<div class="mt-8">
		<Panel label="Activity" padded={data.transactions.length === 0}>
			{#if data.transactions.length === 0}
				<div class="flex flex-col items-center gap-4 py-10 text-center">
					<p class="text-fg-muted">No activity yet.</p>
					<p class="max-w-sm text-sm text-fg-subtle">
						Run a prompt or host a GPU — spend and host rewards show up here.
					</p>
					<Button href="/playground" variant="secondary" size="sm">
						<Sparkles class="size-4" />
						Open playground
					</Button>
				</div>
			{:else}
				<ul class="divide-y divide-line">
					{#each data.transactions as tx (tx.id)}
						<li
							class="flex items-center justify-between gap-4 px-1 py-4 transition-colors
								hover:bg-surface-2"
						>
							<div class="min-w-0">
								<p class="text-fg">{typeLabels[tx.type] ?? tx.type}</p>
								<p class="mt-1 text-xs text-fg-muted">
									{new Date(tx.created_at).toLocaleDateString('en-GB', {
										day: 'numeric',
										month: 'short',
										hour: '2-digit',
										minute: '2-digit'
									})}
								</p>
							</div>
							<div class="flex shrink-0 items-center gap-3">
								<span
									class="font-mono text-sm {tx.type === 'consumption' || tx.type === 'fee'
										? 'text-fg-muted'
										: 'text-success'}"
								>
									{tx.type === 'consumption' || tx.type === 'fee' ? '−' : '+'}
									{Number(tx.amount).toFixed(3)} NOD
								</span>
								{#if tx.signature}
									<a
										href={explorerTx(tx.signature)}
										target="_blank"
										rel="noreferrer"
										class="text-fg-muted transition-colors hover:text-accent-fg"
										aria-label="View transaction"
									>
										<ArrowUpRight class="size-4" />
									</a>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</Panel>
	</div>
</div>
