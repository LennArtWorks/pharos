<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import Tag from '../ui/Tag.svelte';
	import { cn } from '$lib/utils';
	import { FILE_TYPE_CONFIG, VIEW_CONFIG, type UIFileIconType } from '$lib/config/filesystem';
	import { slide } from 'svelte/transition';
	import type { Snippet } from 'svelte';
	import { goto } from '$app/navigation';

	const snappyBezier = (t: number) => --t * t * ((1.7 + 1) * t + 1.7) + 1;

	interface TagData {
		label: string;
		icon?: FigmaIconName;
	}

	interface Props {
		children?: Snippet;
		nestedItems?: Snippet;
		hasChildren?: boolean; // Controls whether the arrow and dropdown actually render
		filetype?: UIFileIconType | string;
		customIcon?: FigmaIconName;
		dropState?: 'before' | 'after' | 'inside' | null;
		mode?: 'default' | 'preview';
		active?: boolean;
		template?: boolean;
		loading?: boolean;
		iconHidden?: boolean;
		disabled?: boolean;
		class?: string;
		href?: string;
		hideLabel?: boolean;
		minimized?: boolean;
		tags?: (string | TagData)[];
		assigned?: boolean | string;
		isEditing?: boolean;
		editValue?: string;
		onsave?: (newName: string) => void;
		oncancel?: () => void;
		isOpen?: boolean;
		onToggle?: (isOpen: boolean) => void;
		[key: string]: any;
	}

	let {
		children,
		nestedItems,
		hasChildren = true, // Default to true so it works out-of-the-box for standard folders
		filetype = 'document',
		customIcon,
		dropState = null,
		mode = 'default',
		active = false,
		template = false,
		loading = false,
		iconHidden = false,
		disabled = false,
		class: className = '',
		href,
		hideLabel = false,
		minimized = false,
		tags = [],
		assigned = false,
		isEditing = false,
		editValue = '',
		onsave,
		oncancel,
		isOpen = false,
		onToggle,
		...rest
	}: Props = $props();

	// --- Expansion & Animation Logic ---
	let isExpanded = $state(isOpen);
	let triggerSquish = $state(false);

	function handleSquish() {
		if (!nestedItems || !hasChildren) return;
		triggerSquish = true;
		setTimeout(() => (triggerSquish = false), 300);
	}

	function handleToggle(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		isExpanded = !isExpanded;
		onToggle?.(isExpanded);
	}

	// --- Navigation Logic ---
	function handleMainClick(e: MouseEvent) {
		if (isEditing) return;
		if (href) {
			e.preventDefault();
			goto(href);
		}
	}

	// --- Visuals ---
	let size = $derived((mode === 'preview' ? 'l' : 's') as 'l' | 's');
	let iconName = $derived(
		(() => {
			if (customIcon) return customIcon;
			if (loading) return 'clock';
			const config =
				VIEW_CONFIG[filetype as keyof typeof VIEW_CONFIG] ||
				FILE_TYPE_CONFIG.internal[filetype as keyof typeof FILE_TYPE_CONFIG.internal] ||
				FILE_TYPE_CONFIG.external[filetype as keyof typeof FILE_TYPE_CONFIG.external];
			return (config?.icon || 'file') as FigmaIconName;
		})()
	);

	let shouldShowLabel = $derived((!!children || isEditing) && !hideLabel);
	// Only allocate space for trailing elements if tags, assignments, OR actual child arrows exist
	let hasTrailingElements = $derived(tags.length > 0 || !!assigned || (!!nestedItems && hasChildren));

	// --- Edit Logic ---
	let inputValue = $state('');
	$effect(() => {
		if (isEditing) inputValue = editValue;
	});
	function focusInput(node: HTMLInputElement) {
		if (isEditing)
			setTimeout(() => {
				node.focus();
				node.select();
			}, 10);
	}
	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.stopPropagation();
			e.preventDefault();
			onsave?.(inputValue);
		}
		if (e.key === 'Escape') {
			e.stopPropagation();
			e.preventDefault();
			oncancel?.();
		}
	}
</script>

<div class={cn('flex flex-col gap-1', !minimized || nestedItems ? 'w-full' : 'w-fit')}>
	<div class="relative w-full">
		{#if dropState === 'before'}
			<div class="bg-accent-500 pointer-events-none absolute -top-[3px] left-0 z-10 h-1 w-full rounded-full shadow-sm"></div>
		{/if}
		{#if dropState === 'after'}
			<div class="bg-accent-500 pointer-events-none absolute -bottom-[3px] left-0 z-10 h-1 w-full rounded-full shadow-sm"></div>
		{/if}
		{#if dropState === 'inside'}
			<div class="ring-accent-500 bg-accent-500/10 rounded-m pointer-events-none absolute inset-0 z-10 ring-2"></div>
		{/if}

		<Button
			variant={template ? 'template' : 'tertiary'}
			{size}
			active={active || isEditing}
			disabled={disabled || loading}
			onclick={handleMainClick}
			class={cn(
				className,
				isEditing ? 'bg-level-1-hover ring-border ring-1' : '',
				!minimized || nestedItems ? 'w-full' : '',
				minimized && !isEditing && !nestedItems ? 'w-main-s hover:pl-xs pl-s whitespace-nowrap transition-all duration-300 ease-out hover:w-40' : '',
				'group relative'
			)}
			{...rest}>
			{#snippet leading()}
				{#if !iconHidden}
					<Icon name={iconName} class={cn(loading ? 'animate-pulse opacity-50' : '', 'shrink-0')} />
				{/if}
			{/snippet}

			{#snippet label()}
				{#if isEditing}
					<input
						type="text"
						bind:value={inputValue}
						use:focusInput
						onkeydown={handleKeydown}
						onblur={() => onsave?.(inputValue)}
						onclick={(e) => e.stopPropagation()}
						ondblclick={(e) => e.stopPropagation()}
						class="text-ink-90 font-label-s m-0 w-full border-none bg-transparent p-0 leading-none outline-none" />
				{:else if children}
					<span class={cn('min-w-0 flex-1 truncate text-left', loading ? 'opacity-50' : '')}>
						{@render children()}
					</span>
				{/if}
			{/snippet}

			{#snippet trailing()}
				<div class="gap-2xs flex items-center">
					{#each tags as tagItem}
						<Tag>
							{#if typeof tagItem === 'string'}
								{tagItem}
							{:else if typeof tagItem === 'object' && tagItem !== null && 'label' in tagItem}
								<div class="flex items-center gap-1">
									{#if tagItem.icon}<Icon name={tagItem.icon} class="h-3 w-3" />{/if}
									{tagItem.label}
								</div>
							{/if}
						</Tag>
					{/each}

					{#if assigned}
						<div class="bg-ink-90 h-1.5 w-1.5 shrink-0 rounded-full"></div>
					{/if}

					{#if nestedItems && hasChildren}
						<div
							role="button"
							tabindex="-1"
							onclick={handleToggle}
							onmouseenter={handleSquish}
							class="text-ink-60 hover:text-ink-80 hit-area-expand flex items-center justify-center transition-transform duration-200 {isExpanded ? '' : 'rotate-90'}">
							<Icon name="arrow-down" class="h-main-2xs" stroke="3" />
						</div>
					{/if}
				</div>
			{/snippet}
		</Button>

		{#if nestedItems && hasChildren && isExpanded}
			<div transition:slide={{ duration: 150, easing: snappyBezier }} class={cn('flex origin-top flex-col', triggerSquish ? 'animate-squish' : '')}>
				<div class="border-border gap-sidebar-files pl-2xs ml-m mt-1 flex flex-col border-l">
					{@render nestedItems()}
				</div>
			</div>
		{/if}
	</div>
</div>

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
</style>
