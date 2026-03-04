<script lang="ts">
	import Sidebar from '$lib/components/layout/sidebar/Sidebar.svelte';
	import ContentHeader from '$lib/components/layout/content/ContentHeader.svelte';
	// import Button from '$lib/components/ui/Button.svelte';
	let { children } = $props();
</script>

<div data-uiname="app-grid" class="app-grid bg-level-1">
	<Sidebar />

	<main data-uiname="main-area" class="main-area pr-m">
		<ContentHeader />

		<section data-uiname="content-window" class="bg-level-2 border-border rounded-tl-l rounded-tr-l overflow-y-auto border-t border-r border-l">
			{@render children()}
		</section>
	</main>
</div>
