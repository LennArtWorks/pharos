<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import { cn } from '$lib/utils';

	import { FILE_TYPE_CONFIG, VIEW_CONFIG, type UIFileIconType, type FSRNode } from '$lib/config/filesystem';
	import type { Snippet } from 'svelte';
	import InlineInput from '$lib/components/ui/InlineInput.svelte';

	interface TagData {
		label: string;
		icon?: FigmaIconName;
	}

	type ButtonVariant = 'unstyled' | 'primary' | 'secondary' | 'tertiary' | 'empty';

	interface Props {
		children?: Snippet;
		name?: string;
		node?: FSRNode;
		filetype?: UIFileIconType | string;
		icon?: FigmaIconName;
		iconHidden?: boolean;
		display?: 'list' | 'grid';
		size?: 's' | 'm' | 'l';
		isWorkspace?: boolean;
		variant?: ButtonVariant; // <-- NEW: Allows forcing standard button styles on workspaces
		active?: boolean;
		disabled?: boolean;
		template?: boolean;
		loading?: boolean;
		minimized?: boolean;
		tags?: Array<string | TagData>;
		assigned?: boolean;
		hideLabel?: boolean;
		maxWidth?: boolean;
		hasChildren?: boolean;
		isOpen?: boolean;
		onToggle?: (isOpen: boolean) => void;
		onSquish?: () => void;
		trailingItems?: Snippet;
		href?: string;
		tagName?: 'a' | 'button' | 'div';
		ref?: HTMLElement | HTMLAnchorElement | null;
		class?: string;
		[key: string]: any;
		isEditing?: boolean;
		onsave?: (newName: string) => void;
		oncancel?: () => void;
	}

	let {
		children,
		name,
		node,
		filetype,
		icon,
		iconHidden = false,
		display = 'list',
		size = 's',
		isWorkspace = false,
		variant,
		active = false,
		disabled = false,
		template = false,
		loading = false,
		minimized = false,
		tags = [],
		assigned = false,
		hideLabel = false,
		maxWidth = false,
		hasChildren = false,
		isOpen = false,
		onToggle,
		onSquish,
		trailingItems,
		href,
		tagName,
		isEditing = false,
		onsave,
		oncancel,
		class: className = '',
		...rest
	}: Props = $props();

	let resolvedName = $derived(name || node?.name || 'Unknown Node');
	let resolvedIcon = $derived.by<FigmaIconName>(() => {
		if (icon) return icon;
		const typeKey = filetype || node?.uiFileType;
		if (typeKey) {
			if (typeKey in VIEW_CONFIG) return VIEW_CONFIG[typeKey as keyof typeof VIEW_CONFIG].icon as FigmaIconName;
			if (typeKey in FILE_TYPE_CONFIG.internal) return FILE_TYPE_CONFIG.internal[typeKey as keyof typeof FILE_TYPE_CONFIG.internal].icon as FigmaIconName;
			if (typeKey in FILE_TYPE_CONFIG.external) return FILE_TYPE_CONFIG.external[typeKey as keyof typeof FILE_TYPE_CONFIG.external].icon as FigmaIconName;
		}
		return 'file';
	});

	let effectiveIconHidden = $derived(iconHidden || (isWorkspace && !icon));
	let isGrid = $derived(display === 'grid');

	// Use passed variant, fallback to empty/unstyled/tertiary logic
	let buttonVariant = $derived<ButtonVariant>(variant || (template ? 'empty' : isWorkspace && !isGrid ? 'unstyled' : 'tertiary'));
	let isIconOnly = $derived(minimized && !isWorkspace);

	// --- EXTENSION LOGIC ---

	// 1. Identify if it's an external file that needs an extension
	let isExternalFile = $derived(node?.extension && !(node.uiFileType in FILE_TYPE_CONFIG.internal));

	// 2. AGGRESSIVE STRIP: This getter ensures the UI *never* sees the extension,
	// even if the extension is currently doubled in the database.
	let editDisplayName = $derived.by(() => {
		if (!isExternalFile) return resolvedName;

		let cleanName = resolvedName;
		const ext = node!.extension;

		// Loop to strip the extension as many times as it appears at the end
		// This cleans up "garbage" data like image.png.png
		while (cleanName.toLowerCase().endsWith(ext.toLowerCase()) && ext !== '') {
			cleanName = cleanName.slice(0, -ext.length);
		}
		return cleanName;
	});

	// 3. ENFORCED APPEND: We strip whatever the user typed (in case they typed the extension)
	// and then add exactly one clean extension back.
	function handleSave(inputValue: string) {
		if (!onsave) return;

		let baseName = inputValue.trim();

		if (isExternalFile) {
			const ext = node!.extension;
			// Strip extension if the user typed it manually
			while (baseName.toLowerCase().endsWith(ext.toLowerCase()) && ext !== '') {
				baseName = baseName.slice(0, -ext.length);
			}
			// Re-attach exactly once
			onsave(baseName + ext);
		} else {
			onsave(baseName);
		}
	}

	// --- MINIMIZED LOGIC ---
	// Per your instruction: just use iconOnly mode if minimized is set
	let effectiveIconOnly = $derived(minimized || isIconOnly);
</script>

<Button
	{href}
	{tagName}
	{active}
	{loading}
	{disabled}
	variant={buttonVariant}
	size={isGrid ? 'l' : size}
	iconOnly={effectiveIconOnly}
	class={cn(
		isGrid ? 'p-m gap-s aspect-square h-auto w-24 flex-col justify-center' : 'w-full justify-start',
		// Only apply tight margins if it's ACTUALLY an unstyled header (FileTree), not a breadcrumb
		isWorkspace && buttonVariant === 'unstyled' && !isGrid ? 'h-main-xs mb-2xs px-2xs hover:bg-level-1-hover group rounded' : 'group',
		minimized ? 'align-center m-0 aspect-square justify-center p-0' : '', //hover:w-40 hover:justify-start hover:px-s
		isEditing && !isWorkspace ? 'bg-level-1-hover ring-border ring-1' : '',
		className
	)}
	{...rest}>
	{#snippet leading()}
		{#if !effectiveIconHidden}
			<Icon
				name={resolvedIcon}
				class={cn(
					loading ? 'animate-pulse opacity-50' : '',
					'shrink-0',
					isGrid ? 'h-8 w-8 stroke-[1.5]' : '',
					isWorkspace && buttonVariant === 'unstyled' && !isGrid ? 'h-main-2xs text-ink-60 group-hover:text-ink-90 stroke-3' : ''
				)} />
		{/if}
	{/snippet}

	{#snippet label()}
		{#if !hideLabel}
			{#if children}
				{@render children()}
			{:else if isEditing}
				<InlineInput value={editDisplayName} {maxWidth} class={isWorkspace && buttonVariant === 'unstyled' && !isGrid ? 'font-label-xs font-bold' : ''} onsave={handleSave} {oncancel} />
			{:else}
				<span
					class={cn(
						'min-w-0 flex-1',
						isGrid ? 'line-clamp-2 w-full text-center' : 'truncate text-left',
						loading ? 'opacity-50' : '',
						// Specific font sizes based on variant
						isWorkspace && buttonVariant === 'unstyled' && !isGrid ? 'font-label-xs text-ink-60 group-hover:text-ink-90 font-bold select-none' : '',
						isWorkspace && buttonVariant !== 'unstyled' && !isGrid ? 'text-ink-60 group-hover:text-ink-90 font-bold select-none' : '', // Keeps bold but normal size
						maxWidth && !isGrid ? 'max-w-62.5' : ''
					)}>
					{resolvedName}
				</span>
			{/if}
		{/if}
	{/snippet}

	{#snippet trailing()}
		{#if tags.length > 0 || assigned || trailingItems || hasChildren}
			<div class={cn('flex shrink-0 items-center gap-1', isGrid ? 'absolute top-1 right-1' : '')}>
				{#if !isGrid}
					{#each tags as tagItem}
						<Tag>
							{#if typeof tagItem === 'string'}{tagItem}{:else}
								<div class="flex items-center gap-1">
									{#if tagItem.icon}<Icon name={tagItem.icon} class="h-3 w-3" />{/if}
									{tagItem.label}
								</div>
							{/if}
						</Tag>
					{/each}
				{/if}

				{#if assigned}<div class="bg-ink-90 h-1.5 w-1.5 shrink-0 rounded-full"></div>{/if}
				{#if trailingItems}{@render trailingItems()}{/if}

				{#if hasChildren && !isGrid}
					<button
						type="button"
						tabindex="-1"
						onmouseenter={onSquish}
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							onToggle?.(!isOpen);
						}}
						ondblclick={(e) => e.stopPropagation()}
						class={cn('text-ink-60 hover:text-ink-80 -ml-2xs flex-center hit-area-expand transition-transform duration-200', !isOpen ? 'rotate-90' : '')}>
						<Icon name="arrow-down" />
					</button>
				{/if}
			</div>
		{/if}
	{/snippet}
</Button>
