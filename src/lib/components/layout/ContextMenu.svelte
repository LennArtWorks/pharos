<script lang="ts">
	import { page } from '$app/state';
	import { contextMenu, requestContextMenuAction } from '$lib/state/layout/contextMenu.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';

	let width = $state(0);
	let height = $state(0);

	let safeX = $state(contextMenu.x + 10);
	let safeY = $state(contextMenu.y + 10);
	let flipSubmenu = $state(false);

	let activeSubmenuId = $state<string | null>(null);
	let submenuTimeout: NodeJS.Timeout; // NEW: Timer for debounce

	$effect(() => {
		if (!contextMenu.isOpen) {
			activeSubmenuId = null;
			return;
		}

		safeX = contextMenu.x + 10 + width > window.innerWidth ? contextMenu.x - width - 10 : contextMenu.x + 10;
		safeY = contextMenu.y + 10 + height > window.innerHeight ? contextMenu.y - height - 10 : contextMenu.y + 10;
		flipSubmenu = safeX + width + 180 > window.innerWidth;
	});

	function handleAction(action?: string) {
		if (action) requestContextMenuAction(action);
	}

	// NEW: Delay closing the submenu to bridge the visual gap
	function handleSubmenuEnter(id: string) {
		clearTimeout(submenuTimeout);
		activeSubmenuId = id;
	}

	function handleSubmenuLeave() {
		submenuTimeout = setTimeout(() => {
			activeSubmenuId = null;
		}, 250);
	}
</script>

{#if contextMenu.isOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- ADDED: role="menu" for standard accessibility -->
	<div
		role="menu"
		bind:clientWidth={width}
		bind:clientHeight={height}
		style="left: {safeX}px; top: {safeY}px; transition: none"
		data-uiname="context-menu-shell"
		class="bg-level-1 border-border rounded-m fixed z-[9999] flex min-w-48 flex-col gap-1 border p-1 shadow-lg"
		onmousedown={(e) => e.stopPropagation()}
		oncontextmenu={(e) => {
			e.preventDefault();
			e.stopPropagation();
		}}>
		{#if contextMenu.items.length === 0}
			<!-- GLOBAL EMPTY STATE -->
			<div role="none">
				<Button role="menuitem" variant="tertiary" size="s" class="text-ink-50 w-full cursor-default justify-start" disabled>
					{#snippet label()}<span class="w-full text-left italic">Nothing to click here :(</span>{/snippet}
				</Button>
			</div>
		{:else}
			{#each contextMenu.items as item}
				{#if item.type === 'divider'}
					<div role="separator" class="bg-border my-1 h-px w-full"></div>
				{:else if item.type === 'label'}
					<div role="none">
						<Button role="menuitem" variant="tertiary" size="s" class="text-ink-50 w-full cursor-default justify-start" disabled>
							{#snippet label()}<span class="w-full text-left italic">{item.label}</span>{/snippet}
						</Button>
					</div>
				{:else if item.type === 'action'}
					<div role="none">
						<Button
							role="menuitem"
							variant="tertiary"
							size="s"
							disabled={item.disabled}
							class="w-full justify-start {item.danger ? 'theme-accent font-medium' : ''}"
							onclick={() => handleAction(item.action)}>
							{#if item.icon}
								{#snippet leading()}<Icon name={item.icon as FigmaIconName} />{/snippet}
							{/if}
							{#snippet label()}<span class="w-full text-left">{item.label}</span>{/snippet}
						</Button>
					</div>
				{:else if item.type === 'submenu'}
					<div role="none" class="relative w-full" onmouseenter={() => handleSubmenuEnter(item.id)} onmouseleave={handleSubmenuLeave}>
						<Button
							role="menuitem"
							aria-haspopup="true"
							aria-expanded={activeSubmenuId === item.id}
							variant="tertiary"
							size="s"
							class="w-full justify-start {activeSubmenuId === item.id ? 'bg-button-hover-low' : ''}">
							{#if item.icon}
								{#snippet leading()}<Icon name={item.icon as FigmaIconName} />{/snippet}
							{/if}
							{#snippet label()}<span class="w-full text-left">{item.label}</span>{/snippet}
							{#snippet trailing()}<Icon name="arrow-right" class="text-ink-50 h-3 w-3" />{/snippet}
						</Button>

						{#if activeSubmenuId === item.id && item.items}
							<div
								role="menu"
								data-uiname={`context-submenu-${item.id}`}
								class="bg-level-1 border-border rounded-m absolute top-0 flex min-w-44 flex-col gap-1 border p-1 shadow-lg"
								style={flipSubmenu ? 'right: 100%; margin-right: 4px;' : 'left: 100%; margin-left: 4px;'}>
								{#each item.items as subItem}
									{#if subItem.type === 'divider'}
										<div role="separator" class="bg-border my-1 h-px w-full"></div>
									{:else}
										<div role="none">
											<Button role="menuitem" variant="tertiary" size="s" class="w-full justify-start {subItem.danger ? 'theme-accent' : ''}" onclick={() => handleAction(subItem.action)}>
												{#if subItem.icon}
													<!-- FIX: TypeScript explicit casting to FigmaIconName -->
													{#snippet leading()}<Icon name={subItem.icon as FigmaIconName} />{/snippet}
												{/if}
												{#snippet label()}<span class="w-full text-left capitalize">{subItem.label}</span>{/snippet}
											</Button>
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/each}

			<!-- RESTRICTED: Only visible to logged-in Operators looking for telemetry -->
			{#if page.data.operator && contextMenu.node}
				<div role="separator" class="bg-border my-1 h-px w-full"></div>
				<div role="none">
					<Button role="menuitem" variant="tertiary" size="s" class="text-ink-50 w-full justify-start" onclick={() => console.log($state.snapshot(contextMenu.node))}>
						{#snippet label()}<span class="w-full text-left text-xs">Log Node Data</span>{/snippet}
					</Button>
				</div>
			{/if}
		{/if}
	</div>
{/if}
