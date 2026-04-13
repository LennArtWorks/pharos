<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';
	import TreeNodeItem from '$lib/components/blocks/NodeItem/TreeNodeItem.svelte';
	import DraggableTree from './DraggableTree.svelte';

	let { data, children } = $props();

	let isResizing = $state(false);

	// Track which categories are open
	let catOpenStates = $state<Record<string, boolean>>({});

	// Category Drag State
	let catDropStates = $state<Record<string, 'before' | 'after' | null>>({});

	function handleResize(event: PointerEvent) {
		if (!isResizing) return;
		document.documentElement.style.setProperty('--width-sidebar', `${event.clientX}px`);
	}
	function stopResizing() {
		isResizing = false;
	}

	// --- API Handlers ---
	async function renameCategory(id: string, newName: string) {
		const res = await fetch('/api/dev/aidev/categories', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action: 'rename', id, name: newName })
		});
		if (res.ok) invalidateAll();
	}

	// --- Category Drag Handlers ---
	function handleCatDragStart(e: DragEvent, id: string) {
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('application/fsr-cat-id', id);
		}
		e.stopPropagation();
	}

	function handleCatDragOver(e: DragEvent, id: string) {
		if (e.dataTransfer?.types.includes('application/fsr-cat-id')) {
			e.preventDefault();
			e.stopPropagation();
			const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
			catDropStates[id] = e.clientY - rect.top < rect.height / 2 ? 'before' : 'after';
		}
	}

	function handleCatDragLeave(e: DragEvent, id: string) {
		catDropStates[id] = null;
	}

	async function handleCatDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		e.stopPropagation();
		const draggedId = e.dataTransfer?.getData('application/fsr-cat-id');
		const dragAction = catDropStates[targetId];
		catDropStates[targetId] = null;

		if (draggedId && draggedId !== targetId && dragAction) {
			await fetch('/api/dev/aidev/categories', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'sort', id: draggedId, targetId, dragAction })
			});
			invalidateAll();
		}
	}

	// --- Empty Global Category Drop Handler ---
	let emptyGlobalDrop = $state(false);
	async function handleEmptyGlobalDrop(e: DragEvent, categoryId: string) {
		e.preventDefault();
		e.stopPropagation();
		emptyGlobalDrop = false;
		const draggedId = e.dataTransfer?.getData('application/fsr-topic-id');
		if (draggedId) {
			await fetch('/api/dev/aidev/sort', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ draggedId, targetId: null, action: 'empty_insert', categoryId, parentId: null })
			});
			invalidateAll();
		}
	}
</script>

<div class="-mt-main-l z-1 flex min-h-screen items-start">
	<aside
		class="pt-main-m bg-level-2 px-l gap-2xs border-border sticky top-0 z-1 flex h-screen w-[var(--width-sidebar)] shrink-0 flex-col border-r"
		onpointermove={handleResize}
		onpointerup={stopResizing}
		onpointerleave={stopResizing}>
		<button
			onpointerdown={(e) => {
				isResizing = true;
				(e.target as HTMLElement).setPointerCapture(e.pointerId);
			}}
			class="hover:bg-accent-500/20 absolute top-0 -right-1 z-50 h-full w-2 cursor-col-resize"></button>

		<section class="h-main-l gap-m flex shrink-0 items-center">
			<Button href="/dev" variant="tertiary" size="s" iconOnly data-tooltip="Back to Dev Portal">
				<Icon name="arrow-left" />
			</Button>
			<div class="flex items-center gap-2">
				<Icon name="sparkles" class="text-accent-500" />
				<p class="font-label-m font-bold">AI Context Hub</p>
			</div>
		</section>

		<section class="scrollbar-minimal py-l min-h-0 flex-1 overflow-y-auto [mask-image:linear-gradient(to_bottom,transparent,black_20px,black_calc(100%-20px),transparent)]">
			<div class="gap-s flex flex-col">
				{#each data.globals as category}
					{@const isOpen = catOpenStates[category.id] ?? true}
					<TreeNodeItem {isOpen} hasChildren={true} isWorkspace={true}>
						{#snippet content(triggerSquish)}
							<NodeItem
								name={category.name}
								icon="sparkles"
								isWorkspace
								variant="unstyled"
								{isOpen}
								hasChildren
								onSquish={triggerSquish}
								onToggle={(s) => (catOpenStates[category.id] = s)}
								onsave={(newName) => renameCategory(category.id, newName)} />
						{/snippet}

						{#snippet children()}
							{#if category.topics.length > 0}
								<DraggableTree topics={category.topics} categoryId={category.id} />
							{:else}
								<div
									class="rounded-m flex h-12 w-full items-center justify-center border-2 border-dashed transition-colors {emptyGlobalDrop
										? 'border-accent-500 bg-accent-500/10'
										: 'border-border bg-level-2'}"
									ondragover={(e) => {
										if (e.dataTransfer?.types.includes('application/fsr-topic-id')) {
											e.preventDefault();
											emptyGlobalDrop = true;
										}
									}}
									ondragleave={() => (emptyGlobalDrop = false)}
									ondrop={(e) => handleEmptyGlobalDrop(e, category.id)}>
									<span class="text-label-xs text-ink-50">Drop global topic here</span>
								</div>
							{/if}
							<Divider class="mt-4" />
						{/snippet}
					</TreeNodeItem>
				{/each}

				{#each data.tree as category}
					{@const isOpen = catOpenStates[category.id] ?? true}
					<TreeNodeItem
						{isOpen}
						hasChildren={true}
						isWorkspace={true}
						dropState={catDropStates[category.id]}
						draggable="true"
						ondragstart={(e) => handleCatDragStart(e, category.id)}
						ondragover={(e) => handleCatDragOver(e, category.id)}
						ondragleave={(e) => handleCatDragLeave(e, category.id)}
						ondrop={(e) => handleCatDrop(e, category.id)}>
						{#snippet content(triggerSquish)}
							<NodeItem
								name={category.name}
								isWorkspace
								variant="unstyled"
								{isOpen}
								hasChildren
								onSquish={triggerSquish}
								onToggle={(s) => (catOpenStates[category.id] = s)}
								onsave={(newName) => renameCategory(category.id, newName)} />
						{/snippet}

						{#snippet children()}
							<DraggableTree topics={category.topics} categoryId={category.id} />
						{/snippet}
					</TreeNodeItem>
				{/each}
			</div>
		</section>

		<div class="shrink-0 p-4 pb-8">
			<Button href="/dev/aidev/new" variant="secondary" size="s" class="w-full justify-center">
				<Icon name="add" /> New Topic
			</Button>
		</div>
	</aside>

	<main class="bg-level-2 min-h-screen flex-1">
		{@render children()}
	</main>
</div>
