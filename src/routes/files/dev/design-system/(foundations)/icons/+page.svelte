<script lang="ts">
	import Icon, { iconGroups, type FigmaIconName } from '$lib/components/ui/Icon.svelte';

	import Button from '$lib/components/ui/Button.svelte';
	import { foundations } from '../../../data';
	const colorData = foundations.find((f) => f.name === 'Icons');
	const aiContext = colorData?.context || '';

	let copiedIcon = $state<string | null>(null);
	let copiedItem = $state<string | null>(null);
	let copiedAI = $state(false);

	async function copyToClipboard(text: string, isAI = false) {
		try {
			await navigator.clipboard.writeText(text);
			if (isAI) {
				copiedAI = true;
				setTimeout(() => (copiedAI = false), 2000);
			} else {
				copiedItem = text;
				setTimeout(() => {
					if (copiedItem === text) copiedItem = null;
				}, 2000);
			}
		} catch (err) {
			console.error(err);
		}
	}

	const getTooltip = (item: string) => (copiedIcon === item ? '<b>Copied snippet!</b>' : 'Copy Svelte snippet');
</script>

<div class="gap-2xl flex flex-col">
	<header class="border-border pb-m border-b">
		<div class="gap-l mb-l flex items-center">
			<Button href="/files/dev/design-system" variant="secondary" size="s" icon data-tooltip="Back to UI">
				<Icon name="arrow-left" />
			</Button>

			<h1 class="text-label-xl text-ink-90 font-bold">Icon Sticker Sheet</h1>
		</div>

		<div class="flex items-start justify-between">
			<p class="text-body-m text-ink-50 mb-m max-w-2xl">Visual reference grouped by topic.</p>
			<Button variant="secondary" size="s" data-tooltip={copiedAI ? '<b>Context Copied!</b>' : 'Copy instructions for AI Prompting'} onclick={() => copyToClipboard(aiContext, true)}>
				<Icon name="code-block" class="mr-2" /> AI Context
			</Button>
		</div>
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
							data-tooltip={getTooltip(iconName)}
							onclick={() => copyToClipboard(iconName as FigmaIconName)}>
							<Icon name={iconName as FigmaIconName} class="h-2xl text-ink-90" />

							<code class="text-label-xs text-ink-50 text-center font-mono">
								{iconName}
							</code>
						</button>
					{/each}
				</div>
			</section>
		{/each}
	</div>
</div>
