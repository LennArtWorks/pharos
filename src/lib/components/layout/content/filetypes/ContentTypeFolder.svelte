<script lang="ts">
	import { goto } from '$app/navigation';
	import type { VNode } from '$lib/config/filesystem';
	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';

	let { node }: { node: VNode } = $props();

	let children = $derived(node.children ?? []);
	let emptyLabel = $derived(node.type === 'workspace' ? 'This workspace is empty' : 'This folder is empty');
</script>

{#if children.length === 0}
	<div class="text-ink-40 flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
		<p>{emptyLabel}</p>
	</div>
{:else}
	<div class="flex flex-wrap gap-4 p-8">
		{#each children as child (child.id)}
			<NodeItem
				node={child}
				display="grid"
				tagName="button"
				ondblclick={() => goto(`/files/${child.id}`)} />
		{/each}
	</div>
{/if}
