<script lang="ts">
	import { setSelectContext } from '$lib/components/ui/Select/context.svelte';
	import * as Popover from '$lib/components/ui/TriggerPopover';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';

	let { value = $bindable(null), class: className = '', children }: { value?: string | number | null; class?: string; children: Snippet } = $props();

	const ctx = setSelectContext();

	// Push external bindings down to the internal context
	$effect(() => {
		if (value !== undefined) ctx.value = value;
	});

	// Bubble internal selections up to the parent binding
	$effect(() => {
		if (ctx.value !== undefined) value = ctx.value;
	});
</script>

<!-- Notice the inline-flex fix to prevent squishing -->
<Popover.Root class={cn('w-full', className)}>
	{@render children()}
</Popover.Root>
