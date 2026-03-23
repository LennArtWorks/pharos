<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Form from '$lib/components/layout/Form.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import * as Select from '$lib/components/ui/Select';

	import { uiComponents, blocks, layouts } from '../../data';

	let { data } = $props();

	// Alle Kategorien inklusive der Globalen sind jetzt verfügbar!
	let allCategories = $derived(data.categories);
	let allTopics = $derived(data.topics);

	let title = $state('');
	let category = $state(allCategories.length > 0 ? allCategories[0].id : '');
	let newCategoryName = $state('');
	let parentTopic = $state('none');
	let promptText = $state('');
	let filesList = $state('');

	// State für die Komponenten und Design Tokens Checklisten
	let selectedComponents = $state<string[]>([]);
	let selectedTokens = $state<string[]>([]);

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
</script>

<div class="flex h-full flex-col">
	<div class="pt-main-l bg-level-2 p-m border-border sticky top-0 z-10 flex items-center gap-2 border-b">
		<Icon name="sparkles" class="text-accent-500 h-6 w-6" />
		<h2 class="text-label-xl text-ink-90 font-bold">Create New Topic</h2>
	</div>

	<div class="max-w-4xl p-8">
		<Form action="?/create">
			<div class="flex flex-col gap-6">
				<div class="grid grid-cols-2 gap-4">
					<Input label="Topic Title" name="title" bind:value={title} required placeholder="e.g. WebDAV Auth Flow" />

					<div class="flex flex-col gap-1">
						<label class="text-ink-50 px-2xs font-label-s font-semibold">Nest under (Parent Topic)</label>
						<input type="hidden" name="parent_id" value={parentTopic} />
						<Select.Root bind:value={parentTopic}>
							<Select.Trigger label="Parent Topic" placeholder="Select parent..." class="w-full" />
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
							<Select.Trigger label="Category" placeholder="Select a category..." class="w-full" />
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
						<span class="text-label-s text-accent-500 flex items-center gap-2 font-bold">
							<Icon name="folder" class="h-4 w-4" /> Create Category
						</span>
						<Input name="new_category_name" bind:value={newCategoryName} placeholder="e.g. UI Components" required={category === 'new_cat'} />
					</div>
				{/if}

				<div class="flex flex-col gap-1">
					<label class="text-ink-50 px-2xs font-label-s font-semibold">System Prompt</label>
					<textarea
						name="prompt_text"
						bind:value={promptText}
						rows="6"
						class="bg-level-1 border-border text-ink-90 rounded-m focus:ring-accent-500 resize-y border p-3 font-mono text-sm outline-none focus:ring-2"
						placeholder="I am building..."></textarea>
				</div>

				<div class="grid grid-cols-2 gap-6">
					<div class="flex flex-col gap-1">
						<label class="text-ink-50 px-2xs font-label-s font-semibold">Relevant Files (One path per line)</label>
						<textarea
							name="files_list"
							bind:value={filesList}
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
										{#if selectedTokens.includes('colors')}<Icon name="check" class="h-3 w-3" />{/if}
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
										{#if selectedTokens.includes('icons')}<Icon name="check" class="h-3 w-3" />{/if}
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
												{#if selectedComponents.includes(comp.name)}<Icon name="check" class="h-3 w-3" />{/if}
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
												{#if selectedComponents.includes(comp.name)}<Icon name="check" class="h-3 w-3" />{/if}
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
					<Button variant="primary" type="submit" class="w-full justify-center">Create Topic</Button>
				</div>
			</div>
		</Form>
	</div>
</div>
