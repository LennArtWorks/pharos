<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName, iconGroups } from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { allComponents } from '../../../../data';

	// Extract flat array of icon names for the select dropdown
	const allIcons = iconGroups.flatMap((g) => Object.keys(g.icons)) as FigmaIconName[];

	const componentData = allComponents.find((c) => c.name === 'Button');
	const aiContext = componentData?.context || 'Context not found.';

	// --- Sandbox State ---
	let variant = $state<'primary' | 'secondary' | 'tertiary' | 'empty' | 'unstyled'>('primary');
	let size = $state<'xs' | 's' | 'sm' | 'm' | 'l' | 'xl'>('m');

	let labelText = $state('Submit');
	let customClass = $state('');

	let hasLeadingIcon = $state(false);
	let leadingIconName = $state<FigmaIconName>('settings');

	let hasTrailingIcon = $state(false);
	let trailingIconName = $state<FigmaIconName>('arrow-right');

	let isIconOnly = $state(false);
	let isActive = $state(false);
	let isDisabled = $state(false);

	// --- Live Editor State ---
	let copiedCode = $state(false);
	let copiedAI = $state(false);
	let editableCode = $state('');
	let isCodeEditorFocused = $state(false);

	// Auto-generate code when controls change
	$effect(() => {
		// Reference dependencies explicitly to track them
		const currentVariant = variant;
		const currentSize = size;
		const currentIsIconOnly = isIconOnly;
		const currentIsActive = isActive;
		const currentIsDisabled = isDisabled;
		const currentCustomClass = customClass;
		const currentHasLeading = hasLeadingIcon;
		const currentHasTrailing = hasTrailingIcon;
		const currentLeadingName = leadingIconName;
		const currentTrailingName = trailingIconName;
		const currentLabel = labelText;

		if (isCodeEditorFocused) return;

		let props = [];
		if (currentVariant !== 'primary') props.push(`variant="${currentVariant}"`);
		if (currentSize !== 'm') props.push(`size="${currentSize}"`);
		if (currentIsIconOnly) props.push(`icon`);
		if (currentIsActive) props.push(`active`);
		if (currentIsDisabled) props.push(`disabled`);
		if (currentCustomClass) props.push(`class="${currentCustomClass}"`);

		const propsString = props.length > 0 ? ' ' + props.join(' ') : '';

		if (currentIsIconOnly) {
			editableCode = `<Button${propsString}>\n  <Icon name="${currentLeadingName}" />\n</Button>`;
			return;
		}

		let innerHtml = '';
		if (currentHasLeading) innerHtml += `\n  {#snippet leading()}\n    <Icon name="${currentLeadingName}" />\n  {/snippet}\n`;
		if (currentHasTrailing) innerHtml += `\n  {#snippet trailing()}\n    <Icon name="${currentTrailingName}" />\n  {/snippet}\n`;

		innerHtml += `\n  ${currentLabel}\n`;

		editableCode = `<Button${propsString}>${innerHtml}</Button>`;
	});

	// Parse manual code input and update UI controls instantly
	function handleCodeInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		editableCode = target.value;
		const code = editableCode;

		// Helper functions for regex parsing
		const extractString = (prop: string) => {
			const match = code.match(new RegExp(`${prop}="([^"]*)"`));
			return match ? match[1] : '';
		};

		const extractBool = (prop: string) => {
			return new RegExp(`\\b${prop}\\b(?!=")`).test(code);
		};

		const parsedVariant = extractString('variant');
		if (['primary', 'secondary', 'tertiary', 'empty', 'unstyled'].includes(parsedVariant)) {
			variant = parsedVariant as any;
		} else if (!parsedVariant) {
			variant = 'primary';
		}

		const parsedSize = extractString('size');
		if (['xs', 's', 'sm', 'm', 'l', 'xl'].includes(parsedSize)) {
			size = parsedSize as any;
		} else if (!parsedSize) {
			size = 'm';
		}

		customClass = extractString('class');

		isIconOnly = extractBool('icon');
		isActive = extractBool('active');
		isDisabled = extractBool('disabled');

		// Snippet & Icon logic
		hasLeadingIcon = code.includes('{#snippet leading()}');
		hasTrailingIcon = code.includes('{#snippet trailing()}');

		if (isIconOnly) {
			const iconMatch = code.match(/<Icon\s+name="([^"]+)"/);
			if (iconMatch) leadingIconName = iconMatch[1] as FigmaIconName;
		} else {
			if (hasLeadingIcon) {
				const leadingMatch = code.match(/\{#snippet leading\(\)\}[\s\S]*?<Icon\s+name="([^"]+)"[\s\S]*?\{\/snippet\}/);
				if (leadingMatch) leadingIconName = leadingMatch[1] as FigmaIconName;
			}
			if (hasTrailingIcon) {
				const trailingMatch = code.match(/\{#snippet trailing\(\)\}[\s\S]*?<Icon\s+name="([^"]+)"[\s\S]*?\{\/snippet\}/);
				if (trailingMatch) trailingIconName = trailingMatch[1] as FigmaIconName;
			}

			// Extract raw text (children) by stripping out tags and snippets
			let innerText = code.replace(/<Button[^>]*>/g, '').replace(/<\/Button>/g, '');
			innerText = innerText.replace(/\{#snippet [^}]+\}[\s\S]*?\{\/snippet\}/g, '');
			labelText = innerText.trim() || 'Submit';
		}
	}

	function resetSandbox() {
		variant = 'primary';
		size = 'm';
		labelText = 'Submit';
		customClass = '';
		hasLeadingIcon = false;
		hasTrailingIcon = false;
		isIconOnly = false;
		isActive = false;
		isDisabled = false;
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
			<Button data-uiname="back-button" href="/dev/design-system/ui" variant="secondary" size="s" icon data-tooltip="Back to UI">
				<Icon data-uiname="back-button-icon" name="arrow-left" />
			</Button>
			<h1 data-uiname="sandbox-title" class="text-label-xl text-ink-90 font-bold">Button</h1>
		</div>
		<p data-uiname="sandbox-description" class="text-body-m text-ink-50 mb-m max-w-2xl">
			The primary interactive element. It handles standard clicks, semantic routing, programmatic navigation, and integrates natively with the permission system. The Button dynamically turns itself
			into a Button or an Anker. Just use href (for links), goto (for overlays) or nothing for regular Buttons.
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
		<div data-uiname="sandbox-preview-container" class="bg-level-0 border-border relative flex min-h-[240px] items-center justify-center border-b p-8">
			<Button data-uiname="preview-button-component" {variant} {size} icon={isIconOnly} active={isActive} disabled={isDisabled} class={customClass}>
				{#snippet leading()}
					{#if hasLeadingIcon && !isIconOnly}<Icon data-uiname="preview-leading-icon" name={leadingIconName} />{/if}
				{/snippet}

				{#snippet trailing()}
					{#if hasTrailingIcon && !isIconOnly}<Icon data-uiname="preview-trailing-icon" name={trailingIconName} />{/if}
				{/snippet}

				{#if isIconOnly}
					<Icon data-uiname="preview-icon-only" name={leadingIconName} />
				{:else}
					{labelText}
				{/if}
			</Button>
		</div>

		<Button data-uiname="reset-sandbox-button" variant="secondary" size="s" onclick={resetSandbox} class="mt-m ml-m absolute">Reset Sandbox</Button>

		<div data-uiname="sandbox-controls-grid" class="flex flex-col gap-8 p-6 lg:flex-row">
			<div data-uiname="controls-col-variant-size" class="flex flex-1 flex-col gap-6">
				<div data-uiname="control-group-variant" class="flex flex-col gap-2">
					<label data-uiname="control-label-variant" class="text-label-xs text-ink-50 font-bold">Variant</label>
					<div data-uiname="control-buttons-variant" class="flex flex-wrap gap-2">
						{#each ['primary', 'secondary', 'tertiary', 'empty', 'unstyled'] as v}
							<Button data-uiname={`variant-btn-${v}`} size="s" variant={variant === v ? 'primary' : 'tertiary'} active={variant === v} onclick={() => (variant = v as any)}>{v}</Button>
						{/each}
					</div>
				</div>

				<div data-uiname="control-group-size" class="flex flex-col gap-2">
					<label data-uiname="control-label-size" class="text-label-xs text-ink-50 font-bold">Size</label>
					<div data-uiname="control-buttons-size" class="flex flex-wrap gap-2">
						{#each ['xs', 's', 'sm', 'm', 'l', 'xl'] as s}
							<Button data-uiname={`size-btn-${s}`} size="s" variant={size === s ? 'primary' : 'tertiary'} active={size === s} onclick={() => (size = s as any)}>{s}</Button>
						{/each}
					</div>
				</div>
			</div>

			<div data-uiname="controls-col-content-icons" class="flex flex-1 flex-col gap-6">
				<div data-uiname="control-group-content" class="flex flex-col gap-2">
					<label data-uiname="control-label-content" class="text-label-xs text-ink-50 font-bold">Content</label>
					<Input data-uiname="control-input-label" bind:value={labelText} placeholder="Button Label" disabled={isIconOnly} class="max-w-[200px]" />
					<Input data-uiname="control-input-class" bind:value={customClass} placeholder="e.g. 'w-full text-left'" class="mt-2 max-w-[200px]" />
				</div>

				<div data-uiname="control-group-icons" class="flex gap-4">
					<div data-uiname="icon-selector-leading" class="flex flex-col gap-2">
						<Button
							data-uiname="toggle-btn-leading"
							size="s"
							variant={hasLeadingIcon ? 'primary' : 'tertiary'}
							active={hasLeadingIcon}
							disabled={isIconOnly}
							onclick={() => (hasLeadingIcon = !hasLeadingIcon)}>Leading Icon</Button>
						{#if hasLeadingIcon && !isIconOnly}
							<Select.Root bind:value={leadingIconName}>
								<Select.Trigger placeholder="Select..." class="w-40" />
								<Select.Content class="max-h-[300px] overflow-y-auto">
									{#each allIcons as iconName}
										<Select.Item value={iconName}>
											<Icon data-uiname={`icon-preview-leading-${iconName}`} name={iconName} class="mr-2 h-4 w-4" />
											<span data-uiname={`icon-name-leading-${iconName}`} class="truncate">{iconName}</span>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/if}
					</div>

					<div data-uiname="icon-selector-trailing" class="flex flex-col gap-2">
						<Button
							data-uiname="toggle-btn-trailing"
							size="s"
							variant={hasTrailingIcon ? 'primary' : 'tertiary'}
							active={hasTrailingIcon}
							disabled={isIconOnly}
							onclick={() => (hasTrailingIcon = !hasTrailingIcon)}>Trailing Icon</Button>
						{#if hasTrailingIcon && !isIconOnly}
							<Select.Root bind:value={trailingIconName}>
								<Select.Trigger placeholder="Select..." class="w-40" />
								<Select.Content class="max-h-[300px] overflow-y-auto">
									{#each allIcons as iconName}
										<Select.Item value={iconName}>
											<Icon data-uiname={`icon-preview-trailing-${iconName}`} name={iconName} class="mr-2 h-4 w-4" />
											<span data-uiname={`icon-name-trailing-${iconName}`} class="truncate">{iconName}</span>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/if}
					</div>
				</div>
			</div>

			<div data-uiname="controls-col-states" class="flex flex-1 flex-col gap-6">
				<div data-uiname="control-group-states" class="flex flex-col gap-2">
					<label data-uiname="control-label-states" class="text-label-xs text-ink-50 font-bold">States</label>
					<div data-uiname="control-buttons-states" class="flex flex-col items-start gap-2">
						<Button data-uiname="state-btn-icon-only" size="s" variant={isIconOnly ? 'primary' : 'tertiary'} active={isIconOnly} onclick={() => (isIconOnly = !isIconOnly)}>Icon Only Mode</Button>
						<Button data-uiname="state-btn-active" size="s" variant={isActive ? 'primary' : 'tertiary'} active={isActive} onclick={() => (isActive = !isActive)}>Active State</Button>
						<Button data-uiname="state-btn-disabled" size="s" variant={isDisabled ? 'primary' : 'tertiary'} active={isDisabled} onclick={() => (isDisabled = !isDisabled)}>Disabled State</Button>
					</div>
				</div>
			</div>
		</div>

		<div data-uiname="sandbox-code-editor-wrapper" class="border-border flex flex-col justify-between border-t bg-neutral-800 p-4 sm:flex-row sm:items-start">
			<textarea
				data-uiname="live-code-textarea"
				value={editableCode}
				oninput={handleCodeInput}
				onfocus={() => (isCodeEditorFocused = true)}
				onblur={() => (isCodeEditorFocused = false)}
				class="text-label-s text-ink-10 min-h-[100px] w-full border-none bg-transparent p-2 font-mono outline-none focus:ring-0"
				spellcheck="false"></textarea>

			<div data-uiname="code-actions-wrapper" class="mt-4 flex shrink-0 items-center gap-2 sm:mt-2">
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

	<section data-uiname="common-patterns-section">
		<h2 data-uiname="patterns-title" class="text-label-m text-ink-90 mb-l font-bold">Common Patterns</h2>
		<div data-uiname="patterns-grid" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div data-uiname="pattern-card-submit" class="bg-level-1 border-border rounded-m border p-6">
				<h3 data-uiname="pattern-title-submit" class="text-label-s text-ink-90 mb-2 font-bold">Standard Form Submit</h3>
				<div data-uiname="pattern-preview-submit" class="bg-level-0 border-border mb-4 flex h-24 items-center justify-center rounded border">
					<Button data-uiname="pattern-component-submit" variant="primary">Save Changes</Button>
				</div>
				<textarea
					data-uiname="pattern-code-submit"
					readonly
					class="text-label-xs text-ink-50 h-16 w-full resize-none bg-transparent font-mono outline-none"
					spellcheck="false"
					value={`<Button variant="primary">\n  Save Changes\n</Button>`}></textarea>
			</div>

			<div data-uiname="pattern-card-sidebar" class="bg-level-1 border-border rounded-m border p-6">
				<h3 data-uiname="pattern-title-sidebar" class="text-label-s text-ink-90 mb-2 font-bold">Sidebar Navigation Item</h3>
				<div data-uiname="pattern-preview-sidebar" class="bg-level-0 border-border mb-4 flex h-24 items-center justify-center rounded border px-4">
					<Button data-uiname="pattern-component-sidebar" variant="unstyled" class="hover:bg-level-1 px-s py-2xs rounded-m w-full text-left font-semibold transition-colors">
						{#snippet leading()}<Icon data-uiname="pattern-icon-sidebar" name="folder" class="text-ink-50 mr-2" />{/snippet}
						Projects
					</Button>
				</div>
				<textarea
					data-uiname="pattern-code-sidebar"
					readonly
					class="text-label-xs text-ink-50 h-24 w-full resize-none bg-transparent font-mono outline-none"
					spellcheck="false"
					value={`<Button variant="unstyled" class="w-full text-left">\n  {#snippet leading()}<Icon name="folder" />{/snippet}\n  Projects\n</Button>`}></textarea>
			</div>

			<div data-uiname="pattern-card-ghost" class="bg-level-1 border-border rounded-m border p-6">
				<h3 data-uiname="pattern-title-ghost" class="text-label-s text-ink-90 mb-2 font-bold">Ghost Icon Button</h3>
				<div data-uiname="pattern-preview-ghost" class="bg-level-0 border-border mb-4 flex h-24 items-center justify-center rounded border">
					<Button data-uiname="pattern-component-ghost" variant="tertiary" size="s" icon><Icon data-uiname="pattern-icon-ghost" name="settings" /></Button>
				</div>
				<textarea
					data-uiname="pattern-code-ghost"
					readonly
					class="text-label-xs text-ink-50 h-16 w-full resize-none bg-transparent font-mono outline-none"
					spellcheck="false"
					value={`<Button variant="tertiary" size="s" icon>\n  <Icon name="settings" />\n</Button>`}></textarea>
			</div>
		</div>
	</section>

	<section data-uiname="api-reference-section">
		<h2 data-uiname="api-reference-title" class="text-label-m text-ink-90 mb-l font-bold">API Reference</h2>
		<div data-uiname="api-table-wrapper" class="border-border rounded-m overflow-hidden border">
			<table data-uiname="api-table" class="w-full text-left">
				<thead data-uiname="api-table-head" class="bg-level-1 border-border text-label-s text-ink-50 border-b">
					<tr data-uiname="api-table-head-row">
						<th data-uiname="api-th-prop" class="p-4 font-bold">Prop</th>
						<th data-uiname="api-th-type" class="p-4 font-bold">Type</th>
						<th data-uiname="api-th-default" class="p-4 font-bold">Default</th>
						<th data-uiname="api-th-desc" class="p-4 font-bold">Description</th>
					</tr>
				</thead>
				<tbody data-uiname="api-table-body" class="text-body-s text-ink-90 divide-border divide-y">
					<tr data-uiname="api-row-variant">
						<td data-uiname="api-cell-prop-variant" class="p-4 font-mono font-bold">variant</td>
						<td data-uiname="api-cell-type-variant" class="text-ink-50 p-4 font-mono">enum</td>
						<td data-uiname="api-cell-default-variant" class="p-4 font-mono">'primary'</td>
						<td data-uiname="api-cell-desc-variant" class="p-4">Visual style of the button.</td>
					</tr>
					<tr data-uiname="api-row-size">
						<td data-uiname="api-cell-prop-size" class="p-4 font-mono font-bold">size</td>
						<td data-uiname="api-cell-type-size" class="text-ink-50 p-4 font-mono">enum</td>
						<td data-uiname="api-cell-default-size" class="p-4 font-mono">'m'</td>
						<td data-uiname="api-cell-desc-size" class="p-4">Height, padding, and font-size mapped to main tokens.</td>
					</tr>
					<tr data-uiname="api-row-icon">
						<td data-uiname="api-cell-prop-icon" class="p-4 font-mono font-bold">icon</td>
						<td data-uiname="api-cell-type-icon" class="text-ink-50 p-4 font-mono">boolean</td>
						<td data-uiname="api-cell-default-icon" class="p-4 font-mono">false</td>
						<td data-uiname="api-cell-desc-icon" class="p-4">Strips padding to force a perfect square for icon-only usage.</td>
					</tr>
					<tr data-uiname="api-row-permission">
						<td data-uiname="api-cell-prop-permission" class="p-4 font-mono font-bold">permission</td>
						<td data-uiname="api-cell-type-permission" class="text-ink-50 p-4 font-mono">string</td>
						<td data-uiname="api-cell-default-permission" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-permission" class="p-4">Permission key to automatically disable the button if user lacks rights.</td>
					</tr>
					<tr data-uiname="api-row-leading">
						<td data-uiname="api-cell-prop-leading" class="p-4 font-mono font-bold">leading</td>
						<td data-uiname="api-cell-type-leading" class="text-ink-50 p-4 font-mono">snippet</td>
						<td data-uiname="api-cell-default-leading" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-leading" class="p-4">Renders content strictly to the left of the text block.</td>
					</tr>
					<tr data-uiname="api-row-trailing">
						<td data-uiname="api-cell-prop-trailing" class="p-4 font-mono font-bold">trailing</td>
						<td data-uiname="api-cell-type-trailing" class="text-ink-50 p-4 font-mono">snippet</td>
						<td data-uiname="api-cell-default-trailing" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-trailing" class="p-4">Renders content strictly to the right of the text block.</td>
					</tr>
					<tr data-uiname="api-row-label">
						<td data-uiname="api-cell-prop-label" class="p-4 font-mono font-bold">label</td>
						<td data-uiname="api-cell-type-label" class="text-ink-50 p-4 font-mono">snippet</td>
						<td data-uiname="api-cell-default-label" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-label" class="p-4">Overrides `children`. Used when explicitly forcing left-alignment via classes.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>
