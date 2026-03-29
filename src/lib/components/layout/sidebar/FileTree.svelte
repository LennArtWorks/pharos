<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import SidebarSection from '$lib/components/layout/sidebar/SidebarSection.svelte';
	import File from '$lib/components/blocks/File.svelte';

	import { FILE_TYPE_CONFIG, type FSRNode } from '$lib/config/filesystem';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { has } from '$lib/utils/config/permissions'; // FIXED PATH
	import { getFileConfig } from '$lib/utils/config/filesystem';
	import { contextMenu, openContextMenu } from '$lib/state/contextMenu.svelte';

	import { apiCreateNode, apiRenameNode, apiDeleteNode, apiSortNode } from '$lib/utils/fileOperations';

	let tree: FSRNode[] = $state([]);
	let rootNodes = $derived(tree.filter((node) => node.parentId === null));
	let activeId = $derived(page.url.pathname.split('/').pop() || null);

	let editingId = $state<string | null>(null);
	let toastMessage = $state('');
	let dropStates = $state<Record<string, 'before' | 'after' | 'inside' | null>>({});

	onMount(async () => {
		await fetchTree();
	});

	async function fetchTree() {
		const res = await fetch('/api/filesystem', { credentials: 'include' });
		if (res.ok) tree = await res.json();
	}

	function showToast(msg: string) {
		toastMessage = msg;
		setTimeout(() => (toastMessage = ''), 3000);
	}

	// --- Context Menu Listener ---
	$effect(() => {
		if (contextMenu.actionRequested) {
			const action = contextMenu.actionRequested;
			const node = contextMenu.node;
			contextMenu.actionRequested = null;

			if (!node) return;

			if (action === 'rename') {
				editingId = node.id;
			} else if (action === 'delete') {
				handleDelete(node.id);
			} else if (action.startsWith('create:')) {
				const fileType = action.split(':')[1];
				// Ensure files go INSIDE folders/workspaces, but NEXT TO standard files
				const parentId = node.type === 'workspace' || node.type === 'folder' ? node.id : node.parentId;
				handleCreate(fileType, parentId);
			}
		}
	});

	// --- File Operations (UI Layer) ---
	async function handleCreate(type: string, parentId: string | null = null) {
		// 1. Create a fake temporary node
		const tempId = `temp_${Date.now()}`;
		const extension = FILE_TYPE_CONFIG.internal[type as keyof typeof FILE_TYPE_CONFIG.internal]?.ext[0] || '';

		const tempNode: FSRNode = {
			id: tempId,
			parentId: parentId,
			type: type === 'workspace' ? 'workspace' : type === 'folder' ? 'folder' : 'file',
			name: `New ${type}`,
			extension: extension,
			uiFileType: type as any,
			physicalName: `temp${extension}`,
			updatedAt: Date.now(),
			createdAt: Date.now(),
			children: []
		};

		// 2. Optimistically insert it into the local tree
		const insertNode = (nodes: FSRNode[]): FSRNode[] => {
			if (parentId === null) return [...nodes, tempNode];
			return nodes.map((n) => (n.id === parentId ? { ...n, children: [...(n.children || []), tempNode] } : { ...n, children: insertNode(n.children || []) }));
		};
		tree = insertNode(tree);

		// 3. Instantly open the rename input for the user
		editingId = tempId;

		try {
			// 4. Fire the API in the background
			const { id: realId } = await apiCreateNode(type, parentId);

			// 5. Swap the temp ID for the real ID quietly
			const swapId = (nodes: FSRNode[]): FSRNode[] => {
				return nodes.map((n) => {
					if (n.id === tempId) return { ...n, id: realId };
					return { ...n, children: swapId(n.children || []) };
				});
			};
			tree = swapId(tree);

			// If the user hasn't finished renaming yet, update editingId to the real one
			if (editingId === tempId) editingId = realId;
		} catch (err: any) {
			// Rollback if the cloud fails
			const removeNode = (nodes: FSRNode[]): FSRNode[] => {
				return nodes.filter((n) => n.id !== tempId).map((n) => ({ ...n, children: removeNode(n.children || []) }));
			};
			tree = removeNode(tree);
			editingId = null;
			alert(err.message || 'Network error, file creation reverted.');
		}
	}

	async function handleDelete(id: string) {
		try {
			await apiDeleteNode(id);
			// Optimistic UI: Filter it out immediately so it vanishes instantly
			const removeNode = (nodes: FSRNode[]): FSRNode[] => {
				return nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: removeNode(n.children || []) }));
			};
			tree = removeNode(tree);
			showToast('Moved to trash');
		} catch (err: any) {
			alert(err.message);
		}
	}

	async function handleRenameSubmit(node: FSRNode, newName: string) {
		const cleanName = newName.trim();
		if (cleanName === '' || cleanName === node.name) {
			editingId = null;
			return;
		}

		const oldName = node.name;

		// 1. TRUE OPTIMISTIC UI: Update the local state instantly
		node.name = cleanName;
		editingId = null;

		try {
			// 2. Fire the API call in the background
			await apiRenameNode(node.id, cleanName);
		} catch (err: any) {
			// 3. Rollback if the Sciebo cloud fails
			node.name = oldName;
			alert(err.message || 'Network error, name reverted.');
		}
	}

	// --- Drag & Drop ---
	function handleDragStart(e: DragEvent, id: string) {
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('application/fsr-node-id', id);
		}
		e.stopPropagation();
	}

	function handleDragOver(e: DragEvent, targetNode: FSRNode) {
		if (!e.dataTransfer?.types.includes('application/fsr-node-id')) return;
		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const y = e.clientY - rect.top;

		// Strict constraint: Standard files cannot receive "inside" drops
		if (targetNode.type === 'file') {
			if (y < rect.height / 2) dropStates[targetNode.id] = 'before';
			else dropStates[targetNode.id] = 'after';
		} else {
			// Workspaces or Folders
			if (y < rect.height * 0.25) dropStates[targetNode.id] = 'before';
			else if (y > rect.height * 0.75) dropStates[targetNode.id] = 'after';
			else dropStates[targetNode.id] = 'inside';
		}
	}

	function handleDragLeave(e: DragEvent, targetId: string) {
		dropStates[targetId] = null;
	}

	async function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		e.stopPropagation();

		const draggedId = e.dataTransfer?.getData('application/fsr-node-id');
		const action = dropStates[targetId];
		dropStates[targetId] = null;

		if (!draggedId || draggedId === targetId || !action) return;

		// --- OPTIMISTIC UI: Snap it instantly ---

		// 1. Find the node we are dragging
		let draggedNode: FSRNode | null = null;
		const extractNode = (nodes: FSRNode[]): FSRNode[] => {
			return nodes.filter((n) => {
				if (n.id === draggedId) {
					draggedNode = n;
					return false;
				}
				n.children = extractNode(n.children || []);
				return true;
			});
		};

		// 2. Remove it from its old position
		let newTree = extractNode(tree);

		// 3. Insert it into its new position
		if (draggedNode) {
			const insertNode = (nodes: FSRNode[]): FSRNode[] => {
				let result: FSRNode[] = [];
				for (const n of nodes) {
					if (n.id === targetId) {
						if (action === 'before') result.push(draggedNode!);
						if (action === 'inside') n.children = [...(n.children || []), draggedNode!];
						result.push(n);
						if (action === 'after') result.push(draggedNode!);
					} else {
						n.children = insertNode(n.children || []);
						result.push(n);
					}
				}
				return result;
			};
			tree = insertNode(newTree);
		}

		// --- BACKGROUND API CALL ---
		try {
			await apiSortNode(draggedId, targetId, action);
			// Quietly fetch the server's exact order just to be 100% in sync
			const res = await fetch('/api/filesystem', { credentials: 'include' });
			if (res.ok) tree = await res.json();
		} catch (err: any) {
			alert(err.message || 'Failed to move file. Reverting.');
			await fetchTree(); // Revert on failure
		}
	}

	function getDisplayName(node: FSRNode) {
		const config = getFileConfig(node.extension);
		return config.type !== 'file' || node.uiFileType in FILE_TYPE_CONFIG.internal ? node.name : node.name + node.extension;
	}
</script>

{#snippet renderNodes(nodes: FSRNode[])}
	{#each nodes as node (node.id)}
		<div data-uiname={`FileTree-Node-${node.id}`} oncontextmenu={(e) => openContextMenu(e, node.type === 'workspace' ? 'workspace' : 'file', node)}>
			{#if node.type === 'workspace'}
				<SidebarSection title={node.name} onAdd={() => handleCreate('document', node.id)}>
					{@render renderNodes(node.children || [])}
				</SidebarSection>
			{:else}
				<File
					draggable="true"
					ondragstart={(e: DragEvent) => handleDragStart(e, node.id)}
					ondragover={(e: DragEvent) => handleDragOver(e, node)}
					ondragleave={(e: DragEvent) => handleDragLeave(e, node.id)}
					ondrop={(e: DragEvent) => handleDrop(e, node.id)}
					href={`/files/${node.id}`}
					filetype={node.uiFileType}
					empty={node.customFields?.isTemplate}
					isEditing={editingId === node.id}
					editValue={node.name}
					dropState={dropStates[node.id]}
					active={activeId === node.id || (contextMenu.isOpen && contextMenu.node?.id === node.id)}
					onsave={(newName) => handleRenameSubmit(node, newName)}
					oncancel={() => (editingId = null)}
					ondblclick={(e: MouseEvent) => {
						e.stopPropagation();
						if (has(PERMISSIONS.FILES.EDIT)) editingId = node.id;
					}}
					hasChildren={node.children && node.children.length > 0}>
					{getDisplayName(node)}
					{#snippet nestedItems()}
						{#if node.children && node.children.length > 0}
							{@render renderNodes(node.children)}
						{/if}
					{/snippet}
				</File>
			{/if}
		</div>
	{/each}
{/snippet}

<div data-uiname="FileTree-Container" class="file-tree flex flex-col gap-1">
	{@render renderNodes(rootNodes)}
</div>
