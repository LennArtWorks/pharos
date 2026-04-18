import type { FloatingDate, DateVariant } from '$lib/config/filesystem';

// Payload shapes used by the API helpers and this engine
export interface CreateDatePayload {
  title: string;
  variant: DateVariant;
  /** Start timestamp (Unix ms). */
  timestamp: number;
  /** End timestamp (Unix ms). Only for variant === 'standard'. */
  timestampEnd?: number;
  /** Defaults to true. Set false for a timed entry. */
  allDay?: boolean;
  description?: string;
  /** Array of user IDs to assign. */
  assignees?: string[];
  targetNodeId?: string;
}

export interface UpdateDatePayload {
  title?: string;
  variant?: DateVariant;
  timestamp?: number;
  /** Pass null to explicitly clear a previously set end time. */
  timestampEnd?: number | null;
  allDay?: boolean;
  description?: string;
  assignees?: string[];
  targetNodeId?: string;
}

class DatesEngine {
  dates = $state<FloatingDate[]>([]);
  isFetching = $state(false);

  /** True once at least one successful fetch has completed. */
  isLoaded = $state(false);

  async fetchDates() {
    if (this.isLoaded || this.isFetching) return;
    this.isFetching = true;
    try {
      const res = await fetch('/api/dates', { credentials: 'include' });
      if (res.ok) {
        this.dates = await res.json();
        this.isLoaded = true;
      }
    } finally {
      this.isFetching = false;
    }
  }

  /**
   * Optimistically inserts a placeholder, calls the API, then replaces the
   * placeholder with the real ID returned by the server.
   */
  async createDate(payload: CreateDatePayload): Promise<string | null> {
    const res = await fetch('/api/dates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create date');
    }
    const { id } = await res.json();

    // Add the hydrated record to local state without a round-trip
    this.dates = [
      ...this.dates,
      { id, ...payload, createdAt: Date.now() } as FloatingDate
    ];
    return id;
  }

  async deleteDate(id: string): Promise<void> {
    const previousDates = this.dates;
    // Optimistic removal
    this.dates = this.dates.filter(d => d.id !== id);

    const res = await fetch('/api/dates/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id })
    });

    if (!res.ok) {
      this.dates = previousDates; // rollback
      const err = await res.json();
      throw new Error(err.error || 'Failed to delete date');
    }
  }

  async updateDate(id: string, updates: UpdateDatePayload): Promise<void> {
    const previousDates = this.dates;
    // Optimistic update — handle null sentinel for timestampEnd (null means "clear it")
    this.dates = this.dates.map(d => {
      if (d.id !== id) return d;
      const { timestampEnd, ...rest } = updates;
      const patched: FloatingDate = { ...d, ...rest };
      if (timestampEnd === null) delete patched.timestampEnd;
      else if (timestampEnd !== undefined) patched.timestampEnd = timestampEnd;
      return patched;
    });

    const res = await fetch('/api/dates/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id, ...updates })
    });

    if (!res.ok) {
      this.dates = previousDates; // rollback
      const err = await res.json();
      throw new Error(err.error || 'Failed to update date');
    }
  }

  /** Returns dates sorted chronologically by timestamp. */
  get sorted(): FloatingDate[] {
    return [...this.dates].sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Returns the subset of dates tied to a specific VNode. */
  forNode(nodeId: string): FloatingDate[] {
    return this.dates.filter(d => d.targetNodeId === nodeId);
  }
}

export const datesState = new DatesEngine();
