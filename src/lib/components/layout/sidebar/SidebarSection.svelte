<script lang="ts">
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { slide } from 'svelte/transition';

	const snappyBezier = (t: number) => {
		return --t * t * ((1.7 + 1) * t + 1.7) + 1;
	};

	type Props = {
		title: string;
		children: Snippet;
		icon?: FigmaIconName;
		iconHidden?: boolean;
		hideAddButton?: boolean;
		onAdd?: (e: MouseEvent) => void;
		onNameChange?: (newName: string) => void;
		class?: string;
	};

	let { children, title, icon, iconHidden = false, hideAddButton = false, onAdd, onNameChange, class: className = '' }: Props = $props();

	let isExpanded = $state(true);
	let triggerSquish = $state(false);

	// Local state for optimistic UI updates
	let localTitle = $state(title);
	$effect(() => {
		localTitle = title;
	});

	// Edit State
	let isEditing = $state(false);
	let editValue = $state(title);

	function handleSquish() {
		if (isEditing) return;
		triggerSquish = true;
		setTimeout(() => (triggerSquish = false), 300);
	}

	const handleAction = (e: MouseEvent, callback?: (e: MouseEvent) => void) => {
		e.stopPropagation();
		callback?.(e);
	};

	function startEdit(e: MouseEvent) {
		e.stopPropagation();
		isEditing = true;
		editValue = localTitle;
	}

	function commitEdit() {
		if (!isEditing) return;
		isEditing = false;
		const trimmed = editValue.trim();
		if (trimmed !== '' && trimmed !== localTitle) {
			localTitle = trimmed; // Optimistically update UI
			onNameChange?.(trimmed); // Fire backend function
		} else {
			editValue = localTitle; // Reset if empty
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') commitEdit();
		if (e.key === 'Escape') {
			isEditing = false;
			editValue = localTitle;
		}
	}

	// Auto-focus action for the input
	function focusNode(node: HTMLInputElement) {
		setTimeout(() => {
			node.focus();
			node.select();
		}, 10);
	}
</script>

<section data-uiname="sidebar-section-{localTitle}" class={cn('gap-2xs sidebar-section flex flex-col', className)}>
	<header class="group h-main-xs px-2xs mb-2xs flex items-center justify-between">
		{#if isEditing}
			<div class="flex min-w-0 flex-1 items-center pr-2">
				{#if icon && !iconHidden}
					<Icon name={icon} stroke="3" class="text-ink-50 h-main-2xs mr-xs shrink-0" />
				{/if}
				<input
					type="text"
					bind:value={editValue}
					use:focusNode
					onblur={commitEdit}
					onkeydown={handleKeydown}
					class="bg-level-1 border-accent-500 text-ink-90 font-label-xs w-full rounded border px-1 py-0.5 outline-none" />
			</div>
		{:else}
			<button
				type="button"
				onclick={() => (isExpanded = !isExpanded)}
				aria-expanded={isExpanded}
				class="gap-xs text-ink-60 hover:text-ink-90 hit-area-expand flex min-w-0 flex-1 items-center text-left transition-colors">
				{#if icon && !iconHidden}
					<Icon name={icon} stroke="3" class="h-main-2xs shrink-0" />
				{/if}
				<span class="font-label-xs block min-w-0 flex-1 truncate font-bold select-none">
					{localTitle}
				</span>
			</button>
		{/if}

		<div data-uiname="icons" class="gap-3xs pl-xs flex shrink-0 items-center">
			<div class="gap-3xs invisible flex w-0 items-center opacity-0 transition-all duration-150 group-hover:visible group-hover:w-auto group-hover:opacity-100">
				{#if !isEditing}
					<button type="button" onclick={startEdit} aria-label="Edit" class="text-ink-60 hover:text-ink-80 hit-area-expand transition-colors">
						<Icon name="pencil" class="h-main-2xs" stroke="3" />
					</button>
				{/if}
				{#if !hideAddButton && !isEditing}
					<button type="button" onclick={(e) => handleAction(e, onAdd)} aria-label="Add" class="text-ink-60 hover:text-ink-80 hit-area-expand transition-colors">
						<Icon name="add" class="h-main-2xs" stroke="3" />
					</button>
				{/if}
			</div>

			<button
				type="button"
				onclick={() => (isExpanded = !isExpanded)}
				onmouseenter={handleSquish}
				aria-label={isExpanded ? 'Collapse' : 'Expand'}
				class={cn('text-ink-60 hover:text-ink-80 flex-center hit-area-expand transition-transform duration-200', !isExpanded ? 'rotate-90' : '')}>
				<Icon name="arrow-down" class="h-main-2xs" stroke="3" />
			</button>
		</div>
	</header>

	{#if isExpanded}
		<div transition:slide={{ duration: 150, easing: snappyBezier }} class={cn('gap-sidebar-files flex origin-top flex-col', triggerSquish && 'animate-squish')}>
			{@render children()}
		</div>
	{/if}
</section>

<style>
	@keyframes squish {
		0% {
			transform: scaleY(1);
			opacity: 1;
		}
		30% {
			transform: scaleY(0.96);
			opacity: 0.9;
		}
		100% {
			transform: scaleY(1);
			opacity: 1;
		}
	}
	.animate-squish {
		animation: squish 0.3s cubic-bezier(0.25, 1, 0.5, 1);
	}
	[data-uiname='icons'] > div {
		white-space: nowrap;
	}
</style>
