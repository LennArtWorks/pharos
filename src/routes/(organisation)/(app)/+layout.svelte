<script lang="ts">
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import Sidebar from '$lib/components/layout/sidebar/Sidebar.svelte';
	import ContextMenu from '$lib/components/layout/ContextMenu/ContextMenu.svelte';
	import { closeContextMenu, openContextMenu } from '$lib/state/layout/contextMenu.svelte';
	import ContentHeader from '$lib/components/layout/content/ContentHeader.svelte';
	import AssigneeSelector from '$lib/components/ui/AssigneeSelector.svelte';
	import { assignOverlay } from '$lib/state/layout/assign.svelte';
	import { membersState } from '$lib/state/navigation/members.svelte';

	import { appNav } from '$lib/state/navigation/navigation.svelte';
	import { VIEW_CONFIG } from '$lib/config/filesystem';
	import type { FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import { onMount } from 'svelte';

	let { children } = $props();
	let scrollContainer: HTMLElement;

	onMount(() => {
		appNav.init();
		membersState.fetch();
	});

	// 1. Optimistic Highlight
	beforeNavigate(({ to }) => {
		if (to) appNav.optimisticPath = to.url.pathname;
	});

	afterNavigate(({ from, to, type }) => {
		if (!to || to.url.hash) return;

		// IGNORING OVERLAYS: If the pathname is identical (only searchParams changed), do nothing.
		if (from && from.url.pathname === to.url.pathname) return;

		if (scrollContainer) scrollContainer.scrollTo({ top: 0, behavior: 'instant' });

		if (type === 'popstate') {
			appNav.syncWithBrowserHistory(to.url.pathname);
		}

		const path = to.url.pathname;

		// 2. TRACK STATIC VIEWS
		const viewEntry = Object.entries(VIEW_CONFIG).find(([k, v]) => v.path === path);
		if (viewEntry) {
			const [viewKey, viewData] = viewEntry;
			appNav.registerVisit({
				id: viewKey,
				path: path,
				type: viewKey, // Pass 'recentTopics' instead of 'folder'
				name: viewData.label,
				icon: (viewData.icon || 'folder') as FigmaIconName
			});
		}
	});
</script>

<div data-uiname="app-grid" class="app-grid bg-level-1 h-full overflow-hidden">
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

<svelte:window onscroll={closeContextMenu} onresize={closeContextMenu} oncontextmenu={(e) => openContextMenu(e, 'general')} />

<ContextMenu />

{#if assignOverlay.isOpen && assignOverlay.target}
	<AssigneeSelector target={assignOverlay.target} x={assignOverlay.x} y={assignOverlay.y} />
{/if}
