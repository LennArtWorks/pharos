import type { AppDate, DateVariant } from '$lib/config/filesystem';

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
  location?: string;
  link?: string;
  tags?: string[];
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
  location?: string;
  link?: string;
  tags?: string[];
  assignees?: string[];
  targetNodeId?: string;
}

class DatesEngine {
  dates = $state<AppDate[]>([]);
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

  /** Inserts a temporary preview entry — used for create mode live preview. */
  insertPreview(entry: AppDate): void {
    this.dates = [...this.dates, entry];
  }

  /** Removes a preview entry — used on cancel or panel close. */
  removePreview(id: string): void {
    this.dates = this.dates.filter((d) => d.id !== id);
  }

  /**
   * Calls the API, then either replaces the preview entry in-place (if previewId
   * is given) or appends the new record. Replacing avoids a positional jump.
   */
  async createDate(payload: CreateDatePayload, previewId?: string): Promise<string | null> {
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

    const hydrated = { id, ...payload, createdAt: Date.now() } as AppDate;
    if (previewId) {
      this.dates = this.dates.map((d) => (d.id === previewId ? hydrated : d));
    } else {
      this.dates = [...this.dates, hydrated];
    }
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
      const patched: AppDate = { ...d, ...rest };
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

  /** Applies updates to local state only — no API call. Used for live edit preview. */
  previewUpdate(id: string, updates: UpdateDatePayload): void {
    this.dates = this.dates.map((d) => {
      if (d.id !== id) return d;
      const { timestampEnd, ...rest } = updates;
      const patched: AppDate = { ...d, ...rest };
      if (timestampEnd === null) delete patched.timestampEnd;
      else if (timestampEnd !== undefined) patched.timestampEnd = timestampEnd;
      return patched;
    });
  }

  /** Restores a previously saved snapshot — used by cancel in edit mode. */
  revertToSnapshot(id: string, snapshot: AppDate): void {
    this.dates = this.dates.map((d) => (d.id === id ? snapshot : d));
  }

  /** Returns dates sorted chronologically by timestamp. */
  get sorted(): AppDate[] {
    return [...this.dates].sort((a, b) => a.timestamp - b.timestamp);
  }

  /** Returns the subset of dates tied to a specific VNode. */
  forNode(nodeId: string): AppDate[] {
    return this.dates.filter(d => d.targetNodeId === nodeId);
  }
}

export const datesState = new DatesEngine();
