<script lang="ts">
	import { getSelectContext } from './context.svelte';
	import { getPopoverContext } from '$lib/components/ui/Popover/context.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Snippet } from 'svelte';

	let {
		value,
		label,
		children,
		default: isDefault = false,
		...rest // Capture data-uiname
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
		const textLabel = label ?? (value !== null && value !== undefined ? String(value) : '');
		selectCtx.label = textLabel;
		selectCtx.contentSnippet = children || null;
		popoverCtx.close();
	}

	$effect(() => {
		if (isDefault && selectCtx.value === null) {
			selectCtx.value = value;
			const textLabel = label ?? (value !== null && value !== undefined ? String(value) : '');
			selectCtx.label = textLabel;
			selectCtx.contentSnippet = children || null;
		}

		// Keep context synced if value matches
		if (selectCtx.value === value) {
			const textLabel = label ?? (value !== null && value !== undefined ? String(value) : '');
			selectCtx.label = textLabel;
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
