import { tick } from 'svelte';
import type { FSRNode } from '$lib/config/filesystem';

export type ContextType = 'file' | 'workspace' | 'general' | null;

export const contextMenu = $state({
  isOpen: false,
  x: 0,
  y: 0,
  type: null as ContextType,
  node: null as FSRNode | null,
  actionRequested: null as string | null, // e.g., 'rename', 'delete', 'create:document'
  payload: null as any
});

export async function openContextMenu(e: MouseEvent, type: ContextType, node: FSRNode | null = null) {
  e.preventDefault();
  e.stopPropagation();

  contextMenu.isOpen = false; // Reset to force re-render if already open
  await tick();

  contextMenu.type = type;
  contextMenu.node = node;
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