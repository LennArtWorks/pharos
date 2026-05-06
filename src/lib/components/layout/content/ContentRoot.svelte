<script lang="ts">
	import { SYSTEM_CONFIG, type VNode } from '$lib/config/filesystem';
	import type { Component } from 'svelte';
	import ContentTypeFolder from './filetypes/ContentTypeFolder.svelte';
	import ContentTypeDocument from './filetypes/ContentTypeDocument.svelte';
	import ContentTypeNotSupported from './filetypes/ContentTypeNotSupported.svelte';
	import ContentTypeForbidden from './filetypes/ContentTypeForbidden.svelte';
	import { has } from '$lib/utils/config/permissions';
	import { getFileConfig } from '$lib/utils/config/filesystem';

	let { node }: { node: VNode | null } = $props();
	type AppComponent = Component<{ node: VNode }>;

	const componentRegistry: Record<string, AppComponent> = {
		ContentTypeFolder,
		ContentTypeWorkspace: ContentTypeFolder,
		ContentTypeDocument,
		ContentTypeNotSupported
	};

	let ActiveComponent = $derived.by(() => {
		if (!node) return null;
		const config = getFileConfig(node.extension);
		return (componentRegistry[config.component] || ContentTypeNotSupported) as AppComponent;
	});

	let hasAccess = $derived.by(() => {
		if (!node) return false;
		const isSystemFile = SYSTEM_CONFIG.SYSTEM_FILE_TYPES.includes(node.uiFileType as any);
		const scope = isSystemFile ? 'system.files' : 'files';
		return has(`${scope}.${node.uiFileType}.read`);
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
