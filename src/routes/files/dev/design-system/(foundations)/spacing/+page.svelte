<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { foundations } from '../../../data';
	const colorData = foundations.find((f) => f.name === 'Spacing');
	const aiContext = colorData?.context || '';

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

	// The central tooltip text generator
	const getTooltip = (item: string) => (copiedItem === item ? '<b>Copied!</b>' : 'Click to copy class');

	const spaces = ['3xs', '2xs', 'xs', 's', 'm', 'l', 'xl', '2xl', '3xl', '4xl'];
	const mainHeights = [
		{ name: '2xs', desc: 'Main icon size' },
		{ name: 'xs', desc: 'Tag size' },
		{ name: 's', desc: 'Small button / File size' },
		{ name: 'm', desc: 'Regular button size' },
		{ name: 'l', desc: 'Content header / File preview' }
	];
</script>

<div class="gap-2xl flex flex-col">
	<header class="border-border pb-m border-b">
		<div class="gap-l mb-l flex items-center">
			<Button href="/files/dev/design-system" variant="secondary" size="s" icon data-tooltip="Back to UI">
				<Icon name="arrow-left" />
			</Button>
			<h1 class="text-label-xl text-ink-90 font-bold">Spacing & Styles</h1>
		</div>
		<div class="flex items-start justify-between">
			<p class="text-body-m text-ink-50 mb-m max-w-2xl">Core layout values. Click any row to copy.</p>
			<Button variant="secondary" size="s" data-tooltip={copiedAI ? '<b>Context Copied!</b>' : 'Copy instructions for AI Prompting'} onclick={() => copyToClipboard(aiContext, true)}>
				<Icon name="code-block" class="mr-2" /> AI Context
			</Button>
		</div>
	</header>
	<section>
		<div class="mb-l">
			<h2 class="text-label-m text-ink-50 font-bold tracking-wider uppercase">Spacing Tokens</h2>
			<p class="text-body-s text-ink-50 mt-1">Generates gap-*, p-*, m-*, w-*, h-*</p>
		</div>
		<div class="flex flex-col gap-1">
			{#each spaces as space}
				<button
					class="bg-level-0 hover:bg-level-1 border-border group rounded-m p-m flex items-center justify-between border text-left transition-colors"
					data-tooltip={getTooltip(space)}
					onclick={() => copyToClipboard(space)}>
					<div class="gap-xl flex items-center">
						<span class="text-ink-40 w-16 shrink-0 font-mono text-xs">{space}</span>
						<div class="bg-purpur-500/20 border-purpur-500 h-6 border-x-2" style="width: var(--setup-spacing-{space})"></div>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<section>
		<div class="mb-l">
			<h2 class="text-label-m text-ink-50 font-bold tracking-wider uppercase">Component Heights</h2>
			<p class="text-body-s text-ink-50 mt-1">Fixed heights (h-main-*) for perfect horizontal alignment.</p>
		</div>
		<div class="flex flex-wrap gap-4">
			{#each mainHeights as height}
				<button
					class="bg-level-0 hover:bg-level-1 border-border group rounded-m p-m flex min-w-[200px] flex-1 flex-col border text-left transition-colors"
					data-tooltip={getTooltip(`h-main-${height.name}`)}
					onclick={() => copyToClipboard(`h-main-${height.name}`)}>
					<span class="text-ink-90 mb-1 font-mono font-bold">h-main-{height.name}</span>
					<span class="text-ink-50 text-label-xs mb-4">{height.desc}</span>

					<div class="bg-level-2 border-border flex w-full items-center justify-center rounded border border-dashed" style="height: var(--spacing-main-{height.name})">
						<div class="bg-ink-20 h-1 w-8 rounded-full"></div>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="text-label-m text-ink-50 mb-l font-bold tracking-wider uppercase">Border Radius</h2>
		<div class="flex gap-4">
			<button
				class="bg-level-0 hover:bg-level-1 border-border group flex h-32 flex-1 flex-col items-center justify-center border transition-colors"
				style="border-radius: var(--setup-radius-m)"
				data-tooltip={getTooltip('rounded-m')}
				onclick={() => copyToClipboard('rounded-m')}>
				<span class="text-ink-90 font-mono font-bold">rounded-m</span>
			</button>

			<button
				class="bg-level-0 hover:bg-level-1 border-border group flex h-32 flex-1 flex-col items-center justify-center border transition-colors"
				style="border-radius: var(--setup-radius-l)"
				data-tooltip={getTooltip('rounded-l')}
				onclick={() => copyToClipboard('rounded-l')}>
				<span class="text-ink-90 font-mono font-bold">rounded-l</span>
			</button>
		</div>
	</section>
</div>
