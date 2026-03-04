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
		onEdit?: (e: MouseEvent) => void;
		class?: string;
	};

	let { children, title, icon, iconHidden = false, hideAddButton = false, onAdd, onEdit, class: className = '' }: Props = $props();

	let isExpanded = $state(true);
	let triggerSquish = $state(false);

	function handleSquish() {
		triggerSquish = true;
		setTimeout(() => (triggerSquish = false), 300);
	}

	const handleAction = (e: MouseEvent, callback?: (e: MouseEvent) => void) => {
		e.stopPropagation();
		callback?.(e);
	};
</script>

<section class={cn('gap-2xs sidebar-section flex flex-col', className)}>
	<header class="group h-main-xs px-2xs mb-2xs flex items-center justify-between">
		<button
			onclick={() => (isExpanded = !isExpanded)}
			aria-expanded={isExpanded}
			class="gap-xs text-ink-60 hover:text-ink-90 hit-area-expand flex min-w-0 flex-1 items-center text-left transition-colors">
			{#if icon && !iconHidden}
				<Icon name={icon} stroke="3" class="h-main-2xs shrink-0" />
			{/if}
			<span class="font-label-xs block min-w-0 flex-1 truncate font-bold select-none">
				{title}
			</span>
		</button>

		<div data-uiname="icons" class="gap-3xs pl-xs flex shrink-0 items-center">
			<div
				class="gap-3xs invisible flex w-0 items-center
                  opacity-0 transition-all duration-150 group-hover:visible group-hover:w-auto group-hover:opacity-100">
				<button onclick={(e) => handleAction(e, onEdit)} aria-label="Edit" class="text-ink-60 hover:text-ink-80 hit-area-expand transition-colors">
					<Icon name="pencil" class="h-main-2xs" stroke="3" />
				</button>
				{#if !hideAddButton}
					<button onclick={(e) => handleAction(e, onAdd)} aria-label="Add" class="text-ink-60 hover:text-ink-80 hit-area-expand transition-colors">
						<Icon name="add" class="h-main-2xs" stroke="3" />
					</button>
				{/if}
			</div>

			<button
				onclick={() => (isExpanded = !isExpanded)}
				onmouseenter={handleSquish}
				aria-label={isExpanded ? 'Collapse' : 'Expand'}
				class={cn('text-ink-60 hover:text-ink-80 flex-center hit-area-expand transition-transform duration-200', !isExpanded ? 'rotate-90' : '')}>
				<Icon name="arrow-down" class="h-main-2xs" stroke="3" />
			</button>
		</div>
	</header>

	{#if isExpanded}
		<div transition:slide={{ duration: 150, easing: snappyBezier }} class={cn('gap-sidebar-files flex origin-top flex-col overflow-hidden', triggerSquish && 'animate-squish')}>
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

	/* This prevents the 'pop' of space. 
     The icons container will transition its width and opacity simultaneously.
  */
	[data-uiname='icons'] > div {
		overflow: hidden;
		white-space: nowrap;
	}
</style>
