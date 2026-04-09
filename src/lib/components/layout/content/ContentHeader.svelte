<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import File from '$lib/components/blocks/File.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import * as Popover from '$lib/components/ui/Popover';

	import { appNav } from '$lib/state/navigation/navigation.svelte';
	import { cn } from '$lib/utils';

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
		}, 400); // 400ms is the sweet spot for native app feel
	}

	function handleBackUp(e: Event) {
		if (backTimer) clearTimeout(backTimer);
		if (!isLongPress && Date.now() - backPressTime < 400) {
			appNav.goBack();
		}
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
		if (!isLongPress && Date.now() - forwardPressTime < 400) {
			appNav.goForward();
		}
	}

	function cancelTimers() {
		if (backTimer) clearTimeout(backTimer);
		if (forwardTimer) clearTimeout(forwardTimer);
	}

	// --- DRAG STATE REMAINS IDENTICAL ---
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
</script>

{#snippet historyList()}
	<div class="text-ink-50 bg-level-1 sticky top-0 z-10 p-2 text-xs font-semibold">Full History</div>
	<div class="scrollbar-minimal flex max-h-64 flex-col overflow-y-auto p-1">
		{#each appNav.history.slice().reverse() as historyItem, reversedIndex}
			{@const realIndex = appNav.history.length - 1 - reversedIndex}
			<Button
				variant="tertiary"
				size="s"
				class={cn('w-full shrink-0 justify-start', realIndex === appNav.currentIndex ? 'bg-level-1-hover' : '')}
				onclick={(e: any) => {
					e.stopPropagation();
					appNav.jumpToHistoryIndex(realIndex);
					isBackMenuOpen = false;
					isForwardMenuOpen = false;
				}}>
				{#snippet leading()}
					<Icon name={historyItem.icon || 'file'} class={realIndex === appNav.currentIndex ? 'text-accent-500' : ''} />
				{/snippet}
				{#snippet label()}
					<span class={cn('w-full truncate text-left', realIndex === appNav.currentIndex ? 'text-accent-500 font-bold' : '')}>
						{historyItem.name}
					</span>
				{/snippet}
			</Button>
		{/each}
	</div>
{/snippet}

<svelte:window ondragend={handleDragEnd} />

<header class="bg-level-1 px-l gap-2xl h-main-l flex items-center shadow-sm">
	<div data-uiname="between-file-navigation" class="gap-m flex h-full items-center">
		<div data-uiname="backforth-arrows" class="gap-2xs relative flex">
			<Popover.Root bind:isOpen={isBackMenuOpen} closeOnClick>
				<Popover.Trigger>
					<!-- By catching onclick and stopping it, the Popover.Trigger doesn't auto-fire -->
					<Button
						variant="tertiary"
						size="s"
						icon
						disabled={!appNav.canGoBack || (appNav.isDraggingFile && !appNav.canGoBackDuringDrag)}
						onpointerdown={handleBackDown}
						onpointerup={handleBackUp}
						onpointerleave={cancelTimers}
						onclick={(e: any) => e.stopPropagation()}
						ondragenter={(e: DragEvent) => handleDragEnter(e, 'back')}
						ondragleave={handleDragLeave}
						ondragover={(e: any) => e.preventDefault()}
						class={cn(dragHoverDirection === 'back' ? 'animate-bounce-horizontal bg-accent-500/20' : '')}
						data-tooltip="Back (Long press for history)">
						<Icon name="arrow-left" />
					</Button>
				</Popover.Trigger>
				<Popover.Content class="w-64 p-0!" side="bottom" align="start">
					{@render historyList()}
				</Popover.Content>
			</Popover.Root>

			<Popover.Root bind:isOpen={isForwardMenuOpen} closeOnClick>
				<Popover.Trigger>
					<Button
						variant="tertiary"
						size="s"
						icon
						disabled={!appNav.canGoForward || (appNav.isDraggingFile && !appNav.canGoForwardDuringDrag)}
						onpointerdown={handleForwardDown}
						onpointerup={handleForwardUp}
						onpointerleave={cancelTimers}
						onclick={(e: any) => e.stopPropagation()}
						ondragenter={(e: DragEvent) => handleDragEnter(e, 'forward')}
						ondragleave={handleDragLeave}
						ondragover={(e: any) => e.preventDefault()}
						class={cn(dragHoverDirection === 'forward' ? 'animate-bounce-horizontal bg-accent-500/20' : '')}
						data-tooltip="Forward (Long press for history)">
						<Icon name="arrow-right" />
					</Button>
				</Popover.Trigger>
				<Popover.Content class="w-64 p-0!" side="bottom" align="start">
					{@render historyList()}
				</Popover.Content>
			</Popover.Root>
		</div>

		<!-- BOOKMARKS ROW -->
		<div data-uiname="opened-bookmarks" class="gap-2xs flex h-full items-center">
			{#if appNav.bookmarks.length > 0}
				<div class="border-border mr-2xs h-5 w-1 border-l"></div>

				{#each appNav.bookmarks as bookmark (bookmark.id)}
					<div class="group relative">
						<File filetype={bookmark.type} customIcon={bookmark.icon} active={appNav.activeBookmarkId === bookmark.id} minimized href={bookmark.path} data-tooltip={bookmark.name}>
							{bookmark.name}
						</File>
						<button
							onclick={(e) => {
								e.preventDefault();
								appNav.closeBookmark(bookmark.id);
							}}
							class="bg-level-1 border-border absolute -top-1 -right-1 rounded-full border p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
							aria-label="Close Bookmark">
							<Icon name="x" class="text-ink-60 hover:text-ink-90 h-3 w-3" />
						</button>
					</div>
				{/each}
			{/if}

			<button
				onclick={() => appNav.bookmarkCurrentPage()}
				class="rounded-m hover:border-border flex h-8 w-8 cursor-pointer items-center justify-center border-2 border-transparent transition-all hover:border-dashed"
				data-tooltip="Add current page to bookmarks">
				<Icon name="add" class="text-ink-40 hover:text-ink-90 h-4 w-4 transition-colors" />
			</button>
		</div>
	</div>

	<div data-uiname="directory-navigation" class="gap-3xs mr-auto flex items-center">
		<File filetype="folder" class="text-ink-50" iconHidden>Workspace 1</File>
		<span class="font-label-s text-ink-50 font-semibold">/</span>
		<File filetype="document">Document</File>
	</div>

	<Button variant="tertiary" size="s" icon><Icon name="dots" /></Button>
</header>
