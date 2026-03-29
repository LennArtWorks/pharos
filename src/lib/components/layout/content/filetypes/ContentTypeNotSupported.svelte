<script lang="ts">
	import type { FSRNode } from '$lib/config/filesystem';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import { getFileConfig } from '$lib/utils/config/filesystem';

	let { node }: { node: FSRNode } = $props();

	// Dynamically pull the exact config for this extension
	let config = $derived(getFileConfig(node.extension));

	// Safely get the icon, falling back to the circled question mark for true unknowns
	let iconName = $derived((config?.icon || 'circled-question-small') as FigmaIconName);

	// Format the date nicely
	let formattedDate = $derived(
		new Date(node.updatedAt).toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		})
	);

	function handleDownload() {
		// Navigating to the endpoint will automatically trigger the browser's download dialog
		// without navigating the user away from their current page!
		window.location.href = `/api/filesystem/download?id=${node.id}`;
	}
</script>

<div class="animate-in fade-in flex h-full w-full flex-col items-center justify-center p-8 text-center duration-300">
	<div class="bg-level-1 border-border mb-6 flex h-32 w-32 items-center justify-center rounded-2xl border shadow-sm">
		<Icon name={iconName} class="text-ink-40 h-16 w-16" stroke={1.5} />
	</div>

	<h2 class="text-text-primary mb-2 text-2xl font-semibold">Preview not available</h2>

	<p class="text-text-secondary mb-8 max-w-md">
		FSR-OS does not currently support viewing or editing <strong class="text-text-primary font-medium">{node.extension || 'this'}</strong> files directly in the browser. You can download it to view it locally.
	</p>

	<div class="bg-level-1 border-border mb-8 w-full max-w-sm rounded-lg border p-4 text-left shadow-sm">
		<div class="mb-3 flex justify-between text-sm">
			<span class="text-text-secondary">File Name</span>
			<span class="text-text-primary truncate pl-4 font-medium" title="{node.name}{node.extension}">
				{node.name}{node.extension}
			</span>
		</div>
		<div class="mb-3 flex justify-between text-sm">
			<span class="text-text-secondary">System Type</span>
			<span class="text-text-primary font-medium capitalize">
				{config.type === 'file' && node.uiFileType !== 'unknown' ? node.uiFileType : 'Unknown Binary'}
			</span>
		</div>
		<div class="flex justify-between text-sm">
			<span class="text-text-secondary">Last Modified</span>
			<span class="text-text-primary font-medium">{formattedDate}</span>
		</div>
	</div>

	<Button variant="primary" size="l" onclick={handleDownload}>
		{#snippet leading()}
			<Icon name="download" />
		{/snippet}
		{#snippet label()}
			Download File
		{/snippet}
	</Button>
</div>
