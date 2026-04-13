<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Form from '$lib/components/layout/Form.svelte';
	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { enhance } from '$app/forms';
	import { uiComponents, blocks, layouts } from '../../data';
	import { cn } from '$lib/utils.js';

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
				<div data-uiname="breadcrumbs" class="mb-2 flex flex-wrap items-center gap-1">
					{#each parentChain as parent}
						<NodeItem
							name={parent.title}
							variant="tertiary"
							size="s"
							iconHidden
							class={cn(
								'font-mono underline-offset-4',
								isEditing && editIgnoredParents.includes(parent.id) ? 'line-through opacity-40' : '',
								!isEditing && parent.ignored ? 'line-through opacity-40' : ''
							)}
							tagName={isEditing ? 'button' : 'a'}
							href={isEditing ? undefined : `/dev/aidev/${parent.id}`}
							onclick={() => {
								if (isEditing) editIgnoredParents = toggleArrayItem(editIgnoredParents, parent.id);
							}}
							data-tooltip={isEditing ? 'Toggle Context Inclusion' : 'Go to Parent Topic'} />
						<Icon name="arrow-right" class="text-ink-30 h-3 w-3" />
					{/each}
					<span class="text-ink-90 px-2 font-mono text-sm font-bold">{topic.title}</span>
				</div>
			{/if}

			<div class="flex items-center gap-3">
				<h2 class="text-label-xl text-ink-90 font-bold">{topic.title}</h2>
				{#if !isEditing && uiVisibleGlobalTopics.length > 0}
					<div data-uiname="global-tags" class="ml-2 flex items-center gap-2">
						{#each uiVisibleGlobalTopics as gt}
							<NodeItem name={gt.title} icon="sparkles" href="/dev/aidev/{gt.id}" variant="secondary" size="s" class="rounded-full" />
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
			<Button variant="tertiary" size="s" onclick={toggleEdit}>
				<Icon name={isEditing ? 'x' : 'edit'} />
				{#if isEditing}<span class="ml-xs">Cancel</span>{/if}
			</Button>
			{#if !isEditing}
				<form
					method="POST"
					action="?/delete"
					use:enhance
					onsubmit={(e) => {
						if (!confirm('Delete this topic?')) e.preventDefault();
					}}>
					<Button variant="tertiary" size="s" type="submit" class="text-error" data-tooltip="Delete Topic">
						<Icon name="trash" />
					</Button>
				</form>
			{/if}
		</div>
	</div>

	<div class="p-8">
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
						<div class="flex flex-col gap-1">
							{#if deepContext.files.length > 0}
								{#each deepContext.files as file}
									<NodeItem name={file} filetype="file" variant="tertiary" class="bg-level-1 group font-mono">
										{#snippet trailingItems()}
											<Button variant="secondary" size="xs" class="opacity-0 transition-opacity group-hover:opacity-100" onclick={() => copyText(file, file)}>
												<Icon name={copiedFiles === file ? 'check' : 'copy'} class={copiedFiles === file ? 'text-accent-500' : 'text-ink-50'} />
											</Button>
										{/snippet}
									</NodeItem>
								{/each}
							{:else}
								<p class="text-body-s text-ink-50 italic">No files required.</p>
							{/if}
						</div>
					</div>

					<div class="flex flex-col gap-4">
						<h3 class="text-label-m text-ink-90 flex items-center gap-2 font-bold"><Icon name="layout" class="text-accent-500" /> Components</h3>
						<div class="flex flex-col gap-1">
							{#if deepContext.tokens.includes('colors')}
								<NodeItem name="Colors Token" icon="check" href="/dev/design-system/colors" variant="tertiary" class="bg-level-1" />
							{/if}
							{#if deepContext.tokens.includes('icons')}
								<NodeItem name="Icons Token" icon="check" href="/dev/design-system/icons" variant="tertiary" class="bg-level-1" />
							{/if}

							{#each deepContext.components as compName}
								{@const compData = allComponents.find((c) => c.name === compName)}
								{#if compData}
									<NodeItem name={compData.name} icon="layout" href={compData.href} variant="tertiary" class="bg-level-1 group">
										{#snippet trailingItems()}
											<div class="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
												<Button variant="secondary" size="xs" onclick={() => copyText(compData.context, compName + '-ctx')}>
													<Icon name={copiedFiles === compName + '-ctx' ? 'check' : 'copy'} class="mr-1" /> Context
												</Button>
												<Button variant="secondary" size="xs" onclick={() => copyText(compData.importStr, compName + '-imp')}>
													<Icon name={copiedFiles === compName + '-imp' ? 'check' : 'copy'} class="mr-1" /> Import
												</Button>
											</div>
										{/snippet}
									</NodeItem>
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
