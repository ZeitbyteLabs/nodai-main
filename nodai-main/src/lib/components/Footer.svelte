<script lang="ts">
	import { LINKS } from '$lib/config';
</script>

<footer class="mt-24 border-t border-line">
	<div
		class="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between"
	>
		<p class="text-sm text-fg-subtle">
			NodAI — open, local-first AI network. NOD is on Solana Devnet and has no monetary value.
		</p>
		<div class="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-fg-muted">
			<a href="/guide" class="hover:text-fg">Guide</a>
			<a href="/models" class="hover:text-fg">Models</a>
			{#if LINKS.github}
				<a href={LINKS.github} target="_blank" rel="noreferrer" class="hover:text-fg">GitHub</a>
			{/if}
			{#if LINKS.discord}
				<a href={LINKS.discord} target="_blank" rel="noreferrer" class="hover:text-fg">Discord</a>
			{/if}
		</div>
	</div>
</footer>
