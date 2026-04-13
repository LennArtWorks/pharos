<script lang="ts">
	import { page } from '$app/state';
	import ContentRoot from '$lib/components/layout/content/ContentRoot.svelte';

	import { fsState } from '$lib/state/navigation/filesystem.svelte';
	import { appNav } from '$lib/state/navigation/navigation.svelte';
	import { FILE_TYPE_CONFIG, VIEW_CONFIG } from '$lib/config/filesystem';
	import type { FigmaIconName } from '$lib/components/ui/Icon.svelte';

	let nodeId = $derived(page.params.id);
	let node = $derived(nodeId ? fsState.getNode(nodeId) : null);

	// 1. Ensure the tree is loaded
	$effect(() => {
		if (nodeId && fsState.tree.length === 0) {
			fsState.fetchTree();
		}
	});

	// 2. Track Navigation once the node is available
	$effect(() => {
		if (node) {
			const type = node.uiFileType;
			const resolvedIcon =
				VIEW_CONFIG[type as keyof typeof VIEW_CONFIG]?.icon ||
				FILE_TYPE_CONFIG.internal[type as keyof typeof FILE_TYPE_CONFIG.internal]?.icon ||
				FILE_TYPE_CONFIG.external[type as keyof typeof FILE_TYPE_CONFIG.external]?.icon ||
				'file';

			appNav.registerVisit({
				id: node.id,
				path: `/files/${node.id}`,
				type: node.uiFileType,
				name: node.name,
				icon: resolvedIcon as FigmaIconName
			});
		}
	});
</script>

{#if !node}
	<div class="bg-surface-0 flex flex-1 animate-pulse items-center justify-center">
		<div class="border-brand h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
	</div>
{:else}
	<ContentRoot {node} />
{/if}
