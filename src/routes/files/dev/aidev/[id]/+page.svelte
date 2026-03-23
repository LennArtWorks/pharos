<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Form from '$lib/components/layout/Form.svelte';
	import File from '$lib/components/blocks/File.svelte';
	import * as Select from '$lib/components/ui/Select'; // NEW: Imported your Select component
	import { enhance } from '$app/forms';

	// Import your design system registries
	import { uiComponents, blocks, layouts } from '../../data';

	let { data } = $props();
	let topic = $derived(data.topic);
	let deepContext = $derived(data.deepContext);
	let parentChain = $derived(data.parentChain || []);

	// FIXED: Removed the `.filter((c: any) => c.is_global === 0)` so the Global Category is listed
	let categories = $derived(data.categories);

	let isEditing = $state(false);
	let copiedPrompt = $state(false);
	let copiedFiles = $state<string | null>(null);
	let copiedComps = $state(false);
	let copiedState = $state<string | null>(null);

	// Form State
	let editTitle = $state('');
	let editCategory = $state('');
	let editPrompt = $state('');
	let editFiles = $state('');
	let selectedComponents = $state<string[]>([]);
	let selectedTokens = $state<string[]>([]);

	function toggleEdit() {
		if (!isEditing) {
			editTitle = topic.title;
			editCategory = topic.category_id;
			editPrompt = topic.prompt_text || '';
			editFiles = topic.files_list || '';
			selectedComponents = topic.components_list ? topic.components_list.split(',') : [];
			selectedTokens = topic.design_tokens ? topic.design_tokens.split(',') : [];
		}
		isEditing = !isEditing;
	}

	// Combine all available components into a single flat array
	const allComponents = [...uiComponents, ...blocks, ...layouts];

	// Derive the active import strings
	let activeImportStrings = $derived(
		deepContext.components
			.filter((n): n is string => typeof n === 'string')
			.map((name: string) => allComponents.find((c) => c.name === name)?.importStr)
			.filter(Boolean)
			.join('\n')
	);

	function toggleComponent(name: string) {
		if (selectedComponents.includes(name)) {
			selectedComponents = selectedComponents.filter((c) => c !== name);
		} else {
			selectedComponents = [...selectedComponents, name];
		}
	}

	function toggleToken(name: string) {
		if (selectedTokens.includes(name)) {
			selectedTokens = selectedTokens.filter((t) => t !== name);
		} else {
			selectedTokens = [...selectedTokens, name];
		}
	}

	async function copyText(text: string, type: 'prompt' | 'deep' | 'comps' | string) {
		if (!text) return;
		try {
			await navigator.clipboard.writeText(text);
			if (type === 'prompt') {
				copiedPrompt = true;
				setTimeout(() => (copiedPrompt = false), 2000);
			} else if (type === 'deep') {
				copiedState = 'deep';
				setTimeout(() => (copiedState = null), 2000);
			} else if (type === 'comps') {
				copiedComps = true;
				setTimeout(() => (copiedComps = false), 2000);
			} else {
				copiedFiles = type;
				setTimeout(() => (copiedFiles = null), 2000);
			}
		} catch (err) {
			console.error('Failed to copy', err);
		}
	}

	let fileArray = $derived(topic.files_list ? topic.files_list.split('\n').filter((f: string) => f.trim() !== '') : []);
</script>

<div class="flex h-fit flex-col">
	<div class="bg-level-2 p-m pt-main-l border-border sticky top-0 z-10 flex items-center justify-between border-b">
		<div>
			{#if parentChain.length > 0}
				<div class="mb-1 flex flex-wrap items-center gap-2">
					{#each parentChain as parent}
						<a href="/files/dev/aidev/{parent.id}" class="text-body-s text-ink-50 hover:text-accent-500 font-mono transition-colors">
							{parent.title}
						</a>
						<Icon name="arrow-right" class="text-ink-30" />
					{/each}
					<span class="text-body-s text-ink-90 font-mono font-bold">{topic.title}</span>
				</div>
			{/if}
			<h2 class="text-label-xl text-ink-90 font-bold">{topic.title}</h2>
			<p class="text-body-s text-ink-50 mt-1 font-mono">ID: {topic.id}</p>
		</div>

		<div class="flex items-center gap-4">
			<Button
				variant="primary"
				size="s"
				onclick={() => copyText(`${deepContext.prompt}\n\nREQUIRED FILES:\n${deepContext.files}\n\nREQUIRED COMPONENTS:\n${activeImportStrings}`, 'deep')}
				data-tooltip="Copies this topic, its parent topics, and all Global project instructions.">
				<Icon name={copiedState === 'deep' ? 'check' : 'copy'} class="mr-2" />
				{copiedState === 'deep' ? 'Deep Context Copied!' : 'Copy Deep Context'}
			</Button>

			<div class="bg-border mx-2 h-6 w-px"></div>

			<Button variant="tertiary" size="s" icon={isEditing ? false : true} onclick={toggleEdit}>
				<Icon name={isEditing ? 'x' : 'edit'} />
				{#if isEditing}
					<p class="mr-xs">Cancel</p>
				{/if}
			</Button>

			{#if !isEditing}
				<form
					method="POST"
					action="?/delete"
					use:enhance
					onsubmit={(e) => {
						if (!confirm('Delete this topic?')) e.preventDefault();
					}}>
					<Button variant="tertiary" size="s" icon type="submit" class="text-error">
						<Icon name="trash" />
					</Button>
				</form>
			{/if}
		</div>
	</div>

	<div class="max-w-4xl p-8">
		{#if isEditing}
			<Form
				action="?/update"
				enhance={() => {
					return async ({ update }) => {
						isEditing = false;
						await update();
					};
				}}>
				<div class="flex flex-col gap-6">
					<div class="grid grid-cols-2 gap-4">
						<Input label="Topic Title" name="title" bind:value={editTitle} required />

						<div class="flex flex-col gap-1">
							<label class="text-ink-50 px-2xs font-label-s font-semibold">Category</label>
							<input type="hidden" name="category_id" value={editCategory} />
							<Select.Root bind:value={editCategory}>
								<Select.Trigger placeholder="Select a category..." class="w-full" />
								<Select.Content>
									{#each categories as cat}
										<Select.Item value={cat.id}>
											<Icon name={cat.is_global ? 'sparkles' : 'folder'} class="{cat.is_global ? 'text-accent-500' : 'text-ink-50'} mr-2" />
											<span class={cat.is_global ? 'text-ink-90 font-bold' : ''}>{cat.name}</span>
										</Select.Item>
									{/each}
								</Select.Content>
							</Select.Root>
						</div>
					</div>

					<div class="flex flex-col gap-1">
						<label class="text-ink-50 px-2xs font-label-s font-semibold">System Prompt</label>
						<textarea
							name="prompt_text"
							bind:value={editPrompt}
							rows="6"
							class="bg-level-1 border-border text-ink-90 rounded-m focus:ring-accent-500 resize-y border p-3 font-mono text-sm outline-none focus:ring-2"></textarea>
					</div>

					<div class="grid grid-cols-2 gap-6">
						<div class="flex flex-col gap-1">
							<label class="text-ink-50 px-2xs font-label-s font-semibold">Relevant Files (One path per line)</label>
							<textarea
								name="files_list"
								bind:value={editFiles}
								class="bg-level-1 border-border text-ink-90 rounded-m focus:ring-accent-500 h-full resize-y border p-3 font-mono text-sm outline-none focus:ring-2"
								placeholder="src/routes/+page.svelte"></textarea>
						</div>

						<div class="flex flex-col gap-4">
							<div class="flex flex-col gap-1">
								<label class="text-ink-50 px-2xs font-label-s font-semibold">Design Tokens Context</label>
								<div class="bg-level-1 border-border rounded-m flex flex-col gap-2 border p-4">
									<label class="group flex cursor-pointer items-start gap-3">
										<input type="checkbox" name="tokens" value="colors" checked={selectedTokens.includes('colors')} onchange={() => toggleToken('colors')} class="hidden" />
										<div
											class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors {selectedTokens.includes('colors')
												? 'bg-accent-500 border-accent-500 text-white'
												: 'border-border bg-level-2 group-hover:border-accent-500'}">
											{#if selectedTokens.includes('colors')}<Icon name="check" />{/if}
										</div>
										<div class="flex flex-col">
											<span class="text-body-s text-ink-90 group-hover:text-accent-500 font-bold transition-colors">Colors & Levels</span>
											<span class="text-label-xs text-ink-50">Tailwind color scale mapping.</span>
										</div>
									</label>

									<label class="group mt-2 flex cursor-pointer items-start gap-3">
										<input type="checkbox" name="tokens" value="icons" checked={selectedTokens.includes('icons')} onchange={() => toggleToken('icons')} class="hidden" />
										<div
											class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors {selectedTokens.includes('icons')
												? 'bg-accent-500 border-accent-500 text-white'
												: 'border-border bg-level-2 group-hover:border-accent-500'}">
											{#if selectedTokens.includes('icons')}<Icon name="check" />{/if}
										</div>
										<div class="flex flex-col">
											<span class="text-body-s text-ink-90 group-hover:text-accent-500 font-bold transition-colors">Icon System</span>
											<span class="text-label-xs text-ink-50">Available icon strings.</span>
										</div>
									</label>
								</div>
							</div>

							<div class="flex flex-col gap-1">
								<label class="text-ink-50 px-2xs font-label-s font-semibold">Required Components</label>
								<div class="bg-level-1 border-border rounded-m flex h-[220px] flex-col gap-4 overflow-y-auto border p-4">
									<div class="flex flex-col gap-2">
										<span class="text-label-xs text-ink-50 font-bold uppercase">UI Components</span>
										{#each uiComponents as comp}
											<label class="group flex cursor-pointer items-center gap-2">
												<input type="checkbox" name="components" value={comp.name} checked={selectedComponents.includes(comp.name)} onchange={() => toggleComponent(comp.name)} class="hidden" />
												<div
													class="flex h-4 w-4 items-center justify-center rounded border transition-colors {selectedComponents.includes(comp.name)
														? 'bg-accent-500 border-accent-500 text-white'
														: 'border-border bg-level-2 group-hover:border-accent-500'}">
													{#if selectedComponents.includes(comp.name)}<Icon name="check" />{/if}
												</div>
												<span class="text-body-s text-ink-90 group-hover:text-accent-500 transition-colors">{comp.name}</span>
											</label>
										{/each}
									</div>

									<div class="flex flex-col gap-2">
										<span class="text-label-xs text-ink-50 font-bold uppercase">Blocks & Layouts</span>
										{#each [...blocks, ...layouts] as comp}
											<label class="group flex cursor-pointer items-center gap-2">
												<input type="checkbox" name="components" value={comp.name} checked={selectedComponents.includes(comp.name)} onchange={() => toggleComponent(comp.name)} class="hidden" />
												<div
													class="flex h-4 w-4 items-center justify-center rounded border transition-colors {selectedComponents.includes(comp.name)
														? 'bg-accent-500 border-accent-500 text-white'
														: 'border-border bg-level-2 group-hover:border-accent-500'}">
													{#if selectedComponents.includes(comp.name)}<Icon name="check" />{/if}
												</div>
												<span class="text-body-s text-ink-90 group-hover:text-accent-500 transition-colors">{comp.name}</span>
											</label>
										{/each}
									</div>
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
				<div class="flex flex-col gap-3">
					<div class="flex items-center justify-between">
						<h3 class="text-label-m text-ink-90 flex items-center gap-2 font-bold">
							<Icon name="sparkles" class="text-accent-500" /> System Prompt Blueprint
						</h3>
						<Button variant="secondary" size="s" onclick={() => copyText(topic.prompt_text, 'prompt')}>
							<Icon name={copiedPrompt ? 'check' : 'copy'} class="mr-2 {copiedPrompt ? 'text-accent-500' : ''}" />
							{copiedPrompt ? 'Copied!' : 'Copy Context'}
						</Button>
					</div>
					<div class="bg-level-1 border-border rounded-xl border p-6">
						{#if topic.prompt_text}
							<p class="text-body-m text-ink-90 font-mono leading-relaxed whitespace-pre-wrap">{topic.prompt_text}</p>
						{:else}
							<p class="text-body-s text-ink-50 italic">No prompt text defined.</p>
						{/if}
					</div>
				</div>

				<Divider />

				<div class="grid grid-cols-1 gap-8 md:grid-cols-2">
					<div class="flex flex-col gap-3">
						<div class="flex items-center justify-between">
							<h3 class="text-label-m text-ink-90 flex items-center gap-2 font-bold">
								<Icon name="folder" class="text-accent-500" /> Required Files
							</h3>
							<Button variant="secondary" size="s" onclick={() => copyText(fileArray.join('\n'), 'all-files')}>
								<Icon name={copiedFiles === 'all-files' ? 'check' : 'copy'} class="mr-2 {copiedFiles === 'all-files' ? 'text-accent-500' : ''}" />
								{copiedFiles === 'all-files' ? 'Copied!' : 'Copy List'}
							</Button>
						</div>

						<div class="bg-level-1 border-border flex flex-col gap-1 rounded-xl border p-2">
							{#if fileArray.length > 0}
								{#each fileArray as file}
									<div role="button" tabindex="0" onclick={() => copyText(file, file)} onkeydown={(e) => e.key === 'Enter' && copyText(file, file)} class="group cursor-pointer">
										<File filetype="document" class="group-hover:bg-level-2 transition-colors">
											<div class="flex w-full items-center justify-between pr-2">
												<span class="text-ink-90 truncate font-mono">{file}</span>
												<Icon
													name={copiedFiles === file ? 'check' : 'copy'}
													class="opacity-0 transition-opacity group-hover:opacity-100 {copiedFiles === file ? 'text-accent-500 opacity-100' : 'text-ink-50'}" />
											</div>
										</File>
									</div>
								{/each}
							{:else}
								<p class="text-body-s text-ink-50 p-4 italic">No files linked.</p>
							{/if}
						</div>
					</div>

					<div class="flex flex-col gap-6">
						<div class="flex flex-col gap-3">
							<div class="flex items-center justify-between">
								<h3 class="text-label-m text-ink-90 flex items-center gap-2 font-bold">
									<Icon name="layout" /> Component Imports
								</h3>
								<Button variant="secondary" size="s" onclick={() => copyText(activeImportStrings, 'comps')}>
									<Icon name={copiedComps ? 'check' : 'copy'} class="mr-2 {copiedComps ? 'text-accent-500' : ''}" />
									{copiedComps ? 'Copied!' : 'Copy Imports'}
								</Button>
							</div>

							<div class="bg-level-1 border-border overflow-hidden rounded-xl border">
								{#if deepContext.components.length > 0 || deepContext.tokens.length > 0}
									<div class="flex flex-col">
										{#if deepContext.tokens.includes('colors')}
											<a href="/files/dev/design-system/colors" class="border-border/50 hover:bg-level-2 group flex items-center justify-between border-b p-4 transition-colors">
												<span class="text-label-s text-ink-90 flex items-center gap-2 font-bold"><Icon name="check" class="text-accent-500" /> Colors Context</span>
											</a>
										{/if}
										{#if deepContext.tokens.includes('icons')}
											<a href="/files/dev/design-system/icons" class="border-border/50 hover:bg-level-2 group flex items-center justify-between border-b p-4 transition-colors">
												<span class="text-label-s text-ink-90 flex items-center gap-2 font-bold"><Icon name="check" class="text-accent-500" /> Icons Context</span>
											</a>
										{/if}

										{#each deepContext.components as compName}
											{@const compData = allComponents.find((c) => c.name === compName)}
											{#if compData}
												<a href={compData.href} class="border-border/50 hover:bg-level-2 group block flex flex-col gap-1 border-b p-4 transition-colors">
													<div class="flex items-center justify-between">
														<span class="text-label-s text-ink-90 font-bold">{compData.name}</span>

														<button
															class="text-ink-50 hover:text-ink-90 relative z-10 p-1 opacity-0 transition-opacity group-hover:opacity-100"
															onclick={(e) => {
																e.preventDefault();
																e.stopPropagation();
																copyText(compData.importStr, compData.name);
															}}
															title="Copy import">
															<Icon name={copiedFiles === compData.name ? 'check' : 'copy'} class={copiedFiles === compData.name ? 'text-accent-500' : ''} />
														</button>
													</div>
													<span class="text-body-s text-ink-50 truncate font-mono">{compData.importStr}</span>
												</a>
											{/if}
										{/each}
									</div>
								{:else}
									<p class="text-body-s text-ink-50 p-6 italic">No components or tokens linked.</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
