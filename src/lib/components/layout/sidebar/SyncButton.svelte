<script lang="ts">
	let loading = $state(false);
	let lastSync = $state('Never');

	async function triggerSync() {
		loading = true;
		try {
			const res = await fetch('/api/admin/sync', { method: 'POST' });
			const data = await res.json();
			if (data.success) {
				lastSync = new Date().toLocaleTimeString();
				// Optional: reload the page or dispatch an event to refresh the Filetree
				window.location.reload();
			}
		} catch (e) {
			console.error('Sync failed', e);
		} finally {
			loading = false;
		}
	}
</script>

<div class="mt-auto border-t border-neutral-200 p-4 dark:border-neutral-800">
	<div class="mb-2 flex items-center justify-between">
		<span class="text-2xs font-bold tracking-wider text-neutral-400 uppercase">Cloud Status</span>
		<span class="text-2xs text-neutral-500">{lastSync}</span>
	</div>
	<button
		onclick={triggerSync}
		disabled={loading}
		class="rounded-base hover:bg-purpur-100 dark:hover:bg-purpur-900 flex w-full items-center justify-center gap-2 bg-neutral-100 px-3 py-2 transition-colors disabled:opacity-50 dark:bg-neutral-800">
		<span class={loading ? 'animate-spin' : ''}>
			{loading ? '⏳' : '🔄'}
		</span>
		<span class="text-sm font-medium">{loading ? 'Syncing...' : 'Sync Now'}</span>
	</button>
</div>
