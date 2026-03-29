<script lang="ts">
	import { afterNavigate } from '$app/navigation';
	import Sidebar from '$lib/components/layout/sidebar/Sidebar.svelte';
	import ContentHeader from '$lib/components/layout/content/ContentHeader.svelte';
	import ContextMenu from '$lib/components/layout/ContextMenu.svelte';
	import { closeContextMenu, openContextMenu } from '$lib/state/contextMenu.svelte';

	let { children } = $props();

	// Create a reference to our scrollable container
	let scrollContainer: HTMLElement;

	// Reset scroll position of the specific container on navigation
	afterNavigate(({ to }) => {
		// Ignore hash routing so anchor links still work
		if (to?.url.hash) return;

		if (scrollContainer) {
			scrollContainer.scrollTo({ top: 0, behavior: 'instant' });
		}
	});
</script>

<div data-uiname="app-grid" class="app-grid bg-level-1 h-screen overflow-hidden">
	<div class="relative z-2 flex h-full min-h-0 flex-col">
		<Sidebar />
	</div>

	<main data-uiname="main-area" class="main-area pr-m relative z-1 flex h-full min-h-0 flex-col">
		<ContentHeader />

		<section bind:this={scrollContainer} data-uiname="content-window" class="bg-level-2 border-border rounded-t-l relative z-0 min-h-0 flex-1 overflow-y-auto border-x border-t">
			{@render children()}
		</section>
	</main>
</div>

<svelte:window onmousedown={closeContextMenu} onscroll={closeContextMenu} onresize={closeContextMenu} oncontextmenu={(e) => openContextMenu(e, 'general')} />

<ContextMenu />
