<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { goto as navigate } from '$app/navigation';

	type BaseProps = {
		children?: Snippet;
		leading?: Snippet;
		label?: Snippet;
		trailing?: Snippet;
		variant?: 'primary' | 'secondary' | 'tertiary' | 'template' | 'unstyled';
		size?: 'xs' | 's' | 'sm' | 'm' | 'l' | 'xl';
		active?: boolean;
		disabled?: boolean;
		class?: string;
		goto?: string;
		icon?: boolean;
	};

	type Props = BaseProps & ((HTMLButtonAttributes & { href?: never }) | (HTMLAnchorAttributes & { href: string; goto?: never }));

	let { children, leading, label, trailing, variant = 'primary', size = 'm', icon = false, href, goto, active = false, disabled = false, class: className = '', onclick, ...rest }: Props = $props();

	const tag = $derived(href ? 'a' : 'button');

	const variantClasses = {
		primary: 'bg-button hover:bg-button-hover-high text-ink-10',
		secondary: 'bg-transparent ring ring-inset ring-border hover:bg-button-hover-low text-ink-90',
		tertiary: 'bg-transparent hover:bg-button-hover-low text-ink-90',
		template: 'bg-transparent border-custom-dashed hover:bg-button-hover-low text-ink-50',
		unstyled: 'bg-transparent p-0 text-ink-50 hover:text-ink-90 transition-colors'
	};

	// Base sizes (Heights and Gaps)
	const sizeClasses = {
		xs: 'h-main-xs font-label-xs font-semibold gap-2xs',
		s: 'h-main-s font-label-s font-semibold gap-3xs',
		sm: 'h-main-s font-semibold gap-2xs',
		m: 'h-main-m font-semibold gap-xs',
		l: 'h-main-l font-semibold gap-xs',
		xl: 'h-main-xl font-semibold gap-xs'
	};

	// Horizontal Padding (Ignored if icon=true)
	const paddingClasses = $derived({
		xs: icon ? 'w-main-xs justify-center p-0' : 'px-s',
		s: icon ? 'w-main-s justify-center p-0' : 'pl-2xs pr-xs', // Working padding for small size
		sm: icon ? 'w-main-s justify-center p-0' : 'px-m',
		m: icon ? 'w-main-m justify-center p-0' : 'px-xl',
		l: icon ? 'w-main-l justify-center p-0' : 'px-l',
		xl: icon ? 'w-main-xl justify-center p-0' : 'px-l'
	});

	let activeVariantClass = $derived(variantClasses[variant]);
	let activeSize = $derived(variant === 'unstyled' ? '' : `${sizeClasses[size]} ${paddingClasses[size]}`);

	// Checks if the user explicitly passed text alignment classes
	let hasTextLeft = $derived(className.includes('text-left') || className.includes('justify-start'));

	function handleClick(e: MouseEvent) {
		if (disabled) {
			e.preventDefault();
			return;
		}
		if (goto) {
			e.preventDefault();
			navigate(goto, { noScroll: true, keepFocus: true });
		}
		if (onclick) {
			// @ts-ignore
			onclick(e);
		}
	}
</script>

<svelte:element
	this={tag}
	{href}
	{disabled}
	aria-disabled={disabled}
	data-uiname="button-root"
	onclick={handleClick}
	class={cn(
		'flex min-w-0 items-center justify-center overflow-hidden transition-colors outline-none',
		activeSize,
		variant !== 'unstyled' && 'rounded-m hit-area-expand',
		activeVariantClass,
		active && variant === 'unstyled' ? 'text-ink-90 font-bold' : '',
		active && variant !== 'unstyled' ? 'bg-button-active text-ink-90 border-transparent' : '',
		disabled && 'pointer-events-none cursor-not-allowed opacity-50',
		className
	)}
	{...rest}>
	{#if leading}
		{@render leading()}
	{/if}

	{#if label || children}
		<span
			data-uiname="button-content"
			class={cn('flex min-w-0 flex-1 items-center truncate', icon ? 'justify-center' : label || hasTextLeft ? 'justify-start text-left' : 'justify-center text-center')}>
			{#if label}
				{@render label()}
			{:else if children}
				{@render children()}
			{/if}
		</span>
	{/if}

	{#if trailing}
		{@render trailing()}
	{/if}
</svelte:element>

<style>
	/* Ensure SVGs inside buttons never shrink */
	:global([data-uiname='button-root'] svg) {
		flex-shrink: 0;
	}
</style>
