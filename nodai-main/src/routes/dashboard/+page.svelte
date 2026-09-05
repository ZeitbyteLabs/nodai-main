<script lang="ts">
	import Panel from '$lib/components/Panel.svelte';
	import WalletPanel from '$lib/components/WalletPanel.svelte';

	let { data } = $props();

	const displayName = $derived(data.profile?.username ?? data.email.split('@')[0]);

	const joined = $derived(
		data.profile
			? new Date(data.profile.created_at).toLocaleDateString('en-GB', {
					day: 'numeric',
					month: 'short',
					year: 'numeric'
				})
			: '—'
	);

	const stats = $derived([
		{ label: 'NOD balance', value: (data.profile?.nod_balance ?? 0).toFixed(3) },
		{ label: 'Inference runs', value: String(data.runCount) },
		{ label: 'Transactions', value: String(data.transactions.length) },
		{ label: 'Member since', value: joined }
	]);
</script>

<svelte:head><title>Dashboard — NodAI</title></svelte:head>

<div class="mx-auto max-w-6xl px-6 py-16 md:py-20">
	<header class="border-b border-line pb-10">
		<p class="mono-label">Dashboard</p>
		<h1 class="mt-4 text-4xl font-semibold md:text-5xl">{displayName}</h1>
		<p class="mt-3 font-mono text-fg-muted">{data.email}</p>
	</header>

	<!-- Stats strip -->
	<div class="mt-10 grid grid-cols-2 border-t border-l border-line md:grid-cols-4">
		{#each stats as stat (stat.label)}
			<div class="border-r border-b border-line p-6">
				<p class="mono-label">{stat.label}</p>
				<p class="mt-3 font-mono text-2xl text-fg md:text-3xl">{stat.value}</p>
			</div>
		{/each}
	</div>

	<div class="mt-8 grid gap-8 lg:grid-cols-2">
		<WalletPanel address={data.profile?.wallet_address ?? null} />

		<Panel label="Account">
			<dl class="flex flex-col divide-y divide-line">
				<div class="flex items-baseline justify-between gap-6 pb-4">
					<dt class="text-fg-muted">Email</dt>
					<dd class="font-mono text-right break-all text-fg">{data.email}</dd>
				</div>
				<div class="flex items-baseline justify-between gap-6 py-4">
					<dt class="text-fg-muted">Username</dt>
					<dd class="font-mono text-fg">{data.profile?.username ?? '—'}</dd>
				</div>
				<div class="flex items-baseline justify-between gap-6 py-4">
					<dt class="text-fg-muted">Account ID</dt>
					<dd class="font-mono text-sm break-all text-fg-muted">{data.profile?.id ?? '—'}</dd>
				</div>
				<div class="flex items-baseline justify-between gap-6 pt-4">
					<dt class="text-fg-muted">Joined</dt>
					<dd class="font-mono text-fg">{joined}</dd>
				</div>
			</dl>
		</Panel>
	</div>

	<div class="mt-8">
		<Panel label="Recent activity" padded={data.transactions.length === 0}>
			{#if data.transactions.length === 0}
				<p class="py-6 text-center text-fg-subtle">
					Nothing yet. Activity appears here once you start running inference.
				</p>
			{:else}
				<table class="w-full text-left">
					<thead>
						<tr class="border-b border-line">
							<th class="mono-label px-5 py-3 font-normal">Type</th>
							<th class="mono-label px-5 py-3 font-normal">Amount</th>
							<th class="mono-label px-5 py-3 font-normal">Status</th>
							<th class="mono-label px-5 py-3 font-normal">Date</th>
						</tr>
					</thead>
					<tbody>
						{#each data.transactions as tx (tx.id)}
							<tr class="border-b border-line last:border-b-0">
								<td class="px-5 py-4 text-fg">{tx.type}</td>
								<td class="px-5 py-4 font-mono text-fg">{Number(tx.amount).toFixed(3)} NOD</td>
								<td class="px-5 py-4 font-mono text-sm text-fg-muted">{tx.status}</td>
								<td class="px-5 py-4 font-mono text-sm text-fg-muted">
									{new Date(tx.created_at).toLocaleDateString('en-GB')}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			{/if}
		</Panel>
	</div>
</div>
