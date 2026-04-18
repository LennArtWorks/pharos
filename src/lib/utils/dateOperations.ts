import type { CreateDatePayload, UpdateDatePayload } from '$lib/state/navigation/dates.svelte';

/**
 * Low-level API wrappers for the /api/dates/* endpoints.
 * These are thin fetch helpers — prefer using datesState directly in components
 * so you get optimistic updates and reactive state for free.
 * Use these helpers only in server-side code or non-reactive contexts.
 */

export async function apiCreateDate(payload: CreateDatePayload): Promise<{ id: string }> {
  const res = await fetch('/api/dates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create date');
  }
  return res.json();
}

export async function apiDeleteDate(id: string): Promise<void> {
  const res = await fetch('/api/dates/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete date');
  }
}

export async function apiUpdateDate(id: string, updates: UpdateDatePayload): Promise<void> {
  const res = await fetch('/api/dates/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to update date');
  }
}
