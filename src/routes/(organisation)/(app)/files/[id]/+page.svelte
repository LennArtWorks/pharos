<script lang="ts">
	import { page } from '$app/state';
	import type { FSRNode } from '$lib/config/filesystem';
	import ContentRoot from '$lib/components/layout/content/ContentRoot.svelte';
	import { appNav } from '$lib/state/navigation/navigation.svelte';

	// Import the configs to resolve the icon
	import { FILE_TYPE_CONFIG, VIEW_CONFIG } from '$lib/config/filesystem';
	import type { FigmaIconName } from '$lib/components/ui/Icon.svelte';

	let nodeId = $derived(page.params.id);

	let node = $state<FSRNode | null>(null);
	let isLoading = $state(true);

	$effect(() => {
		if (nodeId) {
			loadFile(nodeId);
		}
	});

	async function loadFile(id: string) {
		isLoading = true;
		try {
			const res = await fetch('/api/filesystem');
			if (res.ok) {
				const tree: FSRNode[] = await res.json();

				function findNode(nodes: FSRNode[], targetId: string): FSRNode | null {
					for (const n of nodes) {
						if (n.id === targetId) return n;
						if (n.children) {
							const found = findNode(n.children, targetId);
							if (found) return found;
						}
					}
					return null;
				}

				node = findNode(tree, id);

				if (node) {
					// --- RESOLVE THE EXACT ICON FROM CONFIG ---
					const fileType = node.uiFileType;
					const resolvedIcon =
						VIEW_CONFIG[fileType as keyof typeof VIEW_CONFIG]?.icon ||
						FILE_TYPE_CONFIG.internal[fileType as keyof typeof FILE_TYPE_CONFIG.internal]?.icon ||
						FILE_TYPE_CONFIG.external[fileType as keyof typeof FILE_TYPE_CONFIG.external]?.icon ||
						'file';

					appNav.registerVisit({
						id: node.id,
						path: `/files/${node.id}`,
						type: node.uiFileType,
						name: node.name,
						icon: resolvedIcon as FigmaIconName // Use the safely resolved icon
					});
				}
			}
		} catch (e) {
			console.error('Failed to load file', e);
		} finally {
			isLoading = false;
		}
	}
</script>

{#if isLoading}
	<div class="bg-surface-0 flex flex-1 animate-pulse items-center justify-center">
		<div class="border-brand h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
	</div>
{:else}
	<ContentRoot {node} />
{/if}
