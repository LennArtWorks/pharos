<script lang="ts">
	import type { FSRNode } from '$lib/config/filesystem';
	let { node }: { node: FSRNode } = $props();
</script>

<div class="p-8">
	<h1 class="mb-4 text-3xl font-bold">{node.name}</h1>
	<p class="text-ink-50">This is a placeholder for the Folder/Workspace Grid View.</p>
	<p class="text-ink-30 mt-4 text-sm">ID: {node.id}</p>
</div>
