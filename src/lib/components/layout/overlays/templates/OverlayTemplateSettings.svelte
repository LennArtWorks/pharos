<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import type { Snippet } from 'svelte';

	let {
		onclose,
		sidebar,
		children
	}: {
		onclose: () => void;
		sidebar: Snippet;
		children: Snippet;
	} = $props();
</script>

<div class="bg-level-1 relative flex h-full w-full">
	<button onclick={onclose} class="text-ink-50 hover:text-ink-90 absolute top-6 right-6 z-10 transition-colors outline-none">
		<Icon name="x" class="h-6 w-6" />
	</button>

	<div class="border-border bg-level-0 w-64 shrink-0 overflow-y-auto border-r p-4">
		{@render sidebar()}
	</div>

	<div class="relative flex-1 overflow-y-auto p-8">
		{@render children()}
	</div>
</div>
