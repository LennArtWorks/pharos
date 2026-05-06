/**
 * DatePanel overlay — floating panel for viewing, creating, and editing calendar date entries.
 *
 * Positioned as a fixed overlay anchored near the click coordinates (clamped to viewport).
 * Used by the calendar page for all three modes; day view will place the same component
 * as a sidebar column when that view is built.
 *
 * Usage:
 *   openDatePanelCreate(e, { timestamp, targetNodeId, targetNodeName })
 *   openDatePanelView(e, entryId)
 *   closeDatePanel()
 */

export type DatePanelMode = 'view' | 'create' | 'edit';

export const datePanel = $state({
  isOpen: false,
  mode: 'create' as DatePanelMode,
  x: 0,
  y: 0,
  entryId: null as string | null,
  initialTimestamp: null as number | null,
  initialTimestampEnd: null as number | null,
  targetNodeId: null as string | null,
  targetNodeName: null as string | null
});

export function openDatePanelCreate(
  e: MouseEvent,
  opts?: { timestamp?: number; timestampEnd?: number; targetNodeId?: string; targetNodeName?: string }
) {
  datePanel.mode = 'create';
  datePanel.entryId = null;
  datePanel.x = e.clientX;
  datePanel.y = e.clientY;
  datePanel.initialTimestamp = opts?.timestamp ?? null;
  datePanel.initialTimestampEnd = opts?.timestampEnd ?? null;
  datePanel.targetNodeId = opts?.targetNodeId ?? null;
  datePanel.targetNodeName = opts?.targetNodeName ?? null;
  datePanel.isOpen = true;
}

export function openDatePanelView(e: MouseEvent, entryId: string) {
  datePanel.mode = 'view';
  datePanel.entryId = entryId;
  datePanel.x = e.clientX;
  datePanel.y = e.clientY;
  datePanel.initialTimestamp = null;
  datePanel.initialTimestampEnd = null;
  datePanel.targetNodeId = null;
  datePanel.targetNodeName = null;
  datePanel.isOpen = true;
}

export function closeDatePanel() {
  datePanel.isOpen = false;
  datePanel.entryId = null;
}
