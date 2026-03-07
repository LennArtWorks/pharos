<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import type { FSRNode } from '$lib/config/filesystem';
	import ContentRoot from '$lib/components/layout/content/ContentRoot.svelte';

	// Reactively track the ID from the URL
	let nodeId = $derived($page.params.id);

	let node = $state<FSRNode | null>(null);
	let isLoading = $state(true);

	// When the nodeId changes, fetch the correct file data
	$effect(() => {
		if (nodeId) {
			loadFile(nodeId);
		}
	});

	async function loadFile(id: string) {
		isLoading = true;
		try {
			// Temporarily fetching the whole tree to find our node
			const res = await fetch('/api/filesystem');
			if (res.ok) {
				const tree: FSRNode[] = await res.json();

				// Recursive helper to find a node by ID in a nested tree
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
