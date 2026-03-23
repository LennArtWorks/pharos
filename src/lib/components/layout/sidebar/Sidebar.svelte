<script lang="ts">
	/**
	 * import Sidebar from '$lib/components/layout/Sidebar.svelte';
	 */

	import Button from '$lib/components/ui/Button.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import File from '$lib/components/blocks/File.svelte';
	import * as Popover from '$lib/components/ui/Popover';

	import SidebarSection from './SidebarSection.svelte';
	import FileTree from './FileTree.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import SidebarProfile from './SidebarProfile.svelte';
	import { page } from '$app/state';
	import { VIEW_CONFIG, type UIFileIconType } from '$lib/config/filesystem';

	/* *** Sidebar Resizing *** */

	// State to track if the user is currently dragging
	let isResizing = $state(false);

	function startResizing(event: PointerEvent) {
		isResizing = true;
		// Capture the pointer to maintain tracking even if the mouse leaves the thin handle
		(event.target as HTMLElement).setPointerCapture(event.pointerId);
	}

	function handleResize(event: PointerEvent) {
		if (!isResizing) return;
		// Update the CSS variable. The grid's clamp() in app.css handles the 20rem-30rem limits.
		const newWidth = `${event.clientX}px`;
		document.documentElement.style.setProperty('--width-sidebar', newWidth);
	}

	function stopResizing() {
		isResizing = false;
	}

	function resetWidth() {
		// Reset to the middle of your clamp range (25rem) on double-click
		document.documentElement.style.setProperty('--width-sidebar', 'var(--width-sidebar-default)');
	}

	/* *** Turning Views from object to array *** */
	const views = Object.entries(VIEW_CONFIG) as [UIFileIconType, (typeof VIEW_CONFIG)[keyof typeof VIEW_CONFIG]][];
</script>

<aside class="bg-level-1 px-l gap-2xs relative flex h-full max-h-full min-h-0 flex-col" onpointermove={handleResize} onpointerup={stopResizing} onpointerleave={stopResizing}>
	<button
		data-uiname="sidebar-resizer"
		aria-label="click and drag to resize, double click for original size"
		onpointerdown={startResizing}
		ondblclick={resetWidth}
		class="hover:bg-accent-500/20 absolute top-0 -right-1 z-50 h-full w-2 cursor-col-resize {isResizing ? 'bg-accent-500/40' : ''}">
	</button>

	<!-- <Button variant="primary" onclick={() => console.log('Navigating...')}><Icon name="settings" />{t('dashboard')}</Button>

	<Button variant="secondary" href="/files/dev/icons" onclick={() => console.log('Opening Settings...')}>
		<Icon name="settings" />
		<span>{t('iconOverview')}</span>
	</Button>

	<Button variant="primary" size="l" href="../"><Icon name="arrow-left" />{t('back')}</Button>
	<Button variant="template" size="s"><Icon name="arrow-left" />Template</Button> -->

	<section data-uiname="top-part" class="h-main-l flex items-center justify-between">
		<p class="font-label-m">Organisation</p>
		<div class="gap-2xs flex">
			<!-- <Button variant="tertiary" size="s" href="?overlay=settings-org"><Icon name="dots" /></Button> -->
			<Popover.Root closeOnClick>
				<Popover.Trigger>
					<Button variant="tertiary" size="s" icon>
						{#snippet children()}
							<Icon name="dots" />
						{/snippet}
					</Button>
				</Popover.Trigger>

				<Popover.Content class="w-48">
					<Button variant="tertiary" size="s" href="/" class="w-full justify-start">
						{#snippet leading()}
							<Icon name="web" />
						{/snippet}
						{#snippet label()}
							<span class="w-full text-left">Open Public Page</span>
						{/snippet}
					</Button>

					<Button variant="tertiary" size="s" goto="?overlay=settings-org" class="w-full justify-start">
						{#snippet leading()}
							<Icon name="settings" />
						{/snippet}
						{#snippet label()}
							<span class="w-full text-left">Settings</span>
						{/snippet}
					</Button>
				</Popover.Content>
			</Popover.Root>

			<Button variant="tertiary" size="s" icon><Icon name="sidebar-close" /></Button>
		</div>
	</section>

	<section
		data-uiname="center-part"
		class="scrollbar-minimal py-l min-h-0 flex-1 overflow-x-hidden overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]">
		<div class="gap-s flex flex-col">
			<SidebarSection title="Pinned" hideAddButton>
				<File filetype="document" class="pr-s">Documenas dasd asd asd asd as dat</File>
			</SidebarSection>

			<Divider />

			<SidebarSection title="Views" hideAddButton>
				{#each views as [id, view]}
					{#if view.active == true}
						<File filetype={id} href={view.path} class="pr-2xs" tags={[{ label: 'new', icon: 'circled-alert' }]}>{view.label}</File>
					{/if}
				{/each}
			</SidebarSection>

			<Divider />

			<FileTree />
		</div>
	</section>

	<SidebarProfile user={page.data.user} />
</aside>
