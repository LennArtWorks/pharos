<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	const snappyBezier = (t: number) => --t * t * ((1.7 + 1) * t + 1.7) + 1;

	interface Props extends HTMLAttributes<HTMLDivElement> {
		isOpen?: boolean;
		hasChildren?: boolean;
		isWorkspace?: boolean;
		dropState?: 'before' | 'after' | 'inside' | null;

		content: Snippet<[() => void]>; // Passes the triggerAnimation function down
		children?: Snippet;

		class?: string;
	}

	let { isOpen = $bindable(false), hasChildren = false, isWorkspace = false, dropState = null, content, children, class: className = '', ...rest }: Props = $props();

	let triggerSquish = $state(false);

	export function triggerAnimation() {
		triggerSquish = true;
		setTimeout(() => (triggerSquish = false), 300);
	}
</script>

<div data-is-workspace={isWorkspace} class={cn('tree-node relative flex w-full flex-col', className)} {...rest}>
	{#if dropState === 'before'}
		<div class="bg-accent-500 pointer-events-none absolute -top-1 left-0 z-10 h-1 w-full rounded-full shadow-sm"></div>
	{/if}
	{#if dropState === 'after'}
		<div class="bg-accent-500 pointer-events-none absolute -bottom-1 left-0 z-10 h-1 w-full rounded-full shadow-sm"></div>
	{/if}
	{#if dropState === 'inside'}
		<div class="ring-accent-500 bg-accent-500/10 rounded-m pointer-events-none absolute inset-0 z-10 ring-2"></div>
	{/if}

	<div class="relative w-full">
		{@render content(triggerAnimation)}
	</div>

	{#if hasChildren && isOpen && children}
		<div transition:slide={{ duration: 150, easing: snappyBezier }} class={cn('flex origin-top flex-col', triggerSquish ? 'animate-squish' : '')}>
			<div class={cn('flex flex-col', isWorkspace ? 'gap-sidebar-files' : 'border-border pl-2xs ml-m gap-sidebar-files mt-1 border-l')}>
				{@render children()}
			</div>
		</div>
	{/if}
</div>

<style>
	[data-is-workspace='true'] :global([data-is-workspace='true']) {
		padding-left: var(--spacing-m);
		margin-top: var(--spacing-2xs);
	}

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
