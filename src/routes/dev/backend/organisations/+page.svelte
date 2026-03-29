<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { openOverlay } from '$lib/utils/overlay'; // Ensure this utility exists!
	import type { SafeOrganisation } from './+page.server';

	let { data } = $props();
	let orgs = $derived(data.organisations as SafeOrganisation[]);
</script>

<div class="gap-3xl relative flex min-h-screen flex-col">
	<header class="border-border border-b pb-8">
		<div class="mb-4 flex items-center justify-between">
			<div class="flex items-center gap-4">
				<Button href="/files/dev/backend" variant="secondary" size="s" icon><Icon name="arrow-left" /></Button>
				<h1 class="text-label-xl text-ink-90 font-bold">Organisations</h1>
			</div>
			<Button variant="primary" size="s" onclick={() => openOverlay('DevOrganisationsEditor')}>
				<Icon name="add" class="mr-2" /> Add Organisation
			</Button>
		</div>
		<p class="text-body-m text-ink-50 max-w-2xl">Manage all active FSR-OS instances. Credentials are encrypted securely in SQLite via AES-256-GCM.</p>
	</header>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
		{#each orgs as org}
			<div class="bg-level-1 border-border relative flex flex-col overflow-hidden rounded-xl border">
				{#if org.is_active === 0}
					<div class="bg-error absolute top-4 right-4 rounded-sm px-2 py-1 text-[10px] font-bold text-white">Inactive</div>
				{/if}
				<div class="flex-1 p-6 pb-0">
					<h2 class="text-label-l text-ink-90 mb-1 font-bold">{org.organization_name}</h2>
					<p class="text-body-s text-ink-50 mb-6 font-mono">{org.subdomain}.fsr-os.de</p>

					<div class="mb-6 flex flex-col gap-2">
						<div class="text-body-s text-ink-70 flex items-center gap-2">
							<Icon name="web" class="text-ink-50 h-4 w-4 shrink-0" />
							<span class="truncate">{org.cloud_url}</span>
						</div>
						<div class="text-body-s text-ink-70 flex items-center gap-2">
							<Icon name="person" class="text-ink-50 h-4 w-4 shrink-0" />
							<span class="truncate">{org.cloud_username}</span>
						</div>
						<div class="text-body-s text-ink-70 flex items-center gap-2">
							<Icon name="folder" class="text-ink-50 h-4 w-4 shrink-0" />
							<span class="truncate">{org.cloud_directory || '/ (Root)'}</span>
						</div>
					</div>
				</div>

				<div class="bg-level-2 border-border flex gap-4 border-t p-4">
					<Button variant="secondary" size="s" class="flex-1 justify-center" onclick={() => openOverlay('DevOrganisationsEditor', org.organisation_id)}>Edit</Button>

					<form
						method="POST"
						action="?/delete"
						use:enhance
						onsubmit={(e) => {
							if (!confirm('Are you sure? This deletes all sessions!')) e.preventDefault();
						}}>
						<input type="hidden" name="organisation_id" value={org.organisation_id} />
						<Button variant="tertiary" size="s" icon type="submit" class="text-error hover:text-error hover:bg-error/10">
							<Icon name="trash" />
						</Button>
					</form>
				</div>
			</div>
		{/each}
	</div>
</div>
