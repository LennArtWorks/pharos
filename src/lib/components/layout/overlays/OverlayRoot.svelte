<script lang="ts">
	import { page } from '$app/state';
	import { closeOverlay } from '$lib/utils/overlay';

	// 1. Import all your overlay contents
	import OrgSettings from './content/settings/OrgSettings/OrgSettings.svelte';
	import DevOrganisationsEditor from '$lib/components/layout/overlays/content/DevOrganisationsEditor.svelte';
	import DateCreateModal from '$lib/components/pages/calendar/DateCreateModal.svelte';

	type OverlaySize = 'default' | 'compact';
	type OverlayEntry = { component: any; size?: OverlaySize };

	// 2. Map the URL parameter string to the imported component (+ optional card size)
	const overlayRegistry: Record<string, OverlayEntry> = {
		'settings-org': { component: OrgSettings },
		DevOrganisationsEditor: { component: DevOrganisationsEditor },
		'date-create': { component: DateCreateModal, size: 'compact' }
	};

	const cardSizeClasses: Record<OverlaySize, string> = {
		default: 'h-[600px] w-[900px]',
		compact: 'h-auto max-h-[80vh] w-130'
	};

	// 3. Reactively fetch the entry based on URL
	let activeOverlay = $derived(page.url.searchParams.get('overlay'));
	let activeEntry = $derived(activeOverlay ? overlayRegistry[activeOverlay] : null);
	let ActiveComponent = $derived(activeEntry?.component ?? null);
	let cardSize = $derived(cardSizeClasses[activeEntry?.size ?? 'default']);

	// Extract ID if passed
	let overlayId = $derived(page.url.searchParams.get('id'));
</script>

{#if activeOverlay && ActiveComponent}
	<div
		tabindex="0"
		class="bg-level-1/75 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
		onclick={closeOverlay}
		onkeydown={(e) => e.key === 'Escape' && closeOverlay()}
		role="dialog">
		<div role="presentation" class="bg-level-2 border-border rounded-l-l rounded-r-l flex overflow-hidden border {cardSize}" onclick={(e) => e.stopPropagation()}>
			<ActiveComponent id={overlayId} {closeOverlay} />
		</div>
	</div>
{/if}
