<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
</script>

<div class="mx-auto flex min-h-full flex-col items-center justify-center p-8 text-center">
	<div class="bg-level-2 border-border mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border shadow-sm">
		<Icon name="sparkles" class="text-accent-500 h-10 w-10" />
	</div>
	<h1 class="text-label-xl text-ink-90 mb-4 font-bold">AI Context Hub</h1>
	<p class="text-body-m text-ink-50 mb-8">
		Select a topic from the sidebar to load the architecture context, system prompts, and file structures. This keeps AI conversations focused and prevents hallucinations in large codebases.
	</p>
	<div class="flex gap-4">
		<div class="bg-level-1 border-border flex items-center gap-3 rounded-lg border px-4 py-3 text-left">
			<Icon name="copy" class="text-ink-50 h-5 w-5" />
			<div>
				<div class="text-label-s text-ink-90 font-bold">1. Copy Context</div>
				<div class="text-body-s text-ink-50">Grab the system prompt.</div>
			</div>
		</div>
		<div class="bg-level-1 border-border flex items-center gap-3 rounded-lg border px-4 py-3 text-left">
			<Icon name="file" class="text-ink-50 h-5 w-5" />
			<div>
				<div class="text-label-s text-ink-90 font-bold">2. Copy Files</div>
				<div class="text-body-s text-ink-50">Grab the required codebase files.</div>
			</div>
		</div>
	</div>
</div>
