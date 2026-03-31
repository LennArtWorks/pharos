<script lang="ts">
	import OverlayTemplateSidebar from '../../../templates/OverlayTemplateSidebar.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	import GeneralSettings from './pages/GeneralSettings.svelte';
	import AccountsSettings from './pages/AccountsSettings.svelte';
	import RolesSettings from './pages/RolesSettings.svelte';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { has } from '$lib/utils/config/permissions';

	let { closeOverlay }: { closeOverlay: () => void } = $props();

	// 🚨 1. Kick unauthorized users out instantly!
	$effect(() => {
		// Replace PERMISSIONS.SETTINGS.VIEW with whatever your actual permission constant is
		if (!has(PERMISSIONS.SYSTEM.SETTINGS.VIEW)) {
			closeOverlay();
		}
	});

	let activeTab = $state('general');
	let hasUnsavedChanges = $state(false);

	let rolesComponent: ReturnType<typeof RolesSettings>;

	// Define the sidebar structure here
	const sidebarGroups = [
		{
			title: 'Organisation Settings',
			items: [
				{ id: 'general', label: 'General Settings' },
				{ id: 'branding', label: 'Branding' },
				{ id: 'sync', label: 'Sync' },
				{ id: 'new_members', label: 'New Members' },
				{ id: 'backups', label: 'Backups' }
			]
		},
		{
			title: 'Access Management',
			items: [
				{ id: 'accounts', label: 'Accounts' },
				{ id: 'roles', label: 'Roles' },
				{ id: 'teams', label: 'Teams' },
				{ id: 'access', label: 'Access' }
			]
		},
		{
			title: 'Global Defaults',
			items: [
				{ id: 'global_files', label: 'Global Files' },
				{ id: 'global_variables', label: 'Global Variables' },
				{ id: 'global_announcements', label: 'Global Announcements' }
			]
		}
	];

	function handleSave() {
		if (activeTab === 'roles' && rolesComponent) {
			rolesComponent.saveRoles();
		} else {
			console.log('Saving general changes...');
			hasUnsavedChanges = false;
		}
	}
</script>

{#if has(PERMISSIONS.SYSTEM.SETTINGS.VIEW)}
	<OverlayTemplateSidebar onclose={closeOverlay} {sidebarGroups} bind:activeTab>
		{#snippet children()}
			{#if activeTab === 'general'}
				<GeneralSettings bind:hasUnsavedChanges />
			{:else if activeTab === 'accounts'}
				<AccountsSettings />
			{:else if activeTab === 'roles'}
				<RolesSettings bind:this={rolesComponent} bind:hasUnsavedChanges />
			{:else}
				<div class="text-ink-50 mt-12 flex w-full justify-center italic">Placeholder</div>
			{/if}
		{/snippet}

		{#snippet footer()}
			<Button variant="secondary" onclick={closeOverlay}>Cancel</Button>
			<Button variant="primary" disabled={!hasUnsavedChanges} onclick={handleSave}>Save Changes</Button>
		{/snippet}
	</OverlayTemplateSidebar>
{/if}
