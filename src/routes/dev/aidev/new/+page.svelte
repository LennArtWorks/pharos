<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Form from '$lib/components/layout/Form.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { uiComponents, blocks, layouts } from '../../data';

	let { data } = $props();

	let allCategories = $derived(data.categories);
	let allTopics = $derived(data.topics);
	let allGlobalTopics = $derived(data.allGlobalTopics || []);

	let title = $state('');
	let category = $state(allCategories.length > 0 ? allCategories[0].id : '');
	let newCategoryName = $state('');
	let parentTopic = $state('none');
	let description = $state('');
	let promptText = $state('');
	let filesList = $state('');

	let selectedComponents = $state<string[]>([]);
	let selectedTokens = $state<string[]>([]);
	let ignoredParents = $state<string[]>([]);

	let editGlobalMode = $state('ALL');
	let selectedGlobals = $state<string[]>([]);

	let groupedParents = $derived(() => {
		const groups: Record<string, any[]> = {};
		for (const t of allTopics) {
			const cat = data.categories.find((c: any) => c.id === t.category_id);
			const catName = cat ? cat.name : 'Unknown';
			if (!groups[catName]) groups[catName] = [];
			groups[catName].push(t);
		}
		return groups;
	});

	let activeParentChain = $derived.by(() => {
		let chain = [];
		let curr = parentTopic;
		while (curr && curr !== 'none') {
			const t = allTopics.find((t: any) => t.id === curr);
			if (t) {
				chain.unshift(t);
				curr = t.parent_id;
			} else break;
		}
		return chain;
	});

	function toggleArrayItem(arr: string[], item: string) {
		return arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];
	}
</script>

<div class="flex h-full flex-col">
	<div class="pt-main-l bg-level-2 p-m border-border sticky top-0 z-10 flex items-center gap-2 border-b">
		<Icon name="sparkles" class="h-6 w-6 text-purple-500" />
		<h2 class="text-label-xl text-ink-90 font-bold">Create New Topic</h2>
	</div>

	<div class="max-w-4xl p-8">
		<Form action="?/create" enhance>
			<input type="hidden" name="ignored_parents" value={ignoredParents.join(',')} />
			<div class="flex flex-col gap-6">
				{#if activeParentChain.length > 0}
					<div class="bg-level-1 border-border rounded-m flex flex-col gap-2 border p-4">
						<span class="text-label-xs text-ink-50 font-bold uppercase">Parent Context Chain</span>
						<p class="text-body-s text-ink-50 mb-2">Click a parent to ignore its context from bleeding into this topic.</p>
						<div class="flex flex-wrap items-center gap-2">
							{#each activeParentChain as p}
								<button
									type="button"
									class="hover:text-accent-500 flex cursor-pointer items-center gap-2 {ignoredParents.includes(p.id) ? 'text-ink-30 line-through' : 'text-ink-90'}"
									onclick={() => (ignoredParents = toggleArrayItem(ignoredParents, p.id))}>
									<span class="text-body-s font-mono transition-colors">{p.title}</span>
									<Icon name="arrow-right" class="text-ink-30" />
								</button>
							{/each}
							<span class="text-body-s text-ink-90 border-ink-50 border-b border-dashed font-mono font-bold">{title || 'New Topic'}</span>
						</div>
					</div>
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<Input label="Topic Title" name="title" bind:value={title} placeholder="e.g. WebDAV Auth Flow" />

					<div class="flex flex-col gap-1">
						<label class="text-ink-50 px-2xs font-label-s font-semibold">Nest under (Parent Topic)</label>
						<input type="hidden" name="parent_id" value={parentTopic} />
						<Select.Root bind:value={parentTopic}>
							<Select.Trigger class="w-full">
								{#if parentTopic === 'none'}
									<div class="flex items-center"><Icon name="minus" class="text-ink-50 mr-2 h-4 w-4" /> None (Root Level)</div>
								{:else}
									<div class="flex items-center"><Icon name="file" class="text-ink-50 mr-2 h-4 w-4" /> {allTopics.find((t) => t.id === parentTopic)?.title || 'Select...'}</div>
								{/if}
							</Select.Trigger>
							<Select.Content class="max-h-[300px] overflow-y-auto">
								<Select.Item value="none">
									<Icon name="minus" class="text-ink-50 mr-2 h-4 w-4" /> None (Root Level)
								</Select.Item>
								<div class="bg-border my-1 h-px w-full"></div>
								{#each Object.entries(groupedParents()) as [catName, topicsInCat]}
									<div class="text-label-xs text-ink-50 px-2 py-1 font-bold uppercase">{catName}</div>
									{#each topicsInCat as parent}
										<Select.Item value={parent.id} class="pl-6">
											<Icon name="file" class="text-ink-50 mr-2 h-4 w-4" />
											{parent.title}
										</Select.Item>
									{/each}
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>

				{#if parentTopic === 'none'}
					<div class="animate-in fade-in flex w-1/2 flex-col gap-1 pr-2">
						<label class="text-ink-50 px-2xs font-label-s font-semibold">Category</label>
						<input type="hidden" name="category_id" value={category} />
						<Select.Root bind:value={category}>
							<Select.Trigger class="w-full">
								{#if category === 'new_cat'}
									<div class="text-accent-500 flex items-center font-bold"><Icon name="add" class="mr-2 h-4 w-4" /> Add New Category</div>
								{:else}
									{@const activeCat = allCategories.find((c) => c.id === category)}
									<div class="flex items-center"><Icon name={activeCat?.is_global ? 'sparkles' : 'folder'} class="text-ink-50 mr-2 h-4 w-4" /> {activeCat?.name || 'Select...'}</div>
								{/if}
							</Select.Trigger>
							<Select.Content>
								{#each allCategories as cat}
									<Select.Item value={cat.id}>
										<Icon name={cat.is_global ? 'sparkles' : 'folder'} class="text-ink-50 mr-2 h-4 w-4" />
										{cat.name}
									</Select.Item>
								{/each}
								<div class="bg-border my-1 h-px w-full"></div>
								<Select.Item value="new_cat">
									<Icon name="add" class="text-accent-500 mr-2 h-4 w-4" /> <span class="text-accent-500 font-bold">Add New Category</span>
								</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>
				{:else}
					<input type="hidden" name="category_id" value="" />
				{/if}

				{#if category === 'new_cat' && parentTopic === 'none'}
					<div class="bg-level-1 border-accent-500/50 animate-in fade-in slide-in-from-top-2 flex w-1/2 flex-col gap-2 rounded-lg border p-4">
						<span class="text-label-s text-accent-500 flex items-center gap-2 font-bold"><Icon name="folder" class="h-4 w-4" /> Create Category</span>
						<Input name="new_category_name" bind:value={newCategoryName} placeholder="e.g. UI Components" />
					</div>
				{/if}

				<div class="flex flex-col gap-1">
					<label class="text-ink-50 px-2xs font-label-s font-semibold">Human Description (Optional, UI only)</label>
					<textarea
						name="human_description"
						bind:value={description}
						rows="2"
						class="bg-level-1 border-border text-ink-90 rounded-m resize-y border p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-purple-500"
						placeholder="Explain what this architecture does..."></textarea>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-ink-50 px-2xs font-label-s font-semibold">System Prompt (AI Logic)</label>
					<textarea
						name="prompt_text"
						bind:value={promptText}
						rows="6"
						class="bg-level-1 border-border text-ink-90 rounded-m resize-y border p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-purple-500"
						placeholder="I am building..."></textarea>
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
													class="flex h-4 w-4 items-center justify-center rounded border {selectedGlobals.includes(gt.id) ? 'bg-accent-500 border-accent-500 text-white' : 'border-border bg-level-2'}">
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
							<label class="text-ink-50 px-2xs font-label-s font-semibold">Relevant Files (One path per line)</label>
							<textarea
								name="files_list"
								bind:value={filesList}
								class="bg-level-1 border-border text-ink-90 rounded-m h-full min-h-[120px] resize-y border p-3 font-mono text-sm outline-none focus:ring-2 focus:ring-purple-500"
								placeholder="src/routes/+page.svelte"></textarea>
						</div>
					</div>

					<div class="flex flex-col gap-4">
						<div class="flex flex-col gap-1">
							<label class="text-ink-50 px-2xs font-label-s font-semibold">Design Tokens Context</label>
							<div class="bg-level-1 border-border rounded-m flex flex-col gap-2 border p-4">
								{#each ['colors', 'icons'] as token}
									<label class="group flex cursor-pointer items-start gap-3">
										<input
											type="checkbox"
											name="tokens"
											value={token}
											checked={selectedTokens.includes(token)}
											onchange={() => (selectedTokens = toggleArrayItem(selectedTokens, token))}
											class="hidden" />
										<div
											class="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors {selectedTokens.includes(token)
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
													class="flex h-4 w-4 items-center justify-center rounded border transition-colors {selectedComponents.includes(comp.name)
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
					<Button variant="primary" type="submit" class="w-full justify-center">Create Topic</Button>
				</div>
			</div>
		</Form>
	</div>
</div>
