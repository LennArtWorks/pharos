<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';

	let {
		flags = $bindable([]),
		inheritedFlags = [],
		title = 'Flags'
	}: {
		flags: string[];
		inheritedFlags?: string[];
		title?: string;
	} = $props();

	const fileFlags = ['view', 'read', 'create', 'edit', 'delete', 'move', 'publish', 'manage_permission', 'download'];

	let collapsed = $state<Record<string, boolean>>({
		global: false,
		system: false,
		systemFiles: false,
		workspace: false,
		files: false,
		interaction: false
	});

	// Automatically expand/collapse categories based on active flags
	$effect(() => {
		const allActive = [...flags, ...inheritedFlags];
		const hasGlobal = allActive.includes('*');
		const checkGrp = (prefix: string) => allActive.includes(`${prefix}.*`);

		collapsed.global = hasGlobal;
		collapsed.system = hasGlobal || checkGrp('system');
		collapsed.systemFiles = hasGlobal || allActive.includes('system.*') || checkGrp('system.files');
		collapsed.workspace = hasGlobal || checkGrp('workspace');
		collapsed.files = hasGlobal || checkGrp('files');
		collapsed.interaction = hasGlobal || checkGrp('interaction');
	});

	function isFlagCovered(flag: string, list: string[]) {
		if (!list) return false;
		if (flag === '*') return false;
		if (list.includes('*')) return true;
		const parts = flag.split('.');
		let currentPath = '';
		for (let i = 0; i < parts.length - 1; i++) {
			currentPath += i === 0 ? parts[i] : '.' + parts[i];
			if (list.includes(currentPath + '.*') && flag !== currentPath + '.*') return true;
		}
		return false;
	}

	function toggleAccordion(key: string) {
		collapsed[key] = !collapsed[key];
	}

	function toggleFlag(flag: string, categoryToCollapse?: string) {
		if (flags.includes(flag)) {
			flags = flags.filter((f) => f !== flag);
			if (categoryToCollapse && flag.endsWith('*')) collapsed[categoryToCollapse] = false;
		} else {
			flags = [...flags, flag];
			if (categoryToCollapse && flag.endsWith('*')) collapsed[categoryToCollapse] = true;
		}
	}
</script>

{#snippet checkboxProp(flag: string, label?: string)}
	{@const isExplicit = flags.includes(flag) || isFlagCovered(flag, flags)}
	{@const isInherited = inheritedFlags.includes(flag) || isFlagCovered(flag, inheritedFlags)}

	<button
		onclick={(e) => {
			e.stopPropagation();
			toggleFlag(flag);
		}}
		class="rounded-m h-main-m flex w-full items-center gap-3 border px-3 text-left transition-all
      {isExplicit ? 'bg-ink-90/5 border-ink-90 text-ink-90' : isInherited ? 'bg-level-2 border-border text-ink-50' : 'bg-level-2 border-border text-ink-50 hover:border-ink-50'}">
		<div
			class="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border
      {isExplicit ? 'bg-ink-90 border-ink-90 text-level-0' : isInherited ? 'bg-ink-30 border-ink-30 text-level-0' : 'border-ink-50'}">
			{#if isExplicit || isInherited}<Icon name="circled-check" class={isExplicit ? 'stroke-ink-10' : 'stroke-level-0'} />{/if}
		</div>
		<span class="text-label-s truncate font-mono {isInherited && !isExplicit ? 'text-ink-50' : ''}">
			{label || flag}
			{#if isInherited && !isExplicit}<span class="text-ink-40 ml-2 text-[10px] tracking-wider uppercase">(Inherited)</span>{/if}
			{#if isExplicit}<span class="text-accent-500 ml-2 text-[10px] tracking-wider uppercase">(Override)</span>{/if}
		</span>
	</button>
{/snippet}

{#snippet wildcardToggle(flag: string, collapseCategory: string)}
	{@const isExplicit = flags.includes(flag) || isFlagCovered(flag, flags)}
	{@const isInherited = inheritedFlags.includes(flag) || isFlagCovered(flag, inheritedFlags)}

	<button
		onclick={(e) => {
			e.stopPropagation();
			toggleFlag(flag, collapseCategory);
		}}
		class="flex h-5 w-5 items-center justify-center rounded-sm border transition-all
      {isExplicit ? 'bg-ink-90 border-ink-90 text-level-0' : isInherited ? 'bg-ink-30 border-ink-30 text-level-0' : 'border-ink-50 hover:border-ink-90 text-transparent'}"
		title="Toggle all permissions in group">
		{#if isExplicit || isInherited}<Icon name="circled-check" class={isExplicit ? 'stroke-ink-10' : 'stroke-level-0'} />{/if}
	</button>
{/snippet}

{#snippet accordionHeader(id: string, groupTitle: string, flag: string)}
	{@const isInherited = inheritedFlags.includes(flag) || isFlagCovered(flag, inheritedFlags)}
	{@const covered = isInherited || isFlagCovered(flag, flags)}
	<div
		class="h-main-s flex cursor-pointer items-center justify-between px-2 transition-colors {covered ? 'bg-level-2' : 'bg-level-1 hover:bg-level-2'} {collapsed[id]
			? 'rounded-m'
			: 'border-border rounded-t-m border-b'}"
		onclick={() => toggleAccordion(id)}>
		<div class="flex items-center gap-3">
			<Icon name={collapsed[id] ? 'arrow-right' : 'arrow-down'} class={covered ? 'text-ink-30' : 'text-ink-50'} />
			<span class="text-label-s font-bold {covered ? 'text-ink-30' : 'text-ink-90'}">{groupTitle}</span>
		</div>
		<div class="flex items-center gap-3">
			<span class="text-label-s font-mono {covered ? 'text-ink-30' : 'text-ink-50'}">{flag}</span>
			{@render wildcardToggle(flag, id)}
		</div>
	</div>
{/snippet}

<div data-uiname="PermissionBuilder-Wrapper" class="flex flex-col gap-6">
	<div data-uiname="PermissionBuilder-Header" class="flex items-center justify-between">
		<h2 class="text-label-xl text-ink-90 font-bold">{title}</h2>
		<span class="text-label-s text-ink-50">{flags.length} active overrides</span>
	</div>

	<div data-uiname="PermissionBuilder-AccordionList" class="bg-level-0 border-border rounded-m flex flex-col overflow-hidden border">
		{@render accordionHeader('global', 'Global System Access', '*')}
		{#if !collapsed.global}
			<div data-uiname="PermissionBuilder-AccordionContent" class="bg-level-0 rounded-b-m flex flex-col gap-6 p-6">
				<div class="border-border rounded-m border">
					{@render accordionHeader('system', 'System Administration', 'system.*')}
					{#if !collapsed.system}
						<div class="bg-level-0 rounded-b-m flex flex-col gap-6 p-4">
							<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
								{@render checkboxProp('system.manage_users')}
								{@render checkboxProp('system.manage_roles')}
								{@render checkboxProp('system.settings_write')}
							</div>
							<div class="border-border rounded-m border">
								{@render accordionHeader('systemFiles', 'System Files', 'system.files.*')}
								{#if !collapsed.systemFiles}
									<div class="bg-level-0 rounded-b-m grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
										{#each fileFlags as flag}{@render checkboxProp(`system.files.${flag}`)}{/each}
									</div>
								{/if}
							</div>
						</div>
					{/if}
				</div>

				<div class="border-border rounded-m border">
					{@render accordionHeader('workspace', 'Workspace', 'workspace.*')}
					{#if !collapsed.workspace}
						<div class="bg-level-0 rounded-b-m grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
							{@render checkboxProp('workspace.create')}
							{@render checkboxProp('workspace.edit')}
							{@render checkboxProp('workspace.delete')}
							{@render checkboxProp('workspace.move')}
							{@render checkboxProp('workspace.manage_permission')}
						</div>
					{/if}
				</div>

				<div class="border-border rounded-m border">
					{@render accordionHeader('files', 'Files', 'files.*')}
					{#if !collapsed.files}
						<div class="bg-level-0 rounded-b-m grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
							{#each fileFlags as flag}{@render checkboxProp(`files.${flag}`)}{/each}
						</div>
					{/if}
				</div>

				<div class="border-border rounded-m border">
					{@render accordionHeader('interaction', 'Interactions', 'interaction.*')}
					{#if !collapsed.interaction}
						<div class="bg-level-0 rounded-b-m grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
							{@render checkboxProp('interaction.submit_forms')}
							{@render checkboxProp('interaction.book_shifts')}
							{@render checkboxProp('interaction.checkout')}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
