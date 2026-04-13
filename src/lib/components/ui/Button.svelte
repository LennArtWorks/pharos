<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	type BaseProps = {
		children?: Snippet;
		leading?: Snippet;
		label?: Snippet;
		trailing?: Snippet;
		variant?: 'primary' | 'secondary' | 'tertiary' | 'empty' | 'unstyled';
		size?: 'xs' | 's' | 'sm' | 'm' | 'l' | 'xl';
		active?: boolean;
		disabled?: boolean;
		loading?: boolean;
		iconOnly?: boolean;
		tagName?: 'button' | 'a' | 'div'; // <-- NEW: Allow forced tag types
		class?: string;
		ref?: HTMLElement | HTMLAnchorElement | null;
	};

	type Props = BaseProps &
		(
			| (HTMLButtonAttributes & { href?: never; type?: 'button' | 'submit' | 'reset' })
			| (HTMLAnchorAttributes & { href: string; type?: never })
			| (any & { tagName: 'div' }) // Fallback for div
		);

	let {
		children,
		leading,
		label,
		trailing,
		variant = 'primary',
		size = 'm',
		iconOnly = false,
		loading = false,
		active = false,
		disabled = false,
		href,
		type = href ? undefined : 'button',
		tagName,
		ref = $bindable(null),
		class: className = '',
		onclick,
		...rest
	}: Props = $props();

	// Automatically resolve the correct HTML tag
	const tag = $derived(tagName ? tagName : href ? 'a' : 'button');

	const variantClasses = {
		primary: 'bg-button hover:bg-button-hover-high text-ink-10',
		secondary: 'bg-transparent ring ring-inset ring-border hover:bg-button-hover-low text-ink-90',
		tertiary: 'bg-transparent hover:bg-button-hover-low text-ink-90',
		empty: 'bg-transparent border-custom-dashed hover:bg-button-hover-low text-ink-50',
		unstyled: 'bg-transparent p-0 text-ink-50 hover:text-ink-90 transition-colors'
	};

	const sizeClasses = {
		xs: 'h-main-xs font-label-xs font-semibold gap-2xs',
		s: 'h-main-s font-label-s font-semibold gap-3xs',
		sm: 'h-main-s font-semibold gap-2xs',
		m: 'h-main-m font-semibold gap-xs',
		l: 'h-main-l font-semibold gap-xs',
		xl: 'h-main-xl font-semibold gap-xs'
	};

	const paddingClasses = $derived({
		xs: iconOnly ? 'aspect-square p-0 justify-center' : 'px-s',
		s: iconOnly ? 'aspect-square p-0 justify-center' : 'px-2xs',
		sm: iconOnly ? 'aspect-square p-0 justify-center' : 'px-m',
		m: iconOnly ? 'aspect-square p-0 justify-center' : 'px-xl',
		l: iconOnly ? 'aspect-square p-0 justify-center' : 'px-l',
		xl: iconOnly ? 'aspect-square p-0 justify-center' : 'px-l'
	});

	let activeVariantClass = $derived(variantClasses[variant as keyof typeof variantClasses]);
	let activeSize = $derived(variant === 'unstyled' ? '' : `${sizeClasses[size as keyof typeof sizeClasses]} ${paddingClasses[size as keyof typeof paddingClasses]}`);

	function handleClick(e: MouseEvent) {
		if (disabled || loading) {
			e.preventDefault();
			return;
		}
		if (onclick) {
			/* @ts-ignore */ onclick(e);
		}
	}
</script>

<svelte:element
	this={tag}
	bind:this={ref}
	{href}
	{type}
	role={tag === 'div' ? 'button' : undefined}
	tabindex={tag === 'div' ? 0 : undefined}
	disabled={disabled || loading}
	aria-disabled={disabled || loading}
	data-uiname="button-root"
	onclick={handleClick}
	class={cn(
		'relative flex min-w-0 cursor-pointer items-center overflow-hidden transition-colors outline-none',
		iconOnly ? 'justify-center' : 'justify-start',
		activeSize,
		variant !== 'unstyled' && 'rounded-m hit-area-expand',
		activeVariantClass,
		active && variant === 'unstyled' ? 'text-ink-90 font-bold' : '',
		active && variant !== 'unstyled' ? 'bg-button-active text-ink-90 border-transparent' : '',
		(disabled || loading) && 'pointer-events-none cursor-not-allowed opacity-50',
		className
	)}
	{...rest}>
	{#if loading && variant !== 'unstyled'}
		<div class="absolute inset-0 z-0 animate-pulse bg-current opacity-10"></div>
	{/if}

	<div class={cn('contents', loading ? 'invisible' : 'visible')}>
		{#if leading}{@render leading()}{/if}

		{#if label || children}
			<span
				class={cn(
					'flex min-w-0 items-center',
					iconOnly ? 'justify-center' : 'flex-1',
					!iconOnly && className.includes('flex-col') ? 'justify-center text-center' : '',
					!iconOnly && !className.includes('flex-col') ? 'truncate' : ''
				)}>
				{#if label && !iconOnly}{@render label()}{:else if children}{@render children()}{/if}
			</span>
		{/if}

		{#if trailing}{@render trailing()}{/if}
	</div>

	{#if loading}
		<svg class={cn('absolute inset-0 m-auto h-4 w-4 animate-spin', iconOnly ? '' : 'left-4 mx-0')} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
			<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
			<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
		</svg>
	{/if}
</svelte:element>

<style>
	:global([data-uiname='button-root'] svg) {
		flex-shrink: 0;
	}
</style>
