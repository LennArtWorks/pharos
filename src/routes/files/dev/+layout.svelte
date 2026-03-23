<script lang="ts">
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import FloatingNav, { type NavSection } from '$lib/components/layout/FloatingNav.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import * as Select from '$lib/components/ui/Select';
	import { onMount } from 'svelte';

	// Import raw data (We will split data.ts into specific exports)
	import { designSystemNav, backendNav, aiDevNav } from './data';

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

	let { children } = $props();
	let currentPath = $derived(page.url.pathname);

	// Determine which navigation to show based on the URL path
	let activeNavSections: NavSection[] = $derived.by(() => {
		if (currentPath.includes('/dev/design-system')) return designSystemNav(currentPath, page.url.hash);
		if (currentPath.includes('/dev/backend')) return backendNav(currentPath);
		if (currentPath.includes('/dev/aidev')) return aiDevNav(currentPath);

		// Root /dev page doesn't need a massive nav, just a back button
		return [{ items: [{ label: 'Back to App', href: '/files', active: false, level: 1 }] }];
	});
</script>

<div class="relative mx-auto flex w-full items-start">
	<div class="mt-m ml-m fixed z-2 flex gap-2">
		<Select.Root bind:value={currentMode}>
			<Select.Trigger class="bg-level-2">
				{#if currentMode === 'mode-light'}
					<Icon name="sun" class="text-ink-50 mr-2" />
				{:else}
					<Icon name="moon" class="text-ink-50 mr-2" />
				{/if}
			</Select.Trigger>
			<Select.Content>
				<Select.Item value="mode-light" default={currentMode === 'mode-light'}>
					<Icon name="sun" class="text-ink-50 mr-2" />
				</Select.Item>
				<Select.Item value="mode-dark" default={currentMode === 'mode-dark'}>
					<Icon name="moon" class="text-ink-50 mr-2" />
				</Select.Item>
			</Select.Content>
		</Select.Root>
	</div>

	<div class="relative z-2">
		<div class="fixed top-[50vh] h-0 overflow-visible">
			<div class="left-m absolute top-0 -translate-y-1/2">
				{#if currentPath !== '/files/dev'}
					<FloatingNav sections={activeNavSections} />
				{/if}
			</div>
		</div>
	</div>

	<div class="px-3xl py-4xl z-1 mx-auto max-w-7xl min-w-0 flex-1">
		{@render children()}
	</div>
</div>
