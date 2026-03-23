<script lang="ts">
	import { setPopoverContext } from './context.svelte';
	import type { Snippet } from 'svelte';

	let {
		children,
		closeOnClick = false
	}: {
		children: Snippet;
		closeOnClick?: boolean;
	} = $props();

	const ctx = setPopoverContext(closeOnClick);

	// Keep the context synced if the prop changes dynamically
	$effect(() => {
		ctx.closeOnClick = closeOnClick;
	});
</script>

<div class="relative inline-flex">
	{@render children()}
</div>
