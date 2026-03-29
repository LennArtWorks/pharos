<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName, iconGroups } from '$lib/components/ui/Icon.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { allComponents } from '../../../../data';

	// Extract flat array of icon names for the select dropdown
	const allIcons = iconGroups.flatMap((g) => Object.keys(g.icons)) as FigmaIconName[];

	const componentData = allComponents.find((c) => c.name === 'Input');
	const aiContext = componentData?.context || 'Context not found.';

	// --- Sandbox State ---
	let inputValue = $state('');
	let type = $state<'text' | 'email' | 'password' | 'number'>('text');

	let labelText = $state('Email Address');
	let placeholderText = $state('Enter your email...');
	let tooltipText = $state('We will never share your email.');
	let errorText = $state('');
	let permissionKey = $state('');

	let hasLeadingIcon = $state(false);
	let leadingIconName = $state<FigmaIconName>('mail');

	let hasTrailingIcon = $state(false);
	let trailingIconName = $state<FigmaIconName>('circled-question-small');

	let isRequired = $state(false);
	let isDisabled = $state(false);
	let isReadonly = $state(false);

	// --- Live Editor State ---
	let copiedCode = $state(false);
	let copiedAI = $state(false);
	let editableCode = $state('');
	let isCodeEditorFocused = $state(false); // Prevents the $effect from overwriting manual typing

	// Auto-generate code when controls change (only if not manually typing in the textarea)
	$effect(() => {
		// We reference all states here so the effect tracks them
		const currentType = type;
		const currentLabel = labelText;
		const currentPlaceholder = placeholderText;
		const currentTooltip = tooltipText;
		const currentError = errorText;
		const currentPermission = permissionKey;
		const currentRequired = isRequired;
		const currentDisabled = isDisabled;
		const currentReadonly = isReadonly;
		const currentHasLeading = hasLeadingIcon;
		const currentHasTrailing = hasTrailingIcon;
		const currentLeadingName = leadingIconName;
		const currentTrailingName = trailingIconName;

		if (isCodeEditorFocused) return;

		let props = [];
		props.push(`bind:value={myValue}`);

		if (currentType !== 'text') props.push(`type="${currentType}"`);
		if (currentLabel) props.push(`label="${currentLabel}"`);
		if (currentPlaceholder) props.push(`placeholder="${currentPlaceholder}"`);
		if (currentTooltip) props.push(`tooltip="${currentTooltip}"`);
		if (currentError) props.push(`error="${currentError}"`);
		if (currentPermission) props.push(`permission="${currentPermission}"`);

		if (currentRequired) props.push(`required`);
		if (currentDisabled) props.push(`disabled`);
		if (currentReadonly) props.push(`readonly`);

		const propsString = props.length > 0 ? '\n  ' + props.join('\n  ') + '\n' : '';

		let innerHtml = '';
		if (currentHasLeading) innerHtml += `  {#snippet leading()}\n    <Icon name="${currentLeadingName}" />\n  {/snippet}\n`;
		if (currentHasTrailing) innerHtml += `  {#snippet trailing()}\n    <Icon name="${currentTrailingName}" />\n  {/snippet}\n`;

		if (innerHtml === '') {
			editableCode = `<Input${propsString}/>`;
		} else {
			editableCode = `<Input${propsString}>\n${innerHtml}</Input>`;
		}
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

		labelText = extractString('label');
		placeholderText = extractString('placeholder');
		tooltipText = extractString('tooltip');
		errorText = extractString('error');
		permissionKey = extractString('permission');

		const parsedType = extractString('type');
		if (['text', 'email', 'password', 'number'].includes(parsedType)) {
			type = parsedType as any;
		} else if (!parsedType) {
			type = 'text'; // Fallback to default
		}

		isRequired = extractBool('required');
		isDisabled = extractBool('disabled');
		isReadonly = extractBool('readonly');

		hasLeadingIcon = code.includes('{#snippet leading()}');
		hasTrailingIcon = code.includes('{#snippet trailing()}');
	}

	function resetSandbox() {
		inputValue = '';
		type = 'text';
		labelText = 'Email Address';
		placeholderText = 'Enter your email...';
		tooltipText = 'We will never share your email.';
		errorText = '';
		permissionKey = '';
		hasLeadingIcon = false;
		hasTrailingIcon = false;
		isRequired = false;
		isDisabled = false;
		isReadonly = false;
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

{#snippet dynamicLeading()}
	<Icon name={leadingIconName} />
{/snippet}

{#snippet dynamicTrailing()}
	<Icon name={trailingIconName} />
{/snippet}

<div data-uiname="sandbox-page-wrapper" class="gap-3xl flex flex-col">
	<header data-uiname="sandbox-header" class="border-border border-b pb-8">
		<div data-uiname="header-title-row" class="mb-4 flex items-center gap-4">
			<Button data-uiname="back-button" href="/files/dev/design-system/ui" variant="secondary" size="s" icon data-tooltip="Back to UI">
				<Icon name="arrow-left" />
			</Button>
			<h1 data-uiname="sandbox-title" class="text-label-xl text-ink-90 font-bold">Input</h1>
		</div>
		<p data-uiname="sandbox-description" class="text-body-m text-ink-50 mb-m max-w-2xl">
			The primary text entry field. It supports multiple types, integrated labels, tooltips, validation errors, and hooks directly into the permission system. Includes native password masking and
			responsive focus states.
		</p>
		<Button
			data-uiname="ai-context-button"
			variant="secondary"
			size="s"
			data-tooltip={copiedAI ? '<b>Context Copied!</b>' : 'Copy instructions for AI Prompting'}
			onclick={() => copyToClipboard(aiContext, 'ai')}>
			<Icon name="code-block" class="mr-2" /> AI Context
		</Button>
	</header>

	<section data-uiname="sandbox-interactive-area" class="bg-level-1 border-border flex flex-col overflow-hidden rounded-xl border">
		<div data-uiname="sandbox-preview-container" class="bg-level-0 border-border relative flex min-h-50 items-center justify-center border-b p-8">
			<div data-uiname="sandbox-preview-wrapper" class="w-full max-w-80">
				<Input
					data-uiname="preview-input-component"
					bind:value={inputValue}
					{type}
					label={labelText}
					placeholder={placeholderText}
					tooltip={tooltipText}
					error={errorText}
					required={isRequired}
					disabled={isDisabled}
					readonly={isReadonly}
					permission={permissionKey || undefined}
					leading={hasLeadingIcon ? dynamicLeading : undefined}
					trailing={hasTrailingIcon ? dynamicTrailing : undefined} />
			</div>
		</div>

		<Button data-uiname="reset-sandbox-button" variant="secondary" size="s" onclick={resetSandbox} class="mt-m ml-m absolute">Reset Sandbox</Button>

		<div data-uiname="sandbox-controls-grid" class="flex flex-col gap-8 p-6 lg:flex-row">
			<div data-uiname="controls-col-core" class="gap-xl flex flex-1 flex-col">
				<div data-uiname="control-group-type" class="gap-m flex flex-col">
					<label data-uiname="control-label-type" class="text-label-xs text-ink-50 font-bold">Type</label>
					<div data-uiname="control-buttons-type" class="flex flex-wrap gap-2">
						{#each ['text', 'email', 'password', 'number'] as t}
							<Button data-uiname={`type-btn-${t}`} size="s" variant={type === t ? 'primary' : 'tertiary'} active={type === t} onclick={() => (type = t as any)}>{t}</Button>
						{/each}
					</div>
				</div>

				<div data-uiname="control-group-text" class="gap-xl flex flex-col">
					<Input data-uiname="control-input-label" bind:value={labelText} placeholder="Label Text" label="Label" />
					<Input data-uiname="control-input-placeholder" bind:value={placeholderText} placeholder="Placeholder" label="Placeholder" />
					<Input data-uiname="control-input-tooltip" bind:value={tooltipText} placeholder="Tooltip Text" label="Tooltip" />
				</div>
			</div>

			<div data-uiname="controls-col-advanced" class="flex flex-1 flex-col gap-6">
				<div data-uiname="control-group-validation" class="gap-xl flex flex-col">
					<label data-uiname="control-label-validation" class="text-label-xs text-ink-50 font-bold">Validation & Auth</label>
					<Input data-uiname="control-input-error" bind:value={errorText} placeholder="Error message (triggers red state)" label="Error Label" />
					<Input data-uiname="control-input-permission" bind:value={permissionKey} placeholder="Permission Key (e.g. 'users.edit')" label="Permission" />
				</div>

				<div data-uiname="control-group-icons" class="flex gap-4">
					<div data-uiname="icon-selector-leading" class="flex flex-col gap-2">
						<Button data-uiname="toggle-btn-leading" size="s" variant={hasLeadingIcon ? 'primary' : 'tertiary'} active={hasLeadingIcon} onclick={() => (hasLeadingIcon = !hasLeadingIcon)}
							>Leading Icon</Button>
						{#if hasLeadingIcon}
							<Select.Root bind:value={leadingIconName}>
								<Select.Trigger placeholder="Select..." class="w-40" />
								<Select.Content class="max-h-[300px] overflow-y-auto">
									{#each allIcons as iconName}
										<Select.Item value={iconName}>
											<Icon name={iconName} class="mr-2 h-4 w-4" />
											<span data-uiname={`icon-name-leading-${iconName}`} class="truncate">{iconName}</span>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						{/if}
					</div>

					<div data-uiname="icon-selector-trailing" class="flex flex-col gap-2">
						<Button data-uiname="toggle-btn-trailing" size="s" variant={hasTrailingIcon ? 'primary' : 'tertiary'} active={hasTrailingIcon} onclick={() => (hasTrailingIcon = !hasTrailingIcon)}
							>Trailing Icon</Button>
						{#if hasTrailingIcon}
							<Select.Root bind:value={trailingIconName}>
								<Select.Trigger placeholder="Select..." class="w-40" />
								<Select.Content class="max-h-[300px] overflow-y-auto">
									{#each allIcons as iconName}
										<Select.Item value={iconName}>
											<Icon name={iconName} class="mr-2 h-4 w-4" />
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
						<Button data-uiname="state-btn-required" size="s" variant={isRequired ? 'primary' : 'tertiary'} active={isRequired} onclick={() => (isRequired = !isRequired)}>Required State (*)</Button>
						<Button data-uiname="state-btn-disabled" size="s" variant={isDisabled ? 'primary' : 'tertiary'} active={isDisabled} onclick={() => (isDisabled = !isDisabled)}>Disabled State</Button>
						<Button data-uiname="state-btn-readonly" size="s" variant={isReadonly ? 'primary' : 'tertiary'} active={isReadonly} onclick={() => (isReadonly = !isReadonly)}>Readonly State</Button>
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
				class="text-label-s text-ink-10 min-h-[160px] w-full border-none bg-transparent p-2 font-mono outline-none focus:ring-0"
				spellcheck="false"></textarea>

			<div data-uiname="code-actions-wrapper" class="mt-4 flex shrink-0 items-center gap-2 sm:mt-2">
				<Button
					data-uiname="copy-code-button"
					variant="secondary"
					size="s"
					class="text-ink-10 hover:text-ink-90"
					data-tooltip={copiedCode ? '<b>Copied!</b>' : 'Copy Component Code'}
					onclick={() => copyToClipboard(editableCode, 'code')}>
					<Icon name="copy" class="mr-m" /> Code
				</Button>
			</div>
		</div>
	</section>

	<section data-uiname="common-patterns-section">
		<h2 data-uiname="patterns-title" class="text-label-m text-ink-90 mb-l font-bold">Common Patterns</h2>
		<div data-uiname="patterns-grid" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div data-uiname="pattern-card-standard" class="bg-level-1 border-border rounded-xl border p-6">
				<h3 data-uiname="pattern-title-standard" class="text-label-s text-ink-90 mb-2 font-bold">Standard Form Input</h3>
				<div data-uiname="pattern-preview-standard" class="bg-level-0 border-border mb-4 flex min-h-[100px] items-center justify-center rounded border p-4">
					<Input data-uiname="pattern-component-standard" label="Full Name" placeholder="Jane Doe" required />
				</div>
				<textarea
					data-uiname="pattern-code-standard"
					readonly
					class="text-label-xs text-ink-50 h-24 w-full resize-none bg-transparent font-mono outline-none"
					spellcheck="false"
					value={`<Input\n  bind:value={name}\n  label="Full Name"\n  placeholder="Jane Doe"\n  required\n/>`}></textarea>
			</div>

			<div data-uiname="pattern-card-password" class="bg-level-1 border-border rounded-xl border p-6">
				<h3 data-uiname="pattern-title-password" class="text-label-s text-ink-90 mb-2 font-bold">Password with Tooltip</h3>
				<div data-uiname="pattern-preview-password" class="bg-level-0 border-border mb-4 flex min-h-[100px] items-center justify-center rounded border p-4">
					<Input data-uiname="pattern-component-password" type="password" label="Password" tooltip="Must be at least 8 characters long." />
				</div>
				<textarea
					data-uiname="pattern-code-password"
					readonly
					class="text-label-xs text-ink-50 h-24 w-full resize-none bg-transparent font-mono outline-none"
					spellcheck="false"
					value={`<Input\n  type="password"\n  label="Password"\n  tooltip="Must be at least..."\n/>`}></textarea>
			</div>

			<div data-uiname="pattern-card-error" class="bg-level-1 border-border rounded-xl border p-6">
				<h3 data-uiname="pattern-title-error" class="text-label-s text-ink-90 mb-2 font-bold">Error State</h3>
				<div data-uiname="pattern-preview-error" class="bg-level-0 border-border mb-4 flex min-h-[100px] items-center justify-center rounded border p-4">
					<Input data-uiname="pattern-component-error" label="Username" value="admin123" error="This username is already taken." />
				</div>
				<textarea
					data-uiname="pattern-code-error"
					readonly
					class="text-label-xs text-ink-50 h-24 w-full resize-none bg-transparent font-mono outline-none"
					spellcheck="false"
					value={`<Input\n  label="Username"\n  bind:value={username}\n  error="This username is already taken."\n/>`}></textarea>
			</div>
		</div>
	</section>

	<section data-uiname="api-reference-section">
		<h2 data-uiname="api-reference-title" class="text-label-m text-ink-90 mb-l font-bold">API Reference</h2>
		<div data-uiname="api-table-wrapper" class="border-border overflow-hidden rounded-xl border">
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
					<tr data-uiname="api-row-bind-value">
						<td data-uiname="api-cell-prop-bind-value" class="p-4 font-mono font-bold">bind:value</td>
						<td data-uiname="api-cell-type-bind-value" class="text-ink-50 p-4 font-mono">string | number</td>
						<td data-uiname="api-cell-default-bind-value" class="p-4 font-mono">null</td>
						<td data-uiname="api-cell-desc-bind-value" class="p-4">The core value of the input.</td>
					</tr>
					<tr data-uiname="api-row-type">
						<td data-uiname="api-cell-prop-type" class="p-4 font-mono font-bold">type</td>
						<td data-uiname="api-cell-type-type" class="text-ink-50 p-4 font-mono">string</td>
						<td data-uiname="api-cell-default-type" class="p-4 font-mono">'text'</td>
						<td data-uiname="api-cell-desc-type" class="p-4">HTML input type. If 'password', native unmasking logic applies.</td>
					</tr>
					<tr data-uiname="api-row-label">
						<td data-uiname="api-cell-prop-label" class="p-4 font-mono font-bold">label</td>
						<td data-uiname="api-cell-type-label" class="text-ink-50 p-4 font-mono">string</td>
						<td data-uiname="api-cell-default-label" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-label" class="p-4">Renders the label text above the input.</td>
					</tr>
					<tr data-uiname="api-row-tooltip">
						<td data-uiname="api-cell-prop-tooltip" class="p-4 font-mono font-bold">tooltip</td>
						<td data-uiname="api-cell-type-tooltip" class="text-ink-50 p-4 font-mono">string</td>
						<td data-uiname="api-cell-default-tooltip" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-tooltip" class="p-4">Adds a hoverable info icon next to the label.</td>
					</tr>
					<tr data-uiname="api-row-error">
						<td data-uiname="api-cell-prop-error" class="p-4 font-mono font-bold">error</td>
						<td data-uiname="api-cell-type-error" class="text-ink-50 p-4 font-mono">string</td>
						<td data-uiname="api-cell-default-error" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-error" class="p-4">Displays validation error below and turns the focus ring red.</td>
					</tr>
					<tr data-uiname="api-row-permission">
						<td data-uiname="api-cell-prop-permission" class="p-4 font-mono font-bold">permission</td>
						<td data-uiname="api-cell-type-permission" class="text-ink-50 p-4 font-mono">string</td>
						<td data-uiname="api-cell-default-permission" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-permission" class="p-4">Specific permission key. Overrides the FORM_PERMISSION_KEY if provided.</td>
					</tr>
					<tr data-uiname="api-row-leading">
						<td data-uiname="api-cell-prop-leading" class="p-4 font-mono font-bold">leading</td>
						<td data-uiname="api-cell-type-leading" class="text-ink-50 p-4 font-mono">snippet</td>
						<td data-uiname="api-cell-default-leading" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-leading" class="p-4">Slot for rendering an Icon or text on the left edge inside the input area.</td>
					</tr>
					<tr data-uiname="api-row-trailing">
						<td data-uiname="api-cell-prop-trailing" class="p-4 font-mono font-bold">trailing</td>
						<td data-uiname="api-cell-type-trailing" class="text-ink-50 p-4 font-mono">snippet</td>
						<td data-uiname="api-cell-default-trailing" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-trailing" class="p-4">Slot for rendering an Icon or text on the right edge.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>
