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
	}

	let { children, class: className = '', variant = 'standard', ...rest }: Props = $props();

	const ctx = getPopoverContext();
	let popoverRef: HTMLDivElement;
	let top = $state('calc(100% + 4px)');
	let left = $state('0');
	let transformOrigin = $state('top left');

	function adjustPosition() {
		if (!popoverRef || !ctx.isOpen) return;

		const rect = popoverRef.getBoundingClientRect();
		const parentRect = popoverRef.parentElement?.getBoundingClientRect();
		if (!parentRect) return;

		const viewportHeight = window.innerHeight;
		const viewportWidth = window.innerWidth;

		if (rect.bottom > viewportHeight && parentRect.top > rect.height) {
			top = `-${rect.height + 4}px`;
			transformOrigin = 'bottom left';
		} else {
			top = `calc(100% + 4px)`;
			transformOrigin = 'top left';
		}

		if (rect.right > viewportWidth) {
			left = 'auto';
			popoverRef.style.right = '0';
			transformOrigin = transformOrigin.replace('left', 'right');
		} else {
			left = '0';
			popoverRef.style.right = 'auto';
		}
	}

	$effect(() => {
		if (ctx.isOpen) tick().then(adjustPosition);
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
		style="top: {top}; left: {left}; transform-origin: {transformOrigin}; {rest.style || ''}"
		class={cn('bg-level-1 border-border rounded-m absolute z-50 max-h-60 min-w-40 overflow-y-auto border shadow-lg', variant === 'standard' ? 'flex flex-col gap-1 p-1' : '', className)}>
		{@render children()}
	</div>
{/if}
