<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import * as Popover from '$lib/components/ui/Popover';
	import { SETUP_ROLES, DEFAULT_ROLES } from '$lib/config/cloudfiles/roles';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { foundations } from '../../../data';
	const colorData = foundations.find((f) => f.name === 'Permissions');
	const aiContext = colorData?.context || '';

	let copiedAI = $state(false);
	let copiedItem = $state<string | null>(null);

	// --- Logic to extract all permission strings ---
	function flattenPermissions(obj: any, prefix = ''): string[] {
		let flags: string[] = [];
		for (const key in obj) {
			if (typeof obj[key] === 'string') flags.push(obj[key]);
			else if (typeof obj[key] === 'object') flags = [...flags, ...flattenPermissions(obj[key])];
		}
		return [...new Set(flags)];
	}

	const allFlags = flattenPermissions(PERMISSIONS);

	// --- Data Structure ---
	type RoleData = { name: string; flags: string[] };

	let rolesList = $state<RoleData[]>(Object.entries({ ...DEFAULT_ROLES }).map(([name, flags]) => ({ name, flags })));

	let activeRoleIndex = $state(0);
	let activeRole = $derived(rolesList[activeRoleIndex]);

	let guestRoleName = $state<string>(SETUP_ROLES.GUEST);
	let newUserRoleName = $state<string>(SETUP_ROLES.NEW_USER);
	let newRoleInput = $state('');

	// Editing State
	let editingRoleIndex = $state<number | null>(null);
	let editingRoleName = $state('');

	// --- Accordion State ---
	let collapsed = $state<Record<string, boolean>>({
		global: false,
		system: false,
		systemFiles: false,
		workspace: false,
		files: false,
		interaction: false
	});

	// --- Drag & Drop Roles ---
	let draggedRoleIndex = $state<number | null>(null);
	let dragOverRoleIndex = $state<number | null>(null);

	// --- Output State ---
	let copiedCode = $state(false);

	const fileFlags = ['view', 'read', 'create', 'edit', 'delete', 'move', 'publish', 'manage_permission', 'download'];

	// --- Auto-Collapse Effect ---
	let prevRoleIndex = $state(-1);
	$effect(() => {
		if (activeRoleIndex !== prevRoleIndex && activeRole) {
			const flags = activeRole.flags;
			const hasGlobal = flags.includes('*');

			const checkGrp = (prefix: string) => flags.includes(`${prefix}.*`);

			collapsed.global = hasGlobal;
			collapsed.system = hasGlobal || checkGrp('system');
			collapsed.systemFiles = hasGlobal || flags.includes('system.*') || checkGrp('system.files');
			collapsed.workspace = hasGlobal || checkGrp('workspace');
			collapsed.files = hasGlobal || checkGrp('files');
			collapsed.interaction = hasGlobal || checkGrp('interaction');

			prevRoleIndex = activeRoleIndex;
		}
	});

	function isFlagCovered(flag: string, flagsList: string[]) {
		if (flag === '*') return false;
		if (flagsList.includes('*')) return true;

		const parts = flag.split('.');
		let currentPath = '';
		for (let i = 0; i < parts.length - 1; i++) {
			currentPath += i === 0 ? parts[i] : '.' + parts[i];
			if (flagsList.includes(currentPath + '.*') && flag !== currentPath + '.*') {
				return true;
			}
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

	// --- Actions ---
	function selectRole(index: number) {
		activeRoleIndex = index;
		window.scrollTo({ top: 0, behavior: 'smooth' });
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

	// --- Drag Handlers ---
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

	// --- Generator ---
	let generatedFile = $derived.by(() => {
		const rolesObj: Record<string, string[]> = {};
		for (const r of rolesList) {
			rolesObj[r.name] = cleanFlagsForOutput(r.flags);
		}
		const rolesJson = JSON.stringify(rolesObj, null, 2);

		return `
// src/lib/config/permissions.ts
// GENERATED VIA FSR PERMISSION BUILDER

const buildFilePermissions = <T extends string>(prefix: T) => ({
  ALL: \`\${prefix}.*\` as const,
  VIEW: \`\${prefix}.view\` as const,
  READ: \`\${prefix}.read\` as const,
  CREATE: \`\${prefix}.create\` as const,
  EDIT: \`\${prefix}.edit\` as const,
  DELETE: \`\${prefix}.delete\` as const,
  MOVE: \`\${prefix}.move\` as const,
  PUBLISH: \`\${prefix}.publish\` as const,
  MANAGE_PERMISSION: \`\${prefix}.manage_permission\` as const,
  DOWNLOAD: \`\${prefix}.download\` as const
});

export const PERMISSIONS = {
  GLOBAL_ADMIN: '*',
  SYSTEM: {
    ALL: 'system.*',
    MANAGE_USERS: 'system.manage_users',
    MANAGE_ROLES: 'system.manage_roles',
    SETTINGS_WRITE: 'system.settings_write',
    FILES: buildFilePermissions('system.files')
  },
  WORKSPACE: {
    ALL: 'workspace.*',
    CREATE: 'workspace.create',
    EDIT: 'workspace.edit',
    DELETE: 'workspace.delete',
    MOVE: 'workspace.move',
    MANAGE_PERMISSION: 'workspace.manage_permission',
  },
  FILES: buildFilePermissions('files'),
  INTERACTION: {
    ALL: 'interaction.*',
    SUBMIT_FORMS: 'interaction.submit_forms',
    BOOK_SHIFTS: 'interaction.book_shifts',
    CHECKOUT: 'interaction.checkout',
  }
} as const;

export const SETUP_ROLES = {
  GUEST: '${guestRoleName}',
  NEW_USER: '${newUserRoleName}'
} as const;

export const DEFAULT_ROLES: Record<string, string[]> = ${rolesJson};

export function hasPermission(userRole: string, requiredFlag: string, activeRoles: Record<string, string[]>): boolean {
  const rolePermissions = activeRoles[userRole] || [];
  if (rolePermissions.includes('*')) return true;
  if (rolePermissions.includes(requiredFlag)) return true;
  const parts = requiredFlag.split('.');
  while (parts.length > 0) {
    parts.pop();
    if (parts.length === 0) break;
    const wildcardFlag = \`\${parts.join('.')}.*\`;
    if (rolePermissions.includes(wildcardFlag)) return true;
  }
  const originalParts = requiredFlag.split('.');
  if (originalParts.length === 3) {
    const baseActionFlag = \`\${originalParts[0]}.\${originalParts[2]}\`;
    if (rolePermissions.includes(baseActionFlag)) return true;
  }
  return false;
}
    `.trim();
	});

	async function copyToClipboard(text: string, isAI = false) {
		try {
			await navigator.clipboard.writeText(text);
			if (isAI) {
				copiedAI = true;
				setTimeout(() => (copiedAI = false), 2000);
			} else {
				copiedItem = text;
				setTimeout(() => {
					if (copiedItem === text) copiedItem = null;
				}, 2000);
			}
		} catch (err) {
			console.error(err);
		}
	}
</script>

{#snippet checkboxProp(flag: string, label?: string)}
	{@const effectivelyCovered = isFlagCovered(flag, activeRole?.flags || [])}
	{@const isChecked = activeRole?.flags.includes(flag) || effectivelyCovered}

	<button
		data-uiname="permission-checkbox-{flag.replace(/[^a-zA-Z0-9]/g, '-')}"
		disabled={effectivelyCovered}
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
	{@const isChecked = activeRole?.flags.includes(flag) || effectivelyCovered}

	<button
		data-uiname="wildcard-toggle-{collapseCategory}"
		disabled={effectivelyCovered}
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
		{#if isChecked}
			<Icon name="circled-check" class="stroke-ink-10" />
		{/if}
	</button>
{/snippet}

{#snippet accordionHeader(id: string, title: string, flag: string)}
	{@const covered = isFlagCovered(flag, activeRole?.flags || [])}
	<div
		data-uiname="accordion-header-{id}"
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

<div data-uiname="permissions-page-wrapper" class="gap-3xl flex min-h-screen flex-col">
	<header data-uiname="permissions-header" class="border-border border-b pb-8">
		<div data-uiname="header-title-row" class="mb-4 flex items-center gap-4">
			<Button data-uiname="back-button" href="/dev/design-system" variant="secondary" size="s" icon><Icon name="arrow-left" /></Button>
			<h1 data-uiname="page-title" class="text-label-xl text-ink-90 font-bold">Roles & Permissions</h1>
		</div>
		<div class="flex items-start justify-between">
			<p data-uiname="page-description" class="text-body-m text-ink-50 max-w-2xl">Hierarchical system access control. Configure groups visually and export the smart, clean configuration.</p>
			<Button variant="secondary" size="s" data-tooltip={copiedAI ? '<b>Context Copied!</b>' : 'Copy instructions for AI Prompting'} onclick={() => copyToClipboard(aiContext, true)}>
				<Icon name="code-block" class="mr-2" /> AI Context
			</Button>
		</div>
	</header>

	<div data-uiname="permissions-main-content" class="relative flex flex-1 items-start gap-12">
		<div data-uiname="roles-sidebar" class="border-border pr-m sticky top-8 flex h-fit w-64 flex-col gap-6">
			<div data-uiname="roles-title" class="text-label-m text-ink-90 font-bold">Roles</div>

			<div data-uiname="roles-list" class="flex flex-col gap-1">
				{#each rolesList as role, index (role.name)}
					<div
						data-uiname="role-item-{index}"
						class="group rounded-m relative cursor-grab transition-colors focus-within:z-50 hover:z-50 active:cursor-grabbing {dragOverRoleIndex === index ? 'border-ink-90 border-t-2' : ''}"
						draggable={editingRoleIndex !== index}
						ondragstart={(e) => handleDragStart(e, index)}
						ondragover={(e) => handleDragOver(e, index)}
						ondrop={(e) => handleDrop(e, index)}>
						{#if editingRoleIndex === index}
							<div data-uiname="role-edit-wrapper" class="bg-level-1 border-accent-500 h-main-s rounded-m flex w-full items-center overflow-hidden border px-1 shadow-sm">
								<input
									data-uiname="role-edit-input"
									type="text"
									bind:value={editingRoleName}
									class="text-label-s text-ink-90 h-full w-full border-none bg-transparent px-2 ring-0 outline-none focus:ring-0"
									onkeydown={(e) => e.key === 'Enter' && saveEditRole()}
									onblur={saveEditRole}
									autofocus />
								<button
									data-uiname="role-edit-save-btn"
									class="text-ink-50 hover:text-accent-500 flex h-full items-center justify-center px-2 transition-colors outline-none"
									onmousedown={(e) => {
										e.preventDefault();
										saveEditRole();
									}}>
									<Icon name="circled-check" />
								</button>
							</div>
						{:else}
							<Button
								data-uiname="role-select-btn-{index}"
								variant="tertiary"
								size="s"
								active={activeRoleIndex === index}
								onclick={() => selectRole(index)}
								ondblclick={(e: MouseEvent) => {
									e.stopPropagation();
									startEditRole(index);
								}}
								class="w-full justify-start pr-8">
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
											<Icon name="rocket" class="stroke-transparent" />
										{/if}
									</div>
								{/snippet}
								{role.name}
							</Button>

							<div data-uiname="role-actions-wrapper" class="absolute top-1/2 right-1 z-50 -translate-y-1/2 opacity-0 group-hover:opacity-100">
								<Popover.Root closeOnClick={true}>
									<Popover.Trigger>
										<div
											data-uiname="role-actions-trigger"
											tabindex="0"
											class="text-ink-50 hover:bg-level-0 hover:text-ink-90 flex h-6 w-6 cursor-pointer items-center justify-center rounded transition-colors outline-none">
											<Icon name="dots" />
										</div>
									</Popover.Trigger>
									<Popover.Content data-uiname="role-actions-popover" class="w-56 p-1">
										<Button data-uiname="action-edit-name" variant="tertiary" size="s" class="w-full justify-start" onclick={() => startEditRole(index)}>
											{#snippet leading()}<Icon name="pencil" />{/snippet} Edit Name
										</Button>
										<Button data-uiname="action-set-guest" variant="tertiary" size="s" class="w-full justify-start" onclick={() => (guestRoleName = role.name)}>
											{#snippet leading()}<Icon name="person" />{/snippet} Set as Guest Role
										</Button>
										<Button data-uiname="action-set-new-user" variant="tertiary" size="s" class="w-full justify-start" onclick={() => (newUserRoleName = role.name)}>
											{#snippet leading()}<Icon name="rocket" />{/snippet} Set as New User
										</Button>
										{#if role.name !== guestRoleName && role.name !== newUserRoleName}
											<div class="border-border my-1 border-t"></div>
											<Button data-uiname="action-delete" variant="tertiary" size="s" class="text-error hover:text-error w-full justify-start" onclick={() => deleteRole(index)}>
												{#snippet leading()}<Icon name="trash" />{/snippet} Delete Role
											</Button>
										{/if}
									</Popover.Content>
								</Popover.Root>
							</div>
						{/if}
					</div>
				{/each}
			</div>

			<div data-uiname="role-legend" class="border-border flex flex-col gap-2 border-t pt-4">
				<div class="text-ink-50 text-label-xs flex items-center gap-2">
					<Icon name="person" /> Guest Role
				</div>
				<div class="text-ink-50 text-label-xs flex items-center gap-2">
					<Icon name="rocket" /> New User Role
				</div>
			</div>

			<div data-uiname="role-create" class="border-border flex flex-col gap-3 border-t pt-4">
				<Input data-uiname="role-create-input" bind:value={newRoleInput} placeholder="Add new role..." onkeydown={(e) => e.key === 'Enter' && addRole()} />
				<Button data-uiname="role-create-btn" size="s" variant="secondary" class="w-full" onclick={addRole}>Create Role</Button>
			</div>
		</div>

		<div data-uiname="permissions-builder-main" class="flex flex-1 flex-col gap-6">
			<div data-uiname="permissions-header-row" class="mb-2 flex items-center justify-between">
				<h2 data-uiname="permissions-active-title" class="text-label-xl text-ink-90 font-bold">
					Flags for {activeRole?.name}
				</h2>
				<span data-uiname="permissions-active-count" class="text-label-s text-ink-50">{activeRole?.flags.length || 0} active</span>
			</div>

			<div data-uiname="permissions-accordion-container" class="bg-level-0 border-border rounded-m flex flex-col overflow-hidden border">
				{@render accordionHeader('global', 'Global System Access', '*')}
				{#if !collapsed.global}
					<div data-uiname="accordion-content-global" class="bg-level-0 rounded-b-m flex flex-col gap-6 p-6">
						<div data-uiname="group-system" class="border-border rounded-m border">
							{@render accordionHeader('system', 'System Administration', 'system.*')}
							{#if !collapsed.system}
								<div data-uiname="accordion-content-system" class="bg-level-0 rounded-b-m flex flex-col gap-6 p-4">
									<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
										{@render checkboxProp('system.manage_users')}
										{@render checkboxProp('system.manage_roles')}
										{@render checkboxProp('system.settings_write')}
									</div>

									<div data-uiname="group-system-files" class="border-border rounded-m border">
										{@render accordionHeader('systemFiles', 'System Files', 'system.files.*')}
										{#if !collapsed.systemFiles}
											<div data-uiname="accordion-content-system-files" class="bg-level-0 rounded-b-m grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
												{#each fileFlags as flag}{@render checkboxProp(`system.files.${flag}`)}{/each}
											</div>
										{/if}
									</div>
								</div>
							{/if}
						</div>

						<div data-uiname="group-workspace" class="border-border rounded-m border">
							{@render accordionHeader('workspace', 'Workspace', 'workspace.*')}
							{#if !collapsed.workspace}
								<div data-uiname="accordion-content-workspace" class="bg-level-0 rounded-b-m grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
									{@render checkboxProp('workspace.create')}
									{@render checkboxProp('workspace.edit')}
									{@render checkboxProp('workspace.delete')}
									{@render checkboxProp('workspace.move')}
									{@render checkboxProp('workspace.manage_permission')}
								</div>
							{/if}
						</div>

						<div data-uiname="group-files" class="border-border rounded-m border">
							{@render accordionHeader('files', 'Files', 'files.*')}
							{#if !collapsed.files}
								<div data-uiname="accordion-content-files" class="bg-level-0 rounded-b-m grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
									{#each fileFlags as flag}{@render checkboxProp(`files.${flag}`)}{/each}
								</div>
							{/if}
						</div>

						<div data-uiname="group-interaction" class="border-border rounded-m border">
							{@render accordionHeader('interaction', 'Interactions', 'interaction.*')}
							{#if !collapsed.interaction}
								<div data-uiname="accordion-content-interaction" class="bg-level-0 rounded-b-m grid grid-cols-1 gap-3 p-4 md:grid-cols-2">
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
	</div>

	<section data-uiname="code-output-section" class="border-border mt-12 border-t pt-12">
		<div data-uiname="code-output-header" class="mb-4 flex items-center justify-between">
			<h2 class="text-label-l text-ink-90 font-bold">Generated config/permissions.ts</h2>
			<Button
				data-uiname="copy-code-btn"
				icon
				variant="secondary"
				size="s"
				data-tooltip={copiedCode ? 'Copied!' : 'Copy File Content'}
				onclick={() => copyToClipboard(generatedFile, (copiedCode = true))}>
				<Icon name="copy" />
			</Button>
		</div>
		<div data-uiname="code-output-container" class="rounded-xl border border-neutral-700 bg-neutral-900 p-6">
			<pre data-uiname="code-output-pre" class="text-label-s max-h-[400px] w-full overflow-x-auto overflow-y-auto font-mono text-neutral-300"><code>{generatedFile}</code></pre>
		</div>
	</section>

	<section data-uiname="dev-guide-section" class="border-border mt-12 border-t pt-12 pb-32">
		<h2 data-uiname="dev-guide-title" class="text-label-xl text-ink-90 mb-6 font-bold">For Devs: Checking Permissions</h2>
		<div data-uiname="dev-guide-grid" class="gap-xl grid grid-cols-1 lg:grid-cols-2">
			<div data-uiname="dev-guide-client" class="flex flex-col gap-4">
				<div class="border-border flex items-center gap-3 border-b pb-2">
					<div class="bg-level-1 border-border rounded-lg border p-2"><Icon name="layout" class="text-ink-90" /></div>
					<h3 class="text-label-l text-ink-90 font-bold">Client-Side (UX & Rendering)</h3>
				</div>
				<p class="text-body-m text-ink-70 mt-2">
					UI checks exist solely to guide the user visually. They prevent users from seeing buttons or filling out forms they lack rights for. <b>UI checks do not provide real security.</b>
				</p>
				<div class="mt-2 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
					<pre class="text-label-s w-full overflow-x-auto font-mono text-neutral-300"><code
							><span class="text-neutral-500">&lt;script&gt;</span>
  import &#123; has &#125; from '$lib/utils/permissions';
  import &#123; PERMISSIONS &#125; from '$lib/config/permissions';
<span class="text-neutral-500">&lt;/script&gt;</span>

<span class="text-neutral-500">&lt;!-- 1. Hide completely --&gt;</span>
&#123;#if has(PERMISSIONS.FILES.EDIT)&#125;
  &lt;Button&gt;Edit File&lt;/Button&gt;
&#123;/if&#125;

<span class="text-neutral-500">&lt;!-- 2. Lock Form Inputs automatically --&gt;</span>
&lt;Form permission=&#123;PERMISSIONS.SYSTEM.SETTINGS_WRITE&#125;&gt;
  &lt;Input label="Theme" /&gt;
&lt;/Form&gt;</code></pre>
				</div>
			</div>

			<div data-uiname="dev-guide-server" class="flex flex-col gap-4">
				<div class="border-border flex items-center gap-3 border-b pb-2">
					<div class="bg-level-1 border-border rounded-lg border p-2"><Icon name="code-block" class="text-ink-90" /></div>
					<h3 class="text-label-l text-ink-90 font-bold">Server-Side (True Security)</h3>
				</div>
				<p class="text-body-m text-ink-70 mt-2">
					Security happens in the backend. API routes and Form Actions must verify if the user is allowed to perform the action. If an attacker manipulates the frontend, the server catches them here.
				</p>
				<div class="mt-2 rounded-lg border border-neutral-700 bg-neutral-900 p-4">
					<pre class="text-label-s w-full overflow-x-auto font-mono text-neutral-300"><code
							><span class="text-neutral-500">// routes/api/+server.ts</span>
import &#123; hasPermission, PERMISSIONS &#125; from '$lib/config/permissions';

export async function POST(&#123; request, locals &#125;) &#123;
  const userRole = locals.user?.role || 'Guest';
  const roles = locals.orgConfig.roles || &#123;&#125;;

  <span class="text-neutral-500">// Reject if permission is missing</span>
  if (!hasPermission(userRole, PERMISSIONS.FILES.CREATE, roles)) &#123;
    return new Response('Forbidden', &#123; status: 403 &#125;);
  &#125;

  <span class="text-neutral-500">// Process safe request...</span>
&#125;</code></pre>
				</div>
			</div>
		</div>
	</section>
</div>
