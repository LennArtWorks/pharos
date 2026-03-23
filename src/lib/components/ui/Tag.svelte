<script lang="ts">
	import type { Snippet } from 'svelte';
	import Button from './Button.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		children?: Snippet;
		class?: string;
		[key: string]: any; // Allow any other button props
	}

	let { children, class: className = '', ...rest }: Props = $props();
</script>

<Button size="xs" variant="secondary" class={cn('shrink-0', className)} {...rest}>
	{@render children()}
</Button>
