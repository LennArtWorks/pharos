<script lang="ts">
	import * as Select from '$lib/components/ui/Select';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { iconMap, type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { allComponents } from '../../../../data';

	const allIcons = Object.keys(iconMap) as FigmaIconName[];

	const componentData = allComponents.find((c) => c.name === 'Select');
	const aiContext = componentData?.context || 'Context not found.';

	type SelectItem = {
		id: string;
		value: string;
		label: string;
		icon?: FigmaIconName;
		isDefault?: boolean;
	};

	// --- Sandbox State ---
	let selectedValue = $state<string | number | null>(null);
	let labelText = $state('Role');
	let placeholderText = $state('Select a role...');
	let isRequired = $state(false);
	let includeIcons = $state(true);

	// Dynamic Items Array
	let items = $state<SelectItem[]>([
		{ id: 'item-1', value: 'admin', label: 'Admin', icon: 'star' },
		{ id: 'item-2', value: 'editor', label: 'Editor', icon: 'pencil' },
		{ id: 'item-3', value: 'viewer', label: 'Viewer', icon: 'eye' }
	]);

	let activeItem = $derived(items.find((i) => i.value === selectedValue));

	// --- Live Editor & Linter State ---
	let copiedCode = $state(false);
	let copiedAI = $state(false);
	let editableCode = $state('');
	let isCodeEditorFocused = $state(false);

	let overlayRef = $state<HTMLDivElement | null>(null);

	// Syntax Linter: Checks if there are multiple 'default' props
	let hasCodeError = $derived.by(() => {
		const defaultMatches = editableCode.match(/<Select\.Item[^>]*\bdefault\b[^>]*>/g);
		return defaultMatches && defaultMatches.length > 1;
	});

	// Generates the highlighted background code for the textarea
	let highlightedCode = $derived.by(() => {
		let safe = editableCode.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
		if (hasCodeError) {
			safe = safe.replace(
				/\bdefault\b/g,
				`<span class="border-error text-transparent border-b-2 pointer-events-auto cursor-help" data-tooltip="<b>Syntax Error</b><br/>Only one Select.Item can be the default.">default</span>`
			);
		}
		// Add extra space at the end to perfectly match textarea scrolling behavior
		return safe + '\n';
	});

	let nextId = 4;

	function addItem() {
		items = [...items, { id: `item-${nextId++}`, value: `option-${nextId}`, label: `Option ${nextId}`, icon: 'circled-check' as FigmaIconName }];
	}

	function removeItem(idToRemove: string) {
		items = items.filter((item) => item.id !== idToRemove);
		if (selectedValue === items.find((i) => i.id === idToRemove)?.value) {
			selectedValue = null;
		}
	}

	function setAsDefault(idToSet: string) {
		items = items.map((item) => ({
			...item,
			isDefault: item.id === idToSet
		}));
		const newDefault = items.find((i) => i.isDefault);
		if (newDefault) selectedValue = newDefault.value;
	}

	function clearDefault() {
		items = items.map((item) => ({ ...item, isDefault: false }));
	}

	// Auto-generate code when UI controls change
	$effect(() => {
		const currentLabel = labelText;
		const currentPlaceholder = placeholderText;
		const currentRequired = isRequired;
		const currentIncludeIcons = includeIcons;
		const currentItems = items.map((i) => ({ ...i }));

		if (isCodeEditorFocused) return;

		let triggerProps = [];
		if (currentLabel) triggerProps.push(`label="${currentLabel}"`);
		if (currentPlaceholder && currentPlaceholder !== 'Select...') triggerProps.push(`placeholder="${currentPlaceholder}"`);
		if (currentRequired) triggerProps.push(`required`);

		const triggerPropsStr = triggerProps.length > 0 ? ' ' + triggerProps.join(' ') : '';

		let code = `<Select.Root bind:value={selectedValue}>\n`;
		code += `  <Select.Trigger${triggerPropsStr} />\n`;
		code += `  <Select.Content>\n`;

		for (const item of currentItems) {
			const defaultAttr = item.isDefault ? ' default' : '';

			if (currentIncludeIcons && item.icon) {
				code += `    <Select.Item value="${item.value}"${defaultAttr}>\n`;
				code += `      <Icon name="${item.icon}" class="text-ink-50 mr-2 h-4 w-4" /> ${item.label}\n`;
				code += `    </Select.Item>\n`;
			} else {
				code += `    <Select.Item value="${item.value}" label="${item.label}"${defaultAttr} />\n`;
			}
		}

		code += `  </Select.Content>\n`;
		code += `</Select.Root>`;

		editableCode = code;
	});

	// Parse manual code input & apply Linter rules
	function handleCodeInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		editableCode = target.value;
		const code = editableCode;

		// Linter Barrier: Stop parsing into the UI if syntax is broken
		if (hasCodeError) return;

		const triggerMatch = code.match(/<Select\.Trigger([^>]+)\/?>/);
		if (triggerMatch) {
			const triggerAttr = triggerMatch[1];
			const labelMatch = triggerAttr.match(/label="([^"]*)"/);
			labelText = labelMatch ? labelMatch[1] : '';

			const placeholderMatch = triggerAttr.match(/placeholder="([^"]*)"/);
			placeholderText = placeholderMatch ? placeholderMatch[1] : 'Select...';

			isRequired = /\brequired\b(?!=")/.test(triggerAttr);
		}

		const contentMatch = code.match(/<Select\.Content[\s\S]*?>([\s\S]*?)<\/Select\.Content>/);
		if (contentMatch) {
			const innerContent = contentMatch[1];
			const itemRegex = /<Select\.Item\s+([^>]*?)(?:>(.*?)<\/Select\.Item>|\/?>)/gs;

			let match;
			const parsedItems: SelectItem[] = [];
			let foundIcons = false;

			while ((match = itemRegex.exec(innerContent)) !== null) {
				const attrs = match[1];
				const inner = match[2] || '';

				const valMatch = attrs.match(/value="([^"]*)"/);
				const value = valMatch ? valMatch[1] : `parsed-${Date.now()}`;

				const labelAttrMatch = attrs.match(/label="([^"]*)"/);
				let label = labelAttrMatch ? labelAttrMatch[1] : '';

				const isDefault = /\bdefault\b(?!=")/.test(attrs);

				let icon: FigmaIconName | undefined = undefined;
				const iconMatch = inner.match(/<Icon[^>]*name="([^"]+)"/);
				if (iconMatch) {
					icon = iconMatch[1] as FigmaIconName;
					foundIcons = true;
				}

				if (!label && inner) {
					label = inner.replace(/<Icon[^>]*>/, '').trim();
				}

				parsedItems.push({
					id: `parsed-${Math.random().toString(36).substr(2, 9)}`,
					value,
					label,
					icon,
					isDefault
				});
			}

			if (parsedItems.length > 0) {
				items = parsedItems.map((pi, index) => ({
					...pi,
					id: items[index] ? items[index].id : pi.id
				}));
				includeIcons = foundIcons;

				const newDefault = items.find((i) => i.isDefault);
				if (newDefault && selectedValue === null) selectedValue = newDefault.value;
			}
		}
	}

	function syncScroll(e: UIEvent) {
		if (overlayRef) {
			const target = e.currentTarget as HTMLTextAreaElement;
			overlayRef.scrollTop = target.scrollTop;
			overlayRef.scrollLeft = target.scrollLeft;
		}
	}

	function resetSandbox() {
		selectedValue = null;
		labelText = 'Role';
		placeholderText = 'Select a role...';
		isRequired = false;
		includeIcons = true;
		items = [
			{ id: 'item-1', value: 'admin', label: 'Admin', icon: 'star' },
			{ id: 'item-2', value: 'editor', label: 'Editor', icon: 'pencil' },
			{ id: 'item-3', value: 'viewer', label: 'Viewer', icon: 'eye' }
		];
	}

	async function copyToClipboard(text: string, copyType: 'code' | 'ai') {
		try {
			await navigator.clipboard.writeText(text);
			if (copyType === 'code') copiedCode = true;
			if (copyType === 'ai') copiedAI = true;
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
			<Button data-uiname="back-button" href="/files/dev/design-system/ui" variant="secondary" size="s" icon data-tooltip="Back to UI">
				<Icon data-uiname="back-button-icon" name="arrow-left" />
			</Button>
			<h1 data-uiname="sandbox-title" class="text-label-xl text-ink-90 font-bold">Select</h1>
		</div>
		<p data-uiname="sandbox-description" class="text-body-m text-ink-50 mb-m max-w-2xl">
			A contextual dropdown menu allowing users to choose a value from a predefined list. Built on top of the Popover component, it features active state synchronization, floating UI positioning, and
			rich content support via snippets.
		</p>
		<Button
			data-uiname="ai-context-button"
			variant="secondary"
			size="s"
			data-tooltip={copiedAI ? '<b>Context Copied!</b>' : 'Copy instructions for AI Prompting'}
			onclick={() => copyToClipboard(aiContext, 'ai')}>
			<Icon data-uiname="ai-context-icon" name="code-block" class="mr-2" /> AI Context
		</Button>
	</header>

	<section data-uiname="sandbox-interactive-area" class="bg-level-1 border-border rounded-m flex flex-col overflow-hidden border">
		<div data-uiname="sandbox-preview-container" class="bg-level-0 border-border relative flex min-h-[360px] items-start justify-center border-b p-12">
			<div data-uiname="sandbox-preview-wrapper" class="w-full max-w-[280px]">
				<Select.Root bind:value={selectedValue}>
					<Select.Trigger label={labelText} placeholder={placeholderText} required={isRequired}>
						{#if selectedValue !== null && activeItem}
							{#if includeIcons && activeItem.icon}
								<Icon data-uiname={`trigger-icon-${activeItem.icon}`} name={activeItem.icon} class="text-ink-50 mr-2 h-4 w-4" /> {activeItem.label}
							{:else}
								{activeItem.label}
							{/if}
						{:else}
							<span data-uiname="preview-trigger-placeholder" class="text-ink-50 font-normal">{placeholderText || 'Select...'}</span>
						{/if}
					</Select.Trigger>

					<Select.Content>
						{#each items as item (item.id)}
							<Select.Item data-uiname={`preview-item-${item.value}`} value={item.value} label={includeIcons ? undefined : item.label} default={item.isDefault}>
								{#if includeIcons && item.icon}
									<Icon data-uiname={`preview-icon-${item.icon}`} name={item.icon} class="text-ink-50 mr-2 h-4 w-4" /> {item.label}
								{/if}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>

			<Button data-uiname="reset-sandbox-button" variant="secondary" size="s" onclick={resetSandbox} class="mt-m ml-m absolute top-0 left-0">Reset Sandbox</Button>
		</div>

		<div data-uiname="sandbox-controls-grid" class="flex flex-col gap-8 p-6 lg:flex-row">
			<div data-uiname="controls-col-trigger" class="flex flex-[1] flex-col gap-6">
				<div data-uiname="control-group-trigger" class="flex flex-col gap-2">
					<label data-uiname="control-label-trigger" class="text-label-xs text-ink-50 font-bold">Trigger Content</label>
					<Input data-uiname="control-input-label" bind:value={labelText} placeholder="Label Text" class="mb-2 max-w-[200px]" />
					<Input data-uiname="control-input-placeholder" bind:value={placeholderText} placeholder="Placeholder" class="mb-2 max-w-[200px]" />
					<Button data-uiname="state-btn-required" size="s" variant={isRequired ? 'primary' : 'tertiary'} active={isRequired} onclick={() => (isRequired = !isRequired)} class="w-max"
						>Required State (*)</Button>
				</div>
			</div>

			<div data-uiname="controls-col-builder" class="flex flex-[2.5] flex-col gap-6">
				<div data-uiname="control-group-builder" class="flex flex-col gap-4">
					<div class="flex items-center justify-between">
						<label data-uiname="control-label-builder" class="text-label-xs text-ink-50 font-bold">Options Builder</label>
						<div class="flex gap-2">
							<Button data-uiname="clear-default-btn" size="s" variant="tertiary" onclick={clearDefault}>Clear Default</Button>
							<Button data-uiname="toggle-icons-btn" size="s" variant={includeIcons ? 'primary' : 'tertiary'} active={includeIcons} onclick={() => (includeIcons = !includeIcons)}>
								{#if includeIcons}Hide Icons{:else}Show Icons{/if}
							</Button>
						</div>
					</div>

					<div data-uiname="builder-items-list" class="flex flex-col gap-3">
						<div class="text-label-xs text-ink-50 grid grid-cols-[32px_1fr_1fr_120px_32px] gap-2 px-2">
							<span title="Set Default" class="text-center">Def.</span>
							<span>Value</span>
							<span>Label</span>
							{#if includeIcons}<span>Icon</span>{/if}
							<span></span>
						</div>

						{#each items as item (item.id)}
							<div data-uiname={`builder-row-${item.id}`} class="bg-level-2 border-border flex items-center gap-2 rounded-lg border p-2">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center">
									<input
										data-uiname={`builder-default-btn-${item.id}`}
										type="radio"
										name="default-item-radio"
										checked={item.isDefault}
										onchange={() => setAsDefault(item.id)}
										class="bg-level-1 border-border text-purpur-500 focus:ring-purpur-500 h-4 w-4 cursor-pointer"
										data-tooltip="Set as default" />
								</div>

								<Input data-uiname={`builder-val-${item.id}`} bind:value={item.value} placeholder="Value" class="min-w-[80px] flex-1" />
								<Input data-uiname={`builder-label-${item.id}`} bind:value={item.label} placeholder="Label" class="min-w-[80px] flex-1" />

								{#if includeIcons}
									<div data-uiname={`builder-icon-wrapper-${item.id}`} class="w-[140px] shrink-0">
										<Select.Root bind:value={item.icon}>
											<Select.Trigger placeholder="Icon">
												{#if item.icon}
													<Icon data-uiname={`builder-icon-active-${item.icon}`} name={item.icon} class="mr-2 h-4 w-4" />
													<span class="truncate">{item.icon}</span>
												{:else}
													<span data-uiname={`builder-icon-placeholder-${item.id}`} class="text-ink-50 font-normal">Select Icon</span>
												{/if}
											</Select.Trigger>

											<Select.Content class="max-h-[240px] overflow-y-auto">
												{#each allIcons as iconName}
													<Select.Item data-uiname={`builder-icon-item-${iconName}`} value={iconName}>
														<Icon data-uiname={`builder-icon-preview-${iconName}`} name={iconName} class="mr-2 h-4 w-4" />
														<span class="truncate">{iconName}</span>
													</Select.Item>
												{/each}
											</Select.Content>
										</Select.Root>
									</div>
								{/if}

								<Button data-uiname={`builder-del-${item.id}`} variant="tertiary" size="s" icon onclick={() => removeItem(item.id)} class="text-error hover:bg-error/10">
									<Icon data-uiname={`builder-del-icon-${item.id}`} name="trash" />
								</Button>
							</div>
						{/each}
					</div>

					<Button data-uiname="builder-add-btn" variant="secondary" size="s" onclick={addItem} class="w-full border-dashed">
						<Icon data-uiname="builder-add-icon" name="add" class="mr-2" /> Add Option
					</Button>
				</div>
			</div>
		</div>

		<div data-uiname="sandbox-code-editor-wrapper" class="border-border relative flex min-h-[260px] flex-col justify-between border-t bg-neutral-800 sm:flex-row sm:items-start">
			<div
				data-uiname="live-code-overlay"
				bind:this={overlayRef}
				class="text-label-s pointer-events-none absolute inset-0 overflow-hidden p-6 font-mono break-words whitespace-pre-wrap text-transparent"
				aria-hidden="true">
				{@html highlightedCode}
			</div>

			<textarea
				data-uiname="live-code-textarea"
				value={editableCode}
				oninput={handleCodeInput}
				onfocus={() => (isCodeEditorFocused = true)}
				onblur={() => (isCodeEditorFocused = false)}
				onscroll={syncScroll}
				class="text-label-s text-ink-10 z-10 min-h-[260px] w-full resize-none border-none bg-transparent p-6 font-mono outline-none focus:ring-0"
				spellcheck="false"></textarea>

			<div data-uiname="code-actions-wrapper" class="absolute top-4 right-4 z-20 flex shrink-0 items-center gap-2">
				<Button
					data-uiname="copy-code-button"
					variant="secondary"
					size="s"
					class="text-ink-10 hover:text-ink-90"
					data-tooltip={copiedCode ? '<b>Copied!</b>' : 'Copy Component Code'}
					onclick={() => copyToClipboard(editableCode, 'code')}>
					<Icon data-uiname="copy-code-icon" name="copy" class="mr-m" /> Code
				</Button>
			</div>
		</div>
	</section>

	<section data-uiname="api-reference-section">
		<h2 data-uiname="api-reference-title" class="text-label-m text-ink-90 mb-l font-bold">API Reference</h2>

		<h3 data-uiname="api-subtitle-root" class="text-label-s text-ink-90 mt-6 mb-2 font-bold">Select.Root</h3>

		<div data-uiname="api-table-wrapper-root" class="border-border rounded-m overflow-hidden border">
			<table data-uiname="api-table-root" class="w-full text-left">
				<thead data-uiname="api-table-head-root" class="bg-level-1 border-border text-label-s text-ink-50 border-b">
					<tr data-uiname="api-table-head-row-root">
						<th data-uiname="api-th-prop-root" class="p-4 font-bold">Prop</th>

						<th data-uiname="api-th-type-root" class="p-4 font-bold">Type</th>

						<th data-uiname="api-th-default-root" class="p-4 font-bold">Default</th>

						<th data-uiname="api-th-desc-root" class="p-4 font-bold">Description</th>
					</tr>
				</thead>

				<tbody data-uiname="api-table-body-root" class="text-body-s text-ink-90 divide-border divide-y">
					<tr data-uiname="api-row-bind-value">
						<td data-uiname="api-cell-prop-bind-value" class="p-4 font-mono font-bold">bind:value</td>

						<td data-uiname="api-cell-type-bind-value" class="text-ink-50 p-4 font-mono">string | number | null</td>

						<td data-uiname="api-cell-default-bind-value" class="p-4 font-mono">null</td>

						<td data-uiname="api-cell-desc-bind-value" class="p-4">The core active value of the select.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3 data-uiname="api-subtitle-trigger" class="text-label-s text-ink-90 mt-8 mb-2 font-bold">Select.Trigger</h3>

		<div data-uiname="api-table-wrapper-trigger" class="border-border rounded-m overflow-hidden border">
			<table data-uiname="api-table-trigger" class="w-full text-left">
				<thead data-uiname="api-table-head-trigger" class="bg-level-1 border-border text-label-s text-ink-50 border-b">
					<tr data-uiname="api-table-head-row-trigger">
						<th data-uiname="api-th-prop-trigger" class="p-4 font-bold">Prop</th>

						<th data-uiname="api-th-type-trigger" class="p-4 font-bold">Type</th>

						<th data-uiname="api-th-default-trigger" class="p-4 font-bold">Default</th>

						<th data-uiname="api-th-desc-trigger" class="p-4 font-bold">Description</th>
					</tr>
				</thead>

				<tbody data-uiname="api-table-body-trigger" class="text-body-s text-ink-90 divide-border divide-y">
					<tr data-uiname="api-row-label">
						<td data-uiname="api-cell-prop-label" class="p-4 font-mono font-bold">label</td>

						<td data-uiname="api-cell-type-label" class="text-ink-50 p-4 font-mono">string</td>

						<td data-uiname="api-cell-default-label" class="p-4 font-mono">-</td>

						<td data-uiname="api-cell-desc-label" class="p-4">Text rendered directly above the trigger.</td>
					</tr>

					<tr data-uiname="api-row-placeholder">
						<td data-uiname="api-cell-prop-placeholder" class="p-4 font-mono font-bold">placeholder</td>

						<td data-uiname="api-cell-type-placeholder" class="text-ink-50 p-4 font-mono">string</td>

						<td data-uiname="api-cell-default-placeholder" class="p-4 font-mono">'Select...'</td>

						<td data-uiname="api-cell-desc-placeholder" class="p-4">Text shown when value is null.</td>
					</tr>

					<tr data-uiname="api-row-required">
						<td data-uiname="api-cell-prop-required" class="p-4 font-mono font-bold">required</td>

						<td data-uiname="api-cell-type-required" class="text-ink-50 p-4 font-mono">boolean</td>

						<td data-uiname="api-cell-default-required" class="p-4 font-mono">false</td>

						<td data-uiname="api-cell-desc-required" class="p-4">Appends a red asterisk to the label.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3 data-uiname="api-subtitle-item" class="text-label-s text-ink-90 mt-8 mb-2 font-bold">Select.Item</h3>

		<div data-uiname="api-table-wrapper-item" class="border-border rounded-m overflow-hidden border">
			<table data-uiname="api-table-item" class="w-full text-left">
				<thead data-uiname="api-table-head-item" class="bg-level-1 border-border text-label-s text-ink-50 border-b">
					<tr data-uiname="api-table-head-row-item">
						<th data-uiname="api-th-prop-item" class="p-4 font-bold">Prop</th>

						<th data-uiname="api-th-type-item" class="p-4 font-bold">Type</th>

						<th data-uiname="api-th-default-item" class="p-4 font-bold">Default</th>

						<th data-uiname="api-th-desc-item" class="p-4 font-bold">Description</th>
					</tr>
				</thead>

				<tbody data-uiname="api-table-body-item" class="text-body-s text-ink-90 divide-border divide-y">
					<tr data-uiname="api-row-item-value">
						<td data-uiname="api-cell-prop-item-value" class="p-4 font-mono font-bold">value</td>

						<td data-uiname="api-cell-type-item-value" class="text-ink-50 p-4 font-mono">string | number</td>

						<td data-uiname="api-cell-default-item-value" class="p-4 font-mono">- (req)</td>

						<td data-uiname="api-cell-desc-item-value" class="p-4">The value written to the context when selected.</td>
					</tr>

					<tr data-uiname="api-row-item-label">
						<td data-uiname="api-cell-prop-item-label" class="p-4 font-mono font-bold">label</td>

						<td data-uiname="api-cell-type-item-label" class="text-ink-50 p-4 font-mono">string</td>

						<td data-uiname="api-cell-default-item-label" class="p-4 font-mono">-</td>

						<td data-uiname="api-cell-desc-item-label" class="p-4">Fallback text. Displayed if no children snippet is passed.</td>
					</tr>

					<tr data-uiname="api-row-item-default">
						<td data-uiname="api-cell-prop-item-default" class="p-4 font-mono font-bold">default</td>

						<td data-uiname="api-cell-type-item-default" class="text-ink-50 p-4 font-mono">boolean</td>

						<td data-uiname="api-cell-default-item-default" class="p-4 font-mono">false</td>

						<td data-uiname="api-cell-desc-item-default" class="p-4">If true, automatically claims the select context value on mount if currently null.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>
