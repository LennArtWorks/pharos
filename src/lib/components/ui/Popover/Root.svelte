<script lang="ts">
	import { setPopoverContext } from './context.svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
		closeOnClick?: boolean;
		isOpen?: boolean; // NEW: Allow binding to track state externally
	}

	let { children, closeOnClick = false, isOpen = $bindable(false), class: className = '', ...rest }: Props = $props();

	const ctx = setPopoverContext(closeOnClick);

	$effect(() => {
		ctx.closeOnClick = closeOnClick;
	});

	// Two-way binding sync between the Context class and the external variable
	$effect(() => {
		if (isOpen !== undefined) ctx.isOpen = isOpen;
	});

	$effect(() => {
		isOpen = ctx.isOpen;
	});
</script>

<div class="relative inline-flex {className}" {...rest}>
	{@render children()}
</div>
