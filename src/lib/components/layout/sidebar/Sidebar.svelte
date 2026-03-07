<script lang="ts">
	/**
	 * import Sidebar from '$lib/components/layout/Sidebar.svelte';
	 */

	import Button from '$lib/components/ui/Button.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import File from '$lib/components/blocks/File.svelte';

	import SidebarSection from './SidebarSection.svelte';
	import FileTree from './FileTree.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

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
</script>

<aside class="bg-level-1 px-l gap-2xs relative flex h-full max-h-full min-h-0 flex-col" onpointermove={handleResize} onpointerup={stopResizing} onpointerleave={stopResizing}>
	<button
		data-uiname="sidebar-resizer"
		aria-label="click and drag to resize, double click for original size"
		onpointerdown={startResizing}
		ondblclick={resetWidth}
		class="hover:bg-purpur-500/20 absolute top-0 -right-1 z-50 h-full w-2 cursor-col-resize {isResizing ? 'bg-purpur-500/40' : ''}">
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
		<Button variant="tertiary" size="s" href="?overlay=settings-org"><Icon name="dots" /></Button>
	</section>

	<section
		data-uiname="center-part"
		class="scrollbar-minimal py-l min-h-0 flex-1 overflow-x-hidden overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]">
		<div class="gap-m flex flex-col">
			<SidebarSection title="Pinned" hideAddButton>
				<File filetype="document" class="pr-s">Documenas dasd asd asd asd as dat</File>
			</SidebarSection>

			<Divider />

			<SidebarSection title="Views" hideAddButton>
				<File filetype="recentTopics" href="/files/dev/icons" class="pr-s">Recent Topics</File>
				<File filetype="myTasks" href="../" class="pr-s">My Tasks</File>
				<File filetype="calendar" class="pr-s">Calendar</File>
				<File filetype="eMails" class="pr-s">E-Mails</File>
			</SidebarSection>

			<Divider />

			<FileTree />
		</div>
	</section>

	<section data-uiname="bottom-part" class=" border-border gap-xs py-l mt-auto flex flex-col justify-center border-t">
		<Button>Settings</Button>
	</section>
</aside>
