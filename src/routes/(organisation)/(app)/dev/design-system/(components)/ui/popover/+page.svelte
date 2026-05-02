<script lang="ts">
	import * as Popover from '$lib/components/ui/TriggerPopover';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { allComponents } from '../../../../data';

	const componentData = allComponents.find((c) => c.name === 'Popover');
	const aiContext = componentData?.context || 'Context not found.';

	// --- Sandbox State ---
	let closeOnClick = $state(true);
	let triggerType = $state<'icon' | 'button'>('icon');
	let contentTemplate = $state<'menu' | 'profile'>('menu');

	// --- Live Editor State ---
	let copiedCode = $state(false);
	let copiedAI = $state(false);
	let editableCode = $state('');
	let isCodeEditorFocused = $state(false);

	// Auto-generate code when controls change
	$effect(() => {
		const currentCloseOnClick = closeOnClick;
		const currentTrigger = triggerType;
		const currentTemplate = contentTemplate;

		if (isCodeEditorFocused) return;

		let code = `<Popover.Root${currentCloseOnClick ? ' closeOnClick' : ''}>\n`;
		code += `  <Popover.Trigger>\n`;

		if (currentTrigger === 'icon') {
			code += `    <Button variant="tertiary" size="s" icon>\n`;
			code += `      <Icon name="dots" />\n`;
			code += `    </Button>\n`;
		} else {
			code += `    <Button variant="secondary">\n`;
			code += `      Actions <Icon name="arrow-down" class="ml-2" />\n`;
			code += `    </Button>\n`;
		}

		code += `  </Popover.Trigger>\n\n`;

		if (currentTemplate === 'menu') {
			code += `  <Popover.Content class="w-48">\n`;
			code += `    <Button variant="tertiary" size="s" class="w-full justify-start">\n`;
			code += `      {#snippet leading()}<Icon name="web" />{/snippet}\n`;
			code += `      Open Public Page\n`;
			code += `    </Button>\n`;
			code += `    <Button variant="tertiary" size="s" class="w-full justify-start">\n`;
			code += `      {#snippet leading()}<Icon name="settings" />{/snippet}\n`;
			code += `      Settings\n`;
			code += `    </Button>\n`;
			code += `  </Popover.Content>\n`;
		} else {
			code += `  <Popover.Content class="w-64 p-4">\n`;
			code += `    <div class="flex flex-col gap-2">\n`;
			code += `      <span class="font-label-m text-ink-90 font-bold">Workspace Settings</span>\n`;
			code += `      <span class="text-body-s text-ink-50">Manage your team and billing.</span>\n`;
			code += `      <Button variant="primary" size="s" class="mt-2 w-full">Upgrade Plan</Button>\n`;
			code += `    </div>\n`;
			code += `  </Popover.Content>\n`;
		}

		code += `</Popover.Root>`;

		editableCode = code;
	});

	// Parse manual code input (Simplified Linter for structural components)
	function handleCodeInput(e: Event) {
		const target = e.target as HTMLTextAreaElement;
		editableCode = target.value;
		const code = editableCode;

		const rootMatch = code.match(/<Popover\.Root([^>]*)>/);
		if (rootMatch) {
			const rootAttr = rootMatch[1];
			closeOnClick = /\bcloseOnClick\b(?!="false")/.test(rootAttr);
		}
	}

	function resetSandbox() {
		closeOnClick = true;
		triggerType = 'icon';
		contentTemplate = 'menu';
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
			<Button data-uiname="back-button" href="/dev/design-system/ui" variant="secondary" size="s" icon data-tooltip="Back to UI">
				<Icon data-uiname="back-button-icon" name="arrow-left" />
			</Button>
			<h1 data-uiname="sandbox-title" class="text-label-xl text-ink-90 font-bold">Popover</h1>
		</div>
		<p data-uiname="sandbox-description" class="text-body-m text-ink-50 mb-m max-w-2xl">
			A structural overlay component used to display contextual menus, rich tooltips, or complex interaction panels. It handles viewport-aware positioning, click-outside logic, and internal state
			management.
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
		<div data-uiname="sandbox-preview-container" class="bg-level-0 border-border relative flex min-h-[360px] items-center justify-center border-b p-12">
			<div data-uiname="sandbox-preview-wrapper" class="flex items-center justify-center p-12">
				<Popover.Root {closeOnClick}>
					<Popover.Trigger>
						{#if triggerType === 'icon'}
							<Button variant="tertiary" size="s" icon>
								<Icon name="dots" />
							</Button>
						{:else}
							<Button variant="secondary">
								Actions <Icon name="arrow-down" class="ml-2" />
							</Button>
						{/if}
					</Popover.Trigger>

					<Popover.Content class={contentTemplate === 'menu' ? 'w-48' : 'w-64 p-4'}>
						{#if contentTemplate === 'menu'}
							<Button variant="tertiary" size="s" class="w-full justify-start">
								{#snippet leading()}<Icon name="web" />{/snippet}
								Open Public Page
							</Button>
							<Button variant="tertiary" size="s" class="w-full justify-start">
								{#snippet leading()}<Icon name="settings" />{/snippet}
								Settings
							</Button>
						{:else}
							<div class="flex flex-col gap-2">
								<span class="font-label-m text-ink-90 font-bold">Workspace Settings</span>
								<span class="text-body-s text-ink-50">Manage your team and billing.</span>
								<Button variant="primary" size="s" class="mt-2 w-full">Upgrade Plan</Button>
							</div>
						{/if}
					</Popover.Content>
				</Popover.Root>
			</div>

			<Button data-uiname="reset-sandbox-button" variant="secondary" size="s" onclick={resetSandbox} class="mt-m ml-m absolute top-0 left-0">Reset Sandbox</Button>
		</div>

		<div data-uiname="sandbox-controls-grid" class="flex flex-col gap-8 p-6 lg:flex-row">
			<div data-uiname="controls-col-trigger" class="flex flex-1 flex-col gap-6">
				<div data-uiname="control-group-trigger" class="flex flex-col gap-2">
					<label data-uiname="control-label-trigger" class="text-label-xs text-ink-50 font-bold">Trigger Element</label>
					<div class="flex gap-2">
						<Button size="s" variant={triggerType === 'icon' ? 'primary' : 'tertiary'} active={triggerType === 'icon'} onclick={() => (triggerType = 'icon')}>Icon Button</Button>
						<Button size="s" variant={triggerType === 'button' ? 'primary' : 'tertiary'} active={triggerType === 'button'} onclick={() => (triggerType = 'button')}>Standard Button</Button>
					</div>
				</div>
			</div>

			<div data-uiname="controls-col-content" class="flex flex-1 flex-col gap-6">
				<div data-uiname="control-group-content" class="flex flex-col gap-2">
					<label data-uiname="control-label-content" class="text-label-xs text-ink-50 font-bold">Content Template</label>
					<div class="flex gap-2">
						<Button size="s" variant={contentTemplate === 'menu' ? 'primary' : 'tertiary'} active={contentTemplate === 'menu'} onclick={() => (contentTemplate = 'menu')}>Action Menu</Button>
						<Button size="s" variant={contentTemplate === 'profile' ? 'primary' : 'tertiary'} active={contentTemplate === 'profile'} onclick={() => (contentTemplate = 'profile')}
							>Custom Layout</Button>
					</div>
				</div>
			</div>

			<div data-uiname="controls-col-states" class="flex flex-1 flex-col gap-6">
				<div data-uiname="control-group-states" class="flex flex-col gap-2">
					<label data-uiname="control-label-states" class="text-label-xs text-ink-50 font-bold">Behavior</label>
					<div class="flex flex-col items-start gap-2">
						<Button data-uiname="state-btn-closeonclick" size="s" variant={closeOnClick ? 'primary' : 'tertiary'} active={closeOnClick} onclick={() => (closeOnClick = !closeOnClick)}
							>Close On Click</Button>
					</div>
					<span class="text-body-s text-ink-50 mt-1 max-w-[200px]">Turn off if popover contains a form or complex interactions.</span>
				</div>
			</div>
		</div>

		<div data-uiname="sandbox-code-editor-wrapper" class="border-border relative flex min-h-[220px] flex-col justify-between border-t bg-neutral-800 sm:flex-row sm:items-start">
			<textarea
				data-uiname="live-code-textarea"
				value={editableCode}
				oninput={handleCodeInput}
				onfocus={() => (isCodeEditorFocused = true)}
				onblur={() => (isCodeEditorFocused = false)}
				class="text-label-s text-ink-10 z-10 min-h-[220px] w-full resize-none border-none bg-transparent p-6 font-mono outline-none focus:ring-0"
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

		<h3 data-uiname="api-subtitle-root" class="text-label-s text-ink-90 mt-6 mb-2 font-bold">Popover.Root</h3>
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
					<tr data-uiname="api-row-closeonclick">
						<td data-uiname="api-cell-prop-closeonclick" class="p-4 font-mono font-bold">closeOnClick</td>
						<td data-uiname="api-cell-type-closeonclick" class="text-ink-50 p-4 font-mono">boolean</td>
						<td data-uiname="api-cell-default-closeonclick" class="p-4 font-mono">false</td>
						<td data-uiname="api-cell-desc-closeonclick" class="p-4">Automatically closes the popover when a click event occurs anywhere inside the Content block.</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3 data-uiname="api-subtitle-trigger" class="text-label-s text-ink-90 mt-8 mb-2 font-bold">Popover.Trigger & Content</h3>
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
					<tr data-uiname="api-row-class">
						<td data-uiname="api-cell-prop-class" class="p-4 font-mono font-bold">class</td>
						<td data-uiname="api-cell-type-class" class="text-ink-50 p-4 font-mono">string</td>
						<td data-uiname="api-cell-default-class" class="p-4 font-mono">-</td>
						<td data-uiname="api-cell-desc-class" class="p-4">Overrides or appends styles to the Content container (e.g., width, padding).</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>
