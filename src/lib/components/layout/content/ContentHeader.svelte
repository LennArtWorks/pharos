<script lang="ts">
	// IMPORT GOTO TO FIX POPOVER RELOADS
	import { goto } from '$app/navigation';

	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import * as Popover from '$lib/components/ui/TriggerPopover';

	import { appNav } from '$lib/state/navigation/navigation.svelte';
	import { cn } from '$lib/utils';

	import { page } from '$app/state';
	import { fsState } from '$lib/state/navigation/filesystem.svelte';
	import { VIEW_CONFIG } from '$lib/config/filesystem';
	import { openContextMenu } from '$lib/state/layout/contextMenu.svelte';
	import { getFileContextMenuItems } from '$lib/components/layout/ContextMenu/menus/fileMenu';

	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';

	let isBackMenuOpen = $state(false);
	let isForwardMenuOpen = $state(false);

	let backPressTime = 0;
	let forwardPressTime = 0;
	let backTimer: ReturnType<typeof setTimeout> | null = null;
	let forwardTimer: ReturnType<typeof setTimeout> | null = null;
	let isLongPress = $state(false);

	function handleBackDown() {
		isLongPress = false;
		backPressTime = Date.now();
		backTimer = setTimeout(() => {
			isLongPress = true;
			isBackMenuOpen = true;
		}, 400);
	}
	function handleBackUp(e: Event) {
		if (backTimer) clearTimeout(backTimer);
		if (!isLongPress && Date.now() - backPressTime < 400) appNav.goBack();
	}
	function handleForwardDown() {
		isLongPress = false;
		forwardPressTime = Date.now();
		forwardTimer = setTimeout(() => {
			isLongPress = true;
			isForwardMenuOpen = true;
		}, 400);
	}
	function handleForwardUp(e: Event) {
		if (forwardTimer) clearTimeout(forwardTimer);
		if (!isLongPress && Date.now() - forwardPressTime < 400) appNav.goForward();
	}
	function cancelTimers() {
		if (backTimer) clearTimeout(backTimer);
		if (forwardTimer) clearTimeout(forwardTimer);
	}

	let dragHoverDirection: 'back' | 'forward' | null = $state(null);
	let dragHoverTimer: ReturnType<typeof setTimeout> | null = null;

	function handleDragEnter(e: DragEvent, direction: 'back' | 'forward') {
		if (!e.dataTransfer?.types.includes('application/fsr-node-id')) return;
		appNav.isDraggingFile = true;
		if (direction === 'back' && !appNav.canGoBackDuringDrag) return;
		if (direction === 'forward' && !appNav.canGoForwardDuringDrag) return;
		dragHoverDirection = direction;
		dragHoverTimer = setTimeout(() => {
			if (direction === 'back') appNav.goBack();
			if (direction === 'forward') appNav.goForward();
			dragHoverDirection = null;
		}, 1000);
	}
	function handleDragLeave() {
		dragHoverDirection = null;
		if (dragHoverTimer) clearTimeout(dragHoverTimer);
	}
	function handleDragEnd() {
		appNav.isDraggingFile = false;
		dragHoverDirection = null;
		if (dragHoverTimer) clearTimeout(dragHoverTimer);
	}

	let nodeId = $derived(page.params.id);
	let lineage = $derived(nodeId ? fsState.getLineage(nodeId) : []);
	let siblings = $derived(nodeId ? fsState.getSiblings(nodeId) : []);
	let staticView = $derived(Object.values(VIEW_CONFIG).find((v) => v.path === page.url.pathname));

	let isSiblingMenuOpen = $state(false);
</script>

{#snippet historyList()}
	<div class="text-ink-50 bg-level-1 sticky top-0 z-10 p-2 text-xs font-semibold">Full History</div>
	<div class="scrollbar-minimal flex max-h-64 flex-col overflow-y-auto p-1">
		{#each appNav.history.slice().reverse() as historyItem, reversedIndex}
			{@const realIndex = appNav.history.length - 1 - reversedIndex}
			<Button
				variant="tertiary"
				size="s"
				active={realIndex === appNav.currentIndex ? true : false}
				class={cn('w-full shrink-0 justify-start')}
				onclick={(e: any) => {
					e.stopPropagation();
					appNav.jumpToHistoryIndex(realIndex);
					isBackMenuOpen = false;
					isForwardMenuOpen = false;
				}}>
				{#snippet leading()}<Icon name={historyItem.icon || 'file'} class={realIndex === appNav.currentIndex ? 'text-ink-90' : ''} />{/snippet}
				{#snippet label()}<span class={cn('w-full truncate text-left', realIndex === appNav.currentIndex ? 'text-ink-90 font-bold' : '')}>{historyItem.name}</span>{/snippet}
			</Button>
		{/each}
	</div>
{/snippet}

<svelte:window ondragend={handleDragEnd} />

<header class="bg-level-1 px-l gap-2xl h-main-l flex items-center">
	<div data-uiname="between-file-navigation" class="gap-m flex h-full items-center">
		<div data-uiname="backforth-arrows" class="gap-2xs relative flex">
			<Popover.Root bind:isOpen={isBackMenuOpen} closeOnClick>
				<Popover.Trigger>
					<Button
						variant="tertiary"
						size="s"
						iconOnly
						disabled={!appNav.canGoBack || (appNav.isDraggingFile && !appNav.canGoBackDuringDrag)}
						onpointerdown={handleBackDown}
						onpointerup={handleBackUp}
						onpointerleave={cancelTimers}
						onclick={(e: any) => e.stopPropagation()}
						ondragenter={(e: DragEvent) => handleDragEnter(e, 'back')}
						ondragleave={handleDragLeave}
						ondragover={(e: any) => e.preventDefault()}
						class={cn(dragHoverDirection === 'back' ? 'animate-bounce-horizontal bg-accent-500/20' : '')}
						data-tooltip="Back (Long press for history)"><Icon name="arrow-left" /></Button>
				</Popover.Trigger>
				<Popover.Content class="w-64 p-0!" side="bottom" align="start">{@render historyList()}</Popover.Content>
			</Popover.Root>

			<Popover.Root bind:isOpen={isForwardMenuOpen} closeOnClick>
				<Popover.Trigger>
					<Button
						variant="tertiary"
						size="s"
						iconOnly
						disabled={!appNav.canGoForward || (appNav.isDraggingFile && !appNav.canGoForwardDuringDrag)}
						onpointerdown={handleForwardDown}
						onpointerup={handleForwardUp}
						onpointerleave={cancelTimers}
						onclick={(e: any) => e.stopPropagation()}
						ondragenter={(e: DragEvent) => handleDragEnter(e, 'forward')}
						ondragleave={handleDragLeave}
						ondragover={(e: any) => e.preventDefault()}
						class={cn(dragHoverDirection === 'forward' ? 'animate-bounce-horizontal bg-accent-500/20' : '')}
						data-tooltip="Forward (Long press for history)"><Icon name="arrow-right" /></Button>
				</Popover.Trigger>
				<Popover.Content class="w-64 p-0!" side="bottom" align="start">{@render historyList()}</Popover.Content>
			</Popover.Root>
		</div>

		<div data-uiname="opened-bookmarks" class="gap-2xs flex h-full items-center">
			{#if appNav.bookmarks.length > 0}
				<div class="border-border mr-2xs h-5 w-1 border-l"></div>
				{#each appNav.bookmarks as bookmark (bookmark.id)}
					<div
						class="group relative"
						onauxclick={(e) => {
							if (e.button === 1) {
								// Middle click
								e.preventDefault();
								appNav.closeBookmark(bookmark.id);
							}
						}}>
						<NodeItem
							filetype={bookmark.type}
							icon={bookmark.icon as FigmaIconName}
							iconHidden={!bookmark.icon && bookmark.type === 'workspace'}
							isWorkspace={bookmark.type === 'workspace'}
							variant="tertiary"
							active={appNav.activeBookmarkId === bookmark.id}
							minimized
							href={bookmark.path}
							data-tooltip={bookmark.name}
							name={bookmark.name} />
						<button
							onclick={(e) => {
								e.preventDefault();
								e.stopPropagation();
								appNav.closeBookmark(bookmark.id);
							}}
							class="bg-level-1 border-border absolute -top-1 -right-1 rounded-full border p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
							aria-label="Close Bookmark"><Icon name="x" class="text-ink-60 hover:text-ink-90 h-3 w-3" /></button>
					</div>
				{/each}
			{/if}
			<button
				onclick={() => appNav.bookmarkCurrentPage()}
				class="rounded-m hover:border-border flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-transparent transition-all hover:border-dashed"
				data-tooltip="Add current page to bookmarks"><Icon name="add" class="text-ink-40 hover:text-ink-90 h-4 w-4 transition-colors" /></button>
		</div>
	</div>

	<div data-uiname="directory-navigation" class="gap-3xs mr-auto flex min-w-0 items-center">
		{#if lineage.length > 0}
			{#each lineage as ancestor, i}
				{#if i > 0}<span class="font-label-s text-ink-50 shrink-0 font-semibold">/</span>{/if}

				<div
					class="contents"
					oncontextmenu={(e) => {
						e.preventDefault();
						openContextMenu(e, ancestor.type === 'workspace' ? 'workspace' : 'file', ancestor, getFileContextMenuItems(ancestor));
					}}>
					{#if i === lineage.length - 1}
						<Popover.Root bind:isOpen={isSiblingMenuOpen} closeOnClick>
							<Popover.Trigger>
								<NodeItem
									filetype={ancestor.uiFileType}
									name={ancestor.name}
									maxWidth={true}
									isWorkspace={ancestor.type === 'workspace'}
									variant="tertiary"
									class="w-fit shrink-0"
									isEditing={fsState.editingId === ancestor.id}
									onsave={(newName) => fsState.renameNode(ancestor.id, newName)}
									oncancel={() => (fsState.editingId = null)}
									ondblclick={(e: { stopPropagation: () => void }) => {
										e.stopPropagation();
										fsState.editingId = ancestor.id;
										isSiblingMenuOpen = false;
									}} />
							</Popover.Trigger>
							<Popover.Content class="w-64 p-0!" side="bottom" align="start">
								<div class="text-ink-50 bg-level-1 sticky top-0 z-10 p-2 text-xs font-semibold">In this Directory</div>
								<div class="scrollbar-minimal flex max-h-64 flex-col gap-1 overflow-y-auto p-1">
									{#each siblings as sibling}
										<NodeItem
											filetype={sibling.uiFileType}
											name={sibling.name}
											active={sibling.id === ancestor.id}
											tags={sibling.tags || []}
											assigned={sibling.customFields?.assigned}
											isWorkspace={sibling.type === 'workspace'}
											variant="tertiary"
											tagName="button"
											onclick={() => {
												goto(`/files/${sibling.id}`);
												isSiblingMenuOpen = false;
											}}
											class="w-full shrink-0" />
									{/each}
								</div>
							</Popover.Content>
						</Popover.Root>
					{:else}
						<NodeItem
							filetype={ancestor.uiFileType}
							name={ancestor.name}
							class="text-ink-50 hover:text-ink-90 w-fit shrink-0 transition-colors"
							isWorkspace={ancestor.type === 'workspace'}
							variant="tertiary"
							href={`/files/${ancestor.id}`} />
					{/if}
				</div>
			{/each}
		{:else if staticView}
			<NodeItem filetype="folder" name="Organisation" class="text-ink-50 w-fit shrink-0" iconHidden variant="tertiary" />
			<span class="font-label-s text-ink-50 shrink-0 font-semibold">/</span>
			<NodeItem icon={staticView.icon as FigmaIconName} name={staticView.label} active class="w-fit shrink-0" variant="tertiary" />
		{/if}
	</div>

	<Button variant="tertiary" size="s" iconOnly><Icon name="dots" /></Button>
</header>
