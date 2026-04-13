<script lang="ts">
	import type { VNode } from '$lib/config/filesystem';
	let { node }: { node: VNode } = $props();
</script>

<div class="p-8">
	<h2 class="mb-4 text-3xl font-bold">{node.name}</h2>
	<h1 class="mb-4 text-3xl font-bold">Access Forbidden!!!</h1>
	<p class="text-ink-50">You are not allowed to be here, please leave! NOW!</p>
	<p class="text-ink-30 mt-4 text-sm">ID: {node.id}</p>
</div>
