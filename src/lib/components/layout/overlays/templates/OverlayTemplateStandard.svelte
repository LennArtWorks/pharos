<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { Snippet } from 'svelte';

	let {
		title,
		onclose,
		children,
		footer
	}: {
		title: string;
		onclose: () => void;
		children: Snippet;
		footer?: Snippet;
	} = $props();
</script>

<div class="flex h-full w-full flex-col">
	<div class="border-border bg-level-0 flex shrink-0 items-center justify-between border-b p-6">
		<h2 class="text-label-xl text-ink-90 font-bold">{title}</h2>
		<button type="button" onclick={onclose} class="text-ink-50 hover:text-ink-90 cursor-pointer transition-colors outline-none">
			<Icon name="x" class="h-6 w-6" />
		</button>
	</div>

	<div class="flex-1 overflow-y-auto p-6">
		{@render children()}
	</div>

	{#if footer}
		<div class="border-border bg-level-0 flex shrink-0 items-center justify-end gap-3 border-t p-6">
			{@render footer()}
		</div>
	{/if}
</div>
