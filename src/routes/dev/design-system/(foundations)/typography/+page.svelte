<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { foundations } from '../../../data';
	const colorData = foundations.find((f) => f.name === 'Typography');
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

	const getTooltip = (item: string) => (copiedItem === item ? '<b>Copied!</b>' : 'Click to copy class');

	const labels = ['3xl', '2xl', 'xl', 'l', 'm', 's', 'xs'];
</script>

<div class="gap-2xl flex flex-col">
	<header class="border-border pb-l border-b">
		<div class="gap-l mb-l flex items-center">
			<Button href="/files/dev/design-system" variant="secondary" size="s" icon data-tooltip="Back to UI">
				<Icon name="arrow-left" />
			</Button>
			<h1 class="text-label-xl text-ink-90 font-bold">Typography</h1>
		</div>
		<div class="flex items-start justify-between">
			<p class="text-body-m text-ink-50 mb-m max-w-2xl">Click any row to copy its Tailwind utility class.</p>
			<Button variant="secondary" size="s" data-tooltip={copiedAI ? '<b>Context Copied!</b>' : 'Copy instructions for AI Prompting'} onclick={() => copyToClipboard(aiContext, true)}>
				<Icon name="code-block" class="mr-2" /> AI Context
			</Button>
		</div>
	</header>

	<section>
		<h2 class="text-label-m text-ink-50 mb-l font-bold tracking-wider uppercase">Labels</h2>
		<div class="flex flex-col gap-1">
			{#each labels as size}
				<button
					class="bg-level-0 hover:bg-level-1 border-border group rounded-m p-m flex items-center justify-between border text-left transition-colors"
					data-tooltip={getTooltip(`font-label-${size}`)}
					onclick={() => copyToClipboard(`font-label-${size}`)}>
					<div class="gap-l flex items-center truncate">
						<span class="text-ink-40 w-24 shrink-0 font-mono text-xs">font-label-{size}</span>
						<span class="text-ink-90 truncate font-label-{size}"> The quick brown fox jumps over the lazy dog </span>
					</div>
				</button>
			{/each}
		</div>
	</section>

	<section>
		<h2 class="text-label-m text-ink-50 mb-l font-bold tracking-wider uppercase">Body Text</h2>
		<div class="flex flex-col gap-1">
			<button
				class="bg-level-0 hover:bg-level-1 border-border group rounded-m p-m flex items-start justify-between border text-left transition-colors"
				data-tooltip={getTooltip(`font-body-m`)}
				onclick={() => copyToClipboard(`font-body-m`)}>
				<div class="gap-l flex items-start">
					<span class="text-ink-40 mt-1 w-24 shrink-0 font-mono text-xs">font-body-m</span>
					<span class="text-ink-90 font-body-m max-w-2xl">
						Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam eu turpis molestie, dictum est a, mattis tellus. Sed dignissim, metus nec fringilla accumsan, risus sem sollicitudin lacus,
						ut interdum tellus elit sed risus. Maecenas eget condimentum velit, sit amet feugiat lectus.
					</span>
				</div>
			</button>
		</div>
	</section>
</div>
