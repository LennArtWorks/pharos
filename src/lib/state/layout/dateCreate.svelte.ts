/**
 * Hybrid overlay trigger for the date creation modal.
 *
 * - open/close is URL-driven via the shared overlay system (?overlay=date-create)
 *   → browser back button dismisses the modal automatically
 * - pre-fill context (timestamp, target node) is kept in reactive state
 *   → avoids polluting the URL with cryptic params
 *
 * Usage:
 *   openDateCreate({ timestamp: date.getTime() })      // from calendar day click
 *   openDateCreate({ targetNodeId, targetNodeName })   // from file tree context menu
 *   closeDateCreate()                                  // from cancel / submit
 */

import { openOverlay, closeOverlay } from '$lib/utils/overlay';

/** Pre-fill context read by DateCreateModal — set before URL navigation. */
export const dateCreateContext = $state({
  /** Pre-filled start timestamp (Unix ms). Set when user clicks a day cell. */
  initialTimestamp: null as number | null,
  /** Pre-filled target node ID. Set when "Add Date" is triggered from a file/folder. */
  targetNodeId: null as string | null,
  /** Display name of the target node — shown in the modal header for context. */
  targetNodeName: null as string | null
});

export function openDateCreate(opts: {
  timestamp?: number;
  targetNodeId?: string;
  targetNodeName?: string;
} = {}) {
  // Set context before navigating so the modal can read it immediately on mount
  dateCreateContext.initialTimestamp = opts.timestamp ?? null;
  dateCreateContext.targetNodeId = opts.targetNodeId ?? null;
  dateCreateContext.targetNodeName = opts.targetNodeName ?? null;
  openOverlay('date-create');
}

export function closeDateCreate() {
  closeOverlay();
}
