<script lang="ts">
	import { can } from '$lib/utils/permissions';
	import { PERMISSIONS } from '$lib/config/permissions';
	import Icon from '$lib/components/ui/Icon.svelte';

	import SyncButton from '$lib/components/overlays/settings/SyncButton.svelte';

	import { t, locale } from '$lib/language/i18n.svelte';
	const languages: { val: typeof locale.current; label: string }[] = [
		{ val: 'en', label: 'English' },

		{ val: 'de', label: 'Deutsch' }
	];

	// If they aren't an admin, show an error state instead of the settings
	let isAdmin = $derived($can(PERMISSIONS.SYSTEM.SETTINGS_WRITE));
</script>

{#if isAdmin}
	<div class="sidebar border-border w-64 border-r p-4">items</div>
	<div class="content flex-1 overflow-y-auto p-8">
		<label for="lang-select" class="text-ink-50 px-2xs font-label-s font-semibold"> Language </label>
		<select
			id="lang-select"
			bind:value={locale.current}
			class="bg-button-hover-low text-ink-90 font-label-s rounded-m px-s h-button-s focus:ring-purpur-500 cursor-pointer border-none outline-none focus:ring-2">
			{#each languages as lang}
				<option value={lang.val}>{lang.label}</option>
			{/each}
		</select>

		<SyncButton />
	</div>
{:else}
	<div class="flex flex-1 flex-col items-center justify-center">
		<Icon name="lock" class="text-ink-50 mb-4 h-12 w-12" />
		<h2 class="text-xl font-bold">Access Denied</h2>
		<p class="text-ink-50">You do not have permission to view organisation settings.</p>
	</div>
{/if}
