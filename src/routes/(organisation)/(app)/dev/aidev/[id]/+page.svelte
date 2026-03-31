<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Form from '$lib/components/layout/Form.svelte';
	import File from '$lib/components/blocks/File.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { enhance } from '$app/forms';
	import { uiComponents, blocks, layouts } from '../../data';

	let { data } = $props();
	let topic = $derived(data.topic);
	let deepContext = $derived(data.deepContext);
	let parentChain = $derived(data.parentChain || []);
	let categories = $derived(data.categories);

	let allGlobalTopics = $derived(data.allGlobalTopics);
	let uiVisibleGlobalTopics = $derived(data.uiVisibleGlobalTopics);
	let rawOutputString = $derived(data.rawOutputString);

	let isEditing = $state(false);
	let copiedPrompt = $state(false);
	let copiedFiles = $state<string | null>(null);
	let copiedState = $state<string | null>(null);

	// Form State
	let editTitle = $state('');
	let editCategory = $state('');
	let editDescription = $state('');
	let editPrompt = $state('');
	let editFiles = $state('');
	let selectedComponents = $state<string[]>([]);
	let selectedTokens = $state<string[]>([]);

	// Settings State
	let editGlobalMode = $state('ALL');
	let selectedGlobals = $state<string[]>([]);
	let editIgnoredParents = $state<string[]>([]);

	function toggleEdit() {
		if (!isEditing) {
			editTitle = topic.title;
			editCategory = topic.category_id;
			editDescription = topic.human_description || '';
			editPrompt = topic.prompt_text || '';
			editFiles = topic.files_list || '';
			selectedComponents = topic.components_list ? topic.components_list.split(',') : [];
			selectedTokens = topic.design_tokens ? topic.design_tokens.split(',') : [];

			editGlobalMode = topic.global_topics_list === 'ALL' ? 'ALL' : topic.global_topics_list === 'NONE' ? 'NONE' : 'CUSTOM';
			selectedGlobals = editGlobalMode === 'CUSTOM' ? topic.global_topics_list.split(',') : [];
			editIgnoredParents = topic.ignored_parents ? topic.ignored_parents.split(',') : [];
		}
		isEditing = !isEditing;
	}

	const allComponents = [...uiComponents, ...blocks, ...layouts];

	function toggleArrayItem(arr: string[], item: string) {
		return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
	}

	async function copyText(text: string, type: 'prompt' | 'deep' | string) {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'prompt') {
				copiedPrompt = true;
				setTimeout(() => (copiedPrompt = false), 2000);
			} else if (type === 'deep') {
				copiedState = 'deep';
				setTimeout(() => (copiedState = null), 2000);
			} else {
				copiedFiles = type;
				setTimeout(() => (copiedFiles = null), 2000);
			}
		} catch (err) {
			console.error('Failed to copy', err);
		}
	}
</script>

<div class="flex h-fit flex-col">
	<div class="bg-level-2 p-m pt-main-l border-border sticky top-0 z-10 flex items-center justify-between border-b">
		<div>
			{#if parentChain.length > 0}
				<div data-uiname="breadcrumbs" class="mb-1 flex flex-wrap items-center gap-2">
					{#each parentChain as parent}
						{#if isEditing}
							<button
								type="button"
								data-tooltip={editIgnoredParents.includes(parent.id) ? 'Click to Include Context' : 'Click to Ignore Context'}
								class="hover:text-accent-500 flex cursor-pointer items-center gap-2 {editIgnoredParents.includes(parent.id) ? 'line-through opacity-50' : 'text-ink-50'}"
								onclick={() => (editIgnoredParents = toggleArrayItem(editIgnoredParents, parent.id))}>
								<span class="text-body-s font-mono transition-colors">{parent.title}</span>
								<Icon name="arrow-right" class="text-ink-30" />
							</button>
						{:else}
							<a
								href="/dev/aidev/{parent.id}"
								data-tooltip={parent.ignored ? 'Ignored in AI Context' : 'Go to Parent Topic'}
								class="hover:text-accent-500 flex items-center gap-2 {parent.ignored ? 'line-through opacity-50' : 'text-ink-50'}">
								<span class="text-body-s font-mono transition-colors">{parent.title}</span>
								<Icon name="arrow-right" class="text-ink-30" />
							</a>
						{/if}
					{/each}
					<span class="text-body-s text-ink-90 font-mono font-bold">{topic.title}</span>
				</div>
			{/if}

			<div class="flex items-center gap-3">
				<h2 class="text-label-xl text-ink-90 font-bold">{topic.title}</h2>
				{#if !isEditing && uiVisibleGlobalTopics.length > 0}
					<div data-uiname="global-tags" class="ml-2 flex items-center gap-2">
						{#each uiVisibleGlobalTopics as gt}
							<a
								href="/dev/aidev/{gt.id}"
								class="bg-level-1 hover:bg-level-2 border-border text-label-xs text-ink-90 flex items-center gap-1.5 rounded-full border px-2 py-1 transition-colors"
								data-tooltip="View Global Context">
								<Icon name="sparkles" class="text-accent-500 h-3 w-3" />
								{gt.title}
							</a>
						{/each}
					</div>
				{/if}
			</div>

			{#if topic.human_description && !isEditing}
				<p class="text-body-m text-ink-50 mt-2">{topic.human_description}</p>
			{/if}
		</div>

		<div class="flex items-center gap-4">
			<Button variant="primary" size="s" onclick={() => copyText(rawOutputString, 'deep')} data-tooltip="Copies the perfectly compiled AI Context.">
				<Icon name={copiedState === 'deep' ? 'check' : 'copy'} class="mr-2" />
				{copiedState === 'deep' ? 'Context Copied!' : 'Copy AI Context'}
			</Button>
			<div class="bg-border mx-2 h-6 w-px"></div>
			<Button variant="tertiary" size="s" icon={!isEditing} onclick={toggleEdit}>
				<Icon name={isEditing ? 'x' : 'edit'} />
				{#if isEditing}<p class="mr-xs">Cancel</p>{/if}
			</Button>
			{#if !isEditing}
				<form
					method="POST"
					action="?/delete"
					use:enhance
					onsubmit={(e) => {
						if (!confirm('Delete this topic?')) e.preventDefault();
					}}>
					<Button variant="tertiary" size="s" icon type="submit" class="text-error" data-tooltip="Delete Topic"><Icon name="trash" /></Button>
				</form>
			{/if}
		</div>
	</div>

	<div class=" p-8">
		{#if isEditing}
			<Form
				action="?/update"
				enhance={() => {
					return async ({ update }) => {
						isEditing = false;
						await update();
					};
				}}>
				<input type="hidden" name="ignored_parents" value={editIgnoredParents.join(',')} />
				<div class="flex flex-col gap-6">
					<div class="grid grid-cols-2 gap-4">
						<Input label="Topic Title" name="title" bind:value={editTitle} required />
						<div class="flex flex-col gap-1">
							<label class="text-ink-50 px-2xs font-label-s font-semibold">Category</label>
							<input type="hidden" name="category_id" value={editCategory} />
							<Select.Root bind:value={editCategory}>
								<Select.Trigger class="w-full">
									{@const activeCat = categories.find((c) => c.id === editCategory)}
									<div class="flex items-center">
										<Icon name={activeCat?.is_global ? 'sparkles' : 'folder'} class="{activeCat?.is_global ? 'text-accent-500' : 'text-ink-50'} mr-2 h-4 w-4" />
										{activeCat?.name || 'Select...'}
									</div>
								</Select.Trigger>
								<Select.Content>
									{#each categories as cat}
										<Select.Item value={cat.id}>
											<Icon name={cat.is_global ? 'sparkles' : 'folder'} class="{cat.is_global ? 'text-accent-500' : 'text-ink-50'} mr-2 h-4 w-4" />
											<span class={cat.is_global ? 'text-ink-90 font-bold' : ''}>{cat.name}</span>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-ink-50 px-2xs font-label-s font-semibold">Human Description (Optional, UI only)</label>
						<Input name="human_description" bind:value={editDescription} placeholder="Explain what this architecture does..." />
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-ink-50 px-2xs font-label-s font-semibold">System Prompt (AI Logic)</label>
						<textarea
							name="prompt_text"
							bind:value={editPrompt}
							rows="6"
							class="bg-level-1 border-border text-ink-90 rounded-m focus:ring-accent-500 resize-y border p-3 font-mono text-sm outline-none focus:ring-2"></textarea>
					</div>

					<div class="border-border grid grid-cols-2 gap-6 border-t pt-6">
						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-1">
								<label class="text-ink-50 px-2xs font-label-s font-semibold">Global Project Context Settings</label>
								<div class="bg-level-1 border-border rounded-m flex flex-col gap-3 border p-4">
									<input type="hidden" name="global_mode" value={editGlobalMode} />
									<div class="flex gap-2">
										<Button type="button" size="xs" variant={editGlobalMode === 'ALL' ? 'primary' : 'tertiary'} onclick={() => (editGlobalMode = 'ALL')}>All</Button>
										<Button type="button" size="xs" variant={editGlobalMode === 'CUSTOM' ? 'primary' : 'tertiary'} onclick={() => (editGlobalMode = 'CUSTOM')}>Custom</Button>
										<Button type="button" size="xs" variant={editGlobalMode === 'NONE' ? 'primary' : 'tertiary'} onclick={() => (editGlobalMode = 'NONE')}>None</Button>
									</div>

									{#if editGlobalMode === 'CUSTOM'}
										<div class="mt-2 flex flex-col gap-2">
											{#each allGlobalTopics as gt}
												<label class="flex cursor-pointer items-center gap-2">
													<input
														type="checkbox"
														name="global_topics"
														value={gt.id}
														checked={selectedGlobals.includes(gt.id)}
														onchange={() => (selectedGlobals = toggleArrayItem(selectedGlobals, gt.id))}
														class="hidden" />
													<div
														class="flex h-4 w-4 items-center justify-center rounded border {selectedGlobals.includes(gt.id)
															? 'bg-accent-500 border-accent-500 text-white'
															: 'border-border bg-level-2'}">
														{#if selectedGlobals.includes(gt.id)}<Icon name="check" class="h-3 w-3" />{/if}
													</div>
													<span class="text-body-s text-ink-90">{gt.title}</span>
												</label>
											{/each}
										</div>
									{/if}
								</div>
							</div>

							<div class="flex flex-col gap-1">
								<label class="text-ink-50 px-2xs font-label-s font-semibold">Relevant Files</label>
								<textarea
									name="files_list"
									bind:value={editFiles}
									class="bg-level-1 border-border text-ink-90 rounded-m focus:ring-accent-500 h-full min-h-[120px] resize-y border p-3 font-mono text-sm outline-none focus:ring-2"
									placeholder="src/routes/+page.svelte"></textarea>
							</div>
						</div>

						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-1">
								<label class="text-ink-50 px-2xs font-label-s font-semibold">Design Tokens Context</label>
								<div class="bg-level-1 border-border rounded-m flex gap-4 border p-4">
									{#each ['colors', 'icons'] as token}
										<label class="group flex cursor-pointer items-center gap-2">
											<input
												type="checkbox"
												name="tokens"
												value={token}
												checked={selectedTokens.includes(token)}
												onchange={() => (selectedTokens = toggleArrayItem(selectedTokens, token))}
												class="hidden" />
											<div
												class="flex h-4 w-4 shrink-0 items-center justify-center rounded border {selectedTokens.includes(token)
													? 'bg-accent-500 border-accent-500 text-white'
													: 'border-border bg-level-2 group-hover:border-accent-500'}">
												{#if selectedTokens.includes(token)}<Icon name="check" class="h-3 w-3" />{/if}
											</div>
											<span class="text-body-s text-ink-90 group-hover:text-accent-500 font-bold capitalize transition-colors">{token}</span>
										</label>
									{/each}
								</div>
							</div>

							<div class="flex flex-col gap-1">
								<label class="text-ink-50 px-2xs font-label-s font-semibold">Required Components</label>
								<div class="bg-level-1 border-border rounded-m flex h-[220px] flex-col gap-4 overflow-y-auto border p-4">
									{#each [{ label: 'UI', items: uiComponents }, { label: 'Blocks/Layouts', items: [...blocks, ...layouts] }] as group}
										<div class="flex flex-col gap-2">
											<span class="text-label-xs text-ink-50 font-bold uppercase">{group.label}</span>
											{#each group.items as comp}
												<label class="group flex cursor-pointer items-center gap-2">
													<input
														type="checkbox"
														name="components"
														value={comp.name}
														checked={selectedComponents.includes(comp.name)}
														onchange={() => (selectedComponents = toggleArrayItem(selectedComponents, comp.name))}
														class="hidden" />
													<div
														class="flex h-4 w-4 items-center justify-center rounded border {selectedComponents.includes(comp.name)
															? 'bg-accent-500 border-accent-500 text-white'
															: 'border-border bg-level-2 group-hover:border-accent-500'}">
														{#if selectedComponents.includes(comp.name)}<Icon name="check" class="h-3 w-3" />{/if}
													</div>
													<span class="text-body-s text-ink-90 group-hover:text-accent-500 transition-colors">{comp.name}</span>
												</label>
											{/each}
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>

					<div class="border-border border-t pt-4">
						<Button variant="primary" type="submit">Save Changes</Button>
					</div>
				</div>
			</Form>
		{:else}
			<div class="flex flex-col gap-8">
				<div class="bg-level-1 border-border rounded-xl border p-6">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="text-label-m text-ink-90 flex items-center gap-2 font-bold"><Icon name="sparkles" class="text-accent-500" /> System Prompt Blueprint</h3>
						<Button type="button" variant="secondary" size="s" onclick={() => copyText(topic.prompt_text, 'prompt')}>
							<Icon name={copiedPrompt ? 'check' : 'copy'} class="mr-2 {copiedPrompt ? 'text-accent-500' : ''}" />
							{copiedPrompt ? 'Copied!' : 'Copy Context'}
						</Button>
					</div>
					{#if topic.prompt_text}
						<p class="text-body-m text-ink-90 font-mono leading-relaxed whitespace-pre-wrap">{topic.prompt_text}</p>
					{:else}
						<p class="text-body-s text-ink-50 italic">No prompt text defined.</p>
					{/if}
				</div>

				<Divider />

				<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
					<div class="flex flex-col gap-4">
						<h3 class="text-label-m text-ink-90 flex items-center gap-2 font-bold"><Icon name="folder" class="text-accent-500" /> Files</h3>
						<div class="flex flex-col gap-2">
							{#if deepContext.files.length > 0}
								{#each deepContext.files as file}
									<div data-uiname="file-card-{file}" class="group">
										<File mode="default" class="border-border bg-level-1 group-hover:border-accent-500 border p-2">
											<span class="text-ink-90 font-mono">{file}</span>
											{#snippet trailing()}
												<Button type="button" variant="secondary" size="xs" onclick={() => copyText(file, file)} data-tooltip="Copy File Path">
													<Icon name={copiedFiles === file ? 'check' : 'copy'} class={copiedFiles === file ? 'text-accent-500' : 'text-ink-50'} />
												</Button>
											{/snippet}
										</File>
									</div>
								{/each}
							{:else}
								<p class="text-body-s text-ink-50 italic">No files required.</p>
							{/if}
						</div>
					</div>

					<div class="flex flex-col gap-4">
						<h3 class="text-label-m text-ink-90 flex items-center gap-2 font-bold"><Icon name="layout" class="text-accent-500" /> Components</h3>
						<div class="flex flex-col gap-2">
							{#if deepContext.tokens.includes('colors')}
								<a href="/dev/design-system/colors" class="bg-level-1 border-border hover:border-accent-500 rounded-m flex items-center justify-between border p-3 transition-colors">
									<span class="text-label-s text-ink-90 font-bold"><Icon name="check" class="text-accent-500 mr-2" /> Colors Token</span>
								</a>
							{/if}
							{#if deepContext.tokens.includes('icons')}
								<a href="/dev/design-system/icons" class="bg-level-1 border-border hover:border-accent-500 rounded-m flex items-center justify-between border p-3 transition-colors">
									<span class="text-label-s text-ink-90 font-bold"><Icon name="check" class="text-accent-500 mr-2" /> Icons Token</span>
								</a>
							{/if}

							{#each deepContext.components as compName}
								{@const compData = allComponents.find((c) => c.name === compName)}
								{#if compData}
									<div data-uiname="component-card-{compName}" class="bg-level-1 border-border rounded-m hover:border-accent-500 flex items-center justify-between border p-3 transition-colors">
										<a href={compData.href} class="flex items-center gap-2 hover:opacity-80">
											<Icon name="layout" class="text-accent-500 h-4 w-4" />
											<span class="text-ink-90 font-bold">{compData.name}</span>
										</a>
										<div class="flex items-center gap-2">
											<Button type="button" variant="secondary" size="xs" onclick={() => copyText(compData.context, compName + '-ctx')} data-tooltip="Copy AI Component Context">
												<Icon name={copiedFiles === compName + '-ctx' ? 'check' : 'copy'} class={copiedFiles === compName + '-ctx' ? 'text-accent-500' : ''} /> Context
											</Button>
											<Button type="button" variant="secondary" size="xs" onclick={() => copyText(compData.importStr, compName + '-imp')} data-tooltip="Copy Svelte Import Statement">
												<Icon name={copiedFiles === compName + '-imp' ? 'check' : 'copy'} class={copiedFiles === compName + '-imp' ? 'text-accent-500' : ''} /> Import
											</Button>
										</div>
									</div>
								{/if}
							{/each}

							{#if deepContext.components.length === 0 && deepContext.tokens.length === 0}
								<p class="text-body-s text-ink-50 italic">No components required.</p>
							{/if}
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
