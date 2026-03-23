<script lang="ts">
	import { SYSTEM_CONFIG, type FSRNode } from '$lib/config/filesystem';
	import { page } from '$app/state';
	import type { Component } from 'svelte';

	// Import the actual Svelte components
	import ContentTypeFolder from './filetypes/ContentTypeFolder.svelte';
	import ContentTypeWorkspace from './filetypes/ContentTypeWorkspace.svelte';
	import ContentTypeDocument from './filetypes/ContentTypeDocument.svelte';
	import ContentTypePreview from './filetypes/ContentTypePreview.svelte';
	import ContentTypeTasks from './filetypes/ContentTypeTasks.svelte';
	import ContentTypeNotSupported from './filetypes/ContentTypeNotSupported.svelte';
	import ContentTypeForbidden from './filetypes/ContentTypeForbidden.svelte';
	import { hasPermission } from '$lib/config/permissions';
	import { getFileConfig } from '$lib/utils/filesystem';

	let { node }: { node: FSRNode | null } = $props();
	type FSRComponent = Component<{ node: FSRNode }>;

	// This is the "Bridge" between your config strings and the actual code
	const componentRegistry = {
		ContentTypeFolder,
		ContentTypeWorkspace,
		ContentTypeDocument,
		ContentTypePreview,
		ContentTypeTasks,
		ContentTypeNotSupported
	};

	let ActiveComponent = $derived(() => {
		if (!node) return null;
		const config = getFileConfig(node.extension);
		return (componentRegistry[config.component] || ContentTypeNotSupported) as FSRComponent;
	});

	let hasAccess = $derived(() => {
		if (!node) return false;

		// Extract user and roles from the layout load function
		let currentUser = $derived(page.data.user);
		let activeRoles = $derived(page.data.activeRoles);

		if (!currentUser) return false;

		// Check if this filetype belongs to the restricted SYSTEM_FILE_TYPES list
		const isSystemFile = SYSTEM_CONFIG.SYSTEM_FILE_TYPES.includes(node.uiFileType as any);
		const scope = isSystemFile ? 'system.files' : 'files';

		// e.g., "system.files.secure.read" or "files.document.read"
		const requiredPermission = `${scope}.${node.uiFileType}.read`;

		return hasPermission(currentUser.role, requiredPermission, activeRoles);
	});
</script>

<div class="relative flex-1 overflow-y-auto">
	{#if !node}{:else if !hasAccess}
		<ContentTypeForbidden {node} />
	{:else}
		{#key node.id}
			{@const Component = ActiveComponent()}
			<Component {node} />
		{/key}
	{/if}
</div>
