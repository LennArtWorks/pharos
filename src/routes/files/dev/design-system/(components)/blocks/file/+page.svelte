<script lang="ts">
	import File from '$lib/components/blocks/File.svelte';
	import Icon, { type FigmaIconName, iconGroups } from '$lib/components/ui/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { allComponents } from '../../../../data';
	import { FILE_TYPE_CONFIG, VIEW_CONFIG } from '$lib/config/filesystem';

	const allIcons = iconGroups.flatMap((g) => Object.keys(g.icons)) as FigmaIconName[];

	const allFileTypes = [...Object.keys(VIEW_CONFIG), ...Object.keys(FILE_TYPE_CONFIG.internal), ...Object.keys(FILE_TYPE_CONFIG.external)];

	const componentData = allComponents.find((c) => c.name === 'File');
	const aiContext = componentData?.context || 'Context not found.';

	// --- Sandbox State ---
	let fileName = $state('Project_Alpha');
	let filetype = $state('folder');
	let mode = $state<'default' | 'preview'>('default');
	let isMinimized = $state(false);
	let isActive = $state(false);
	let isDisabled = $state(false);
	let isLoading = $state(false);
	let isEditing = $state(false);
	let editValue = $state('Project_Alpha');
	let hasNested = $state(false);
	let customIcon = $state<string | null>(null); // Changed to null
	let dropState = $state<'before' | 'after' | 'inside' | null>(null);

	// --- Live Editor State ---
	let copiedCode = $state(false);
	let copiedAI = $state(false);
	let editableCode = $state('');
	let isCodeEditorFocused = $state(false);

	// Auto-generate code
	$effect(() => {
		if (isCodeEditorFocused) return;

		let props = [];
		if (filetype !== 'document') props.push(`filetype="${filetype}"`);
		if (customIcon) props.push(`customIcon="${customIcon}"`);
		if (mode !== 'default') props.push(`mode="${mode}"`);
		if (isMinimized) props.push(`minimized`);
		if (isActive) props.push(`active`);
		if (isDisabled) props.push(`disabled`);
		if (isLoading) props.push(`loading`);
		if (isEditing) {
			props.push(`isEditing`);
			props.push(`bind:editValue={editValue}`);
		}
		if (dropState) props.push(`dropState="${dropState}"`);

		const propsString = props.length > 0 ? ' ' + props.join(' ') : '';

		let code = `<File${propsString}>\n  ${fileName}`;
		if (hasNested) {
			code += `\n  {#snippet nestedItems()}\n    <File filetype="document">Child_File.txt</File>\n  {/snippet}`;
		}
		code += `\n</File>`;

		editableCode = code;
	});

	// Parse manual code input
	function handleCodeInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		editableCode = target.value;
		const code = editableCode;

		const extractString = (prop: string) => {
			const match = code.match(new RegExp(`${prop}="([^"]*)"`));
			return match ? match[1] : '';
		};

		const extractBool = (prop: string) => {
			return new RegExp(`\\b${prop}\\b(?!=")`).test(code);
		};

		filetype = extractString('filetype') || 'document';
		customIcon = extractString('customIcon') || null; // Changed to null
		mode = (extractString('mode') as any) || 'default';
		dropState = (extractString('dropState') as any) || null;

		isMinimized = extractBool('minimized');
		isActive = extractBool('active');
		isDisabled = extractBool('disabled');
		isLoading = extractBool('loading');
		isEditing = extractBool('isEditing');

		hasNested = code.includes('{#snippet nestedItems()}');

		let innerText = code.replace(/<File[^>]*>/g, '').replace(/<\/File>/g, '');
		innerText = innerText.replace(/\{#snippet [^}]+\}[\s\S]*?\{\/snippet\}/g, '');
		fileName = innerText.trim() || 'Project_Alpha';
	}

	function resetSandbox() {
		fileName = 'Project_Alpha';
		filetype = 'folder';
		mode = 'default';
		isMinimized = false;
		isActive = false;
		isDisabled = false;
		isLoading = false;
		isEditing = false;
		hasNested = false;
		customIcon = null; // Changed to null
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

	function handleSave(newName: string) {
		fileName = newName;
		editValue = newName;
		isEditing = false;
	}
</script>

<div data-uiname="sandbox-page-wrapper" class="gap-3xl flex flex-col">
	<header data-uiname="sandbox-header" class="border-border pb-3xl border-b">
		<div data-uiname="header-title-row" class="gap-l mb-l flex items-center">
			<Button href="/files/dev/design-system" variant="secondary" size="s" icon>
				<Icon name="arrow-left" />
			</Button>
			<h1 class="text-label-xl text-ink-90 font-bold">File Block</h1>
		</div>
		<p class="text-body-m text-ink-50 mb-m max-w-2xl">
			The standard representation of a filesystem node. It handles folder nesting, inline renaming, drag-and-drop visual states, and automatic icon mapping based on file extensions.
		</p>
		<Button variant="secondary" size="s" data-tooltip={copiedAI ? '<b>Context Copied!</b>' : 'Copy instructions for AI Prompting'} onclick={() => copyToClipboard(aiContext, 'ai')}>
			<Icon name="code-block" class="mr-2" /> AI Context
		</Button>
	</header>

	<section class="bg-level-1 border-border rounded-m flex flex-col border">
		<div class="bg-level-0 border-border relative flex min-h-[300px] flex-col items-center justify-center border-b p-12">
			<File
				{filetype}
				{mode}
				minimized={isMinimized}
				active={isActive}
				disabled={isDisabled}
				loading={isLoading}
				{isEditing}
				bind:editValue
				customIcon={(customIcon as FigmaIconName) || undefined}
				{dropState}
				hasChildren={hasNested}
				ondblclick={() => {
					isEditing = true;
					editValue = fileName;
				}}
				onsave={handleSave}
				oncancel={() => {
					isEditing = false;
					editValue = fileName;
				}}>
				{fileName}
				{#snippet nestedItems()}
					{#if hasNested}
						<File filetype="document">Sub_Document_01.pdf</File>
						<File filetype="image">Asset_Preview.png</File>
					{/if}
				{/snippet}
			</File>
		</div>

		<Button variant="secondary" size="s" onclick={resetSandbox} class="mt-m ml-m absolute">Reset Sandbox</Button>

		<div class="grid grid-cols-1 gap-8 p-6 lg:grid-cols-3">
			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold">File Type / Icon</label>
					<div class="flex gap-2">
						<Select.Root bind:value={filetype}>
							<Select.Trigger class="w-full" />
							<Select.Content class="max-h-[250px] overflow-y-auto">
								{#each allFileTypes as type}
									<Select.Item value={type} class="h-main-xs">{type}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold">Custom Icon</label>
					<Select.Root bind:value={customIcon}>
						<Select.Trigger class="w-full" placeholder="Default mapped" />
						<Select.Content class="max-h-[250px] overflow-y-auto">
							<Select.Item value={null} class="h-main-xs">Auto-map by File Type</Select.Item>
							{#each allIcons as iconName}
								<Select.Item value={iconName} class="h-main-xs">
									<Icon name={iconName} class="mr-2 h-4 w-4" />
									<span class="truncate">{iconName}</span>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold">Mode</label>
					<div class="flex gap-2">
						<Button size="s" variant={mode === 'default' ? 'primary' : 'tertiary'} onclick={() => (mode = 'default')}>Default</Button>
						<Button size="s" variant={mode === 'preview' ? 'primary' : 'tertiary'} onclick={() => (mode = 'preview')}>Preview</Button>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold">Name</label>
					<Input bind:value={fileName} placeholder="File name..." disabled={isEditing} />
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold">Hierarchy</label>
					<Button size="s" variant={hasNested ? 'primary' : 'tertiary'} onclick={() => (hasNested = !hasNested)}>
						{hasNested ? 'Remove Children' : 'Add Children'}
					</Button>
				</div>
			</div>

			<div class="flex flex-col gap-6">
				<label class="text-label-xs text-ink-50 font-bold">Interaction States</label>
				<div class="flex flex-wrap gap-2">
					<Button size="s" active={isMinimized} variant="tertiary" onclick={() => (isMinimized = !isMinimized)}>Minimized</Button>
					<Button size="s" active={isLoading} variant="tertiary" onclick={() => (isLoading = !isLoading)}>Loading</Button>
					<Button
						size="s"
						active={isEditing}
						variant="tertiary"
						onclick={() => {
							isEditing = !isEditing;
							if (isEditing) editValue = fileName;
						}}>Editing</Button>
					<Button size="s" active={isActive} variant="tertiary" onclick={() => (isActive = !isActive)}>Active</Button>
				</div>

				<div class="flex flex-col gap-2">
					<label class="text-label-xs text-ink-50 font-bold">Drop Indicator</label>
					<div class="flex flex-wrap gap-2">
						{#each [null, 'before', 'inside', 'after'] as state}
							<Button size="xs" variant={dropState === state ? 'primary' : 'tertiary'} onclick={() => (dropState = state as any)}>
								{state ?? 'none'}
							</Button>
						{/each}
					</div>
				</div>
			</div>
		</div>

		<div class="border-border flex flex-col justify-between border-t bg-neutral-800 p-4 sm:flex-row sm:items-start">
			<textarea
				value={editableCode}
				oninput={handleCodeInput}
				onfocus={() => (isCodeEditorFocused = true)}
				onblur={() => (isCodeEditorFocused = false)}
				class="text-label-s text-ink-10 min-h-[120px] w-full border-none bg-transparent p-2 font-mono outline-none focus:ring-0"
				spellcheck="false"></textarea>

			<div class="mt-4 flex shrink-0 items-center gap-2 sm:mt-2">
				<Button variant="secondary" size="s" class="text-ink-10 hover:text-ink-90" onclick={() => copyToClipboard(editableCode, 'code')}>
					<Icon name="copy" class="mr-m" />
					{copiedCode ? 'Copied' : 'Code'}
				</Button>
			</div>
		</div>
	</section>

	<section>
		<h2 class="text-label-m text-ink-90 mb-l font-bold">Common Patterns</h2>
		<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div class="bg-level-1 border-border rounded-m border p-6">
				<h3 class="text-label-s text-ink-90 mb-2 font-bold">Sidebar Folder</h3>
				<div class="bg-level-0 border-border mb-4 flex h-24 items-center justify-center rounded border px-4">
					<File filetype="folder" hasChildren>Work Projects</File>
				</div>
			</div>
			<div class="bg-level-1 border-border rounded-m border p-6">
				<h3 class="text-label-s text-ink-90 mb-2 font-bold">Asset Preview</h3>
				<div class="bg-level-0 border-border mb-4 flex h-24 items-center justify-center rounded border px-4">
					<File filetype="image" mode="preview">header_bg.jpg</File>
				</div>
			</div>
			<div class="bg-level-1 border-border rounded-m border p-6">
				<h3 class="text-label-s text-ink-90 mb-2 font-bold">Renaming State</h3>
				<div class="bg-level-0 border-border mb-4 flex h-24 items-center justify-center rounded border px-4">
					<File isEditing editValue="new_report_v2">new_report_v2</File>
				</div>
			</div>
		</div>
	</section>

	<section>
		<h2 class="text-label-m text-ink-90 mb-l font-bold">API Reference</h2>
		<div class="border-border rounded-m overflow-hidden border">
			<table class="w-full text-left">
				<thead class="bg-level-1 border-border text-label-s text-ink-50 border-b">
					<tr>
						<th class="p-4 font-bold">Prop</th>
						<th class="p-4 font-bold">Type</th>
						<th class="p-4 font-bold">Default</th>
						<th class="p-4 font-bold">Description</th>
					</tr>
				</thead>
				<tbody class="text-body-s text-ink-90 divide-border divide-y">
					<tr>
						<td class="p-4 font-mono font-bold">filetype</td>
						<td class="text-ink-50 p-4 font-mono">string</td>
						<td class="p-4 font-mono">'document'</td>
						<td>Determines default icon mapping.</td>
					</tr>
					<tr>
						<td class="p-4 font-mono font-bold">customIcon</td>
						<td class="text-ink-50 p-4 font-mono">string</td>
						<td class="p-4 font-mono">undefined</td>
						<td>Overrides the filetype icon mapping.</td>
					</tr>
					<tr>
						<td class="p-4 font-mono font-bold">mode</td>
						<td class="text-ink-50 p-4 font-mono">'default' | 'preview'</td>
						<td class="p-4 font-mono">'default'</td>
						<td>'preview' uses larger icons (size 'l').</td>
					</tr>
					<tr>
						<td class="p-4 font-mono font-bold">isEditing</td>
						<td class="text-ink-50 p-4 font-mono">boolean</td>
						<td class="p-4 font-mono">false</td>
						<td>Swaps the label for a text input.</td>
					</tr>
					<tr>
						<td class="p-4 font-mono font-bold">nestedItems</td>
						<td class="text-ink-50 p-4 font-mono">snippet</td>
						<td class="p-4 font-mono">-</td>
						<td>Snippet for recursive folder structures.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>
