<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="flex h-full flex-col p-8">
	<p class="text-sm text-gray-500">Workspace: {$page.params.workspaceId}</p>
	<h1 class="text-2xl font-bold">File ID: {$page.params.fileId}</h1>

	<div class="mt-8 border-t pt-4">
		<p>Editor placeholder...</p>
	</div>
</div>
