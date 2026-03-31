<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { allComponents } from '../../../../data';
	import { openOverlay } from '$lib/utils/overlay';

	const componentData = allComponents.find((c) => c.name === 'OverlayRoot');
	const aiContext = componentData?.context || 'Context not found.';

	// --- Sandbox State ---
	let overlayName = $state('settings-org');
	let overlayId = $state('');

	// --- Live Editor State ---
	let copiedCode = $state(false);
	let copiedAI = $state(false);
	let isCodeEditorFocused = $state(false);

	let editableCode = $derived.by(() => {
		if (isCodeEditorFocused) return;
		if (overlayId) {
			return `import { openOverlay } from '$lib/utils/overlay';\n\nopenOverlay('${overlayName}', '${overlayId}');`;
		}
		return `import { openOverlay } from '$lib/utils/overlay';\n\nopenOverlay('${overlayName}');`;
	});

	function handleCodeInput(e: Event) {
		// Basic sync for manual edits if needed, though this is primarily a JS trigger preview
		const target = e.target as HTMLTextAreaElement;
		const match = target.value.match(/openOverlay\('([^']+)'(?:,\s*'([^']+)')?\)/);
		if (match) {
			overlayName = match[1];
			overlayId = match[2] || '';
		}
	}

	function triggerOverlay() {
		openOverlay(overlayName, overlayId || undefined);
	}

	function resetSandbox() {
		overlayName = 'settings-org';
		overlayId = '';
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
	<header data-uiname="sandbox-header" class="border-border border-b pb-8">
		<div data-uiname="header-title-row" class="mb-4 flex items-center gap-4">
			<Button data-uiname="back-button" href="/dev/design-system" variant="secondary" size="s" icon data-tooltip="Back to Overview">
				<Icon name="arrow-left" />
			</Button>
			<h1 data-uiname="sandbox-title" class="text-label-xl text-ink-90 font-bold">OverlayRoot & Templates</h1>
		</div>
		<p data-uiname="sandbox-description" class="text-body-m text-ink-50 mb-m max-w-2xl">
			The global modal manager. Instead of importing modal components on every page, overlays are triggered via URL parameters. This preserves the background OS context and allows deep-linking to
			specific settings.
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
			<div data-uiname="sandbox-preview-wrapper" class="flex flex-col items-center gap-4">
				<Icon name="sparkles" class="text-ink-50 h-8 w-8" />
				<p class="text-label-m text-ink-70 text-center">Overlays render globally over the entire OS.<br />Configure the payload below and trigger the preview.</p>
				<Button variant="primary" onclick={triggerOverlay}>Open Active Overlay</Button>
			</div>
		</div>

		<Button data-uiname="reset-sandbox-button" variant="secondary" size="s" onclick={resetSandbox} class="mt-m ml-m absolute">Reset Sandbox</Button>

		<div data-uiname="sandbox-controls-grid" class="flex flex-col gap-8 p-6 lg:flex-row">
			<div data-uiname="controls-col-core" class="gap-xl flex flex-1 flex-col">
				<div data-uiname="control-group-type" class="gap-m flex flex-col">
					<label data-uiname="control-label-type" class="text-label-xs text-ink-50 font-bold">Overlay Target</label>
					<Select.Root bind:value={overlayName}>
						<Select.Trigger class="w-full">{overlayName}</Select.Trigger>
						<Select.Content>
							<Select.Item value="settings-org">Organisation Settings (settings-org)</Select.Item>
							<Select.Item value="DevOrganisationsEditor">Dev Editor (DevOrganisationsEditor)</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div data-uiname="control-group-text" class="gap-xl flex flex-col">
					<Input data-uiname="control-input-id" bind:value={overlayId} placeholder="e.g., usr_123" label="Optional ID Parameter" tooltip="Passed to the overlay component as the 'id' prop." />
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
					data-tooltip={copiedCode ? '<b>Copied!</b>' : 'Copy JS Trigger'}
					onclick={() => copyToClipboard(editableCode || '', 'code')}>
					<Icon name="copy" class="mr-m" /> Code
				</Button>
			</div>
		</div>
	</section>

	<section data-uiname="common-patterns-section">
		<h2 data-uiname="patterns-title" class="text-label-m text-ink-90 mb-l font-bold">Template Patterns</h2>
		<div data-uiname="patterns-grid" class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<div data-uiname="pattern-card-standard" class="bg-level-1 border-border rounded-xl border p-6">
				<h3 data-uiname="pattern-title-standard" class="text-label-s text-ink-90 mb-2 font-bold">Standard Overlay</h3>
				<p class="text-body-s text-ink-50 mb-4">Used for simple dialogs, confirmations, and small forms.</p>
				<textarea
					data-uiname="pattern-code-standard"
					readonly
					class="text-label-xs text-ink-50 h-48 w-full resize-none bg-transparent font-mono outline-none"
					spellcheck="false"
					value={`<script>\n  import OverlayTemplateStandard from '$lib/components/layout/overlays/templates/OverlayTemplateStandard.svelte';\n  let { closeOverlay } = $props();\n</script>\n\n<OverlayTemplateStandard title="Edit Item" onclose={closeOverlay}>\n  <p>Main content goes here.</p>\n\n  {#snippet footer()}\n    <Button variant="secondary" onclick={closeOverlay}>Cancel</Button>\n    <Button variant="primary">Save</Button>\n  {/snippet}\n</OverlayTemplateStandard>`}
				></textarea>
			</div>

			<div data-uiname="pattern-card-settings" class="bg-level-1 border-border rounded-xl border p-6">
				<h3 data-uiname="pattern-title-settings" class="text-label-s text-ink-90 mb-2 font-bold">Settings Overlay</h3>
				<p class="text-body-s text-ink-50 mb-4">Used for complex interfaces requiring internal vertical navigation.</p>
				<textarea
					data-uiname="pattern-code-settings"
					readonly
					class="text-label-xs text-ink-50 h-48 w-full resize-none bg-transparent font-mono outline-none"
					spellcheck="false"
					value={`<script>\n  import OverlayTemplateSettings from '$lib/components/layout/overlays/templates/OverlayTemplateSidebar.svelte';\n  let { closeOverlay } = $props();\n</script>\n\n<OverlayTemplateSettings onclose={closeOverlay}>\n  {#snippet sidebar()}\n    <nav>Sidebar links here</nav>\n  {/snippet}\n\n  <div class="content">\n    <h1>General Settings</h1>\n    \n  </div>\n</OverlayTemplateSettings>`}
				></textarea>
			</div>
		</div>
	</section>

	<section data-uiname="api-reference-section">
		<h2 data-uiname="api-reference-title" class="text-label-m text-ink-90 mb-l font-bold">Overlay Utility API</h2>
		<div data-uiname="api-table-wrapper" class="border-border overflow-hidden rounded-xl border">
			<table data-uiname="api-table" class="w-full text-left">
				<thead data-uiname="api-table-head" class="bg-level-1 border-border text-label-s text-ink-50 border-b">
					<tr data-uiname="api-table-head-row">
						<th data-uiname="api-th-func" class="p-4 font-bold">Function</th>
						<th data-uiname="api-th-args" class="p-4 font-bold">Arguments</th>
						<th data-uiname="api-th-desc" class="p-4 font-bold">Description</th>
					</tr>
				</thead>
				<tbody data-uiname="api-table-body" class="text-body-s text-ink-90 divide-border divide-y">
					<tr data-uiname="api-row-open">
						<td data-uiname="api-cell-func-open" class="p-4 font-mono font-bold">openOverlay</td>
						<td data-uiname="api-cell-args-open" class="text-ink-50 p-4 font-mono">name: string, id?: string</td>
						<td data-uiname="api-cell-desc-open" class="p-4">Updates the URL parameters to trigger the global OverlayRoot.</td>
					</tr>
					<tr data-uiname="api-row-close">
						<td data-uiname="api-cell-func-close" class="p-4 font-mono font-bold">closeOverlay</td>
						<td data-uiname="api-cell-args-close" class="text-ink-50 p-4 font-mono">()</td>
						<td data-uiname="api-cell-desc-close" class="p-4">Strips overlay parameters from the URL, dismissing the modal. Passed automatically to template props.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>
</div>
