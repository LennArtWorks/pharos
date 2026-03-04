<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import { cn } from '$lib/utils';
	import { FILE_TYPE_CONFIG, type UIFileIconType } from '$lib/config/filesystem';
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
				FILE_TYPE_CONFIG.views[filetype as keyof typeof FILE_TYPE_CONFIG.views] ||
				FILE_TYPE_CONFIG.internal[filetype as keyof typeof FILE_TYPE_CONFIG.internal] ||
				FILE_TYPE_CONFIG.external[filetype as keyof typeof FILE_TYPE_CONFIG.external];
			return (config?.icon || 'circled-alert') as FigmaIconName;
		})()
	);

	let iconClass = $derived(loading ? 'animate-pulse opacity-50' : '');

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

<Button
	variant={template ? 'template' : 'tertiary'}
	{size}
	active={active || isEditing}
	disabled={disabled || loading}
	class={cn(className, isEditing ? 'bg-surface-2 ring-border ring-1' : '')}
	{...rest}>
	{#snippet leading()}
		{#if !iconHidden}
			<Icon name={iconName} class={cn(iconClass, 'shrink-0')} />
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
				class="text-text-primary font-inherit font-label-s m-0 w-full border-none bg-transparent p-0 leading-none outline-transparent" />
		{:else if children}
			<span class={cn('gap-xs min-w-0 flex-1 truncate text-left', loading ? 'opacity-50' : '')}>
				{@render children()}
			</span>
		{/if}
	{/snippet}
</Button>
