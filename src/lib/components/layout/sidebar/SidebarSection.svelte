<script lang="ts">
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import * as Popover from '$lib/components/ui/Popover';
	import { FILE_TYPE_CONFIG } from '$lib/config/filesystem';
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
		dropState?: 'before' | 'after' | 'inside' | null;
		draggable?: boolean;
		onAdd?: (type: string) => void;
		onNameChange?: (newName: string) => void;
		ondragstart?: (e: DragEvent) => void;
		ondragover?: (e: DragEvent) => void;
		ondragleave?: (e: DragEvent) => void;
		ondrop?: (e: DragEvent) => void;
		class?: string;
	};

	let {
		children,
		title,
		icon,
		iconHidden = false,
		hideAddButton = false,
		dropState = null,
		draggable = false,
		onAdd,
		onNameChange,
		ondragstart,
		ondragover,
		ondragleave,
		ondrop,
		class: className = ''
	}: Props = $props();

	let isExpanded = $state(true);
	let triggerSquish = $state(false);
	let isAddMenuOpen = $state(false); // NEW: Track popover state

	let localTitle = $state(title);
	$effect(() => {
		localTitle = title;
	});

	let isEditing = $state(false);
	let editValue = $state(title);

	const creatableTypes = Object.entries(FILE_TYPE_CONFIG.internal)
		.filter(([id, config]) => config.active && !['sysfolder', 'sysfile'].includes(id))
		.map(([id, config]) => ({ id, ...config }));

	function handleSquish() {
		if (isEditing) return;
		triggerSquish = true;
		setTimeout(() => (triggerSquish = false), 300);
	}

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
			localTitle = trimmed;
			onNameChange?.(trimmed);
		} else {
			editValue = localTitle;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') commitEdit();
		if (e.key === 'Escape') {
			isEditing = false;
			editValue = localTitle;
		}
	}

	function focusNode(node: HTMLInputElement) {
		setTimeout(() => {
			node.focus();
			node.select();
		}, 10);
	}
</script>

<section data-uiname="sidebar-section-{localTitle}" class={cn('gap-2xs sidebar-section relative flex flex-col', className)} {draggable} {ondragstart} {ondragover} {ondragleave} {ondrop}>
	{#if dropState === 'before'}
		<div class="bg-accent-500 pointer-events-none absolute -top-[3px] left-0 z-10 h-1 w-full rounded-full shadow-sm"></div>
	{/if}
	{#if dropState === 'after'}
		<div class="bg-accent-500 pointer-events-none absolute -bottom-[3px] left-0 z-10 h-1 w-full rounded-full shadow-sm"></div>
	{/if}

	<header
		class={cn(
			'group h-main-xs px-2xs mb-2xs rounded-m relative flex items-center justify-between transition-colors',
			dropState === 'inside' ? 'bg-accent-500/10 ring-accent-500 ring-2' : '',
			isAddMenuOpen ? 'bg-level-1-hover' : '' // NEW: Keep active background when popover is open
		)}
		role="region"
		aria-label="Workspace {localTitle}">
		{#if isEditing}
			<div class="flex min-w-0 flex-1 items-center pr-2">
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
			<!-- NEW: Keep icons fully visible if the popover is open -->
			<div
				class={cn(
					'gap-3xs flex w-0 items-center opacity-0 transition-all duration-150 group-hover:visible group-hover:w-auto group-hover:opacity-100',
					isAddMenuOpen ? 'visible w-auto opacity-100' : 'invisible'
				)}>
				{#if !isEditing}
					<button type="button" onclick={startEdit} data-tooltip="Rename Workspace" aria-label="Edit" class="text-ink-60 hover:text-ink-80 hit-area-expand transition-colors">
						<Icon name="pencil" class="h-main-2xs" stroke="3" />
					</button>
				{/if}
				{#if !hideAddButton && !isEditing}
					<Popover.Root bind:isOpen={isAddMenuOpen}>
						<Popover.Trigger>
							<button type="button" data-tooltip="Create..." aria-label="Add" class="text-ink-60 hover:text-ink-80 hit-area-expand transition-colors {isAddMenuOpen ? 'text-ink-90' : ''}">
								<Icon name="add" class="h-main-2xs" stroke="3" />
							</button>
						</Popover.Trigger>
						<Popover.Content class="z-[9999] flex w-44 flex-col gap-1 p-1" side="bottom" align="end">
							{#each creatableTypes as type}
								<Button
									variant="tertiary"
									size="s"
									class="w-full justify-start"
									onclick={() => {
										onAdd?.(type.id);
										isAddMenuOpen = false;
									}}>
									{#snippet leading()}<Icon name={(type.icon as FigmaIconName) || 'file'} />{/snippet}
									{#snippet label()}<span class="w-full text-left capitalize">{type.id === 'workspace' ? 'Workspace' : type.id}</span>{/snippet}
								</Button>
							{/each}
							<div class="bg-border my-1 h-px w-full"></div>
							<Button
								variant="tertiary"
								size="s"
								class="w-full justify-start"
								onclick={() => {
									onAdd?.('upload');
									isAddMenuOpen = false;
								}}>
								{#snippet leading()}<Icon name="upload" />{/snippet}
								{#snippet label()}<span class="w-full text-left">Upload File...</span>{/snippet}
							</Button>
						</Popover.Content>
					</Popover.Root>
				{/if}
			</div>

			<button
				type="button"
				onclick={() => (isExpanded = !isExpanded)}
				onmouseenter={handleSquish}
				class={cn('text-ink-60 hover:text-ink-80 flex-center hit-area-expand transition-transform duration-200', !isExpanded ? 'rotate-90' : '')}>
				<Icon name="arrow-down" class="h-main-2xs" stroke="3" />
			</button>
		</div>
	</header>

	{#if isExpanded}
		<div transition:slide={{ duration: 150, easing: snappyBezier }} class={cn('gap-sidebar-files flex origin-top flex-col', triggerSquish ? 'animate-squish' : '')}>
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
