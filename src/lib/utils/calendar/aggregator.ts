/**
 * Calendar Aggregator
 *
 * Merges two date sources into a single normalised CalendarEntry[]:
 *   1. FloatingDates  — standalone entries from dates.appsys
 *   2. VNode dates    — dates embedded in VNode.customFields (meta.appsys)
 *
 * This is a pure utility function: no fetching, no side-effects. Call it
 * with data already loaded by datesState and fsState.
 *
 * ── VNode date storage convention (must be respected by any writer) ──────────
 *
 *   Event VNodes (extension === APP_EXTENSIONS.EVENT):
 *     customFields.eventDate?: number   ← primary event timestamp (Unix ms)
 *     customFields.eventDateEnd?: number ← optional end timestamp
 *     customFields.eventAllDay?: boolean ← defaults true
 *
 *   Any VNode with general attached dates:
 *     customFields.dates?: Record<string, {
 *       title: string; variant: DateVariant;
 *       timestamp: number; timestampEnd?: number; allDay: boolean;
 *       description?: string; assignees?: string[];
 *     }>
 *
 *   The `customFields.dates` shape mirrors the lean record in dates.appsys so
 *   the aggregator can handle both sources with identical logic.
 */

import type { FloatingDate, VNode, DateVariant } from '$lib/config/filesystem';
import { APP_EXTENSIONS } from '$lib/config/globalsettings';

// ─── CalendarEntry ────────────────────────────────────────────────────────────

/**
 * Describes where a CalendarEntry originated.
 *   floating → came from dates.appsys
 *   node     → derived from a VNode in meta.appsys
 */
export type CalendarEntrySource =
  | { type: 'floating' }
  | { type: 'node'; nodeId: string; nodeName: string; nodeExtension: string };

/**
 * The unified, normalised calendar entry consumed by all calendar views.
 * Never stored on disk — always computed on the fly by aggregateCalendarEntries().
 */
export interface CalendarEntry {
  /**
   * Globally unique identifier.
   *   Floating date  → FloatingDate.id
   *   Event VNode    → `${nodeId}::eventDate`
   *   Attached date  → `${nodeId}::${dateKey}`
   */
  calendarId: string;

  title: string;

  /**
   * Always a DateVariant — events are just folders with a date attached,
   * not a separate variant. To detect Event VNodes specifically, check
   * `source.type === 'node' && source.nodeExtension === APP_EXTENSIONS.EVENT`.
   */
  variant: DateVariant;

  // ── Time ──
  timestamp: number;       // start (Unix ms)
  timestampEnd?: number;   // end (Unix ms) — only set for timeframes
  allDay: boolean;

  // ── Content ──
  description?: string;
  assignees?: string[];

  source: CalendarEntrySource;
}

// ─── Aggregator ───────────────────────────────────────────────────────────────

/**
 * Builds a CalendarEntry[] from both data sources.
 *
 * @param nodeMap  The flat VNode map from fsState.nodeMap (id → VNode).
 * @param dates    The hydrated FloatingDate[] from datesState.dates.
 * @returns        Unsorted array of all calendar entries. Sort as needed in the UI.
 */
export function aggregateCalendarEntries(
  nodeMap: Map<string, VNode>,
  dates: FloatingDate[]
): CalendarEntry[] {
  const entries: CalendarEntry[] = [];

  // ── Source 1: Floating dates ──────────────────────────────────────────────
  // Direct 1-to-1 mapping — FloatingDate is already normalised.
  for (const date of dates) {
    entries.push({
      calendarId: date.id,
      title: date.title,
      variant: date.variant,
      timestamp: date.timestamp,
      timestampEnd: date.timestampEnd,
      allDay: date.allDay,
      description: date.description,
      assignees: date.assignees,
      source: { type: 'floating' }
    });
  }

  // ── Source 2: VNode-embedded dates ────────────────────────────────────────
  for (const [nodeId, node] of nodeMap) {
    const cf = node.customFields;
    if (!cf) continue;

    const nodeSource: CalendarEntrySource = {
      type: 'node',
      nodeId,
      nodeName: node.name,
      nodeExtension: node.extension
    };

    // 2a. Event VNodes — primary date stored at customFields.eventDate.
    // Events are standard folders with a date; we use whatever variant is stored
    // (defaulting to 'standard'). The UI can detect event nodes via source.nodeExtension.
    if (node.extension === APP_EXTENSIONS.EVENT && cf.eventDate != null) {
      entries.push({
        calendarId: `${nodeId}::eventDate`,
        title: node.name,
        variant: (cf.eventVariant as DateVariant) ?? 'standard',
        timestamp: cf.eventDate as number,
        timestampEnd: cf.eventDateEnd as number | undefined,
        allDay: cf.eventAllDay !== false, // default true
        description: cf.description as string | undefined,
        assignees: cf.attendees as string[] | undefined,
        source: nodeSource
      });
    }

    // 2b. General attached dates — stored at customFields.dates record
    if (cf.dates && typeof cf.dates === 'object') {
      for (const [dateKey, record] of Object.entries(cf.dates as Record<string, any>)) {
        if (!record || typeof record.timestamp !== 'number') continue;

        entries.push({
          calendarId: `${nodeId}::${dateKey}`,
          title: record.title ?? node.name,
          variant: record.variant ?? 'standard',
          timestamp: record.timestamp,
          timestampEnd: record.timestampEnd,
          allDay: record.allDay !== false, // default true
          description: record.description,
          assignees: record.assignees,
          source: nodeSource
        });
      }
    }
  }

  return entries;
}

// ─── Sorting helpers ──────────────────────────────────────────────────────────

/** Sorts CalendarEntry[] chronologically by start timestamp. */
export function sortByTimestamp(entries: CalendarEntry[]): CalendarEntry[] {
  return [...entries].sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Groups CalendarEntry[] by calendar date string (YYYY-MM-DD in local time).
 * Useful for the Table / Grid view in Phase 3.
 */
export function groupByDay(entries: CalendarEntry[]): Map<string, CalendarEntry[]> {
  const map = new Map<string, CalendarEntry[]>();
  for (const entry of entries) {
    const key = new Date(entry.timestamp).toLocaleDateString('sv-SE'); // ISO date, locale-independent
    const bucket = map.get(key) ?? [];
    bucket.push(entry);
    map.set(key, bucket);
  }
  return map;
}
