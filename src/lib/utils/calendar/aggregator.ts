/**
 * Calendar Aggregator — unified dates.appsys model
 *
 * All dates live in dates.appsys as AppDate records.
 * A date without targetNodeId is standalone (floating).
 * A date with targetNodeId is attached to that VNode (file, folder, task, event, etc.).
 *
 * The aggregator simply maps AppDate → CalendarEntry, resolving node display info
 * from the VNode map when an attachment is present.
 */

import type { AppDate, VNode } from '$lib/config/filesystem';

// ─── CalendarEntry ────────────────────────────────────────────────────────────

export type CalendarEntrySource =
	| { type: 'floating' }
	| { type: 'node'; nodeId: string; nodeName: string; nodeExtension: string };

export interface CalendarEntry {
	/** Equals AppDate.id — unique across all entries. */
	calendarId: string;

	title: string;
	variant: AppDate['variant'];

	timestamp: number;
	timestampEnd?: number;
	allDay: boolean;

	description?: string;
	location?: string;
	assignees?: string[];
	/** Assignees of the attached VNode — used for "assigned to me" display without data propagation. */
	nodeAssignees?: string[];

	source: CalendarEntrySource;
}

// ─── Aggregator ───────────────────────────────────────────────────────────────

/**
 * Converts AppDate[] → CalendarEntry[].
 * Node info (name, extension) is resolved from nodeMap for attached dates.
 * If the node no longer exists (deleted), source still carries the nodeId.
 */
export function aggregateCalendarEntries(
	nodeMap: Map<string, VNode>,
	dates: AppDate[]
): CalendarEntry[] {
	return dates.map((date) => {
		const base = {
			calendarId: date.id,
			title: date.title,
			variant: date.variant,
			timestamp: date.timestamp,
			timestampEnd: date.timestampEnd,
			allDay: date.allDay,
			description: date.description,
			location: date.location,
			assignees: date.assignees
		};

		if (!date.targetNodeId) {
			return { ...base, source: { type: 'floating' } };
		}

		const node = nodeMap.get(date.targetNodeId);
		return {
			...base,
			nodeAssignees: node?.assignees,
			source: {
				type: 'node',
				nodeId: date.targetNodeId,
				nodeName: node?.name ?? 'Unknown',
				nodeExtension: node?.extension ?? ''
			}
		};
	});
}

// ─── Sorting helpers ──────────────────────────────────────────────────────────

/** Sorts CalendarEntry[] chronologically by start timestamp. */
export function sortByTimestamp(entries: CalendarEntry[]): CalendarEntry[] {
	return [...entries].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Groups CalendarEntry[] by calendar date string (YYYY-MM-DD in local time).
 * Note: does not expand spanning entries — use the MonthView's cellEntriesMap for that.
 */
export function groupByDay(entries: CalendarEntry[]): Map<string, CalendarEntry[]> {
	const map = new Map<string, CalendarEntry[]>();
	for (const entry of entries) {
		const key = new Date(entry.timestamp).toLocaleDateString('sv-SE');
		const bucket = map.get(key) ?? [];
		bucket.push(entry);
		map.set(key, bucket);
	}
	return map;
}
