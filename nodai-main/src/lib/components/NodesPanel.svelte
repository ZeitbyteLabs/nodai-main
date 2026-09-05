<script lang="ts">
	import { onMount } from 'svelte';
	import { Cpu } from '@lucide/svelte';
	import LoadingSkeleton from './LoadingSkeleton.svelte';
	import Panel from './Panel.svelte';

	type NodeRow = {
		id: string;
		label: string | null;
		status: string;
		last_heartbeat: string | null;
	};

	let nodes = $state<NodeRow[]>([]);
	let loading = $state(true);
	let failed = $state(false);

	onMount(async () => {
		try {
			const response = await fetch('/api/nodes');
			if (response.ok) {
				const body = await response.json();
				nodes = body.nodes ?? [];
			} else {
				failed = true;
			}
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	});

	const online = $derived(nodes.filter((n) => n.status === 'online').length);
</script>

<Panel label="Network">
	{#snippet actions()}
		{#if !loading}
			<span class="flex items-center gap-2 text-xs text-fg-muted">
				<Cpu class="size-4" />
				{online} online
			</span>
		{/if}
	{/snippet}

	{#if loading}
		<LoadingSkeleton lines={3} />
	{:else if failed}
		<p class="text-[0.9375rem] text-fg-muted">Could not load network status.</p>
	{:else if nodes.length === 0}
		<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
			No GPU nodes registered yet. Operators can connect hardware with the
			<span class="font-mono text-fg">nodai-node</span> CLI.
		</p>
	{:else}
		<ul class="divide-y divide-line">
			{#each nodes as node (node.id)}
				<li class="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
					<div class="min-w-0">
						<p class="truncate text-fg">{node.label ?? `Node ${node.id.slice(0, 8)}`}</p>
						<p class="mt-0.5 font-mono text-xs text-fg-subtle">{node.id.slice(0, 8)}…</p>
					</div>
					<span
						class="shrink-0 rounded-full px-2.5 py-1 font-mono text-xs capitalize
							{node.status === 'online'
							? 'bg-success/10 text-success'
							: node.status === 'pending'
								? 'bg-accent-wash text-accent-fg'
								: 'bg-surface-3 text-fg-muted'}"
					>
						{node.status}
					</span>
				</li>
			{/each}
		</ul>
	{/if}
</Panel>
