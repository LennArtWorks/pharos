<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import * as Select from '$lib/components/ui/Select';
	import Tag from '$lib/components/ui/Tag.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';

	// Use the single source of truth
	import { uiComponents } from '../../../data';

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
			<h1 class="text-label-xl text-ink-90 font-bold">UI Components</h1>
		</div>
		<p class="text-body-m text-ink-50 max-w-2xl">Primitive building blocks. Click a card to open its interactive sandbox.</p>
	</header>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		{#each uiComponents as comp}
			<a href={comp.href} class="bg-level-1 hover:bg-level-1-hover border-border group flex flex-col rounded-xl border p-6 transition-colors">
				<div class="mb-6 flex items-start justify-between">
					<div>
						<h2 class="text-ink-90 font-label-l font-bold">{comp.name}</h2>
						<p class="text-ink-50 text-body-m mt-2">{comp.desc}</p>
					</div>

					<Button
						variant="tertiary"
						size="s"
						icon
						class={copiedItem === comp.name ? 'text-accent-500' : ''}
						data-tooltip={copiedItem === comp.name ? '<b>Copied Context!</b>' : 'Copy AI Context'}
						onclick={(e: MouseEvent) => copyToClipboard(e, comp.context || comp.importStr, comp.name)}>
						<Icon name={copiedItem === comp.name ? 'check' : 'code-block'} />
					</Button>
				</div>

				<div class="bg-level-0 border-border mt-auto flex min-h-[120px] items-center justify-center rounded-lg border p-6">
					{#if comp.name === 'Button'}
						<Button variant="primary">Click Me</Button>
					{:else if comp.name === 'Input'}
						<Input placeholder="Enter something..." class="max-w-xs" />
					{:else if comp.name === 'Select'}
						<Select.Root>
							<Select.Trigger placeholder="Select option..." class="max-w-xs" />
							<Select.Content><Select.Item value="1">Option 1</Select.Item></Select.Content>
						</Select.Root>
					{:else if comp.name === 'Popover'}
						<Button variant="secondary">Hover/Click Example</Button>
					{:else if comp.name === 'Tag'}
						<Tag>New Feature</Tag>
					{:else if comp.name === 'Divider'}
						<div class="w-full max-w-xs"><Divider size="m" /></div>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</div>
