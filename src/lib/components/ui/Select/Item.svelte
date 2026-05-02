<script lang="ts">
	import { getSelectContext } from './context.svelte';
	import { getPopoverContext } from '$lib/components/ui/TriggerPopover/context.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Snippet } from 'svelte';

	let {
		value,
		label,
		children,
		default: isDefault = false,
		...rest
	}: {
		value: string | number | null;
		label?: string;
		children?: Snippet;
		default?: boolean;
		[key: string]: any;
	} = $props();

	const selectCtx = getSelectContext();
	const popoverCtx = getPopoverContext();

	function selectItem() {
		selectCtx.value = value;
		popoverCtx.close();
	}

	$effect(() => {
		// 1. Initialization injection (only runs if the global value is strictly null)
		if (isDefault && selectCtx.value === null) {
			selectCtx.value = value;
		}

		// 2. Sync visual presentation when this item becomes active
		if (selectCtx.value === value) {
			selectCtx.label = label ?? (value !== null && value !== undefined ? String(value) : '');
			selectCtx.contentSnippet = children || null;
		}
	});
</script>

<Button {...rest} variant="tertiary" size="s" active={selectCtx.value === value} onclick={selectItem} class="w-full justify-start">
	{#if children}
		<div class="flex items-center gap-2">
			{@render children()}
		</div>
	{:else}
		<span class="w-full truncate text-left">{label || value}</span>
	{/if}
</Button>
