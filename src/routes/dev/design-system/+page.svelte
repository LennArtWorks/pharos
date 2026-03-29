<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { uiComponents, blocks, layouts } from '../data';
</script>

<div data-uiname="dev-overview" class="gap-2xl flex flex-col">
	<header>
		<h1 class="text-ink-90 mb-l text-4xl font-bold">FSR OS Design System</h1>
		<p class="text-ink-50 text-body-l max-w-2xl">The single source of truth for all foundations, components, and patterns used across the FSR operating system.</p>
	</header>

	<h2 class="text-label-xl text-ink-70 mt-l font-bold">Foundations</h2>
	<div class="gap-l grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
		<a href="/files/dev/design-system/colors" class="bg-level-1 hover:bg-level-1-hover border-border group rounded-m p-xl flex flex-col border transition-colors">
			<div class="mb-4 flex items-center gap-3">
				<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-lg border">
					<Icon name="colors" class="text-ink-90" />
				</div>
				<h3 class="text-ink-90 font-label-l font-bold">Colors</h3>
			</div>
			<p class="text-ink-50 text-body-m mb-6">Semantic tokens, raw primitives, and automated dark mode scaling.</p>

			<div class="mt-auto flex h-4 w-full overflow-hidden rounded-full">
				<div class="h-full flex-1 bg-neutral-300"></div>
				<div class="h-full flex-1 bg-neutral-400"></div>
				<div class="h-full flex-1 bg-neutral-500"></div>
				<div class="h-full flex-1 bg-neutral-600"></div>
				<div class="h-full flex-1 bg-neutral-700"></div>
			</div>
		</a>

		<a href="/files/dev/design-system/icons" class="bg-level-1 hover:bg-level-1-hover border-border group rounded-m p-xl flex flex-col border transition-colors">
			<div class="mb-4 flex items-center gap-3">
				<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-lg border">
					<Icon name="star" class="text-ink-90" />
				</div>
				<h3 class="text-ink-90 font-label-l font-bold">Icons</h3>
			</div>
			<p class="text-ink-50 text-body-m mb-6">Unified sticker sheet with click-to-copy functionality.</p>

			<div class="text-ink-50 group-hover:text-ink-90 mt-auto flex items-center gap-4 transition-colors">
				<Icon name="settings" class="h-6 w-6" />
				<Icon name="person" class="h-6 w-6" />
				<Icon name="folder" class="h-6 w-6" />
			</div>
		</a>

		<a href="/files/dev/design-system/typography" class="bg-level-1 hover:bg-level-1-hover border-border group rounded-m p-xl flex flex-col border transition-colors">
			<div class="mb-4 flex items-center gap-3">
				<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-lg border">
					<Icon name="text-body" class="text-ink-90" />
				</div>
				<h3 class="text-ink-90 font-label-l font-bold">Typography</h3>
			</div>
			<p class="text-ink-50 text-body-m mb-6">Font sizes, weights, and leading mapped to semantic tokens.</p>

			<div class="text-ink-90 group-hover:text-ink-100 mt-auto flex flex-col transition-colors">
				<span class="font-label-xl font-bold">Aa</span>
				<span class="font-body-s text-ink-50 mt-1">Sphinx of black quartz, judge my vow.</span>
			</div>
		</a>

		<a href="/files/dev/design-system/spacing" class="bg-level-1 hover:bg-level-1-hover border-border group rounded-m p-xl flex flex-col border transition-colors">
			<div class="mb-4 flex items-center gap-3">
				<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-lg border">
					<Icon name="ruler" class="text-ink-90" />
				</div>
				<h3 class="text-ink-90 font-label-l font-bold">Spacing</h3>
			</div>
			<p class="text-ink-50 text-body-m mb-6">Standardized gaps, paddings, and heights for rhythms.</p>

			<div class="mt-auto flex items-end gap-2">
				<div class="bg-level-2 border-border h-4 w-4 rounded border transition-all group-hover:bg-neutral-500"></div>
				<div class="bg-level-2 border-border h-6 w-6 rounded border transition-all group-hover:bg-neutral-500"></div>
				<div class="bg-level-2 border-border h-8 w-8 rounded border transition-all group-hover:bg-neutral-500"></div>
			</div>
		</a>

		<a href="/files/dev/design-system/permissions" class="bg-level-1 hover:bg-level-1-hover border-border group rounded-m p-xl flex flex-col border transition-colors">
			<div class="mb-4 flex items-center gap-3">
				<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-lg border">
					<Icon name="key" class="text-ink-90" />
				</div>
				<h3 class="text-ink-90 font-label-l font-bold">Permissions</h3>
			</div>
			<p class="text-ink-50 text-body-m mb-6">Hierarchical access control, role building, and config export.</p>

			<div class="text-ink-50 group-hover:text-ink-90 mt-auto flex items-center gap-2 transition-colors">
				<Icon name="key" class="h-5 w-5" />
				<div class="bg-ink-50 group-hover:bg-ink-90 h-0.5 w-4 transition-colors"></div>
				<Icon name="person" class="h-5 w-5" />
			</div>
		</a>
	</div>

	<h2 class="text-label-xl text-ink-70 mt-2xl font-bold">Components & Blocks</h2>
	<div class="gap-l flex flex-col">
		<div class="bg-level-1 hover:bg-level-1-hover border-border group rounded-m p-xl relative flex flex-col border transition-colors">
			<a href="/files/dev/design-system/ui" class="absolute inset-0 z-0 rounded-xl" aria-label="UI Components"></a>
			<div class="pointer-events-none relative z-10 mb-4 flex items-center gap-3">
				<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-lg border">
					<Icon name="shapes" class="text-ink-90" />
				</div>
				<h3 class="text-ink-90 font-label-l font-bold">UI Components</h3>
			</div>
			<p class="text-ink-50 text-body-m pointer-events-none relative z-10 mb-6">Interactive previews of primitive interfaces like buttons, inputs, tags, and selects.</p>
			<div class="relative z-10 mt-auto flex flex-wrap gap-2">
				{#each uiComponents as comp}
					<Button size="sm" href={comp.href}>
						{comp.name}
					</Button>
				{/each}
			</div>
		</div>

		<div class="bg-level-1 hover:bg-level-1-hover border-border group p-xl rounded-m relative flex flex-col border transition-colors">
			<a href="/files/dev/design-system/blocks" class="absolute inset-0 z-0 rounded-xl" aria-label="Blocks"></a>
			<div class="pointer-events-none relative z-10 mb-4 flex items-center gap-3">
				<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-lg border">
					<Icon name="blocks" class="text-ink-90" />
				</div>
				<h3 class="text-ink-90 font-label-l font-bold">Blocks</h3>
			</div>
			<p class="text-ink-50 text-body-m pointer-events-none relative z-10 mb-6">Complex, domain-specific combinations like Files, Folders, and Event Cards.</p>
			<div class="relative z-10 mt-auto flex flex-wrap gap-2">
				{#each blocks as block}
					<Button size="sm" href={block.href}>
						{block.name}
					</Button>
				{/each}
			</div>
		</div>

		<div class="bg-level-1 hover:bg-level-1-hover border-border group rounded-m p-xl relative flex flex-col border transition-colors">
			<a href="/files/dev/design-system/layout" class="absolute inset-0 z-0 rounded-xl" aria-label="Layouts"></a>
			<div class="pointer-events-none relative z-10 mb-4 flex items-center gap-3">
				<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-lg border">
					<Icon name="layout" class="text-ink-90" />
				</div>
				<h3 class="text-ink-90 font-label-l font-bold">Layouts</h3>
			</div>
			<p class="text-ink-50 text-body-m pointer-events-none relative z-10 mb-6">Structural wrappers managing boundaries and spacing, like Forms and Floating Navs.</p>
			<div class="relative z-10 mt-auto flex flex-wrap gap-2">
				{#each layouts as layout}
					<Button size="sm" href={layout.href}>
						{layout.name}
					</Button>
				{/each}
			</div>
		</div>
	</div>
</div>
