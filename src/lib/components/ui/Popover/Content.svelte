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
		align?: 'start' | 'center' | 'end';
		alignToParent?: boolean;
		alignToQuery?: string;
		stayOnScroll?: boolean;
	}

	let { children, class: className = '', variant = 'standard', side = 'bottom', align = 'center', alignToParent = false, alignToQuery, stayOnScroll = false, ...rest }: Props = $props();

	const ctx = getPopoverContext();
	let popoverRef: HTMLDivElement | undefined = $state();

	let computedStyle = $state('opacity: 0; pointer-events: none; position: fixed; top: -9999px; left: -9999px;');

	function adjustPosition() {
		if (!popoverRef || !ctx.isOpen || !ctx.triggerNode) return;

		let refNode = ctx.triggerNode;

		if (alignToQuery) {
			const queriedNode = document.querySelector(alignToQuery);
			if (queriedNode) refNode = queriedNode as HTMLElement;
		} else if (alignToParent) {
			if (refNode.parentElement?.parentElement) refNode = refNode.parentElement.parentElement;
		}

		const refRect = refNode.getBoundingClientRect();
		const popoverRect = popoverRef.getBoundingClientRect();
		const vw = window.innerWidth;
		const vh = window.innerHeight;

		let finalSide = side;
		let finalAlign = align;

		if (side === 'bottom' && refRect.bottom + popoverRect.height > vh - 10) finalSide = 'top';
		else if (side === 'top' && refRect.top - popoverRect.height < 10) finalSide = 'bottom';

		if (align === 'start' && refRect.left + popoverRect.width > vw - 10) finalAlign = 'end';
		else if (align === 'end' && refRect.right - popoverRect.width < 10) finalAlign = 'start';

		let top = 0;
		let left = 0;

		if (finalSide === 'bottom') top = refRect.bottom + 4;
		else if (finalSide === 'top') top = refRect.top - popoverRect.height - 4;

		if (finalAlign === 'start') left = refRect.left;
		else if (finalAlign === 'end') left = refRect.right - popoverRect.width;
		else if (finalAlign === 'center') left = refRect.left + refRect.width / 2 - popoverRect.width / 2;

		left = Math.max(10, Math.min(left, vw - popoverRect.width - 10));
		top = Math.max(10, Math.min(top, vh - popoverRect.height - 10));

		computedStyle = `position: fixed; top: ${top}px; left: ${left}px; opacity: 1; transition: opacity 0.1s ease-in;`;
	}

	function handleScroll(e: Event) {
		if (!ctx.isOpen) return;
		if (stayOnScroll) {
			requestAnimationFrame(adjustPosition);
		} else {
			if (popoverRef && !popoverRef.contains(e.target as Node)) {
				ctx.close();
			}
		}
	}

	$effect(() => {
		if (ctx.isOpen) {
			computedStyle = 'opacity: 0; pointer-events: none; position: fixed; top: -9999px; left: -9999px;';
			tick().then(() => requestAnimationFrame(adjustPosition));
			document.addEventListener('scroll', handleScroll, true);
			return () => {
				document.removeEventListener('scroll', handleScroll, true);
			};
		}
	});

	function handleClickOutside(e: MouseEvent) {
		if (!ctx.isOpen || !popoverRef || !ctx.triggerNode) return;

		// 1. If we clicked inside our own popover or trigger, do nothing
		if (popoverRef.contains(e.target as Node) || ctx.triggerNode.contains(e.target as Node)) {
			return;
		}

		// 2. NEW FIX: If we clicked inside ANOTHER portaled popover (like a nested Select), do nothing!
		// This stops the parent popover from closing when you click a child popover.
		const clickedInsideAnyPopover = (e.target as HTMLElement).closest('[data-popover-content]');
		if (clickedInsideAnyPopover) {
			return;
		}

		// 3. Otherwise, we genuinely clicked outside, so close it.
		ctx.close();
	}

	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentElement) node.parentElement.removeChild(node);
			}
		};
	}
</script>

<svelte:window onmousedown={handleClickOutside} onresize={adjustPosition} />

{#if ctx.isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		use:portal
		bind:this={popoverRef}
		data-popover-content="true"
		{...rest}
		onclick={(e) => {
			e.stopPropagation();
			if (ctx.closeOnClick) ctx.close();
			if (typeof rest.onclick === 'function') rest.onclick(e);
		}}
		style="{computedStyle} {rest.style || ''}"
		class={cn('bg-level-1 border-border rounded-m z-9999 max-h-[60vh] min-w-40 overflow-y-auto border shadow-lg', variant === 'standard' ? 'flex flex-col gap-1 p-1' : '', className)}>
		{@render children()}
	</div>
{/if}
