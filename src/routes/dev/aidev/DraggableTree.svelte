<script lang="ts">
	import File from '$lib/components/blocks/File.svelte';
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import DraggableTree from './DraggableTree.svelte';

	let { topics, categoryId, parentId = null } = $props(); // Pass parentId down if it's an empty sub-folder
	let activeId = $derived(page.url.pathname.split('/').pop());

	let dropStates = $state<Record<string, 'before' | 'after' | 'inside' | null>>({});
	let emptyDropState = $state<'inside' | null>(null); // For dragging into an empty category

	function handleDragStart(e: DragEvent, topicId: string) {
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('application/fsr-topic-id', topicId);
		}
		e.stopPropagation();
	}

	function handleDragEnter(e: DragEvent) {
		// Only allow enter if it's a topic
		if (e.dataTransfer?.types.includes('application/fsr-topic-id')) {
			e.preventDefault();
		}
	}

	function handleDragOver(e: DragEvent, topicId: string) {
		// ABORT if the dragged item is not a topic (e.g., if it's a category)
		if (!e.dataTransfer?.types.includes('application/fsr-topic-id')) return;

		e.preventDefault();
		e.stopPropagation();

		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';

		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const y = e.clientY - rect.top;

		if (y < rect.height * 0.25) dropStates[topicId] = 'before';
		else if (y > rect.height * 0.75) dropStates[topicId] = 'after';
		else dropStates[topicId] = 'inside';
	}

	function handleDragLeave(e: DragEvent, topicId: string) {
		dropStates[topicId] = null;
	}

	async function handleDrop(e: DragEvent, targetId: string) {
		e.preventDefault();
		e.stopPropagation();

		const draggedId = e.dataTransfer?.getData('application/fsr-topic-id');
		const action = dropStates[targetId];
		dropStates[targetId] = null;

		if (!draggedId || draggedId === targetId || !action) return;

		await fetch('/api/aidev/sort', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ draggedId, targetId, action, categoryId })
		});

		invalidateAll();
	}

	// --- Handlers for Empty Categories / Folders ---
	function handleEmptyDragOver(e: DragEvent) {
		// ABORT if the dragged item is not a topic
		if (!e.dataTransfer?.types.includes('application/fsr-topic-id')) return;

		e.preventDefault();
		e.stopPropagation();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		emptyDropState = 'inside';
	}

	function handleEmptyDragLeave() {
		emptyDropState = null;
	}

	async function handleEmptyDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();

		const draggedId = e.dataTransfer?.getData('application/fsr-topic-id');
		emptyDropState = null;

		if (!draggedId) return;

		// Send the update to the server, passing 'inside' but with no targetId.
		// The server will use the categoryId and parentId to place it.
		await fetch('/api/aidev/sort', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ draggedId, targetId: null, action: 'empty_insert', categoryId, parentId })
		});

		invalidateAll();
	}
</script>

<div class="relative flex min-h-[24px] w-full flex-col gap-1">
	{#if topics.length === 0}
		<div
			class="rounded-m flex h-8 w-full items-center justify-center border-2 border-dashed transition-colors {emptyDropState ? 'border-accent-500 bg-accent-500/10' : 'border-transparent'}"
			ondragenter={handleDragEnter}
			ondragover={handleEmptyDragOver}
			ondragleave={handleEmptyDragLeave}
			ondrop={handleEmptyDrop}>
			<div class="absolute inset-0"></div>
		</div>
	{:else}
		{#each topics as topic (topic.id)}
			<File
				draggable="true"
				ondragstart={(e: DragEvent) => handleDragStart(e, topic.id)}
				ondragenter={handleDragEnter}
				ondragover={(e: DragEvent) => handleDragOver(e, topic.id)}
				ondragleave={(e: DragEvent) => handleDragLeave(e, topic.id)}
				ondrop={(e: DragEvent) => handleDrop(e, topic.id)}
				href={`/files/dev/aidev/${topic.id}`}
				customIcon="file"
				dropState={dropStates[topic.id]}
				active={activeId === topic.id}
				class="cursor-grab active:cursor-grabbing"
				isOpen={true}
				hasChildren={topic.children && topic.children.length > 0}>
				{topic.title}

				{#snippet nestedItems()}
					{#if topic.children && topic.children.length > 0}
						<DraggableTree topics={topic.children} {categoryId} parentId={topic.id} />
					{/if}
				{/snippet}
			</File>
		{/each}
	{/if}
</div>
