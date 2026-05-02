/**
 * BLUEPRINT: dates.appsys
 * Defines the logical structure of the unified app dates index.
 * All dates live here — standalone (floating) or node-attached (targetNodeId set).
 * Mirrors the lean-JSON pattern of meta.appsys — no redundant computed fields stored.
 */
import type { DateVariant } from '$lib/config/filesystem';

export const DATES_SCHEMA_VERSION = '1.0';

export function generateDefaultDatesIndex() {
  return {
    _meta: {
      schemaVersion: DATES_SCHEMA_VERSION,
      lastUpdated: Date.now(),
      description: 'Floating dates index'
    },
    dates: {} as Record<string, any>
  };
}

export interface AppDateInit {
  title: string;
  variant: DateVariant;
  timestamp: number;
  /** Only for variant === 'standard'. Defines the end of a timeframe. */
  timestampEnd?: number;
  /** Defaults to true — opt in to timed entries by setting false. */
  allDay?: boolean;
  description?: string;
  location?: string;
  link?: string;
  tags?: string[];
  assignees?: string[];
  /** Set to attach this date to a VNode (file, task, event, etc.). Absent = floating. */
  targetNodeId?: string;
}

/**
 * Produces the lean record stored under a date's ID key in dates.appsys.
 * `id` is intentionally excluded — it is always the map key, never stored in the value.
 */
export function generateBaseAppDate(init: AppDateInit) {
  const { title, variant, timestamp, timestampEnd, allDay = true, description, location, link, tags, assignees, targetNodeId } = init;

  return {
    title,
    variant,
    timestamp,
    allDay,
    ...(timestampEnd !== undefined && variant === 'standard' ? { timestampEnd } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(location !== undefined ? { location } : {}),
    ...(link !== undefined ? { link } : {}),
    ...(tags && tags.length > 0 ? { tags } : {}),
    ...(assignees && assignees.length > 0 ? { assignees } : {}),
    ...(targetNodeId !== undefined ? { targetNodeId } : {}),
    createdAt: Date.now()
  };
}
