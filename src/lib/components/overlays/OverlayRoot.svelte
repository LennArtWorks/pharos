<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import OrgSettings from './settings/OrgSettings.svelte';
	// import ProfileSettings from './settings/ProfileSettings.svelte';

	// Read the URL parameter reactively
	let activeOverlay = $derived(page.url.searchParams.get('overlay'));

	function closeOverlay() {
		// SvelteKit's way to update the URL without reloading the page
		const url = new URL(page.url);
		url.searchParams.delete('overlay');
		goto(url, { keepFocus: true, noScroll: true });
	}
</script>

{#if activeOverlay}
	<div tabindex="0" class="bg-level-1/75 fixed inset-0 z-50 flex items-center justify-center" onclick={closeOverlay} role="dialog">
		<div class="bg-level-2 border-border flex h-[600px] w-[900px] overflow-hidden rounded-xl border" onclick={(e) => e.stopPropagation()}>
			{#if activeOverlay === 'settings-org'}
				<OrgSettings />
			{:else if activeOverlay === 'settings-profile'}
				<!-- <ProfileSettings /> -->
				return
			{/if}
		</div>
	</div>
{/if}
