<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import { cn } from '$lib/utils';
	import { FILE_TYPE_CONFIG, VIEW_CONFIG, type UIFileIconType } from '$lib/config/filesystem';
	import type { Snippet } from 'svelte';

	interface Props {
		children?: Snippet;
		filetype?: UIFileIconType;
		mode?: 'default' | 'preview';
		active?: boolean;
		template?: boolean;
		loading?: boolean;
		iconHidden?: boolean;
		disabled?: boolean;
		class?: string;
		// --- New Display Modifiers ---
		hideLabel?: boolean;
		minimized?: boolean;
		// --- Edit Props ---
		isEditing?: boolean;
		editValue?: string;
		onsave?: (newName: string) => void;
		oncancel?: () => void;
		[key: string]: any;
	}

	let {
		children,
		filetype = 'document',
		mode = 'default',
		active = false,
		template = false,
		loading = false,
		iconHidden = false,
		disabled = false,
		class: className = '',
		hideLabel = false,
		minimized = false,
		isEditing = false,
		editValue = '',
		onsave,
		oncancel,
		...rest
	}: Props = $props();

	let size = $derived((mode === 'preview' ? 'l' : 's') as 'l' | 's');

	let iconName = $derived(
		(() => {
			if (loading) return 'clock';

			const config =
				VIEW_CONFIG[filetype as keyof typeof VIEW_CONFIG] ||
				FILE_TYPE_CONFIG.internal[filetype as keyof typeof FILE_TYPE_CONFIG.internal] ||
				FILE_TYPE_CONFIG.external[filetype as keyof typeof FILE_TYPE_CONFIG.external];

			return (config?.icon || 'circled-alert') as FigmaIconName;
		})()
	);

	let iconClass = $derived(loading ? 'animate-pulse opacity-50' : '');

	// Derive whether we should pass the label snippet at all
	let shouldShowLabel = $derived((!!children || isEditing) && !hideLabel);

	// ####### Edit Label Logic #######

	let inputValue = $state('');

	$effect(() => {
		if (isEditing) inputValue = editValue;
	});

	function focusInput(node: HTMLInputElement) {
		if (isEditing)
			setTimeout(() => {
				node.focus();
				// Optional: Highlight all text automatically when they double click
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

{#snippet leadingSnippet()}
	{#if !iconHidden}
		<Icon name={iconName} class={cn(iconClass, 'shrink-0')} />
	{/if}
{/snippet}

{#snippet labelSnippet()}
	{#if isEditing}
		<input
			type="text"
			bind:value={inputValue}
			use:focusInput
			onkeydown={handleKeydown}
			onblur={() => onsave?.(inputValue)}
			onclick={(e) => e.stopPropagation()}
			ondblclick={(e) => e.stopPropagation()}
			class="text-text-primary font-inherit font-label-s m-0 w-full border-none bg-transparent p-0 leading-none outline-transparent" />
	{:else if children}
		<span class={cn('gap-xs min-w-0 flex-1 truncate text-left', loading ? 'opacity-50' : '')}>
			{@render children()}
		</span>
	{/if}
{/snippet}

<Button
	variant={template ? 'template' : 'tertiary'}
	{size}
	active={active || isEditing}
	disabled={disabled || loading}
	leading={leadingSnippet}
	label={shouldShowLabel ? labelSnippet : undefined}
	class={cn(
		className,
		isEditing ? 'bg-level-1-hover ring-border ring-1' : '',
		// 1. Use transition-all to override Button's default transition-colors
		// 2. Animate exact 'w' (width) instead of 'max-w' for a smooth curve
		minimized && !isEditing ? 'w-main-s overflow-hidden whitespace-nowrap transition-all duration-300 ease-out hover:w-[10rem]' : ''
	)}
	{...rest} />
