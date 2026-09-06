<script lang="ts">
	import { onMount } from 'svelte';
	import { Copy, KeyRound, Plus, Trash2 } from '@lucide/svelte';
	import { NOD } from '$lib/config';
	import { progress } from '$lib/progress.svelte';
	import Alert from './Alert.svelte';
	import Button from './Button.svelte';
	import LoadingSkeleton from './LoadingSkeleton.svelte';
	import Panel from './Panel.svelte';

	type ApiKeyRow = {
		id: string;
		name: string;
		key_prefix: string;
		last_used_at: string | null;
		revoked_at: string | null;
		created_at: string;
	};

	type HostNode = {
		id: string;
		label: string | null;
		status: string;
		served_model: string | null;
		last_heartbeat: string | null;
		jobs_completed: number;
		earned: number;
	};

	type HostJob = {
		id: string;
		status: string;
		tokens_used: number | null;
		latency_ms: number | null;
		created_at: string;
	};

	let keys = $state<ApiKeyRow[]>([]);
	let nodes = $state<HostNode[]>([]);
	let hostedJobs = $state<HostJob[]>([]);
	let loading = $state(true);
	let failed = $state(false);
	let creating = $state(false);
	let revealedKey = $state('');
	let copied = $state(false);
	let errorMessage = $state('');

	const activeKeys = $derived(keys.filter((key) => !key.revoked_at));
	const jobs = $derived(nodes.reduce((sum, node) => sum + node.jobs_completed, 0));
	const earned = $derived(nodes.reduce((sum, node) => sum + node.earned, 0));

	async function load() {
		try {
			const [keysRes, nodesRes] = await Promise.all([fetch('/api/keys'), fetch('/api/nodes/mine')]);
			if (!keysRes.ok || !nodesRes.ok) {
				failed = true;
				return;
			}
			const keysBody = await keysRes.json();
			const nodesBody = await nodesRes.json();
			keys = keysBody.keys ?? [];
			nodes = nodesBody.nodes ?? [];
			hostedJobs = nodesBody.jobs ?? [];
			failed = false;
		} catch {
			failed = true;
		} finally {
			loading = false;
		}
	}

	onMount(load);

	async function createKey() {
		creating = true;
		errorMessage = '';
		try {
			await progress.track(async () => {
				const response = await fetch('/api/keys', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ name: 'GPU host' })
				});
				const body = await response.json().catch(() => null);
				if (!response.ok) {
					errorMessage = body?.message ?? 'Could not create API key.';
					return;
				}
				revealedKey = body.key ?? '';
				copied = false;
				await load();
			});
		} finally {
			creating = false;
		}
	}

	async function revokeKey(id: string) {
		errorMessage = '';
		const response = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
		if (!response.ok) {
			const body = await response.json().catch(() => null);
			errorMessage = body?.message ?? 'Could not revoke key.';
			return;
		}
		if (revealedKey) revealedKey = '';
		await load();
	}

	async function copyKey() {
		if (!revealedKey) return;
		try {
			await navigator.clipboard.writeText(revealedKey);
			copied = true;
		} catch {
			copied = false;
		}
	}
</script>

<Panel label="Your GPUs">
	<div class="flex flex-col gap-6">
		<p class="text-[0.9375rem] leading-relaxed text-fg-muted">
			Hosts earn <span class="font-mono text-fg">{NOD.hostShare * 100}%</span> of each run’s
			output-token cost ({NOD.pricePer1kOutputTokens} NOD / 1K tokens). Create an API key, then
			paste it into
			<span class="font-mono text-fg">nodai-node start</span>.
		</p>

		{#if loading}
			<LoadingSkeleton lines={4} />
		{:else if failed}
			<p class="text-[0.9375rem] text-fg-muted">Could not load host data.</p>
		{:else}
			<div class="grid grid-cols-2 divide-x divide-line overflow-hidden rounded-xl border border-line">
				<div class="p-4">
					<p class="mono-label">Jobs hosted</p>
					<p class="mt-2 font-mono text-xl text-fg">{jobs}</p>
				</div>
				<div class="p-4">
					<p class="mono-label">Earned</p>
					<p class="mt-2 font-mono text-xl {earned > 0 ? 'text-success' : 'text-fg'}">
						{earned.toFixed(3)}
					</p>
				</div>
			</div>

			{#if nodes.length === 0}
				<p class="text-sm leading-relaxed text-fg-subtle">
					No GPU linked to this account yet. After you start nodai-node with your API key, it
					appears here.
				</p>
			{:else}
				<ul class="divide-y divide-line rounded-xl border border-line">
					{#each nodes as node (node.id)}
						<li class="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
							<div class="min-w-0">
								<p class="truncate text-fg">{node.label ?? `Node ${node.id.slice(0, 8)}`}</p>
								<p class="mt-0.5 font-mono text-xs text-fg-subtle">
									{node.served_model ?? 'model unknown'} · {node.jobs_completed} job{node.jobs_completed ===
									1
										? ''
										: 's'} · {node.earned.toFixed(3)} NOD
								</p>
							</div>
							<span
								class="w-fit shrink-0 rounded-full px-2.5 py-1 font-mono text-xs capitalize
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

			{#if hostedJobs.length > 0}
				<div>
					<p class="mono-label mb-2">Recent hosted jobs</p>
					<ul class="divide-y divide-line rounded-xl border border-line">
						{#each hostedJobs as job (job.id)}
							<li class="flex items-center justify-between gap-3 px-4 py-2.5">
								<p class="font-mono text-xs text-fg-subtle">{job.id.slice(0, 8)}…</p>
								<p class="text-xs text-fg-muted">
									{job.status}
									{#if job.tokens_used}
										· {job.tokens_used} tok
									{/if}
								</p>
							</li>
						{/each}
					</ul>
				</div>
			{/if}

			<div class="flex flex-col gap-3">
				<div class="flex items-center justify-between gap-3">
					<p class="mono-label">API keys</p>
					<Button size="sm" variant="secondary" onclick={createKey} disabled={creating}>
						<Plus class="size-4" />
						{creating ? 'Creating…' : 'New key'}
					</Button>
				</div>

				{#if revealedKey}
					<Alert tone="info">
						<div class="flex flex-col gap-3">
							<p>Copy this key now. It will not be shown again.</p>
							<div class="flex flex-wrap items-center gap-2">
								<code class="break-all font-mono text-xs text-fg">{revealedKey}</code>
								<Button size="sm" variant="ghost" onclick={copyKey}>
									<Copy class="size-4" />
									{copied ? 'Copied' : 'Copy'}
								</Button>
							</div>
						</div>
					</Alert>
				{/if}

				{#if errorMessage}
					<Alert>{errorMessage}</Alert>
				{/if}

				{#if activeKeys.length === 0 && !revealedKey}
					<p class="text-sm text-fg-subtle">
						No API key yet. Create one, then run nodai-node on the GPU PC.
					</p>
				{:else}
					<ul class="space-y-2">
						{#each activeKeys as key (key.id)}
							<li
								class="flex items-center justify-between gap-3 rounded-xl border border-line
									bg-surface-2 px-4 py-3"
							>
								<div class="min-w-0">
									<p class="flex items-center gap-2 text-sm text-fg">
										<KeyRound class="size-4 shrink-0 text-fg-muted" />
										<span class="font-mono">{key.key_prefix}…</span>
									</p>
									<p class="mt-1 text-xs text-fg-subtle">
										{key.name}
										{#if key.last_used_at}
											· last used {new Date(key.last_used_at).toLocaleDateString('en-GB', {
												day: 'numeric',
												month: 'short'
											})}
										{/if}
									</p>
								</div>
								<Button variant="ghost" size="sm" onclick={() => revokeKey(key.id)}>
									<Trash2 class="size-4" />
									Revoke
								</Button>
							</li>
						{/each}
					</ul>
				{/if}
			</div>
		{/if}
	</div>
</Panel>
