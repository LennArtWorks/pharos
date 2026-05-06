<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import * as Popover from '$lib/components/ui/TriggerPopover';

	import FileTree from './FileTree.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import SidebarProfile from './SidebarProfile.svelte';
	import { page } from '$app/state';
	import { session } from '$lib/state/session.svelte';
	import { VIEW_CONFIG, type UIFileIconType } from '$lib/config/filesystem';
	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';
	import TreeNodeItem from '$lib/components/blocks/NodeItem/TreeNodeItem.svelte';

	/* *** Sidebar Resizing *** */
	let isResizing = $state(false);

	function startResizing(event: PointerEvent) {
		isResizing = true;
		(event.target as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handleResize(event: PointerEvent) {
		if (!isResizing) return;
		const newWidth = `${event.clientX}px`;
		document.documentElement.style.setProperty('--width-sidebar', newWidth);
	}

	function stopResizing() {
		isResizing = false;
	}
	function resetWidth() {
		document.documentElement.style.setProperty('--width-sidebar', 'var(--width-sidebar-default)');
	}

	/* *** Views & Routing *** */
	const views = Object.entries(VIEW_CONFIG) as [UIFileIconType, (typeof VIEW_CONFIG)[keyof typeof VIEW_CONFIG]][];

	// NEW: Track active path for highlighting Views
	let activePath = $derived(page.url.pathname);

	// Simple toggle states for the sections
	let pinnedOpen = $state(true);
	let viewsOpen = $state(true);
</script>

<aside class="bg-level-1 px-s gap-2xs relative flex h-full max-h-full min-h-0 flex-col" onpointermove={handleResize} onpointerup={stopResizing} onpointerleave={stopResizing}>
	<button
		data-uiname="sidebar-resizer"
		aria-label="click and drag to resize, double click for original size"
		onpointerdown={startResizing}
		ondblclick={resetWidth}
		class="hover:bg-accent-500/20 absolute top-0 -right-1 z-50 h-full w-2 cursor-col-resize {isResizing ? 'bg-accent-500/40' : ''}">
	</button>

	<section data-uiname="top-part" class="h-main-l relative flex items-center justify-between">
		<p class="font-label-m">Organisation</p>
		<div class="gap-2xs flex">
			<Popover.Root closeOnClick>
				<Popover.Trigger>
					<Button variant="tertiary" size="s" iconOnly><Icon name="dots" /></Button>
				</Popover.Trigger>
				<Popover.Content class="w-48" side="bottom" align="center" alignToQuery="[data-uiname='top-part']">
					<Button size="s" variant="tertiary" href="/" class="w-full justify-start">
						<Icon name="web" />
						<span>Open Public Page</span>
					</Button>
					<Button size="s" variant="tertiary" href="?overlay=settings-org" class="w-full justify-start">
						<Icon name="settings" />
						<span>Settings</span>
					</Button>
				</Popover.Content>
			</Popover.Root>
			<Button variant="tertiary" size="s" iconOnly><Icon name="sidebar-close" /></Button>
		</div>
	</section>

	<section
		data-uiname="center-part"
		class="scrollbar-minimal py-l min-h-0 flex-1 overflow-x-hidden overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]">
		<div class="gap-s flex flex-col">
			<TreeNodeItem isOpen={pinnedOpen} hasChildren={true} isWorkspace={true}>
				{#snippet content(triggerAnimation)}
					<NodeItem name="Pinned" isWorkspace variant="unstyled" onSquish={triggerAnimation} hasChildren isOpen={pinnedOpen} onToggle={(state) => (pinnedOpen = state)} />
				{/snippet}
				{#snippet children()}
					<div class="gap-sidebar-files flex flex-col">
						<NodeItem filetype="document" name="Document Title" />
					</div>
				{/snippet}
			</TreeNodeItem>

			<Divider />

			<TreeNodeItem isOpen={viewsOpen} hasChildren={true} isWorkspace={true}>
				{#snippet content(triggerAnimation)}
					<NodeItem name="Views" isWorkspace variant="unstyled" hasChildren onSquish={triggerAnimation} isOpen={viewsOpen} onToggle={(state) => (viewsOpen = state)} />
				{/snippet}
				{#snippet children()}
					<div class="gap-sidebar-files flex flex-col">
						{#each views as [id, view]}
							{#if view.active}
								<NodeItem filetype={id} name={view.label} href={view.path} active={activePath === view.path} tags={[{ label: 'new', icon: 'circled-alert' }]} />
							{/if}
						{/each}
					</div>
				{/snippet}
			</TreeNodeItem>

			<Divider />

			<FileTree />
		</div>
	</section>

	<SidebarProfile user={session.user} />
</aside>
