<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { layouts } from '../../../data';

	let copiedItem = $state<string | null>(null);

	async function copyToClipboard(e: MouseEvent, text: string, id: string) {
		e.preventDefault();
		e.stopPropagation();
		try {
			await navigator.clipboard.writeText(text);
			copiedItem = id;
			setTimeout(() => {
				if (copiedItem === id) copiedItem = null;
			}, 2000);
		} catch (err) {
			console.error(err);
		}
	}
</script>

<div class="gap-2xl flex flex-col">
	<header class="border-border border-b pb-8">
		<div class="mb-4 flex items-center gap-4">
			<Button href="/files/dev/design-system" variant="secondary" size="s" icon data-tooltip="Back to Overview">
				<Icon name="arrow-left" />
			</Button>
			<h1 class="text-label-xl text-ink-90 font-bold">Layouts</h1>
		</div>
		<p class="text-body-m text-ink-50 max-w-2xl">Structural wrappers managing boundaries, spacing, and logic flow.</p>
	</header>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		{#each layouts as layout}
			<a href={layout.href} class="bg-level-1 hover:bg-level-1-hover border-border group flex flex-col rounded-xl border p-6 transition-colors">
				<div class="flex items-start justify-between">
					<div>
						<h2 class="text-ink-90 font-label-l font-bold">{layout.name}</h2>
						<p class="text-ink-50 text-body-m mt-2">{layout.desc}</p>
					</div>
					<Button
						variant="tertiary"
						size="s"
						icon
						data-tooltip={copiedItem === layout.name ? '<b>Copied Import!</b>' : 'Copy Import'}
						onclick={(e: MouseEvent) => copyToClipboard(e, layout.importStr, layout.name)}>
						<Icon name="copy" />
					</Button>
				</div>
				<div class="text-accent-500 text-label-s mt-6 flex items-center font-bold">
					Open Builder <Icon name="arrow-right" class="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
				</div>
			</a>
		{/each}
	</div>
</div>
