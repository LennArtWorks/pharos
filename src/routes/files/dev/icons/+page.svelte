<script lang="ts">
	import Icon, { iconGroups, type FigmaIconName } from '$lib/components/ui/Icon.svelte';

	let copiedIcon = $state<string | null>(null);

	async function copyToClipboard(iconName: FigmaIconName) {
		try {
			await navigator.clipboard.writeText(`<Icon name="${iconName}" />`);
			copiedIcon = iconName;
			setTimeout(() => {
				if (copiedIcon === iconName) copiedIcon = null;
			}, 2000);
		} catch (err) {
			console.error(err);
		}
	}
</script>

<div class="p-3xl mx-auto max-w-7xl">
	<header class="mb-2xl">
		<h1 class="text-label-l text-ink-90 mb-s font-bold">Icon Sticker Sheet</h1>
		<p class="text-body-m text-ink-50">Visual reference grouped by topic.</p>
	</header>

	<div class="gap-3xl flex flex-col">
		{#each iconGroups as group}
			<section>
				<h2 class="text-label-m text-ink-90 mb-l pb-xs font-bold tracking-wider">
					{group.topic}
				</h2>

				<div class="gap-l grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{#each Object.keys(group.icons) as iconName}
						<button
							class="p-l gap-s border-border bg-level-1 hover:bg-level-1-hover rounded-m flex flex-col items-center justify-center border transition-all duration-200"
							onclick={() => copyToClipboard(iconName as FigmaIconName)}>
							<Icon name={iconName as FigmaIconName} class="h-2xl text-ink-90" />

							<code class="text-label-s text-ink-50 text-center font-mono">
								{copiedIcon === iconName ? 'Copied!' : iconName}
							</code>
						</button>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</div>
