<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
</script>

<div class="gap-2xl mx-auto flex max-w-5xl flex-col">
	<header class="mb-8 text-center">
		<div class="bg-level-2 border-border mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border shadow-sm">
			<Icon name="code-block" class="text-ink-90 h-8 w-8" />
		</div>
		<h1 class="text-ink-90 mb-4 text-4xl font-bold">Developer Portal</h1>
		<p class="text-ink-50 text-body-l mx-auto max-w-2xl">Central command for UI components, backend infrastructure insights, and AI context management.</p>
	</header>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
		<a href="/files/dev/design-system" class="bg-level-1 hover:bg-level-2 border-border group flex flex-col rounded-xl border p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
			<div class="bg-level-0 border-border text-accent-500 mb-6 flex h-12 w-12 items-center justify-center rounded-lg border transition-transform group-hover:scale-110">
				<Icon name="shapes" class="h-6 w-6" />
			</div>
			<h2 class="text-label-xl text-ink-90 mb-2 font-bold">Design System</h2>
			<p class="text-body-m text-ink-50 mb-8 flex-1">The single source of truth for UI components, layouts, foundations, and interactive sandboxes.</p>
			<div class="text-label-s text-accent-500 flex items-center font-bold">
				Explore UI <Icon name="arrow-right" class="ml-2 h-4 w-4" />
			</div>
		</a>

		<a href="/files/dev/backend" class="bg-level-1 hover:bg-level-2 border-border group flex flex-col rounded-xl border p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
			<div class="bg-level-0 border-border text-accent-500 mb-6 flex h-12 w-12 items-center justify-center rounded-lg border transition-transform group-hover:scale-110">
				<Icon name="layout-boxes" class="h-6 w-6" />
			</div>
			<h2 class="text-label-xl text-ink-90 mb-2 font-bold">Backend & Data</h2>
			<p class="text-body-m text-ink-50 mb-8 flex-1">Live insights into active tenants, SQLite records, RAM cache status, and rate limiters.</p>
			<div class="text-label-s text-accent-500 flex items-center font-bold">
				View Dashboard <Icon name="arrow-right" class="ml-2 h-4 w-4" />
			</div>
		</a>

		<a href="/files/dev/aidev" class="bg-level-1 hover:bg-level-2 border-border group flex flex-col rounded-xl border p-8 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md">
			<div class="bg-level-0 border-border text-accent-500 mb-6 flex h-12 w-12 items-center justify-center rounded-lg border transition-transform group-hover:scale-110">
				<Icon name="sparkles" class="h-6 w-6" />
			</div>
			<h2 class="text-label-xl text-ink-90 mb-2 font-bold">AI Context Hub</h2>
			<p class="text-body-m text-ink-50 mb-8 flex-1">Copyable architecture blueprints and system prompts to bootstrap new AI dev sessions instantly.</p>
			<div class="text-label-s text-accent-500 flex items-center font-bold">
				Get Context <Icon name="arrow-right" class="ml-2 h-4 w-4" />
			</div>
		</a>
	</div>
</div>
