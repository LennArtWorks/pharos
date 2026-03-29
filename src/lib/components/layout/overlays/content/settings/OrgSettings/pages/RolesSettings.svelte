<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import * as Popover from '$lib/components/ui/Popover';
	import PermissionBuilder from '$lib/components/blocks/PermissionBuilder.svelte';
	import { SETUP_ROLES } from '$lib/config/cloudfiles/roles';

	let { hasUnsavedChanges = $bindable(false) } = $props();

	type RoleData = { name: string; flags: string[] };

	let rolesList = $state<RoleData[]>([]);
	let originalRolesString = $state('');
	let isLoading = $state(true);

	let activeRoleIndex = $state(0);
	let activeRole = $derived(rolesList[activeRoleIndex]);

	let guestRoleName = $state<string>(SETUP_ROLES.GUEST);
	let newUserRoleName = $state<string>(SETUP_ROLES.NEW_USER);
	let newRoleInput = $state('');

	let editingRoleIndex = $state<number | null>(null);
	let editingRoleName = $state('');

	let collapsed = $state<Record<string, boolean>>({
		global: false,
		system: false,
		systemFiles: false,
		workspace: false,
		files: false,
		interaction: false
	});

	let draggedRoleIndex = $state<number | null>(null);
	let dragOverRoleIndex = $state<number | null>(null);

	const fileFlags = ['view', 'read', 'create', 'edit', 'delete', 'move', 'publish', 'manage_permission', 'download'];

	onMount(async () => {
		try {
			const res = await fetch('/api/settings/organisation/roles');
			if (res.ok) {
				const data = await res.json();
				guestRoleName = data.guestRole;
				newUserRoleName = data.newUserRole;
				rolesList = Object.entries(data.roles).map(([name, flags]) => ({ name, flags: flags as string[] }));
				originalRolesString = JSON.stringify({ guestRoleName, newUserRoleName, rolesList });
			}
		} catch (err) {
			console.error('Failed to load roles', err);
		} finally {
			isLoading = false;
		}
	});

	$effect(() => {
		if (!isLoading) {
			hasUnsavedChanges = JSON.stringify(rolesList) !== originalRolesString;
		}
	});

	export async function saveRoles() {
		const rolesObj: Record<string, string[]> = {};
		for (const r of rolesList) {
			rolesObj[r.name] = cleanFlagsForOutput(r.flags);
		}

		const payload = {
			guestRole: guestRoleName,
			newUserRole: newUserRoleName,
			roles: rolesObj
		};

		try {
			const res = await fetch('/api/settings/organisation/roles', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});

			if (res.ok) {
				originalRolesString = JSON.stringify({ guestRoleName, newUserRoleName, rolesList });
				hasUnsavedChanges = false;
			}
		} catch (err) {
			alert('Network error while saving.');
		}
	}

	let prevRoleIndex = $state(-1);
	$effect(() => {
		// FIX: Add safe check to ensure activeRole actually exists before running string methods
		if (activeRoleIndex !== prevRoleIndex && activeRole && activeRole.flags) {
			const flags = activeRole.flags;
			const hasGlobal = flags.includes('*');
			const checkGrp = (prefix: string) => flags.includes(`${prefix}.*`);

			untrack(() => {
				collapsed.global = hasGlobal;
				collapsed.system = hasGlobal || checkGrp('system');
				collapsed.systemFiles = hasGlobal || flags.includes('system.*') || checkGrp('system.files');
				collapsed.workspace = hasGlobal || checkGrp('workspace');
				collapsed.files = hasGlobal || checkGrp('files');
				collapsed.interaction = hasGlobal || checkGrp('interaction');
			});
			prevRoleIndex = activeRoleIndex;
		}
	});

	function isFlagCovered(flag: string, flagsList: string[]) {
		if (!flagsList) return false;
		if (flag === '*') return false;
		if (flagsList.includes('*')) return true;
		const parts = flag.split('.');
		let currentPath = '';
		for (let i = 0; i < parts.length - 1; i++) {
			currentPath += i === 0 ? parts[i] : '.' + parts[i];
			if (flagsList.includes(currentPath + '.*') && flag !== currentPath + '.*') return true;
		}
		return false;
	}

	function cleanFlagsForOutput(flags: string[]) {
		if (flags.includes('*')) return ['*'];
		const sorted = [...flags].sort();
		const result: string[] = [];
		for (const f of sorted) {
			const isCovered = result.some((r) => r === '*' || (r.endsWith('.*') && f.startsWith(r.slice(0, -2) + '.')));
			if (!isCovered) result.push(f);
		}
		return result;
	}

	function selectRole(index: number) {
		activeRoleIndex = index;
	}
	function toggleAccordion(key: string) {
		collapsed[key] = !collapsed[key];
	}

	function toggleFlag(flag: string, categoryToCollapse?: string) {
		if (!activeRole) return;
		const currentFlags = [...activeRole.flags];
		if (currentFlags.includes(flag)) {
			rolesList[activeRoleIndex].flags = currentFlags.filter((f) => f !== flag);
			if (categoryToCollapse && flag.endsWith('*')) collapsed[categoryToCollapse] = false;
		} else {
			rolesList[activeRoleIndex].flags = [...currentFlags, flag];
			if (categoryToCollapse && flag.endsWith('*')) collapsed[categoryToCollapse] = true;
		}
	}

	function addRole() {
		const name = newRoleInput.trim();
		if (!name || rolesList.find((r) => r.name === name)) return;
		rolesList = [...rolesList, { name, flags: [] }];
		activeRoleIndex = rolesList.length - 1;
		newRoleInput = '';
	}

	function deleteRole(index: number) {
		const roleName = rolesList[index].name;
		if (roleName === guestRoleName || roleName === newUserRoleName) return;
		rolesList = rolesList.filter((_, i) => i !== index);
		if (activeRoleIndex >= rolesList.length) activeRoleIndex = Math.max(0, rolesList.length - 1);
	}

	function startEditRole(index: number) {
		editingRoleIndex = index;
		editingRoleName = rolesList[index].name;
	}

	function saveEditRole() {
		if (editingRoleIndex !== null && editingRoleName.trim() !== '') {
			const newName = editingRoleName.trim();
			const oldName = rolesList[editingRoleIndex].name;
			rolesList[editingRoleIndex].name = newName;
			if (guestRoleName === oldName) guestRoleName = newName;
			if (newUserRoleName === oldName) newUserRoleName = newName;
		}
		editingRoleIndex = null;
	}

	// --- Horizontal Drag Handlers ---
	function handleDragStart(e: DragEvent, index: number) {
		if (editingRoleIndex === index) {
			e.preventDefault();
			return;
		}
		draggedRoleIndex = index;
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', index.toString());
		}
	}

	function handleDragOver(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedRoleIndex === null || draggedRoleIndex === index) return;
		dragOverRoleIndex = index;
	}

	function handleDrop(e: DragEvent, index: number) {
		e.preventDefault();
		if (draggedRoleIndex === null || draggedRoleIndex === index) return;
		const newRoles = [...rolesList];
		const [moved] = newRoles.splice(draggedRoleIndex, 1);
		newRoles.splice(index, 0, moved);
		rolesList = newRoles;

		if (activeRoleIndex === draggedRoleIndex) activeRoleIndex = index;
		else if (activeRoleIndex > draggedRoleIndex && activeRoleIndex <= index) activeRoleIndex--;
		else if (activeRoleIndex < draggedRoleIndex && activeRoleIndex >= index) activeRoleIndex++;

		draggedRoleIndex = null;
		dragOverRoleIndex = null;
	}
</script>

{#snippet checkboxProp(flag: string, label?: string)}
	{@const effectivelyCovered = isFlagCovered(flag, activeRole?.flags || [])}
	{@const isChecked = activeRole?.flags?.includes(flag) || effectivelyCovered}

	<button
		disabled={effectivelyCovered || !activeRole}
		onclick={(e) => {
			e.stopPropagation();
			toggleFlag(flag);
		}}
		class="rounded-m h-main-m flex w-full items-center gap-3 border px-3 text-left transition-all {effectivelyCovered
			? 'bg-level-2 border-border'
			: isChecked
				? 'bg-ink-90/5 border-ink-90 text-ink-90'
				: 'bg-level-2 border-border text-ink-50 hover:border-ink-50'}">
		<div
			class="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border {effectivelyCovered
				? 'bg-ink-30 border-ink-30 text-level-0'
				: isChecked
					? 'bg-ink-90 border-ink-90 text-level-0'
					: 'border-ink-50'}">
			{#if isChecked}<Icon name="circled-check" class="stroke-ink-10" />{/if}
		</div>
		<span class="text-label-s truncate font-mono {effectivelyCovered ? 'text-ink-30' : ''}">{label || flag}</span>
	</button>
{/snippet}

{#snippet wildcardToggle(flag: string, collapseCategory: string)}
	{@const effectivelyCovered = isFlagCovered(flag, activeRole?.flags || [])}
	{@const isChecked = activeRole?.flags?.includes(flag) || effectivelyCovered}

	<button
		disabled={effectivelyCovered || !activeRole}
		onclick={(e) => {
			e.stopPropagation();
			toggleFlag(flag, collapseCategory);
		}}
		class="flex h-5 w-5 items-center justify-center rounded-sm border transition-all {effectivelyCovered
			? 'bg-ink-30 border-ink-30 text-level-0'
			: isChecked
				? 'bg-ink-90 border-ink-90 text-level-0'
				: 'border-ink-50 hover:border-ink-90 text-transparent'}"
		title="Toggle all permissions in group">
		{#if isChecked}<Icon name="circled-check" class="stroke-ink-10" />{/if}
	</button>
{/snippet}

{#snippet accordionHeader(id: string, title: string, flag: string)}
	{@const covered = isFlagCovered(flag, activeRole?.flags || [])}
	<div
		class="h-main-s flex cursor-pointer items-center justify-between px-2 transition-colors {covered ? 'bg-level-2' : 'bg-level-1 hover:bg-level-2'} {collapsed[id]
			? 'rounded-m'
			: 'border-border rounded-t-m border-b'}"
		onclick={() => toggleAccordion(id)}>
		<div class="flex items-center gap-3">
			<Icon name={collapsed[id] ? 'arrow-right' : 'arrow-down'} class={covered ? 'text-ink-30' : 'text-ink-50'} />
			<span class="text-label-s font-bold {covered ? 'text-ink-30' : 'text-ink-90'}">{title}</span>
		</div>
		<div class="flex items-center gap-3">
			<span class="text-label-s font-mono {covered ? 'text-ink-30' : 'text-ink-50'}">{flag}</span>
			{@render wildcardToggle(flag, id)}
		</div>
	</div>
{/snippet}

{#if isLoading}
	<div class="text-ink-50 p-12 text-center italic">Loading roles...</div>
{:else}
	<div class="flex flex-col gap-8 pb-12">
		<div>
			<h1 class="text-label-xl text-ink-90 font-bold">Roles & Permissions</h1>
			<p class="text-body-m text-ink-50 mt-1">Configure groups visually and assign system access levels.</p>
		</div>

		<div class="bg-level-1 border-border sticky top-0 z-40 flex flex-col gap-4 border-b pt-2 pb-4">
			<div class="flex flex-wrap items-center gap-2">
				{#each rolesList as role, index (role.name)}
					<div
						class="group relative flex cursor-grab items-center active:cursor-grabbing {dragOverRoleIndex === index ? 'border-ink-90 border-l-2 pl-1' : ''}"
						draggable={editingRoleIndex !== index}
						ondragstart={(e) => handleDragStart(e, index)}
						ondragover={(e) => handleDragOver(e, index)}
						ondrop={(e) => handleDrop(e, index)}>
						{#if editingRoleIndex === index}
							<div class="bg-level-2 border-accent-500 h-main-s rounded-m flex items-center overflow-hidden border px-1 shadow-sm">
								<input
									type="text"
									bind:value={editingRoleName}
									class="text-label-s text-ink-90 h-full w-24 border-none bg-transparent px-2 ring-0 outline-none focus:ring-0"
									onkeydown={(e) => e.key === 'Enter' && saveEditRole()}
									onblur={saveEditRole}
									autofocus />
								<button
									class="text-ink-50 hover:text-accent-500 flex h-full items-center justify-center px-1 transition-colors outline-none"
									onmousedown={(e) => {
										e.preventDefault();
										saveEditRole();
									}}>
									<Icon name="circled-check" />
								</button>
							</div>
						{:else}
							<div class="flex items-center">
								<Button
									variant="secondary"
									size="s"
									active={activeRoleIndex === index}
									onclick={() => selectRole(index)}
									ondblclick={(e: MouseEvent) => {
										e.stopPropagation();
										startEditRole(index);
									}}
									class="rounded-r-none pr-2 {activeRoleIndex === index ? 'bg-level-2 text-ink-90 border-ink-90' : ''}">
									{#snippet leading()}
										<div class="text-ink-50 flex shrink-0 items-center justify-center gap-1">
											{#if role.name === guestRoleName && role.name === newUserRoleName}
												<Icon name="person" data-tooltip="Guest Role" />
												<Icon name="rocket" data-tooltip="New User Default" />
											{:else if role.name === guestRoleName}
												<Icon name="person" data-tooltip="Guest Role" />
											{:else if role.name === newUserRoleName}
												<Icon name="rocket" data-tooltip="New User Default" />
											{:else}
												<div class="w-1"></div>
											{/if}
										</div>
									{/snippet}
									{role.name}
								</Button>

								<Popover.Root closeOnClick={true}>
									<Popover.Trigger>
										<div
											tabindex="0"
											class="border-border hover:bg-level-2 h-main-s rounded-r-m flex w-6 items-center justify-center border-y border-r transition-colors outline-none {activeRoleIndex === index
												? 'border-y-ink-90 border-r-ink-90 bg-level-2'
												: ''}">
											<Icon name="arrow-down" class="text-ink-50 h-3 w-3" />
										</div>
									</Popover.Trigger>
									<Popover.Content class="w-56 p-1">
										<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => startEditRole(index)}>{#snippet leading()}<Icon name="pencil" />{/snippet} Edit Name</Button>
										<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => (guestRoleName = role.name)}
											>{#snippet leading()}<Icon name="person" />{/snippet} Set as Guest Role</Button>
										<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => (newUserRoleName = role.name)}
											>{#snippet leading()}<Icon name="rocket" />{/snippet} Set as New User</Button>
										{#if role.name !== guestRoleName && role.name !== newUserRoleName}
											<div class="border-border my-1 border-t"></div>
											<Button variant="tertiary" size="s" class="text-error hover:text-error w-full justify-start" onclick={() => deleteRole(index)}
												>{#snippet leading()}<Icon name="trash" />{/snippet} Delete Role</Button>
										{/if}
									</Popover.Content>
								</Popover.Root>
							</div>
						{/if}
					</div>
				{/each}

				<div class="ml-2 flex items-center gap-2">
					<div class="w-32">
						<Input bind:value={newRoleInput} placeholder="New role..." class="!h-main-s text-label-s" onkeydown={(e) => e.key === 'Enter' && addRole()} />
					</div>
					<Button size="s" variant="secondary" icon onclick={addRole}><Icon name="add" /></Button>
				</div>
			</div>
		</div>

		<div class="mt-4 flex flex-col gap-6">
			{#if activeRole}
				<PermissionBuilder bind:flags={activeRole.flags} title={`Flags for ${activeRole.name}`} />
			{/if}
		</div>
	</div>
{/if}
