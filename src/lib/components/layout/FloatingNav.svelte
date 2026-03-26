<script lang="ts">
	import { cn } from '$lib/utils';
	import Button from '$lib/components/ui/Button.svelte';

	export interface NavItem {
		label: string;
		href?: string;
		active?: boolean;
		level?: 1 | 2 | 3;
		onclick?: () => void;
	}

	export interface NavSection {
		title?: string;
		items: NavItem[];
	}

	let { sections = [], class: className = '' }: { sections: NavSection[]; class?: string } = $props();

	// 1. Local state for instant visual feedback
	let optimisticHref = $state<string | null>(null);

	// 2. Find the *actual* active href provided by the parent layout
	let externalActiveHref = $derived(sections.flatMap((s) => s.items).find((i) => i.active)?.href || null);

	// 3. Keep local state in sync with the real router (handles initial load & back/forward navigation)
	$effect(() => {
		if (externalActiveHref !== null) {
			optimisticHref = externalActiveHref;
		}
	});
</script>

<nav class={cn('hover:gap-xl group rounded-m hover:border-border hover:bg-level-1 p-m py-xl flex w-max flex-col border border-transparent bg-transparent', className)}>
	{#each sections as section}
		<div class="group-hover:gap-s mb-m flex flex-col gap-0 last:mb-0">
			{#if section.title}
				<div class="group-hover:mb-2xs grid grid-cols-[0fr] grid-rows-[0fr] group-hover:grid-cols-[1fr] group-hover:grid-rows-[1fr]">
					<div class="overflow-hidden">
						<div class="text-ink-70 font-label-xs px-2xs -translate-x-2 font-bold whitespace-nowrap opacity-0 group-hover:translate-x-0 group-hover:opacity-100">
							{section.title}
						</div>
					</div>
				</div>
			{/if}

			{#each section.items as item}
				{@const isActive = item.href ? optimisticHref === item.href : item.active}

				<Button
					variant="unstyled"
					href={item.href}
					onclick={() => {
						// Instantly update local state on click before routing happens
						if (item.href) optimisticHref = item.href;
						item.onclick?.();
					}}
					active={isActive}
					class="-mb-2xs flex w-full items-center justify-start px-1 text-left group-hover:mb-0">
					<div
						class={cn(
							'h-0.5 shrink-0 rounded-full',
							item.level === 3 ? 'w-1.5' : item.level === 2 ? 'w-2.5' : 'w-4',
							isActive ? 'bg-ink-90' : 'bg-ink-40 group-hover:bg-ink-50',
							'group-hover:w-0 group-hover:opacity-0'
						)}>
					</div>

					<div class="grid grid-cols-[0fr] group-hover:grid-cols-[1fr]">
						<div class="overflow-hidden opacity-0 group-hover:opacity-100">
							<span class={cn('block -translate-x-2 text-left whitespace-nowrap group-hover:translate-x-0', isActive ? 'text-ink-90 font-bold' : 'text-ink-50 hover:text-ink-90')}>
								{item.label}
							</span>
						</div>
					</div>
				</Button>
			{/each}
		</div>
	{/each}
</nav>
