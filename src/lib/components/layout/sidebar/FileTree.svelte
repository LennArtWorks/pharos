<script lang="ts">
	import { onMount } from 'svelte';
	import SidebarSection from '$lib/components/layout/sidebar/SidebarSection.svelte';
	import File from '$lib/components/blocks/File.svelte';
	import { FILE_TYPE_CONFIG, type FSRNode } from '$lib/config/filesystem';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { has } from '$lib/utils/permissions';
	import { getFileConfig } from '$lib/utils/filesystem';

	// --- File Tree Setup ---
	let tree: FSRNode[] = $state([]);
	let rootNodes = $derived(tree.filter((node) => node.parentId === null));

	onMount(async () => {
		try {
			const res = await fetch('/api/filesystem', { credentials: 'include' });
			if (!res.ok) {
				tree = [];
				return;
			}
			const data = await res.json();
			if (!Array.isArray(data)) {
				tree = [];
				return;
			}

			tree = data.sort((a: FSRNode, b: FSRNode) => {
				const typeOrder = { workspace: 0, folder: 1, file: 2 };
				const orderA = typeOrder[a.type] ?? 2;
				const orderB = typeOrder[b.type] ?? 2;
				return orderA - orderB;
			});
		} catch (err) {
			console.error('[FileTree Network Error]:', err);
			tree = [];
		}
	});

	// --- Rename Logic ---
	let editingId = $state<string | null>(null);
	let toastMessage = $state('');

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => (toastMessage = ''), 3000);
	}

	async function handleRenameSubmit(node: FSRNode, newName: string) {
		if (newName.trim() === '' || newName === node.name) {
			editingId = null;
			return;
		}

		try {
			const res = await fetch('/api/filesystem/rename', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: node.id, newName })
			});

			if (res.ok) {
				node.name = newName;
				showToast(`Saved as "${newName}"`);
			} else {
				const err = await res.json();
				alert(err.error || 'Failed to rename');
			}
		} finally {
			editingId = null;
		}
	}

	function getDisplayName(node: FSRNode) {
		const config = getFileConfig(node.extension);
		if (config.type !== 'file') return node.name;
		const isInternal = node.uiFileType in FILE_TYPE_CONFIG.internal;
		return isInternal ? node.name : node.name + node.extension;
	}
</script>

{#snippet renderNodes(nodes: FSRNode[])}
	{#each nodes as node}
		{#if node.type === 'workspace'}
			<SidebarSection title={node.name}>
				{@render renderNodes(node.children || [])}
			</SidebarSection>
		{:else if node.type === 'folder'}
			<File
				href={`/files/${node.id}`}
				filetype={node.uiFileType}
				isEditing={editingId === node.id}
				editValue={node.name}
				onsave={(newName) => handleRenameSubmit(node, newName)}
				oncancel={() => (editingId = null)}
				ondblclick={(e: MouseEvent) => {
					e.stopPropagation();
					if (has(PERMISSIONS.FILES.EDIT)) editingId = node.id;
				}}>
				{getDisplayName(node)}

				{#snippet nestedItems()}
					{#if node.children && node.children.length > 0}
						{@render renderNodes(node.children)}
					{/if}
				{/snippet}
			</File>
		{:else}
			<File
				href={`/files/${node.id}`}
				filetype={node.uiFileType}
				template={node.customFields?.isTemplate}
				isEditing={editingId === node.id}
				editValue={node.name}
				onsave={(newName) => handleRenameSubmit(node, newName)}
				oncancel={() => (editingId = null)}
				ondblclick={(e: MouseEvent) => {
					e.stopPropagation();
					if (has(PERMISSIONS.FILES.EDIT)) editingId = node.id;
				}}>
				{getDisplayName(node)}
			</File>
		{/if}
	{/each}
{/snippet}

<div class="file-tree flex flex-col gap-1">
	{@render renderNodes(rootNodes)}
</div>

{#if toastMessage}
	<div class="bg-surface-inverted text-text-inverted animate-in fade-in slide-in-from-bottom-2 fixed right-4 bottom-4 rounded px-4 py-2 text-sm shadow-lg transition-opacity">
		{toastMessage}
	</div>
{/if}
