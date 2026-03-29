import { FILE_TYPE_CONFIG } from '$lib/config/filesystem';

export async function apiCreateNode(type: string, parentId: string | null = null) {
  // Pull the default name directly from your config (e.g., "New Document", "New Folder")
  const typeConfig = FILE_TYPE_CONFIG.internal[type as keyof typeof FILE_TYPE_CONFIG.internal];
  const defaultName = typeConfig?.defaultContent?.name || `New ${type}`;

  const res = await fetch('/api/filesystem/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, parentId, name: defaultName })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create file');
  }

  return await res.json(); // Returns { success: true, id: 'fsr_...' }
}

export async function apiRenameNode(id: string, newName: string) {
  const res = await fetch('/api/filesystem/rename', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, newName })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to rename file');
  }

  return await res.json();
}

export async function apiDeleteNode(id: string) {
  const res = await fetch('/api/filesystem/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to delete file');
  }

  return await res.json();
}

export async function apiSortNode(draggedId: string, targetId: string, action: 'before' | 'after' | 'inside') {
  const res = await fetch('/api/filesystem/sort', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ draggedId, targetId, action })
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to sort file');
  }

  return await res.json();
}