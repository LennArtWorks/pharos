<script lang="ts">
	import { getFileConfig, type FSRNode } from '$lib/config/filesystem';
	import type { Component } from 'svelte';

	// Import the actual Svelte components
	import ContentTypeFolder from './filetypes/ContentTypeFolder.svelte';
	import ContentTypeWorkspace from './filetypes/ContentTypeWorkspace.svelte';
	import ContentTypeDocument from './filetypes/ContentTypeDocument.svelte';
	import ContentTypePreview from './filetypes/ContentTypePreview.svelte';
	import ContentTypeTasks from './filetypes/ContentTypeTasks.svelte';
	import ContentTypeNotSupported from './filetypes/ContentTypeNotSupported.svelte';

	let { node }: { node: FSRNode | null } = $props();
	type FSRComponent = Component<{ node: FSRNode }>;

	// This is the "Bridge" between your config strings and the actual code
	const componentRegistry = {
		ContentTypeFolder,
		ContentTypeWorkspace,
		ContentTypeDocument,
		ContentTypePreview,
		ContentTypeTasks,
		ContentTypeNotSupported
	};

	let ActiveComponent = $derived(() => {
		if (!node) return null;
		const config = getFileConfig(node.extension);

		// Look up the component, fallback to NotSupported if the string doesn't match
		return (componentRegistry[config.component] || ContentTypeNotSupported) as FSRComponent;
	});
</script>

<div class="flex-1 overflow-y-auto">
	{#if !node}{:else}
		{#key node.id}
			{@const Component = ActiveComponent()}
			<Component {node} />
		{/key}
	{/if}
</div>
