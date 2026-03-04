<script lang="ts">
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils';
	import { slide } from 'svelte/transition';
	import Button from '../ui/Button.svelte';

	const snappyBezier = (t: number) => {
		return --t * t * ((1.7 + 1) * t + 1.7) + 1;
	};

	type Props = {
		title: string;
		children: Snippet;
		class?: string;
	};

	let { children, title, class: className = '' }: Props = $props();

	let isExpanded = $state(true);
	let triggerSquish = $state(false);

	function handleSquish() {
		triggerSquish = true;
		setTimeout(() => (triggerSquish = false), 300);
	}

	const toggleFolder = (e: MouseEvent) => {
		// If the arrow was clicked, we handle it there.
		// This main click handles the rest of the row.
		isExpanded = !isExpanded;
	};
</script>

<section class={cn('gap-sidebar-files folder flex flex-col', className)}>
	<Button variant="tertiary" size="s" class="group" onclick={toggleFolder} onmouseenter={handleSquish}>
		{#snippet leading()}
			<Icon name={isExpanded ? 'folder-open' : 'folder'} />
		{/snippet}

		{#snippet label()}
			{title}
		{/snippet}

		{#snippet trailing()}
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<div
				role="button"
				tabindex="-1"
				onclick={(e) => {
					e.stopPropagation();
					isExpanded = !isExpanded;
				}}
				class={cn('flex cursor-pointer items-center justify-center transition-all duration-200', 'text-ink-60 group-hover:text-ink-80', !isExpanded && 'rotate-90')}>
				<Icon name="arrow-down" class="h-main-2xs" stroke="3" />
			</div>
		{/snippet}
	</Button>

	{#if isExpanded}
		<div transition:slide={{ duration: 150, easing: snappyBezier }} class={cn('pl-m flex origin-top flex-col overflow-hidden', triggerSquish && 'animate-squish')}>
			<div class="pl-2xs border-border gap-sidebar-files flex origin-top flex-col border-l">
				{@render children()}
			</div>
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
</style>
