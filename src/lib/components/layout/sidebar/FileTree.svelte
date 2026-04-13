<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	import * as Popover from '$lib/components/ui/Popover';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';

	import { FILE_TYPE_CONFIG, type FSRNode } from '$lib/config/filesystem';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { has } from '$lib/utils/config/permissions';
	import { getFileConfig } from '$lib/utils/config/filesystem';
	import { contextMenu, openContextMenu } from '$lib/state/layout/contextMenu.svelte';
	import { getFileContextMenuItems } from '$lib/components/layout/ContextMenu/menus/fileMenu';
	import { apiCreateNode, apiRenameNode, apiDeleteNode, apiSortNode } from '$lib/utils/fileOperations';

	import { fsState } from '$lib/state/navigation/filesystem.svelte';
	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';
	import TreeNodeItem from '$lib/components/blocks/NodeItem/TreeNodeItem.svelte';
	import { goto } from '$app/navigation';

	let rootNodes = $derived(fsState.tree.filter((node) => node.parentId === null));
	let activeId = $derived(page.url.pathname.split('/').pop() || null);

	let editingId = $state<string | null>(null);
	let expandedStates = $state<Record<string, boolean>>({});
	let dropStates = $state<Record<string, 'before' | 'after' | 'inside' | null>>({});

	const creatableTypes = Object.entries(FILE_TYPE_CONFIG.internal)
		.filter(([id, config]) => config.active && !['sysfolder', 'sysfile'].includes(id))
		.map(([id, config]) => ({ id, ...config }));

	const canEdit = (node: FSRNode) => has(node.type === 'workspace' ? PERMISSIONS.WORKSPACE.EDIT : PERMISSIONS.FILES.EDIT);
	const canMove = (node: FSRNode) => has(node.type === 'workspace' ? PERMISSIONS.WORKSPACE.MOVE : PERMISSIONS.FILES.MOVE);
	const canCreate = (node: FSRNode) => has(node.type === 'workspace' ? PERMISSIONS.WORKSPACE.CREATE : PERMISSIONS.FILES.CREATE);

	function toggleExpanded(id: string, state: boolean) {
		expandedStates[id] = state;
	}
	function syncTree(newTree: FSRNode[]) {
		fsState.tree = newTree;
		fsState.rebuildMap();
	}

	onMount(async () => {
		await fsState.fetchTree();
	});

	$effect(() => {
		if (contextMenu.actionRequested) {
			const action = contextMenu.actionRequested;
			const node = contextMenu.node;
			contextMenu.actionRequested = null;
			if (!node) return;

			if (action === 'rename') editingId = node.id;
			else if (action === 'delete') handleDelete(node.id);
			else if (action.startsWith('create:')) handleCreate(action.split(':')[1], node.type === 'workspace' || node.type === 'folder' ? node.id : node.parentId);
		}
	});

	async function handleCreate(type: string, parentId: string | null = null) {
		if (type === 'upload') return;
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
		syncTree(insertNode(fsState.tree));
		editingId = tempId;

		try {
			const { id: realId } = await apiCreateNode(type, parentId);
			const swapId = (nodes: FSRNode[]): FSRNode[] => nodes.map((n) => (n.id === tempId ? { ...n, id: realId } : { ...n, children: swapId(n.children || []) }));
			syncTree(swapId(fsState.tree));
			if (editingId === tempId) editingId = realId;
		} catch (err: any) {
			const removeNode = (nodes: FSRNode[]): FSRNode[] => nodes.filter((n) => n.id !== tempId).map((n) => ({ ...n, children: removeNode(n.children || []) }));
			syncTree(removeNode(fsState.tree));
			editingId = null;
		}
	}

	async function handleDelete(id: string) {
		try {
			await apiDeleteNode(id);
			const removeNode = (nodes: FSRNode[]): FSRNode[] => nodes.filter((n) => n.id !== id).map((n) => ({ ...n, children: removeNode(n.children || []) }));
			syncTree(removeNode(fsState.tree));
		} catch (err: any) {}
	}

	async function handleRenameSubmit(node: FSRNode, newName: string) {
		const cleanName = newName.trim();

		// If nothing changed, just close edit mode
		if (cleanName === '' || cleanName === node.name) {
			editingId = null;
			return;
		}

		const oldName = node.name;

		// Update local state immediately (newName already includes extension from NodeItem)
		node.name = cleanName;
		fsState.rebuildMap();
		editingId = null;

		try {
			// The API just takes the new string and writes it to the 'name' field in metadata
			await apiRenameNode(node.id, cleanName);
		} catch (err: any) {
			// Rollback on failure
			node.name = oldName;
			fsState.rebuildMap();
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

		let newTree = extractNode(fsState.tree);
		if (draggedNode) {
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
			syncTree(insertNode(newTree, null));
		}

		try {
			await apiSortNode(draggedId, targetId, action);
			const res = await fetch('/api/filesystem', { credentials: 'include' });
			if (res.ok) syncTree(await res.json());
		} catch (err: any) {
			const res = await fetch('/api/filesystem', { credentials: 'include' });
			if (res.ok) syncTree(await res.json());
		}
	}

	function getDisplayName(node: FSRNode) {
		const config = getFileConfig(node.extension);
		return config.type !== 'file' || node.uiFileType in FILE_TYPE_CONFIG.internal ? node.name : node.name + node.extension;
	}
</script>

{#snippet renderNodes(nodes: FSRNode[])}
	{#each nodes as node (node.id)}
		{@const isOpen = expandedStates[node.id] ?? node.type === 'workspace'}

		<div data-uiname={`FileTree-Node-${node.id}`} oncontextmenu={(e) => openContextMenu(e, node.type === 'workspace' ? 'workspace' : 'file', node, getFileContextMenuItems(node))}>
			<TreeNodeItem
				{isOpen}
				hasChildren={node.children && node.children.length > 0}
				isWorkspace={node.type === 'workspace'}
				dropState={dropStates[node.id]}
				draggable={canMove(node)}
				ondragstart={(e: DragEvent) => handleDragStart(e, node.id)}
				ondragover={(e: DragEvent) => handleDragOver(e, node)}
				ondragleave={(e: DragEvent) => handleDragLeave(e, node.id)}
				ondrop={(e: DragEvent) => handleDrop(e, node.id)}>
				{#snippet content(triggerSquish)}
					<NodeItem
						{node}
						name={getDisplayName(node)}
						isWorkspace={node.type === 'workspace'}
						isEditing={editingId === node.id}
						active={activeId === node.id || (contextMenu.isOpen && contextMenu.node?.id === node.id)}
						template={node.customFields?.isTemplate}
						tagName={node.type === 'workspace' ? 'div' : undefined}
						href={node.type === 'workspace' ? undefined : `/files/${node.id}`}
						onclick={() => {
							if (node.type === 'workspace') goto(`/files/${node.id}`);
						}}
						hasChildren={node.children && node.children.length > 0}
						{isOpen}
						onSquish={triggerSquish}
						onToggle={(newState: boolean) => toggleExpanded(node.id, newState)}
						onsave={(newName) => handleRenameSubmit(node, newName)}
						oncancel={() => (editingId = null)}
						ondblclick={(e: MouseEvent) => {
							e.stopPropagation();
							if (canEdit(node)) editingId = node.id;
						}}>
						{#snippet trailingItems()}
							{#if node.type === 'workspace' && editingId !== node.id}
								<div role="none" class="hidden items-center group-hover:flex" onclick={(e) => e.stopPropagation()} ondblclick={(e) => e.stopPropagation()}>
									{#if canEdit(node)}
										<button
											type="button"
											aria-label="Edit"
											data-tooltip="Rename Workspace"
											onclick={() => {
												editingId = node.id;
											}}
											class="text-ink-60 hover:text-ink-80 hit-area-expand transition-colors">
											<Icon name="pencil" />
										</button>
									{/if}

									{#if canCreate(node)}
										<Popover.Root>
											<Popover.Trigger>
												<button type="button" aria-label="Add" data-tooltip="Create..." class="text-ink-60 hover:text-ink-80 hit-area-expand transition-colors">
													<Icon name="add" />
												</button>
											</Popover.Trigger>
											<Popover.Content class="z-[9999] flex w-44 flex-col gap-1 p-1" side="bottom" align="end">
												{#each creatableTypes as type}
													<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => handleCreate(type.id, node.id)}>
														{#snippet leading()}<Icon name={(type.icon as FigmaIconName) || 'file'} />{/snippet}
														{#snippet label()}<span class="w-full text-left capitalize">{type.id === 'workspace' ? 'Workspace' : type.id}</span>{/snippet}
													</Button>
												{/each}
												<div class="bg-border my-1 h-px w-full"></div>
												<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => handleCreate('upload', node.id)}>
													{#snippet leading()}<Icon name="upload" />{/snippet}
													{#snippet label()}<span class="w-full text-left">Upload File...</span>{/snippet}
												</Button>
											</Popover.Content>
										</Popover.Root>
									{/if}
								</div>
							{/if}
						{/snippet}
					</NodeItem>
				{/snippet}

				{#snippet children()}
					{#if node.children && node.children.length > 0}
						{@render renderNodes(node.children)}
					{:else if node.type === 'workspace'}
						{#if dropStates[node.id] === 'inside'}
							<div data-uiname="empty-drop-zone" class="border-accent-500 bg-accent-500/10 text-accent-500 rounded-m ml-xs border-2 border-dashed py-3 text-center text-xs font-medium">Drop here</div>
						{:else}
							<div class="text-ink-40 ml-m py-1 text-xs italic">Empty</div>
						{/if}
					{/if}
				{/snippet}
			</TreeNodeItem>
		</div>
	{/each}
{/snippet}

<div data-uiname="FileTree-Container" class="file-tree flex flex-col gap-1">
	{@render renderNodes(rootNodes)}
</div>
