<script lang="ts">
	import { getPopoverContext } from './context.svelte';
	import { tick } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
		class?: string;
		variant?: 'standard' | 'unstyled';
		side?: 'top' | 'bottom' | 'left' | 'right';
		align?: 'start' | 'center' | 'end' | 'parent-center';
	}

	let { children, class: className = '', variant = 'standard', side = 'bottom', align = 'center', ...rest }: Props = $props();

	const ctx = getPopoverContext();
	let popoverRef: HTMLDivElement;

	let computedStyle = $state('opacity: 0; pointer-events: none;'); // Hide until positioned to prevent jump

	function adjustPosition() {
		if (!popoverRef || !ctx.isOpen) return;

		const parent = popoverRef.parentElement;
		if (!parent) return;

		const rect = popoverRef.getBoundingClientRect();
		const parentRect = parent.getBoundingClientRect();
		const viewportWidth = window.innerWidth;

		let finalAlign = align;

		// Horizontal bounds check
		if (align === 'start' && parentRect.left + rect.width > viewportWidth) finalAlign = 'end';
		if (align === 'end' && parentRect.right - rect.width < 0) finalAlign = 'start';

		let styleStr = 'opacity: 1; transition: opacity 0.1s ease-in; '; // Fade in smoothly

		// Side Positioning (Simplified with absolute)
		if (side === 'top') styleStr += `bottom: calc(100% + 4px); `;
		else styleStr += `top: calc(100% + 4px); `;

		// Alignment
		if (finalAlign === 'center') {
			styleStr += `left: 50%; transform: translateX(-50%); `;
		} else if (finalAlign === 'end') {
			styleStr += `right: 0; left: auto; `;
		} else {
			styleStr += `left: 0; right: auto; `;
		}

		computedStyle = styleStr;
	}

	$effect(() => {
		if (ctx.isOpen) {
			computedStyle = 'opacity: 0;'; // Reset on open
			tick().then(adjustPosition);
		}
	});

	function handleClickOutside(e: MouseEvent) {
		if (ctx.isOpen && popoverRef && !popoverRef.contains(e.target as Node) && !popoverRef.parentElement?.contains(e.target as Node)) {
			ctx.close();
		}
	}
</script>

<svelte:window onmousedown={handleClickOutside} onresize={adjustPosition} onscroll={adjustPosition} />

{#if ctx.isOpen}
	<div
		bind:this={popoverRef}
		{...rest}
		onclick={(e) => {
			e.stopPropagation();
			if (ctx.closeOnClick) ctx.close();
			if (typeof rest.onclick === 'function') rest.onclick(e);
		}}
		style="{computedStyle} {rest.style || ''}"
		class={cn('bg-level-1 border-border rounded-m absolute z-50 max-h-[80vh] min-w-40 overflow-y-auto border shadow-lg', variant === 'standard' ? 'flex flex-col gap-1 p-1' : '', className)}>
		{@render children()}
	</div>
{/if}
