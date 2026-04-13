<script lang="ts">
	import { getPopoverContext } from './context.svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let { children, class: className, ...rest }: { children: Snippet; class?: string } & HTMLAttributes<HTMLDivElement> = $props();
	const ctx = getPopoverContext();
</script>

<div
	bind:this={ctx.triggerNode}
	onclick={(e) => {
		// We let the child handle stopPropagation if it wants to,
		// otherwise it bubbles here and opens the popover.
		ctx.toggle();
	}}
	class={cn('inline-flex w-fit items-center', className)}
	{...rest}>
	{@render children()}
</div>
