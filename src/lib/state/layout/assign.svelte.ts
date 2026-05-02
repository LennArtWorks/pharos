/**
 * Assign overlay — lightweight context-positioned panel for assigning users
 * to a node (file/folder) or a calendar date entry.
 *
 * Pattern mirrors dateCreate.svelte.ts but uses $state directly (no URL param)
 * since the panel doesn't need browser back-button support.
 *
 * Usage:
 *   openAssign(e, { type: 'node', nodeId, currentAssignees: node.assignees ?? [] })
 *   openAssign(e, { type: 'date', entryId, currentAssignees: entry.assignees ?? [] })
 */

export type AssignTarget =
  | { type: 'node'; nodeId: string; currentAssignees: string[] }
  | { type: 'date'; entryId: string; currentAssignees: string[] };

export const assignOverlay = $state({
  isOpen: false,
  target: null as AssignTarget | null,
  x: 0,
  y: 0
});

export function openAssign(e: MouseEvent, target: AssignTarget) {
  assignOverlay.target = target;
  assignOverlay.x = e.clientX;
  assignOverlay.y = e.clientY;
  assignOverlay.isOpen = true;
}

export function closeAssign() {
  assignOverlay.isOpen = false;
  assignOverlay.target = null;
}
