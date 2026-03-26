<script lang="ts">
	import { has } from '$lib/utils/permissions';
	import { PERMISSIONS } from '$lib/config/permissions';
	import Icon from '$lib/components/ui/Icon.svelte';
	import * as Select from '$lib/components/ui/Select';
	import SyncButton from '$lib/components/layout/overlays/settings/OrgSettings/SyncButton.svelte';
	import { locale } from '$lib/language/i18n.svelte';
	import { onMount } from 'svelte';
	import OverlayTemplateSettings from '../../templates/OverlayTemplateSettings.svelte';

	let { closeOverlay }: { closeOverlay: () => void } = $props();

	const languages = [
		{ val: 'en', label: 'English' },
		{ val: 'de', label: 'Deutsch' }
	];

	let isAdmin = $derived(has(PERMISSIONS.SYSTEM.SETTINGS_WRITE));
	let currentMode = $state('mode-light');

	onMount(() => {
		currentMode = document.documentElement.classList.contains('mode-dark') ? 'mode-dark' : 'mode-light';
	});

	$effect(() => {
		if (typeof document !== 'undefined' && currentMode) {
			document.documentElement.classList.remove('mode-light', 'mode-dark');
			document.documentElement.classList.add(currentMode);
		}
	});
</script>

{#if isAdmin}
	<OverlayTemplateSettings onclose={closeOverlay}>
		{#snippet sidebar()}
			<div class="flex flex-col gap-6">
				<div class="flex flex-col gap-1">
					<span class="text-label-s text-ink-90 mb-2 px-2 font-bold">Organisation Settings</span>
					<button class="text-label-m text-ink-90 bg-level-2 rounded-m px-2 py-1 text-left font-bold">General Settings</button>
					<button class="text-label-m text-ink-50 hover:bg-level-1 rounded-m px-2 py-1 text-left">Accounts</button>
					<button class="text-label-m text-ink-50 hover:bg-level-1 rounded-m px-2 py-1 text-left">Roles</button>
					<button class="text-label-m text-ink-50 hover:bg-level-1 rounded-m px-2 py-1 text-left">Teams</button>
					<button class="text-label-m text-ink-50 hover:bg-level-1 rounded-m px-2 py-1 text-left">Access</button>
				</div>

				<div class="flex flex-col gap-1">
					<button class="text-label-m text-ink-50 hover:bg-level-1 rounded-m px-2 py-1 text-left">Global Files</button>
					<button class="text-label-m text-ink-50 hover:bg-level-1 rounded-m px-2 py-1 text-left">Global Variables</button>
					<button class="text-label-m text-ink-50 hover:bg-level-1 rounded-m px-2 py-1 text-left">Global Announcements</button>
					<button class="text-label-m text-ink-50 hover:bg-level-1 rounded-m px-2 py-1 text-left">Global Topics</button>
				</div>
			</div>
		{/snippet}

		<div class="flex max-w-2xl flex-col gap-8">
			<h1 class="text-label-xl text-ink-90 font-bold">General Settings</h1>

			<div class="flex flex-col gap-4">
				<h2 class="text-label-l text-ink-90 font-bold">Preferences</h2>

				<div class="flex items-end gap-4">
					<div class="flex-1">
						<label class="text-ink-50 px-2xs font-label-s mb-1 block font-semibold">Theme</label>
						<Select.Root bind:value={currentMode}>
							<Select.Trigger class="w-full">
								<Icon name={currentMode === 'mode-light' ? 'sun' : 'moon'} class="text-ink-50 mr-2" />
								{currentMode === 'mode-light' ? 'Light Mode' : 'Dark Mode'}
							</Select.Trigger>
							<Select.Content>
								<Select.Item value="mode-light"><Icon name="sun" class="text-ink-50 mr-2" /> Light Mode</Select.Item>
								<Select.Item value="mode-dark"><Icon name="moon" class="text-ink-50 mr-2" /> Dark Mode</Select.Item>
							</Select.Content>
						</Select.Root>
					</div>

					<div class="flex-1">
						<label class="text-ink-50 px-2xs font-label-s mb-1 block font-semibold">Language</label>
						<Select.Root bind:value={locale.current}>
							<Select.Trigger label="Select Language" placeholder="Select language..." class="w-full" />
							<Select.Content>
								{#each languages as lang}
									<Select.Item value={lang.val} label={lang.label}>{lang.label}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
				</div>
			</div>

			<div class="flex flex-col gap-4">
				<h2 class="text-label-l text-ink-90 font-bold">Sync</h2>
				<p class="text-body-m text-ink-50">Sync OS and cloud (needed after cloud-sided interactions).</p>
				<div>
					<SyncButton />
				</div>
			</div>
		</div>
	</OverlayTemplateSettings>
{:else}
	<div class="bg-level-2 border-border relative flex h-[600px] w-[900px] flex-col items-center justify-center rounded-l border">
		<button onclick={closeOverlay} class="text-ink-50 hover:text-ink-90 absolute top-6 right-6 z-10 transition-colors">
			<Icon name="x" class="h-6 w-6" />
		</button>
		<Icon name="lock" class="text-ink-50 mb-4 h-12 w-12" />
		<h2 class="text-label-xl text-ink-90 font-bold">Access Denied</h2>
		<p class="text-ink-50 text-body-m mt-2">You do not have permission to view organisation settings.</p>
	</div>
{/if}
