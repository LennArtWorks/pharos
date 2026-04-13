<script lang="ts">
	import Icon, { type FigmaIconName, iconGroups } from '$lib/components/ui/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { allComponents } from '../../../../data';
	import { FILE_TYPE_CONFIG, VIEW_CONFIG } from '$lib/config/filesystem';

	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';
	import TreeNodeItem from '$lib/components/blocks/NodeItem/TreeNodeItem.svelte';

	const allIcons = iconGroups.flatMap((g) => Object.keys(g.icons)) as FigmaIconName[];
	const allFileTypes = [...Object.keys(VIEW_CONFIG), ...Object.keys(FILE_TYPE_CONFIG.internal), ...Object.keys(FILE_TYPE_CONFIG.external)];

	const componentData = allComponents.find((c) => c.name === 'NodeItem');
	const aiContext = componentData?.context || 'Context not found.';

	type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'empty' | 'unstyled';
	type NodeSize = 's' | 'm' | 'l';

	// --- Sandbox State ---
	let fileName = $state('Project_Alpha');
	let filetype = $state('folder');
	let display = $state<'list' | 'grid'>('list'); // Explicitly typed
	let variant = $state<ButtonVariant>('tertiary'); // Explicitly typed
	let size = $state<NodeSize>('s'); // Explicitly typed

	let isWorkspace = $state(false);
	let isMinimized = $state(false);
	let isActive = $state(false);
	let isDisabled = $state(false);
	let isLoading = $state(false);
	let isEditing = $state(false);
	let hasNested = $state(false);
	let isOpen = $state(true);

	let customIcon = $state<string | null>(null);
	let dropState = $state<'before' | 'after' | 'inside' | null>(null);

	// --- Live Editor State ---
	let copiedCode = $state(false);
	let copiedAI = $state(false);
	let editableCode = $state('');
	let isCodeEditorFocused = $state(false);

	// Auto-generate code
	$effect(() => {
		if (isCodeEditorFocused) return;

		let niProps = [];
		if (filetype !== 'document') niProps.push(`filetype="${filetype}"`);
		if (display !== 'list') niProps.push(`display="${display}"`);
		if (variant !== 'tertiary') niProps.push(`variant="${variant}"`);
		if (size !== 's') niProps.push(`size="${size}"`);
		if (isWorkspace) niProps.push(`isWorkspace`);
		if (isMinimized) niProps.push(`minimized`);
		if (isActive) niProps.push(`active`);
		if (isEditing) niProps.push(`isEditing`);
		if (customIcon) niProps.push(`icon="${customIcon}"`);

		const niString = niProps.join(' ');

		let code = '';
		if (hasNested || dropState) {
			code = `<TreeNodeItem${isOpen ? ' isOpen' : ''}${hasNested ? ' hasChildren' : ''}${dropState ? ` dropState="${dropState}"` : ''}>\n`;
			code += `  {#snippet content(triggerSquish)}\n`;
			code += `    <NodeItem name="${fileName}" ${niString} onSquish={triggerSquish} />\n`;
			code += `  {/snippet}\n`;
			if (hasNested) {
				code += `  {#snippet children()}\n    <NodeItem name="Child_File.txt" filetype="document" />\n  {/snippet}\n`;
			}
			code += `</TreeNodeItem>`;
		} else {
			code = `<NodeItem name="${fileName}" ${niString} />`;
		}

		editableCode = code;
	});

	function resetSandbox() {
		fileName = 'Project_Alpha';
		filetype = 'folder';
		display = 'list';
		variant = 'tertiary';
		size = 's';
		isWorkspace = false;
		isMinimized = false;
		isActive = false;
		isEditing = false;
		hasNested = false;
		customIcon = null;
		dropState = null;
	}

	async function copyToClipboard(text: string, type: 'code' | 'ai') {
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'code') copiedCode = true;
			if (type === 'ai') copiedAI = true;
			setTimeout(() => {
				copiedCode = false;
				copiedAI = false;
			}, 2000);
		} catch (err) {
			console.error(err);
		}
	}
</script>

<div data-uiname="sandbox-page-wrapper" class="gap-3xl flex flex-col">
	<header data-uiname="sandbox-header" class="border-border pb-3xl border-b">
		<div data-uiname="header-title-row" class="gap-l mb-l flex items-center">
			<Button href="/dev/design-system" variant="secondary" size="s" iconOnly>
				<Icon name="arrow-left" />
			</Button>
			<h1 class="text-label-xl text-ink-90 font-bold">NodeItem & TreeNodeItem</h1>
		</div>
		<p class="text-body-m text-ink-50 mb-m max-w-50ch">
			The dual-component system for the filesystem. <strong>NodeItem</strong> handles visuals and file-type logic, while <strong>TreeNodeItem</strong> manages hierarchy, Drag-and-Drop indicators, and animations.
		</p>
		<Button variant="secondary" size="s" onclick={() => copyToClipboard(aiContext, 'ai')}>
			<Icon name="code-block" class="mr-2" /> AI Context
		</Button>
	</header>

	<section class="bg-level-1 border-border rounded-m flex flex-col border">
		<div class="bg-level-0 border-border relative flex min-h-100 flex-col items-center justify-center border-b p-12">
			<div class="w-full max-w-sm">
				<TreeNodeItem bind:isOpen hasChildren={hasNested} {isWorkspace} {dropState}>
					{#snippet content(triggerSquish)}
						<NodeItem
							name={fileName}
							{filetype}
							{display}
							{variant}
							{size}
							{isWorkspace}
							minimized={isMinimized}
							active={isActive}
							disabled={isDisabled}
							loading={isLoading}
							{isEditing}
							icon={(customIcon as FigmaIconName) || undefined}
							onSquish={triggerSquish}
							onToggle={(s) => (isOpen = s)}
							onsave={(n) => {
								fileName = n;
								isEditing = false;
							}}
							oncancel={() => (isEditing = false)}
							ondblclick={() => (isEditing = true)} />
					{/snippet}

					{#snippet children()}
						{#if hasNested}
							<NodeItem name="Nested_Asset.jpg" filetype="image" />
							<NodeItem name="Configuration.json" filetype="settings" />
						{/if}
					{/snippet}
				</TreeNodeItem>
			</div>
		</div>

		<Button variant="secondary" size="s" onclick={resetSandbox} class="mt-m ml-m absolute">Reset Sandbox</Button>

		<div class="grid grid-cols-1 gap-8 p-6 lg:grid-cols-3">
			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold uppercase">Identity</label>
					<Input bind:value={fileName} placeholder="Label..." />
					<Select.Root bind:value={filetype}>
						<Select.Trigger class="w-full" label="File Type" />
						<Select.Content class="max-h-[200px]">
							{#each allFileTypes as type}
								<Select.Item value={type}>{type}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold uppercase">Display Matrix</label>
					<div class="flex gap-2">
						<Button size="xs" variant={display === 'list' ? 'primary' : 'tertiary'} onclick={() => (display = 'list')}>List</Button>
						<Button size="xs" variant={display === 'grid' ? 'primary' : 'tertiary'} onclick={() => (display = 'grid')}>Grid</Button>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold uppercase">Styling</label>
					<Select.Root bind:value={variant}>
						<Select.Trigger class="w-full" label="Button Variant" />
						<Select.Content>
							{#each ['primary', 'secondary', 'tertiary', 'empty', 'unstyled'] as v}
								<Select.Item value={v}>{v}</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
					<div class="mt-1 flex gap-2">
						<Button size="xs" active={isWorkspace} variant="tertiary" onclick={() => (isWorkspace = !isWorkspace)}>Is Workspace</Button>
						<Button size="xs" active={isMinimized} variant="tertiary" onclick={() => (isMinimized = !isMinimized)}>Minimized</Button>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold uppercase">Hierarchy</label>
					<div class="flex gap-2">
						<Button size="xs" variant={hasNested ? 'primary' : 'tertiary'} onclick={() => (hasNested = !hasNested)}>Toggle Children</Button>
						<Button size="xs" variant={isOpen ? 'primary' : 'tertiary'} onclick={() => (isOpen = !isOpen)} disabled={!hasNested}>Toggle Open</Button>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold uppercase">D&D Drop State</label>
					<div class="flex flex-wrap gap-2">
						{#each [null, 'before', 'inside', 'after'] as state}
							<Button size="xs" variant={dropState === state ? 'primary' : 'tertiary'} onclick={() => (dropState = state as any)}>
								{state ?? 'none'}
							</Button>
						{/each}
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold uppercase">States</label>
					<div class="flex flex-wrap gap-2">
						<Button size="xs" active={isActive} variant="tertiary" onclick={() => (isActive = !isActive)}>Active</Button>
						<Button size="xs" active={isLoading} variant="tertiary" onclick={() => (isLoading = !isLoading)}>Loading</Button>
						<Button size="xs" active={isEditing} variant="tertiary" onclick={() => (isEditing = !isEditing)}>Editing</Button>
					</div>
				</div>
			</div>
		</div>

		<div class="border-border flex flex-col justify-between border-t bg-neutral-900 p-4 sm:flex-row sm:items-start">
			<textarea readonly value={editableCode} class="text-label-s text-ink-10 min-h-30 w-full border-none bg-transparent p-2 font-mono outline-none focus:ring-0"></textarea>

			<div class="mt-4 flex shrink-0 items-center gap-2 sm:mt-2">
				<Button variant="secondary" size="s" class="text-ink-10" onclick={() => copyToClipboard(editableCode, 'code')}>
					<Icon name="copy" class="mr-m" />
					{copiedCode ? 'Copied' : 'Copy Code'}
				</Button>
			</div>
		</div>
	</section>

	<section>
		<h2 class="text-label-m text-ink-90 mb-l font-bold">Common Patterns</h2>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div class="bg-level-1 border-border rounded-m border p-6">
				<h3 class="text-label-s text-ink-90 mb-4 font-bold">Workspace Sidebar Header</h3>
				<NodeItem name="Marketing" isWorkspace variant="unstyled" hasChildren isOpen />
			</div>
			<div class="bg-level-1 border-border rounded-m border p-6">
				<h3 class="text-label-s text-ink-90 mb-4 font-bold">Grid/Folder Gallery</h3>
				<div class="flex gap-2">
					<NodeItem name="Preview.png" filetype="image" display="grid" />
					<NodeItem name="Docs" filetype="folder" display="grid" />
				</div>
			</div>
			<div class="bg-level-1 border-border rounded-m border p-6">
				<h3 class="text-label-s text-ink-90 mb-4 font-bold">Renaming Mode</h3>
				<NodeItem name="Old_Name" isEditing onsave={() => {}} oncancel={() => {}} />
			</div>
		</div>
	</section>
</div>
