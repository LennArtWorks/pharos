<script lang="ts">
	import { contextMenu, closeContextMenu, requestContextMenuAction } from '$lib/state/contextMenu.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { FILE_TYPE_CONFIG } from '$lib/config/filesystem';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { has } from '$lib/utils/config/permissions';
	import { dev } from '$app/environment';

	// Collision detection for main menu
	let width = $state(0);
	let height = $state(0);

	let safeX = $state(contextMenu.x + 10);
	let safeY = $state(contextMenu.y + 10);

	let flipSubmenu = $state(false);

	// Calculate the bounds purely on the client inside the effect
	$effect(() => {
		// We only care if it's open
		if (!contextMenu.isOpen) {
			activeSubmenu = null;
			return;
		}

		// Now we are safely on the client, window is guaranteed to exist!
		safeX = contextMenu.x + 10 + width > window.innerWidth ? contextMenu.x - width - 10 : contextMenu.x + 10;

		safeY = contextMenu.y + 10 + height > window.innerHeight ? contextMenu.y - height - 10 : contextMenu.y + 10;

		flipSubmenu = safeX + width + 180 > window.innerWidth;
	});

	// Sub-menu state
	let activeSubmenu = $state<string | null>(null);
	// let flipSubmenu = $derived(typeof window !== 'undefined' && safeX + width + 180 > window.innerWidth);

	$effect(() => {
		if (!contextMenu.isOpen) activeSubmenu = null;
	});

	const creatableTypes = Object.entries(FILE_TYPE_CONFIG.internal)
		.filter(([id, config]) => config.active && !['workspace', 'sysfolder', 'sysfile'].includes(id))
		.map(([id, config]) => ({ id, ...config }));

	function handleAction(action: string) {
		requestContextMenuAction(action);
	}
</script>

{#if contextMenu.isOpen}
	<div
		bind:clientWidth={width}
		bind:clientHeight={height}
		style="left: {safeX}px; top: {safeY}px; transition: none"
		class="bg-level-1 border-border rounded-m fixed z-[9999] flex min-w-48 flex-col gap-1 border p-1 shadow-lg"
		onmousedown={(e) => e.stopPropagation()}
		oncontextmenu={(e) => {
			e.preventDefault();
			e.stopPropagation();
		}}>
		{#if contextMenu.type === 'file' || contextMenu.type === 'workspace'}
			{#if has(PERMISSIONS.FILES.EDIT)}
				<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => handleAction('rename')}>
					{#snippet leading()}<Icon name="pencil" />{/snippet}
					{#snippet label()}<span class="w-full text-left">Rename</span>{/snippet}
				</Button>
			{/if}

			{#if has(PERMISSIONS.FILES.CREATE)}
				<div class="relative w-full" onmouseenter={() => (activeSubmenu = 'create')} onmouseleave={() => (activeSubmenu = null)}>
					<Button variant="tertiary" size="s" class="w-full justify-start {activeSubmenu === 'create' ? 'bg-button-hover-low' : ''}">
						{#snippet leading()}<Icon name="add" />{/snippet}
						{#snippet label()}<span class="w-full text-left">Create New...</span>{/snippet}
						{#snippet trailing()}<Icon name="arrow-right" class="text-ink-50 h-3 w-3" />{/snippet}
					</Button>

					{#if activeSubmenu === 'create'}
						<div
							class="bg-level-1 border-border rounded-m absolute top-0 flex min-w-44 flex-col gap-1 border p-1 shadow-lg"
							style={flipSubmenu ? 'right: 100%; margin-right: 4px;' : 'left: 100%; margin-left: 4px;'}>
							{#each creatableTypes as type}
								<Button variant="tertiary" size="s" class="w-full justify-start" onclick={() => handleAction(`create:${type.id}`)}>
									{#snippet leading()}<Icon name={type.icon || 'file'} />{/snippet}
									{#snippet label()}<span class="w-full text-left capitalize">{type.id}</span>{/snippet}
								</Button>
							{/each}
						</div>
					{/if}
				</div>
			{/if}

			<div class="bg-border my-1 h-px w-full"></div>

			{#if has(PERMISSIONS.FILES.DELETE)}
				<Button variant="tertiary" size="s" class="theme-accent w-full justify-start" onclick={() => handleAction('delete')}>
					{#snippet leading()}<Icon name="trash" />{/snippet}
					{#snippet label()}<span class="w-full text-left font-medium">Move to Trash</span>{/snippet}
				</Button>
			{/if}
		{:else if contextMenu.type === 'general'}
			<Button variant="tertiary" size="s" class="text-ink-50 w-full cursor-default justify-start">
				{#snippet label()}<span class="w-full text-left italic">Empty for now</span>{/snippet}
			</Button>
		{/if}

		{#if dev}
			<div class="bg-border my-1 h-px w-full"></div>

			{#if contextMenu.node}
				<Button variant="tertiary" size="s" class="text-ink-50 w-full justify-start" onclick={() => console.log($state.snapshot(contextMenu.node))}>
					{#snippet label()}<span class="w-full text-left text-xs">Log Node Data</span>{/snippet}
				</Button>
			{/if}

			<Button variant="tertiary" size="s" class="text-ink-50 w-full justify-start" oncontextmenu={(e: { stopPropagation: () => any }) => e.stopPropagation()}>
				{#snippet label()}<span class="w-full text-left text-xs">Native Right Click Here</span>{/snippet}
			</Button>
		{/if}
	</div>
{/if}
