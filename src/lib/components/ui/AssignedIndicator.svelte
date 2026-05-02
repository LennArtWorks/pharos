<script lang="ts">
	import { cn } from '$lib/utils';
	interface Props { class?: string; }
	let { class: className = '' }: Props = $props();
</script>

<span class={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-current', className)}></span>
