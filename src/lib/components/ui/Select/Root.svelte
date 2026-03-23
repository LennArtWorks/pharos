<script lang="ts">
	import { setSelectContext } from '$lib/components/ui/Select/context.svelte';

	import * as Popover from '$lib/components/ui/Popover';

	import type { Snippet } from 'svelte';

	let { value = $bindable(null), children }: { value?: string | number | null; children: Snippet } = $props();

	const ctx = setSelectContext();

	$effect(() => {
		ctx.value = value;
	});

	$effect(() => {
		value = ctx.value;
	});
</script>

<Popover.Root>
	<div class="w-full">
		{@render children()}
	</div>
</Popover.Root>
