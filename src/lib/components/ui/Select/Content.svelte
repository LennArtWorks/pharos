<script lang="ts">
	import * as Popover from '$lib/components/ui/Popover';
	import type { Snippet } from 'svelte';
	import type { HTMLAttributes } from 'svelte/elements';

	interface Props extends HTMLAttributes<HTMLDivElement> {
		children: Snippet;
		class?: string;
	}

	let { children, class: className = '', ...rest }: Props = $props();
</script>

<Popover.Content {...rest} class={className}>
	{@render children()}
</Popover.Content>
