<script lang="ts">
	import { getPopoverContext } from '$lib/components/ui/Popover/context.svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';

	let { children, class: className, ...rest }: { children: Snippet; class?: string } & HTMLAttributes<HTMLDivElement> = $props();
	const ctx = getPopoverContext();
</script>

<div
	role="button"
	tabindex="0"
	onkeydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') ctx.toggle();
	}}
	onclick={(e) => {
		e.stopPropagation();
		ctx.toggle();
	}}
	class={cn('flex w-full cursor-pointer items-center outline-none', className)}
	{...rest}>
	{@render children()}
</div>
