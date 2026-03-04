<script lang="ts">
	/**
	 * import Button from '$lib/components/ui/Button.svelte';
	 */

	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type BaseProps = {
		children?: Snippet; // Now optional to allow snippet-only buttons
		leading?: Snippet;
		label?: Snippet;
		trailing?: Snippet;
		variant?: 'primary' | 'secondary' | 'tertiary' | 'template';
		size?: 'xs' | 's' | 'm' | 'l' | 'xl';
		/** Controls the inactive state for both buttons and links */
		active?: boolean;
		disabled?: boolean;
		class?: string;
	};

	type Props = BaseProps & ((HTMLButtonAttributes & { href?: never }) | (HTMLAnchorAttributes & { href: string }));

	let { children, leading, label, trailing, variant = 'primary', size = 'm', href, active = false, disabled = false, class: className = '', ...rest }: Props = $props();

	const tag = $derived(href ? 'a' : 'button');

	const variantClasses = {
		primary: 'bg-button hover:bg-button-hover-high text-ink-10',
		secondary: 'bg-transparent border-border border-2 hover:bg-button-hover-low text-ink-90',
		tertiary: 'bg-transparent hover:bg-button-hover-low text-ink-90',
		template: 'bg-transparent border-custom-dashed hover:bg-button-hover-low text-ink-50'
	};

	const sizeClasses = {
		xs: 'h-main-xs px-s font-label-xs font-bold gap-2xs', // tag size
		s: 'h-main-s px-2xs font-label-s font-semibold gap-3xs', // file size
		m: 'h-main-m px-xl font-semibold gap-xs', // regular button size
		l: 'h-main-l px-l font-semibold gap-xs', // big button + file preview size
		xl: 'h-main-xl px-l font-semibold gap-xs'
	};

	let activeVariantClass = $derived(variantClasses[variant]);
	let activeSize = $derived(sizeClasses[size]);
</script>

<svelte:element
	this={tag}
	{href}
	{disabled}
	aria-disabled={disabled}
	data-uiname="button"
	class={cn(
		'rounded-m hit-area-expand flex min-w-0 items-center overflow-hidden transition-colors',
		active ? 'bg-button-active text-ink-90 border-transparent' : activeVariantClass,
		disabled ? 'pointer-events-none cursor-not-allowed opacity-50' : '',
		className
	)}
	{...rest}>
	{#if leading || label || trailing}
		<div class={cn('flex w-full min-w-0 items-center overflow-hidden', activeSize)}>
			{#if leading}
				<div class="flex shrink-0 items-center">
					{@render leading()}
				</div>
			{/if}

			{#if label}
				<div class="{activeSize} flex min-w-0 flex-1 items-center overflow-hidden text-left">
					{@render label()}
				</div>
			{/if}

			{#if trailing}
				<div class="flex shrink-0 items-center">
					{@render trailing()}
				</div>
			{/if}
		</div>
	{:else if children}
		<div class={cn('flex w-full min-w-0 items-center overflow-hidden text-center', activeSize)}>
			{@render children()}
		</div>
	{/if}
</svelte:element>

<style>
	/* Ensure SVGs inside buttons never shrink and maintain OS-style stroke consistency */
	:global([data-uiname='button'] svg) {
		flex-shrink: 0;
	}
</style>
