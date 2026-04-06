<script lang="ts">
	import * as Popover from '$lib/components/ui/Popover';
	import { getSelectContext } from './context.svelte';
	import { getPopoverContext } from '$lib/components/ui/Popover/context.svelte';
	import Icon from '../Icon.svelte';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	let {
		label,
		required = false,
		placeholder = 'Select...',
		class: className = '',
		children
	}: {
		label?: string;
		required?: boolean;
		placeholder?: string;
		class?: string;
		children?: Snippet;
	} = $props();

	const selectCtx = getSelectContext();
	const popoverCtx = getPopoverContext();
</script>

<div class={cn('flex w-full flex-col gap-1', className)}>
	{#if label}
		<label class="font-label-s text-ink-90 font-semibold">
			{label}
			{#if required}<span class="text-error ml-0.5">*</span>{/if}
		</label>
	{/if}

	<Popover.Trigger class="w-full">
		<div
			class="h-main-m rounded-m ring-border bg-level-0 focus-within:ring-ink-90 relative flex w-full min-w-0 items-center justify-between overflow-visible ring-1 transition-all ring-inset hover:ring-2">
			<div class="text-ink-90 px-m flex items-center truncate bg-transparent font-semibold">
				{#if children}
					{@render children()}
					<!-- NEW: Check that the value is neither null AND neither an empty string -->
				{:else if selectCtx.value !== null && selectCtx.value !== ''}
					{#if selectCtx.contentSnippet}
						{@render selectCtx.contentSnippet()}
					{:else if selectCtx.label}
						<span>{selectCtx.label}</span>
					{:else}
						<span>{selectCtx.value}</span>
					{/if}
				{:else}
					<span class="text-ink-50 font-normal">{placeholder}</span>
				{/if}
			</div>

			<div class="pr-m text-ink-50 flex shrink-0 items-center">
				<Icon name="arrow-down" class={cn('h-4 w-4 transition-transform duration-200', popoverCtx.isOpen ? 'rotate-180' : '')} />
			</div>
		</div>
	</Popover.Trigger>
</div>
