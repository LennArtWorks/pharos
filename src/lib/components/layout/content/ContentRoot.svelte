<script lang="ts">
	import { SYSTEM_CONFIG, type VNode } from '$lib/config/filesystem';
	import { page } from '$app/state';
	import type { Component } from 'svelte';

	// Import the actual Svelte components
	import ContentTypeFolder from './filetypes/ContentTypeFolder.svelte';
	import ContentTypeDocument from './filetypes/ContentTypeDocument.svelte';
	import ContentTypePreview from './filetypes/ContentTypePreview.svelte';
	import ContentTypeTasks from './filetypes/ContentTypeTasks.svelte';
	import ContentTypeNotSupported from './filetypes/ContentTypeNotSupported.svelte';
	import ContentTypeForbidden from './filetypes/ContentTypeForbidden.svelte';
	import { hasPermission } from '$lib/utils/config/permissions';
	import { getFileConfig } from '$lib/utils/config/filesystem';

	let { node }: { node: VNode | null } = $props();
	type AppComponent = Component<{ node: VNode }>;

	// Bridge between config component-name strings and actual imported components.
	// ContentTypeWorkspace is merged into ContentTypeFolder (both show the same grid view).
	const componentRegistry: Record<string, AppComponent> = {
		ContentTypeFolder,
		ContentTypeWorkspace: ContentTypeFolder,
		ContentTypeDocument,
		// ContentTypePreview,
		// ContentTypeTasks,
		ContentTypeNotSupported
	};

	let currentUser = $derived(page.data.user);
	let activeRoles = $derived(page.data.activeRoles);

	let ActiveComponent = $derived.by(() => {
		if (!node) return null;
		const config = getFileConfig(node.extension);
		return (componentRegistry[config.component] || ContentTypeNotSupported) as AppComponent;
	});

	let hasAccess = $derived.by(() => {
		if (!node) return false;
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
			{@const Component = ActiveComponent ?? ContentTypeNotSupported}
			<Component {node} />
		{/key}
	{/if}
</div>
