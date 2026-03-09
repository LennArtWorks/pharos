<script lang="ts">
	import { onMount } from 'svelte';
	import SidebarSection from './SidebarSection.svelte';
	import Folder from '$lib/components/blocks/Folder.svelte';
	import File from '$lib/components/blocks/File.svelte';
	import { FILE_TYPE_CONFIG, type FSRNode, getFileConfig } from '$lib/config/filesystem';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { can } from '$lib/utils/permissions';

	/* ---------------------------------------------------------------- *
	 *  setup file tree
	 * ---------------------------------------------------------------- */

	let tree: FSRNode[] = $state([]);
	let rootNodes = $derived(tree.filter((node) => node.parentId === null));

	onMount(async () => {
		try {
			// Force the browser to send the fsr_session cookie!
			const res = await fetch('/api/filesystem', {
				credentials: 'include'
			});

			if (!res.ok) {
				const errData = await res.json();
				console.error('[FileTree Error]:', res.status, errData);
				tree = []; // Fallback gracefully
				return;
			}

			const data = await res.json();

			if (!Array.isArray(data)) {
				console.error('[FileTree Error]: Expected array, got:', data);
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

	/* ---------------------------------------------------------------- *
	 *  file name saved popup
	 * ---------------------------------------------------------------- */

	let editingId = $state<string | null>(null);
	let toastMessage = $state('');

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => (toastMessage = ''), 3000);
	}

	async function handleRenameSubmit(node: FSRNode, newName: string) {
		// If they didn't change the name, just close the input silently
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

	// Helper to decide if we show the extension in the UI
	function getDisplayName(node: FSRNode) {
		const config = getFileConfig(node.extension);
		// If it's an internal OS file (doc, task, etc.), we usually hide the extension
		if (config.type !== 'file') return node.name; // Workspaces/Folders

		// Check if it's an internal type defined in our config
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
			<Folder title={node.name}>
				{@render renderNodes(node.children || [])}
			</Folder>
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
					if ($can(PERMISSIONS.FILES.EDIT)) {
						editingId = node.id;
					}
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
