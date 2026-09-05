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

	const base =
		'inline-flex items-center justify-center gap-2 rounded-none border font-medium tracking-tight transition-colors duration-100 select-none disabled:pointer-events-none disabled:opacity-40';

	const variants: Record<Variant, string> = {
		primary:
			'border-accent bg-accent text-white hover:border-accent-hover hover:bg-accent-hover active:bg-accent-press',
		secondary:
			'border-line-strong bg-surface-2 text-fg hover:border-accent hover:bg-surface-3 active:bg-surface-2',
		ghost: 'border-transparent bg-transparent text-fg-muted hover:border-line-strong hover:text-fg',
		danger: 'border-danger bg-danger-wash text-danger hover:bg-danger hover:text-white'
	};

	const sizes: Record<Size, string> = {
		sm: 'h-9 px-3.5 text-sm',
		md: 'h-11 px-5 text-[0.9375rem]',
		lg: 'h-14 px-7 text-base'
	};
</script>

<Button.Root
	class="{base} {variants[variant]} {sizes[size]} {full ? 'w-full' : ''} {className}"
	{...rest}
>
	{@render children()}
</Button.Root>
