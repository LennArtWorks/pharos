<script lang="ts">
	import { page } from '$app/state';
	import { invalidateAll } from '$app/navigation';
	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';
	import TreeNodeItem from '$lib/components/blocks/NodeItem/TreeNodeItem.svelte';

	let { topics, categoryId, parentId = null } = $props();

	let activeId = $derived(page.url.pathname.split('/').pop());

	// Local state for folder expansion
	let expandedStates = $state<Record<string, boolean>>({});
	let dropStates = $state<Record<string, 'before' | 'after' | 'inside' | null>>({});
	let emptyDropState = $state<'inside' | null>(null);

	// --- Drag & Drop Handlers ---
	function handleDragStart(e: DragEvent, topicId: string) {
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('application/fsr-topic-id', topicId);
		}
		e.stopPropagation();
	}

	function handleDragOver(e: DragEvent, topicId: string) {
		if (!e.dataTransfer?.types.includes('application/fsr-topic-id')) return;

		e.preventDefault();
		e.stopPropagation();

		const target = e.currentTarget as HTMLElement;
		const rect = target.getBoundingClientRect();
		const y = e.clientY - rect.top;

		// Topics act like folders: Before, After, or Inside
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

		await fetch('/api/dev/aidev/sort', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ draggedId, targetId, action, categoryId })
		});

		invalidateAll();
	}

	// --- Handlers for Empty Containers ---
	async function handleEmptyDrop(e: DragEvent) {
		e.preventDefault();
		e.stopPropagation();
		const draggedId = e.dataTransfer?.getData('application/fsr-topic-id');
		emptyDropState = null;

		if (!draggedId) return;

		await fetch('/api/dev/aidev/sort', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ draggedId, targetId: null, action: 'empty_insert', categoryId, parentId })
		});

		invalidateAll();
	}
</script>

<div class="relative flex min-h-[8px] w-full flex-col gap-1">
	{#if topics.length === 0}
		<div
			class="rounded-m relative min-h-4 w-full transition-colors {emptyDropState ? 'bg-accent-500/10 border-accent-500 border-2 border-dashed py-4' : ''}"
			ondragover={(e) => {
				if (e.dataTransfer?.types.includes('application/fsr-topic-id')) {
					e.preventDefault();
					emptyDropState = 'inside';
				}
			}}
			ondragleave={() => (emptyDropState = null)}
			ondrop={handleEmptyDrop}>
			{#if emptyDropState}
				<span class="text-accent-500 block w-full text-center text-xs font-medium">Insert topic here</span>
			{/if}
		</div>
	{:else}
		{#each topics as topic (topic.id)}
			{@const isOpen = expandedStates[topic.id] ?? true}

			<TreeNodeItem
				{isOpen}
				hasChildren={topic.children && topic.children.length > 0}
				dropState={dropStates[topic.id]}
				draggable="true"
				ondragstart={(e) => handleDragStart(e, topic.id)}
				ondragover={(e) => handleDragOver(e, topic.id)}
				ondragleave={(e) => handleDragLeave(e, topic.id)}
				ondrop={(e) => handleDrop(e, topic.id)}>
				{#snippet content(triggerSquish)}
					<NodeItem
						name={topic.title}
						icon="file"
						href={`/dev/aidev/${topic.id}`}
						active={activeId === topic.id}
						hasChildren={topic.children && topic.children.length > 0}
						{isOpen}
						onToggle={(s) => (expandedStates[topic.id] = s)}
						onSquish={triggerSquish}
						class="cursor-grab active:cursor-grabbing" />
				{/snippet}

				{#snippet children()}
					{#if topic.children && topic.children.length > 0}
						<svelte:self topics={topic.children} {categoryId} parentId={topic.id} />
					{/if}
				{/snippet}
			</TreeNodeItem>
		{/each}
	{/if}
</div>
