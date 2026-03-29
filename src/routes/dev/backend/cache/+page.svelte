<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { enhance } from '$app/forms';

	let { data } = $props();

	const formatTimeLeft = (expiresAt: number) => {
		const diff = expiresAt - Date.now();
		if (diff <= 0) return 'Expired';
		const minutes = Math.floor(diff / 60000);
		const seconds = Math.floor((diff % 60000) / 1000);
		return `${minutes}m ${seconds}s left`;
	};
</script>

<div class="gap-3xl relative flex min-h-screen flex-col">
	<header class="border-border border-b pb-8">
		<div class="mb-4 flex items-center gap-4">
			<Button href="/files/dev/backend" variant="secondary" size="s" icon><Icon name="arrow-left" /></Button>
			<h1 class="text-label-xl text-ink-90 font-bold">RAM Cache Insights</h1>
		</div>
		<p class="text-body-m text-ink-50 max-w-2xl">Live view of Node.js memory. These caches prevent excessive WebDAV calls and speed up the application.</p>
	</header>

	<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
		<div class="bg-level-1 border-border flex flex-col rounded-xl border">
			<div class="border-border bg-level-2 flex items-center justify-between rounded-t-xl border-b p-4">
				<div class="flex items-center gap-3">
					<Icon name="folder" class="text-accent-500 h-5 w-5" />
					<h2 class="text-label-m text-ink-90 font-bold">File System Registry (meta.fsrsys)</h2>
				</div>
				<form method="POST" action="?/flushMeta" use:enhance>
					<Button variant="secondary" size="s" type="submit">Flush Meta Cache</Button>
				</form>
			</div>

			<div class="p-6">
				{#if data.metaCache.length === 0}
					<div class="text-body-s text-ink-50 p-4 text-center italic">Meta Cache is currently empty.</div>
				{:else}
					<div class="flex flex-col gap-3">
						{#each data.metaCache as cache}
							<div class="bg-level-0 border-border flex flex-col gap-2 rounded-lg border p-4">
								<div class="flex items-center justify-between">
									<span class="text-label-s text-ink-90 font-mono font-bold">Org: {cache.orgId}</span>
									<span class="text-label-xs font-bold {cache.isExpired ? 'text-error' : 'text-emerald-500'}">
										{formatTimeLeft(cache.expiresAt)}
									</span>
								</div>
								<div class="text-body-s text-ink-70">
									<span class="text-ink-90 font-bold">{cache.nodeCount}</span> file nodes loaded in memory
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>

		<div class="bg-level-1 border-border flex flex-col rounded-xl border">
			<div class="border-border bg-level-2 flex items-center justify-between rounded-t-xl border-b p-4">
				<div class="flex items-center gap-3">
					<Icon name="person" class="h-5 w-5 text-purple-500" />
					<h2 class="text-label-m text-ink-90 font-bold">User Profiles (accounts.fsrsecure)</h2>
				</div>
				<form method="POST" action="?/flushUsers" use:enhance>
					<Button variant="secondary" size="s" type="submit">Flush User Cache</Button>
				</form>
			</div>

			<div class="p-6">
				{#if data.userCache.length === 0}
					<div class="text-body-s text-ink-50 p-4 text-center italic">User Cache is currently empty.</div>
				{:else}
					<div class="flex flex-col gap-3">
						{#each data.userCache as user}
							<div class="bg-level-0 border-border flex flex-col gap-2 rounded-lg border p-4">
								<div class="flex items-center justify-between">
									<span class="text-label-s text-ink-90 font-bold">{user.name} <span class="text-ink-50 font-normal">({user.role})</span></span>
									<span class="text-label-xs font-bold {user.isExpired ? 'text-error' : 'text-emerald-500'}">
										{formatTimeLeft(user.expiresAt)}
									</span>
								</div>
								<div class="text-body-s text-ink-50 font-mono">
									Acc ID: {user.accountId}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
