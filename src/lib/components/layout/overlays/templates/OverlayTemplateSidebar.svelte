<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import type { Snippet } from 'svelte';

	type SidebarGroup = {
		title?: string;
		items: { id: string; label: string }[];
	};

	let {
		onclose,
		sidebarGroups,
		activeTab = $bindable(),
		children,
		footer
	}: {
		onclose: () => void;
		sidebarGroups: SidebarGroup[];
		activeTab: string;
		children: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<div class="relative flex h-full w-full overflow-hidden">
	<button onclick={onclose} class="text-ink-50 hover:text-ink-90 absolute top-6 right-6 z-10 transition-colors outline-none">
		<Icon name="x" class="h-6 w-6" />
	</button>

	<div class="border-border bg-level-0 flex w-64 shrink-0 flex-col gap-6 overflow-y-auto border-r p-6">
		{#each sidebarGroups as group}
			<div class="flex flex-col gap-1">
				{#if group.title}
					<span class="text-label-s text-ink-90 mb-2 px-2 font-bold">{group.title}</span>
				{/if}
				{#each group.items as item}
					<Button
						variant="unstyled"
						size="s"
						class="rounded-m w-full justify-start px-2 py-1.5 {activeTab === item.id ? 'bg-level-2 text-ink-90 font-bold' : 'text-ink-50 hover:bg-level-1'}"
						onclick={() => (activeTab = item.id)}>
						{item.label}
					</Button>
				{/each}
			</div>
		{/each}
	</div>

	<div class="relative flex flex-1 flex-col overflow-hidden">
		<div class="flex-1 overflow-y-auto p-12">
			<div>
				{@render children()}
			</div>
		</div>

		{#if footer}
			<div class="border-border flex shrink-0 items-center justify-end gap-3 border-t p-6 px-12">
				{@render footer()}
			</div>
		{/if}
	</div>
</div>
