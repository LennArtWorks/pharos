// src/lib/state/contextMenu.svelte.ts
import { tick } from 'svelte';
import type { VNode } from '$lib/config/filesystem';
import type { FigmaIconName } from '$lib/components/ui/Icon.svelte';

export type ContextType = 'file' | 'workspace' | 'general' | 'date-entry' | null;

export type ContextMenuItem = {
  id: string;
  type: 'action' | 'submenu' | 'divider' | 'label';
  label?: string;
  icon?: FigmaIconName;
  action?: string;
  danger?: boolean;
  disabled?: boolean;
  items?: ContextMenuItem[];
};

export const contextMenu = $state({
  isOpen: false,
  x: 0,
  y: 0,
  type: null as ContextType,
  node: null as VNode | null,
  items: [] as ContextMenuItem[],
  actionRequested: null as string | null,
  payload: null as any
});

export async function openContextMenu(e: MouseEvent, type: ContextType, node: VNode | null = null, items: ContextMenuItem[] = []) {
  // NEW: Allow native browser context menu if Shift is held down.
  if (e.shiftKey) return;

  e.preventDefault();
  e.stopPropagation();

  contextMenu.isOpen = false;
  await tick();

  contextMenu.type = type;
  contextMenu.node = node;
  contextMenu.items = items;
  contextMenu.x = e.clientX;
  contextMenu.y = e.clientY;
  contextMenu.actionRequested = null;
  contextMenu.isOpen = true;
}

export function closeContextMenu() {
  contextMenu.isOpen = false;
  contextMenu.actionRequested = null;
}

export function requestContextMenuAction(action: string, payload: any = null) {
  contextMenu.actionRequested = action;
  contextMenu.payload = payload;
  contextMenu.isOpen = false;
}