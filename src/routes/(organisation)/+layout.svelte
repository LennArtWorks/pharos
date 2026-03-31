<script lang="ts">
	import '../../styles/app.css';

	import { page } from '$app/state';
	import favicon from '$lib/assets/favicon.svg';
	import OverlayRoot from '$lib/components/layout/overlays/OverlayRoot.svelte';
	import MouseTooltip from '$lib/components/ui/MouseTooltip.svelte';
	import DevFloatingPanel from '$lib/components/layout/DevFloatingPanel.svelte';

	import { opState } from '$lib/state/operator.svelte';
	import { invalidateAll } from '$app/navigation';
	import { addBanner, removeBanner } from '$lib/state/banners.svelte';
	import SystemBanner from '$lib/components/layout/SystemBanner.svelte';
	import { untrack } from 'svelte';

	let { children } = $props();

	let serverOperator = $derived(page.data.operator);

	let isDevMode = $derived(opState.optimisticDevMode ?? serverOperator?.isDevMode);
	let isSimulating = $derived(opState.optimisticSimulating ?? serverOperator?.isSimulating);
	let currentRole = $derived(opState.optimisticRole ?? page.data.user?.role);

	// ⚡️ Automatically sync God Mode states into the global Banner Engine!
	$effect(() => {
		// 2. Read the variables OUTSIDE untrack so the effect knows to watch them
		const dev = isDevMode;
		const sim = isSimulating;
		const role = currentRole;

		// 3. Run the mutations INSIDE untrack so they don't trigger an infinite loop
		untrack(() => {
			if (dev) {
				addBanner({
					id: 'sys_devmode',
					variant: 'dev',
					icon: 'code-block',
					text: 'DevMode Active',
					isProcess: true,
					onStop: async () => {
						opState.optimisticDevMode = false;
						await fetch('/api/dev/simulate', { method: 'POST', body: JSON.stringify({ devMode: false }) });
						await invalidateAll();
						opState.optimisticDevMode = null;
					}
				});
			} else {
				removeBanner('sys_devmode');
			}

			if (sim) {
				addBanner({
					id: 'sys_simulation',
					variant: 'warning',
					icon: 'person',
					text: `Role Simulation: ${role}`,
					isProcess: true,
					onStop: async () => {
						opState.optimisticSimulating = false;
						await fetch('/api/dev/simulate', { method: 'POST', body: JSON.stringify({ action: 'stop' }) });
						await invalidateAll();
						opState.optimisticSimulating = null;
					}
				});
			} else {
				removeBanner('sys_simulation');
			}
		});
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

<div class="bg-level-0 flex h-screen w-screen flex-col overflow-hidden">
	<div class="z-1000">
		<SystemBanner />
	</div>

	<div class="relative min-h-0 flex-1">
		{@render children()}
	</div>
</div>

<OverlayRoot />
<MouseTooltip />

{#if page.data.operator && page.data.operator.tier}
	<DevFloatingPanel />
{/if}
