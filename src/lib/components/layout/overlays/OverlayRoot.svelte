<script lang="ts">
	import { page } from '$app/state';
	import { closeOverlay } from '$lib/utils/overlay';

	// 1. Import all your overlay contents
	import OrgSettings from './contents/OrgSettings.svelte';
	import DevOrganisationsEditor from '$lib/components/dev/layout/overlays/contents/DevOrganisationsEditor.svelte';

	// 2. Map the URL parameter string to the imported component
	const overlayRegistry: Record<string, any> = {
		'settings-org': OrgSettings,
		DevOrganisationsEditor: DevOrganisationsEditor
	};

	// 3. Reactively fetch the component based on URL
	let activeOverlay = $derived(page.url.searchParams.get('overlay'));
	let ActiveComponent = $derived(activeOverlay ? overlayRegistry[activeOverlay] : null);

	// Extract ID if passed
	let overlayId = $derived(page.url.searchParams.get('id'));
</script>

{#if activeOverlay && ActiveComponent}
	<div tabindex="0" class="bg-level-1/75 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm" onclick={closeOverlay} role="dialog">
		<div class="bg-level-2 border-border rounded-l-l rounded-r-l flex h-[600px] w-[900px] overflow-hidden border" onclick={(e) => e.stopPropagation()}>
			<ActiveComponent id={overlayId} {closeOverlay} />
		</div>
	</div>
{/if}
