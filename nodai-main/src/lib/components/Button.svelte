<script lang="ts">
	import { Button } from 'bits-ui';
	import type { Snippet } from 'svelte';

	type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
	type Size = 'sm' | 'md' | 'lg';

	let {
		variant = 'primary',
		size = 'md',
		full = false,
		class: className = '',
		children,
		...rest
	}: {
		variant?: Variant;
		size?: Size;
		full?: boolean;
		class?: string;
		children: Snippet;
		[key: string]: unknown;
	} = $props();

	/**
	 * Hover lifts the button and deepens its shadow; press drops it back down,
	 * so the two states read as a single physical motion.
	 */
	const base =
		'inline-flex items-center justify-center gap-2 rounded-xl border font-medium tracking-tight ' +
		'select-none transition-[transform,background-color,border-color,box-shadow,color] ' +
		'duration-200 ease-out-quart hover:-translate-y-0.5 active:translate-y-0 active:duration-75 ' +
		'disabled:pointer-events-none disabled:opacity-40 disabled:hover:translate-y-0';

	const variants: Record<Variant, string> = {
		primary:
			'border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover ' +
			'hover:shadow-[0_10px_24px_-10px_var(--color-accent)] active:bg-accent-press active:shadow-none',
		secondary:
			'border-line-strong bg-surface-2 text-fg hover:border-accent hover:bg-surface-3 ' +
			'hover:shadow-[0_10px_24px_-14px_rgb(0_0_0/0.9)] active:bg-surface-2 active:shadow-none',
		ghost:
			'border-transparent bg-transparent text-fg-muted hover:border-line-strong ' +
			'hover:bg-surface-2 hover:text-fg',
		danger:
			'border-danger bg-danger-wash text-danger hover:bg-danger hover:text-white ' +
			'hover:shadow-[0_10px_24px_-10px_var(--color-danger)] active:shadow-none'
	};

	const sizes: Record<Size, string> = {
		sm: 'h-9 rounded-lg px-3.5 text-sm',
		md: 'h-11 px-5 text-[0.9375rem]',
		lg: 'h-14 rounded-2xl px-7 text-base'
	};
</script>

<Button.Root
	class="{base} {variants[variant]} {sizes[size]} {full ? 'w-full' : ''} {className}"
	{...rest}
>
	{@render children()}
</Button.Root>
