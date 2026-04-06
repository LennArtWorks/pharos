<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import SidebarSection from '$lib/components/layout/sidebar/SidebarSection.svelte';
	import File from '$lib/components/blocks/File.svelte';
	import type { FigmaIconName } from '$lib/components/ui/Icon.svelte';

	import { FILE_TYPE_CONFIG, type FSRNode } from '$lib/config/filesystem';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { has } from '$lib/utils/config/permissions';
	import { getFileConfig } from '$lib/utils/config/filesystem';
	import { contextMenu, openContextMenu } from '$lib/state/contextMenu.svelte';
	import type { ContextMenuItem } from '$lib/state/contextMenu.svelte';

	import { apiCreateNode, apiRenameNode, apiDeleteNode, apiSortNode } from '$lib/utils/fileOperations';

	let tree: FSRNode[] = $state([]);
	let rootNodes = $derived(tree.filter((node) => node.parentId === null));
	let activeId = $derived(page.url.pathname.split('/').pop() || null);

	let editingId = $state<string | null>(null);
	let dropStates = $state<Record<string, 'before' | 'after' | 'inside' | null>>({});

	onMount(async () => {
		await fetchTree();
	});

	async function fetchTree() {
		const res = await fetch('/api/filesystem', { credentials: 'include' });
		if (res.ok) tree = await res.json();
	}

	function getContextMenuItems(node: FSRNode): ContextMenuItem[] {
		const items: ContextMenuItem[] = [];

		if (has(PERMISSIONS.FILES.EDIT)) {
			items.push({ id: 'rename', type: 'action', label: 'Rename', icon: 'pencil', action: 'rename' });
		}

		if (has(PERMISSIONS.FILES.CREATE)) {
			const fileTypeItems: ContextMenuItem[] = Object.entries(FILE_TYPE_CONFIG.internal)
				.filter(([id, config]) => config.active && !['sysfolder', 'sysfile'].includes(id))
				.map(([id, config]) => ({
					id: `create-${id}`,
					type: 'action',
					label: id === 'workspace' ? 'Workspace' : id,
					icon: config.icon as FigmaIconName,
					action: `create:${id}`
				}));

			items.push({
				id: 'create-menu',
				type: 'submenu',
				label: 'Create New...',
				icon: 'add',
				items: [...fileTypeItems, { id: 'div-upload', type: 'divider' }, { id: 'upload-file', type: 'action', label: 'Upload File...', icon: 'upload', action: 'create:upload' }]
			});
		}

		if (has(PERMISSIONS.FILES.DELETE)) {
			if (items.length > 0) items.push({ id: 'div-delete', type: 'divider' });
			items.push({ id: 'delete', type: 'action', label: 'Move to Trash', icon: 'trash', action: 'delete', danger: true });
		}

		return items;
	}

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
				const parentId = node.type === 'workspace' || node.type === 'folder' ? node.id : node.parentId;
				handleCreate(fileType, parentId);
			}
		}
	});

	async function handleCreate(type: string, parentId: string | null = null) {
		if (type === 'upload') {
			console.log('Upload workflow not connected yet.');
			return;
		}

		const tempId = `temp_${Date.now()}`;
		const extension = FILE_TYPE_CONFIG.internal[type as keyof typeof FILE_TYPE_CONFIG.internal]?.ext[0] || '';
		const tempNode: FSRNode = {
			id: tempId,
			parentId,
			type: type === 'workspace' ? 'workspace' : type === 'folder' ? 'folder' : 'file',
			name: `New ${type}`,
			extension,
			uiFileType: type as any,
			physicalName: `temp${extension}`,
			updatedAt: Date.now(),
			createdAt: Date.now(),
			children: []
		};

		const insertNode = (nodes: FSRNode[]): FSRNode[] => {
			if (parentId === null) return [...nodes, tempNode];
			return nodes.map((n) => (n.id === parentId ? { ...n, children: [...(n.children || []), tempNode] } : { ...n, children: insertNode(n.children || []) }));
		};
		tree = insertNode(tree);
		editingId = tempId;

		try {
			const { id: realId } = await apiCreateNode(type, parentId);
			const swapId = (nodes: FSRNode[]): FSRNode[] => nodes.map((n) => (n.id === tempId ? { ...n, id: realId } : { ...n, children: swapId(n.children || []) }));
			tree = swapId(tree);
			if (editingId === tempId) editingId = realId;
		} catch (err: any) {
			const removeNode = (nodes: FSRNode[]): FSRNode[] => nodes.filter((n) => n.id !== tempId).map((n) => ({ ...n, children: removeNode(n.children || []) }));
			tree = removeNode(tree);
			editingId = null;
		}
	}

	async function handleDelete(id: string) {
		try {
			await apiDeleteNode(id);
			const removeNode = (nodes: FSRNode[]): FSRNode[] => nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: removeNode(n.children || []) }));
			tree = removeNode(tree);
		} catch (err: any) {}
	}

	async function handleRenameSubmit(node: FSRNode, newName: string) {
		const cleanName = newName.trim();
		if (cleanName === '' || cleanName === node.name) {
			editingId = null;
			return;
		}
		const oldName = node.name;
		node.name = cleanName;
		editingId = null;

		try {
			await apiRenameNode(node.id, cleanName);
		} catch (err: any) {
			node.name = oldName;
		}
	}

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

		if (targetNode.type === 'file') {
			dropStates[targetNode.id] = y < rect.height / 2 ? 'before' : 'after';
		} else {
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

		let draggedNode: FSRNode | null = null;
		const extractNode = (nodes: FSRNode[]): FSRNode[] =>
			nodes.filter((n) => {
				if (n.id === draggedId) {
					draggedNode = n;
					return false;
				}
				n.children = extractNode(n.children || []);
				return true;
			});

		let newTree = extractNode(tree);

		if (draggedNode) {
			// FIX: Explicitly assign parentId based on the action so derived states ($rootNodes) don't duplicate rendering.
			const insertNode = (nodes: FSRNode[], currentParentId: string | null): FSRNode[] => {
				let result: FSRNode[] = [];
				for (const n of nodes) {
					if (n.id === targetId) {
						if (action === 'before') {
							draggedNode!.parentId = currentParentId;
							result.push(draggedNode!);
						}
						if (action === 'inside') {
							draggedNode!.parentId = n.id;
							n.children = [...(n.children || []), draggedNode!];
						}
						result.push(n);
						if (action === 'after') {
							draggedNode!.parentId = currentParentId;
							result.push(draggedNode!);
						}
					} else {
						n.children = insertNode(n.children || [], n.id);
						result.push(n);
					}
				}
				return result;
			};
			tree = insertNode(newTree, null);
		}

		try {
			await apiSortNode(draggedId, targetId, action);
			const res = await fetch('/api/filesystem', { credentials: 'include' });
			if (res.ok) tree = await res.json();
		} catch (err: any) {
			await fetchTree();
		}
	}

	function getDisplayName(node: FSRNode) {
		const config = getFileConfig(node.extension);
		return config.type !== 'file' || node.uiFileType in FILE_TYPE_CONFIG.internal ? node.name : node.name + node.extension;
	}
</script>

{#snippet renderNodes(nodes: FSRNode[])}
	{#each nodes as node (node.id)}
		<div data-uiname={`FileTree-Node-${node.id}`} oncontextmenu={(e) => openContextMenu(e, node.type === 'workspace' ? 'workspace' : 'file', node, getContextMenuItems(node))}>
			{#if node.type === 'workspace'}
				<SidebarSection
					title={node.name}
					onAdd={(type) => handleCreate(type, node.id)}
					onNameChange={(newName) => handleRenameSubmit(node, newName)}
					draggable={true}
					ondragstart={(e: DragEvent) => handleDragStart(e, node.id)}
					ondragover={(e: DragEvent) => handleDragOver(e, node)}
					ondragleave={(e: DragEvent) => handleDragLeave(e, node.id)}
					ondrop={(e: DragEvent) => handleDrop(e, node.id)}
					dropState={dropStates[node.id]}>
					{#if !node.children || node.children.length === 0}
						{#if dropStates[node.id] === 'inside'}
							<div data-uiname="empty-drop-zone" class="border-accent-500 bg-accent-500/10 text-accent-500 rounded-m ml-xs border-2 border-dashed py-3 text-center text-xs font-medium">Drop here</div>
						{:else}
							<div class="text-ink-40 ml-m py-1 text-xs italic">Empty</div>
						{/if}
					{:else}
						{@render renderNodes(node.children)}
					{/if}
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
