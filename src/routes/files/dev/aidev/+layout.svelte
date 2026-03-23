<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import SidebarSection from '$lib/components/layout/sidebar/SidebarSection.svelte';
	import DraggableTree from './DraggableTree.svelte';

	let { data, children } = $props();

	let isResizing = $state(false);

	function handleResize(event: PointerEvent) {
		if (!isResizing) return;
		const newWidth = `${event.clientX}px`;
		document.documentElement.style.setProperty('--width-sidebar', newWidth);
	}

	function stopResizing() {
		isResizing = false;
	}
</script>

<div class="-mt-main-l z-1 flex min-h-screen items-start">
	<aside class="pt-main-m bg-level-2 px-l gap-2xs sticky top-0 z-1 flex h-fit w-60 shrink-0 flex-col" onpointermove={handleResize} onpointerup={stopResizing} onpointerleave={stopResizing}>
		<section data-uiname="top-part" class="h-main-l gap-m flex shrink-0 items-center">
			<Button href="/files/dev" variant="tertiary" size="s" icon data-tooltip="Back to Dev Portal"><Icon name="arrow-left" /></Button>
			<div class="flex items-center gap-2">
				<Icon name="sparkles" class="text-accent-500" />
				<p class="font-label-m">AI Context Hub</p>
			</div>
		</section>

		<section data-uiname="center-part" class="scrollbar-minimal py-l min-h-0 flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]">
			<div class="gap-s flex flex-col">
				{#each data.globals as category}
					{#if category.topics && category.topics.length > 0}
						<SidebarSection title={category.name} hideAddButton>
							<DraggableTree topics={category.topics} categoryId={category.id} />
						</SidebarSection>
						<Divider />
					{/if}
				{/each}

				{#each data.tree as category}
					<SidebarSection title={category.name} hideAddButton>
						<DraggableTree topics={category.topics} categoryId={category.id} />
					</SidebarSection>
				{/each}
			</div>
		</section>

		<div class="shrink-0 p-4 pb-8">
			<Button href="/files/dev/aidev/new" variant="secondary" size="s" class="w-full justify-center"><Icon name="add" /> New Topic</Button>
		</div>
	</aside>

	<main class="bg-level-2 min-h-screen flex-1">
		{@render children()}
	</main>
</div>
