<script lang="ts">
	import type { FSRNode } from '$lib/config/filesystem';
	import FileContentDocument from './filetypes/FileContentDocument.svelte';
	import FileContentFolder from './filetypes/FileContentFolder.svelte';

	let { node }: { node: FSRNode | null } = $props();
</script>

<div class="flex-1 overflow-y-auto">
	{#if !node}
		<div class="text-ink-40 flex h-full items-center justify-center">
			<p>File not found or loading...</p>
		</div>
	{:else}
		{#key node.id}
			{#if node.type === 'workspace' || node.type === 'folder' || node.uiFileType === 'folder'}
				<FileContentFolder {node} />
			{:else if node.uiFileType === 'document'}
				<FileContentDocument {node} />
			{:else}
				<div class="p-8">
					<h1 class="mb-4 text-3xl font-bold">{node.name}</h1>
					<p class="text-ink-50">Preview not available for this file type ({node.uiFileType}).</p>
				</div>
			{/if}
		{/key}
	{/if}
</div>
