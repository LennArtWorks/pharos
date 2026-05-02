<script lang="ts">
	import { onMount, untrack } from 'svelte';
	import { page } from '$app/state';
	import { slide } from 'svelte/transition';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import * as Select from '$lib/components/ui/Select';
	import * as Popover from '$lib/components/ui/Popover';
	import PermissionBuilder from '$lib/components/blocks/PermissionBuilder.svelte';

	type User = { id: string; name: string; email: string; role: string; overrides: string[] };

	let users = $state<User[]>([]);
	let originalUsers = $state<User[]>([]);

	let availableRolesData = $state<Record<string, string[]>>({});
	let availableRoleNames = $derived(Object.keys(availableRolesData));

	let isLoading = $state(true);
	let searchQuery = $state('');

	// Permission Overlay State
	let editingPermissionsFor = $state<User | null>(null);
	let editingOverrides = $state<string[]>([]);
	let inheritedFlagsForEditing = $derived(editingPermissionsFor ? availableRolesData[editingPermissionsFor.role] || [] : []);

	const currentUser = $derived(page.data.user);

	onMount(async () => {
		try {
			const res = await fetch('/api/settings/organisation/accounts');
			if (res.ok) {
				const data = await res.json();
				users = data.users;
				originalUsers = JSON.parse(JSON.stringify(data.users));
				availableRolesData = data.roles;
			}
		} catch (err) {
			console.error('Failed to load users', err);
		} finally {
			isLoading = false;
		}
	});

	$effect(() => {
		users.forEach((user) => {
			const original = originalUsers.find((o) => o.id === user.id);
			if (original && original.role !== user.role) {
				untrack(() => updateUser(user.id, user.role, null));
				original.role = user.role;
			}
		});
	});

	let processedUsers = $derived(() => {
		let filtered = users.filter((u) => u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase()));
		return filtered.sort((a, b) => {
			if (a.id === currentUser?.id) return -1;
			if (b.id === currentUser?.id) return 1;
			const aIsDev = a.id.startsWith('dev_');
			const bIsDev = b.id.startsWith('dev_');
			if (aIsDev && !bIsDev) return -1;
			if (!aIsDev && bIsDev) return 1;
			return a.name.localeCompare(b.name);
		});
	});

	async function updateUser(targetAccountId: string, newRole: string | null, newOverrides: string[] | null) {
		try {
			const res = await fetch('/api/settings/organisation/accounts', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ targetAccountId, newRole, newOverrides })
			});
			if (!res.ok) alert('Failed to update user');
		} catch (err) {
			alert('Network error while updating user.');
		}
	}

	function openPermissionsEditor(user: User) {
		editingPermissionsFor = user;
		editingOverrides = [...(user.overrides || [])];
	}

	function savePermissions() {
		if (!editingPermissionsFor) return;

		// Update local state instantly
		const targetUser = users.find((u) => u.id === editingPermissionsFor!.id);
		if (targetUser) targetUser.overrides = [...editingOverrides];

		// Fire API
		updateUser(editingPermissionsFor.id, null, editingOverrides);

		editingPermissionsFor = null;
	}
</script>

<div class="relative flex h-full flex-col gap-6 pb-12">
	{#if editingPermissionsFor}
		<div transition:slide={{ axis: 'x', duration: 300 }} class="bg-level-1 border-border absolute inset-y-0 right-0 z-20 flex w-[95%] flex-col border-l shadow-2xl">
			<div class="border-border bg-level-0 flex shrink-0 items-center justify-between border-b p-6">
				<div>
					<h2 class="text-label-xl text-ink-90 font-bold">Direct Permissions</h2>
					<p class="text-body-s text-ink-50">Editing overrides for <span class="text-ink-90 font-bold">{editingPermissionsFor.name}</span></p>
				</div>
				<div class="flex gap-2">
					<Button variant="secondary" size="s" onclick={() => (editingPermissionsFor = null)}>Cancel</Button>
					<Button variant="primary" size="s" onclick={savePermissions}>Save Overrides</Button>
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-8">
				<PermissionBuilder bind:flags={editingOverrides} inheritedFlags={inheritedFlagsForEditing} title="User Overrides" />
			</div>
		</div>
	{/if}

	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-label-xl text-ink-90 font-bold">Users & Accounts</h1>
			<p class="text-body-m text-ink-50 mt-1">Manage organization members and their system access roles.</p>
		</div>
		<Button variant="primary" size="s">
			{#snippet leading()}<Icon name="add" />{/snippet} Invite User
		</Button>
	</div>

	<div class="flex items-center gap-4">
		<div class="w-64">
			<Input bind:value={searchQuery} placeholder="Search users..." />
		</div>
	</div>

	<div class="border-border bg-level-0 rounded-m border">
		<table class="w-full text-left text-sm">
			<thead class="border-border bg-level-1 text-ink-50 border-b font-semibold">
				<tr>
					<th class="w-1/3 p-3 pl-4">Name</th>
					<th class="w-1/3 p-3">Email</th>
					<th class="w-1/4 p-3">Role</th>
					<th class="p-3 text-right">Actions</th>
				</tr>
			</thead>

			<tbody class="divide-border divide-y">
				{#if isLoading}
					<tr><td colspan="4" class="text-ink-50 p-6 text-center italic">Loading accounts...</td></tr>
				{:else}
					{#each processedUsers() as user (user.id)}
						{@const isMe = user.id === currentUser?.id}
						{@const isDev = user.id.startsWith('dev_')}
						{@const hasOverrides = user.overrides && user.overrides.length > 0}

						<tr class="hover:bg-level-1/50 transition-colors {isMe ? 'bg-level-1/30' : ''}">
							<td class="text-ink-90 flex items-center gap-2 p-3 pl-4 font-medium">
								{user.name}
								{#if isMe}<span class="bg-button-hover-low text-ink-90 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">You</span>{/if}
								{#if isDev}<span class="bg-accent-500/20 text-accent-500 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase">Dev</span>{/if}
								{#if hasOverrides && !isDev}<span class="bg-purpur-500/20 text-purpur-500 rounded px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase" title="Has direct permission overrides"
										>*</span
									>{/if}
							</td>
							<td class="text-ink-60 max-w-xs truncate p-3">{user.email}</td>
							<td class="p-3">
								{#if isDev || isMe}
									<span class="text-ink-50 px-2 py-1 font-medium">{user.role}</span>
								{:else}
									<div class="w-40">
										<Select.Root bind:value={user.role}>
											<Select.Trigger placeholder="Select..." />
											<Select.Content>
												{#each availableRoleNames as roleOption}
													<Select.Item value={roleOption} label={roleOption} />
												{/each}
											</Select.Content>
										</Select.Root>
									</div>
								{/if}
							</td>
							<td class="p-3 text-right">
								<Popover.Root closeOnClick={true}>
									<Popover.Trigger>
										<Button variant="tertiary" size="s" iconOnly disabled={isDev}>
											<Icon name="dots" />
										</Button>
									</Popover.Trigger>
									<Popover.Content class="w-48 p-1">
										<Button variant="tertiary" size="s" class="w-full justify-start">
											{#snippet leading()}<Icon name="pencil" />{/snippet} Edit User
										</Button>
										<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => openPermissionsEditor(user)}>
											{#snippet leading()}<Icon name="key" />{/snippet} Direct Permissions
										</Button>
										<Button variant="tertiary" size="s" class="w-full justify-start">
											{#snippet leading()}<Icon name="mail" />{/snippet} Reset Password
										</Button>
										<div class="border-border my-1 border-t"></div>
										<Button variant="tertiary" size="s" class="theme-accent w-full justify-start">
											{#snippet leading()}<Icon name="trash" />{/snippet} Delete User
										</Button>
									</Popover.Content>
								</Popover.Root>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>
</div>
