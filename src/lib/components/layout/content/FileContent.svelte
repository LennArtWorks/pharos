<script lang="ts">
	import type { FileData } from '$lib/types';
	import FileTypeDocument from './types/FileTypeDocument.svelte';
	import FileTypeSpreadsheet from './types/FileTypeSpreadsheet.svelte';
	import FileTypeTask from './types/FileTypeTask.svelte';
	import FileTypeUnknown from './types/FileTypeUnknown.svelte';

	let { file }: { file: FileData } = $props();

	// Map file extensions/types to their specific components
	const typeMap = {
		document: FileTypeDocument,
		spreadsheet: FileTypeSpreadsheet,
		task: FileTypeTask
		// Add more as fsr-os grows
	};

	// Determine which component to show based on the metadata
	let SelectedComponent = $derived(typeMap[file.type] || FileTypeUnknown);
</script>

<div data-ui="file-content-wrapper" class="h-full w-full">
	<SelectedComponent {file} />
</div>
