<script lang="ts">
	import * as Popover from '$lib/components/ui/Popover';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
		class?: string;
		alignToParent?: boolean;
		alignToQuery?: string;
		stayOnScroll?: boolean;
		align?: 'start' | 'center' | 'end';
	}

	let {
		children,
		class: className = '',
		alignToParent = true, // Selects generally want to snap to their full-width container
		align = 'start',
		stayOnScroll = false,
		...rest
	}: Props = $props();
</script>

<Popover.Content {alignToParent} {align} {stayOnScroll} {...rest} class={className}>
	{@render children()}
</Popover.Content>
