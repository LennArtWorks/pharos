<script lang="ts">
	import { setPopoverContext } from './context.svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
		closeOnClick?: boolean;
	}

	let { children, closeOnClick = false, class: className = '', ...rest }: Props = $props();
	const ctx = setPopoverContext(closeOnClick);

	$effect(() => {
		ctx.closeOnClick = closeOnClick;
	});
</script>

<div class="relative inline-flex {className}" {...rest}>
	{@render children()}
</div>
