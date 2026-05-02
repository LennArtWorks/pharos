<script lang="ts">
	import { page } from '$app/state';
	import { contextMenu, requestContextMenuAction } from '$lib/state/layout/contextMenu.svelte';
	import FloatingPopover from '$lib/components/ui/FloatingPopover.svelte';
	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';

	let activeSubmenuId = $state<string | null>(null);
	let submenuTimeout: ReturnType<typeof setTimeout>;

	function handleAction(action?: string) {
		if (action) requestContextMenuAction(action);
	}

	function handleSubmenuEnter(id: string) {
		clearTimeout(submenuTimeout);
		activeSubmenuId = id;
	}

	function handleSubmenuLeave() {
		submenuTimeout = setTimeout(() => {
			activeSubmenuId = null;
		}, 250);
	}

	function handleClose() {
		contextMenu.isOpen = false;
		activeSubmenuId = null;
	}
</script>

{#if contextMenu.isOpen}
	<FloatingPopover
		x={contextMenu.x + 10}
		y={contextMenu.y + 10}
		onclose={handleClose}
		class="bg-level-1 z-9999 min-w-48 gap-1 p-1"
		aria-label="Context menu"
		role="menu">

		{#if contextMenu.items.length === 0}
			<div role="none">
				<NodeItem role="menuitem" name="Nothing to click here :(" iconHidden disabled class="text-ink-50 cursor-default italic" />
			</div>
		{:else}
			{#each contextMenu.items as item}
				{#if item.type === 'divider'}
					<div role="separator" class="bg-border my-1 h-px w-full"></div>
				{:else if item.type === 'label'}
					<div role="none">
						<NodeItem role="menuitem" name={item.label} iconHidden disabled class="text-ink-50 cursor-default italic" />
					</div>
				{:else if item.type === 'action'}
					<div role="none">
						<NodeItem
							role="menuitem"
							disabled={item.disabled}
							name={item.label}
							icon={item.icon as FigmaIconName}
							iconHidden={!item.icon}
							class={item.danger ? 'theme-accent font-medium' : ''}
							onclick={() => handleAction(item.action)} />
					</div>
				{:else if item.type === 'submenu'}
					<div role="none" class="relative w-full" onmouseenter={() => handleSubmenuEnter(item.id)} onmouseleave={handleSubmenuLeave}>
						<NodeItem
							role="menuitem"
							aria-haspopup="true"
							aria-expanded={activeSubmenuId === item.id}
							name={item.label}
							icon={item.icon as FigmaIconName}
							iconHidden={!item.icon}
							class={activeSubmenuId === item.id ? 'bg-button-hover-low' : ''}>
							{#snippet trailingItems()}
								<Icon name="arrow-right" class="text-ink-50 h-3 w-3" />
							{/snippet}
						</NodeItem>

						{#if activeSubmenuId === item.id && item.items}
							{@const flipSubmenu = contextMenu.x + 10 + 192 + 180 > window.innerWidth}
							<div
								role="menu"
								class="bg-level-1 border-border rounded-m absolute top-0 flex min-w-44 flex-col gap-1 border p-1 shadow-lg"
								style={flipSubmenu ? 'right: 100%; margin-right: 4px;' : 'left: 100%; margin-left: 4px;'}>
								{#each item.items as subItem}
									{#if subItem.type === 'divider'}
										<div role="separator" class="bg-border my-1 h-px w-full"></div>
									{:else}
										<div role="none">
											<NodeItem
												role="menuitem"
												name={subItem.label}
												icon={subItem.icon as FigmaIconName}
												iconHidden={!subItem.icon}
												class={subItem.danger ? 'theme-accent' : 'capitalize'}
												onclick={() => handleAction(subItem.action)} />
										</div>
									{/if}
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/each}

			{#if page.data.operator && contextMenu.node}
				<div role="separator" class="bg-border my-1 h-px w-full"></div>
				<div role="none">
					<NodeItem role="menuitem" size="s" name="Log Node Data" iconHidden class="text-ink-50 text-xs" onclick={() => console.log($state.snapshot(contextMenu.node))} />
				</div>
			{/if}
		{/if}
	</FloatingPopover>
{/if}
