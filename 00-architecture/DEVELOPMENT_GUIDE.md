# PHAROS - Development Guide

## Svelte 5 Runes (MANDATORY)

PHAROS uses Svelte 5 with **strict rune mode**. Every reactive variable must use a rune:

### $state - Reactive Variables
```svelte
<script>
  let count = $state(0);
  let items = $state([]);
  let user = $state({ name: '', email: '' });
</script>

<button onclick={() => count++}>Increment: {count}</button>
```

### $derived - Computed Values
```svelte
<script>
  let items = $state([1, 2, 3, 4, 5]);
  let doubled = $derived(items.map(x => x * 2));
</script>

{doubled} <!-- Reactive: updates when items changes -->
```

### $effect - Side Effects
```svelte
<script>
  let count = $state(0);
  
  $effect(() => {
    console.log('Count changed to:', count);
    localStorage.setItem('count', count);
  });
</script>
```

### $props - Component Props (Typed)
```svelte
<script>
  interface Props {
    name: string;
    count?: number;
  }
  
  let { name, count = 0 }: Props = $props();
</script>

<p>{name}: {count}</p>
```

**Rule:** No `ref` bindings, no `onMount` for initialization. Use `$effect` instead.

---

## Component Architecture

### 1. Button.svelte (Base Interactive Primitive)

**Critical Rule:** Never put a `<button>` inside an `<a>` tag (illegal HTML nesting).

```svelte
<script>
  type ButtonTag = 'button' | 'a' | 'div';
  
  interface Props {
    tagName?: ButtonTag;
    href?: string;
    onclick?: () => void;
    disabled?: boolean;
    variant?: 'primary' | 'secondary' | 'danger';
  }
  
  let { 
    tagName = 'button',
    href,
    onclick,
    disabled = false,
    variant = 'primary'
  }: Props = $props();
</script>

{#if tagName === 'a'}
  <a {href} class="btn btn-{variant}">
    <slot />
  </a>
{:else if tagName === 'button'}
  <button {disabled} {onclick} class="btn btn-{variant}">
    <slot />
  </button>
{:else}
  <div role="button" {onclick} class="btn btn-{variant}">
    <slot />
  </div>
{/if}
```

**Usage:**
```svelte
<!-- Navigate with 'a' tag -->
<Button tagName="a" href="/workspace/123">Open</Button>

<!-- Action with 'button' tag -->
<Button tagName="button" onclick={() => doThing()}>Action</Button>

<!-- Non-interactive with 'div' (rare) -->
<Button tagName="div">Display Only</Button>
```

### 2. NodeItem.svelte (File/Folder Display)

Represents a single file or folder in the file tree.

```svelte
<script>
  interface FileNode {
    id: string;
    name: string;
    extension: string;
    parentId: string | null;
    icon: string;
    permissions: string[];
  }
  
  let { node, onRename, onDelete }: Props = $props();
  let isRenaming = $state(false);
  let editName = $state(node.name);
  
  // Strip extensions from UI (re-attach before API calls)
  function getDisplayName(name: string, ext: string): string {
    if (['.jpg', '.pdf', '.png'].includes(ext)) {
      return name; // Already without extension
    }
    return name;
  }
  
  function handleRename() {
    if (editName.trim()) {
      // RE-ATTACH extension before sending to API
      const fullName = editName + node.extension;
      onRename(node.id, fullName);
      isRenaming = false;
    }
  }
</script>

<div class="node-item">
  <Icon name={node.icon} />
  
  {#if isRenaming}
    <input 
      type="text" 
      bind:value={editName}
      onblur={handleRename}
    />
  {:else}
    <span onclick={() => { isRenaming = true; }}>
      {getDisplayName(node.name, node.extension)}
    </span>
  {/if}
  
  {#if has(PERMISSIONS.EDIT)}
    <Button tagName="button" onclick={() => onDelete(node.id)}>Delete</Button>
  {/if}
</div>
```

### 3. TreeNodeItem.svelte (Recursive Tree)

Handles nested folder structures and drag-and-drop.

```svelte
<script>
  interface Props {
    node: FileNode;
    children: FileNode[];
    level: number;
    draggable?: boolean;
  }
  
  let { node, children, level = 0, draggable = true }: Props = $props();
  let isExpanded = $state(true);
  
  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }
  
  function handleDrop(e: DragEvent) {
    const fileId = e.dataTransfer.getData('application/json');
    moveFile(fileId, node.id);
  }
</script>

<div class="tree-node" style:padding-left="{level * 16}px">
  <NodeItem {node} />
  
  {#if children.length > 0}
    <button onclick={() => { isExpanded = !isExpanded; }}>
      {isExpanded ? '▼' : '▶'}
    </button>
  {/if}
  
  {#if isExpanded && children.length > 0}
    <div ondragover={handleDragOver} ondrop={handleDrop} class="drop-zone">
      {#each children as child (child.id)}
        <TreeNodeItem 
          node={child} 
          children={getChildren(child.id)}
          level={level + 1}
        />
      {/each}
    </div>
  {/if}
</div>
```

### 4. Icon.svelte (Figma-Mapped Icons)

```svelte
<script>
  interface Props {
    name: string;
    size?: number;
    color?: string;
  }
  
  let { name, size = 24, color = 'currentColor' }: Props = $props();
  
  // Map icon name to Tabler Icons (or custom SVG)
  const iconMap = {
    'folder': TablerIconFolder,
    'document': TablerIconFile,
    'kanban': TablerIconLayoutKanban,
    'table': TablerIconTable,
    // ... etc
  };
</script>

{#key name}
  <svelte:component 
    this={iconMap[name]} 
    width={size} 
    height={size} 
    {color}
  />
{/key}
```

---

## Permission System

### Using the `has()` Utility

```svelte
<script>
  import { has, PERMISSIONS } from '$lib/utils/permissions';
  
  let canEdit = has(PERMISSIONS.FILE_EDIT);
  let canDelete = has(PERMISSIONS.FILE_DELETE);
</script>

{#if canEdit}
  <Button onclick={() => editFile()}>Edit</Button>
{/if}

{#if canDelete}
  <Button onclick={() => deleteFile()}>Delete</Button>
{/if}
```

### Permission Flags
```javascript
export const PERMISSIONS = {
  // System
  SYSTEM_MANAGE_USERS: 'system.manage_users',
  SYSTEM_MANAGE_ROLES: 'system.manage_roles',
  SYSTEM_VIEW_SYSFOLDERS: 'system.view_sysfolders',
  SYSTEM_SETTINGS_WRITE: 'system.settings_write',
  
  // Workspace
  WORKSPACE_CREATE: 'workspace.create',
  WORKSPACE_EDIT: 'workspace.edit',
  WORKSPACE_DELETE: 'workspace.delete',
  WORKSPACE_MANAGE_ACCESS: 'workspace.manage_access',
  
  // Files
  FILE_READ: 'files.read',
  FILE_CREATE: 'files.create',
  FILE_EDIT: 'files.edit',
  FILE_DELETE: 'files.delete',
  FILE_MOVE: 'files.move',
  FILE_PUBLISH: 'files.publish',
  
  // Interaction
  INTERACT_SUBMIT_FORMS: 'interaction.submit_forms',
  INTERACT_BOOK_SHIFTS: 'interaction.book_shifts',
  INTERACT_CHECKOUT: 'interaction.checkout'
};
```

---

## File Type Handlers

Each file type needs a dedicated view component:

### DocumentView.svelte (for .fsrdoc)
```svelte
<script>
  import { Tiptap } from '@tiptap/core';
  
  interface Props {
    fileId: string;
    ydoc: Y.Doc;
    readOnly?: boolean;
  }
  
  let { fileId, ydoc, readOnly = false }: Props = $props();
  
  // Bind Tiptap to Y.XmlFragment
  let editor = $state(null);
  
  $effect(() => {
    editor = new Tiptap({
      element: editorElement,
      extensions: [...],
      content: ydoc.getXmlFragment('content'),
      editable: !readOnly
    });
  });
</script>

<div bind:this={editorElement}></div>
```

### TasksView.svelte (for .fsrtasks)
```svelte
<!-- Kanban board using Y.Map for columns -->
<script>
  interface Column {
    id: string;
    name: string;
    tasks: Task[]; // Y.Array
  }
  
  let columns = $state<Column[]>([]);
  
  function handleDodDrop(task: Task, targetColumnId: string) {
    const yarray = ymap.get(targetColumnId);
    yarray.push([task]);
  }
</script>

<div class="kanban">
  {#each columns as column (column.id)}
    <div class="column" ondrop={(e) => handleDropDrop(e, column.id)}>
      <h3>{column.name}</h3>
      {#each column.tasks as task (task.id)}
        <div class="card" draggable={true}>
          {task.name}
        </div>
      {/each}
    </div>
  {/each}
</div>
```

---

## State Management Pattern

### Centralized State (src/lib/state/app.svelte.ts)

```typescript
// Singleton pattern for app state
let appState = $state(null);

export function initializeAppState() {
  if (!appState) {
    appState = {
      currentFileId: null,
      fileTree: [],
      currentUser: null,
      isOffline: false,
      lastSync: null
    };
  }
  return appState;
}

export function useAppState() {
  if (!appState) throw new Error('App state not initialized');
  return appState;
}
```

**Usage in components:**
```svelte
<script>
  import { useAppState } from '$lib/state/app.svelte.ts';
  
  let app = $state(useAppState());
  
  $effect(() => {
    console.log('Current file:', app.currentFileId);
  });
</script>
```

---

## API Integration Pattern

### Server Actions (SvelteKit)

Always use server actions for security-sensitive operations:

```typescript
// src/routes/api/files/+server.ts

export const POST: RequestHandler = async ({ request, locals }) => {
  const { action, fileId, fileName } = await request.json();
  
  // 1. Verify permissions
  if (!has(PERMISSIONS.FILE_CREATE)) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }
  
  // 2. Validate input
  if (!fileName.trim()) {
    return json({ error: 'Invalid file name' }, { status: 400 });
  }
  
  // 3. Call WebDAV API
  const result = await webdavClient.createFile(fileId, fileName);
  
  // 4. Update meta.fsrsys
  await updateMetaIndex(fileId, {
    name: fileName,
    parentId: parentId,
    extension: getExtension(fileName)
  });
  
  return json({ success: true, fileId: result.id });
};
```

**Calling from component:**
```svelte
<script>
  async function createFile() {
    const response = await fetch('/api/files', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'create', fileName: 'New Doc' })
    });
    const data = await response.json();
    if (data.error) {
      showError(data.error);
    } else {
      refreshFileTree();
    }
  }
</script>
```

---

## Tailwind CSS Naming Convention

**Semantic Ink Levels:**
```
ink-30   → Very light (backgrounds)
ink-50   → Light
ink-100  → Light-medium
ink-200  → Medium-light
ink-300  → Medium
ink-400  → Medium-dark
ink-500  → Neutral
ink-600  → Dark-medium
ink-700  → Dark
ink-800  → Very dark
ink-900  → Black
```

**Example:**
```svelte
<div class="bg-ink-30 text-ink-900 border border-ink-200 rounded-md p-4">
  {/* Light background with dark text */}
</div>
```

---

## Testing Guidelines

### Unit Tests (Vitest)
```typescript
import { describe, it, expect } from 'vitest';
import { getDisplayName } from './utils';

describe('getDisplayName', () => {
  it('strips extension for images', () => {
    expect(getDisplayName('photo.jpg', '.jpg')).toBe('photo');
  });
  
  it('keeps .fsr extensions', () => {
    expect(getDisplayName('doc', '.fsrdoc')).toBe('doc.fsrdoc');
  });
});
```

### Component Tests (Svelte Testing Library)
```typescript
import { render, fireEvent } from '@testing-library/svelte';
import Button from './Button.svelte';

describe('Button.svelte', () => {
  it('calls onclick when clicked', async () => {
    const fn = vitest.fn();
    const { getByRole } = render(Button, { props: { onclick: fn } });
    await fireEvent.click(getByRole('button'));
    expect(fn).toHaveBeenCalled();
  });
});
```

---

## Common Pitfalls

### ❌ Don't: Use `ref` bindings
```svelte
<!-- BAD -->
<script>
  let element;
  onMount(() => {
    element.focus();
  });
</script>
<input bind:this={element} />
```

### ✅ Do: Use `$effect`
```svelte
<!-- GOOD -->
<script>
  let element = $state(null);
  
  $effect(() => {
    element?.focus?.();
  });
</script>
<input bind:this={element} />
```

---

### ❌ Don't: Nested button logic
```svelte
<!-- BAD -->
<a href="/open">
  <button onclick={handleDelete}>Delete</button>
</a>
```

### ✅ Do: Use tagName prop
```svelte
<!-- GOOD: For navigation -->
<Button tagName="a" href="/open">Open</Button>

<!-- GOOD: For action -->
<Button tagName="button" onclick={handleDelete}>Delete</Button>
```

---

## Debugging Tips

### 1. Browser DevTools
- Check Svelte component state in DevTools
- Inspect WebSocket messages in Network tab
- Use console for logging

### 2. Reactive Statement Debugging
```svelte
<script>
  $effect(() => {
    console.log('fileTree changed:', fileTree);
    console.log('currentFile changed:', currentFileId);
  });
</script>
```

### 3. Server Logs
```bash
tail -f /var/log/pharos/server.log
```

### 4. WebDAV Debugging
```javascript
import { logger } from '$lib/server/logger';

logger.info('WebDAV MOVE', {
  from: oldPath,
  to: newPath,
  status: response.status
});
```

---

## Performance Optimization

### 1. Lazy Load Components
```svelte
<script>
  import { browser } from '$app/environment';
  
  let Component = $state(null);
  
  $effect(async () => {
    if (browser) {
      Component = (await import('./Heavy.svelte')).default;
    }
  });
</script>

{#if Component}
  <svelte:component this={Component} />
{/if}
```

### 2. Virtualize Long Lists
```svelte
<script>
  import { VirtualScroll } from '@sveltejs/toolkit';
  
  let items = $state([]);
</script>

<VirtualScroll {items} let:item>
  <div>{item.name}</div>
</VirtualScroll>
```

### 3. Debounce Input
```svelte
<script>
  import { debounce } from '$lib/utils/debounce';
  
  let searchQuery = $state('');
  let results = $state([]);
  
  const handleSearch = debounce(async (query) => {
    results = await searchFiles(query);
  }, 300);
  
  $effect(() => {
    handleSearch(searchQuery);
  });
</script>

<input bind:value={searchQuery} placeholder="Search..." />
```

---

## Environment Variables

Create `.env.example`:
```
PUBLIC_API_URL=http://localhost:5173
VITE_WEBSOCKET_URL=ws://localhost:5173
DATABASE_URL=file:./aidev.db?mode=wal
SCIEBO_ENDPOINT=https://sciebo.uni-example.de/remote.php/dav
```

Load in hooks.server.ts:
```typescript
import { env } from '$env/dynamic/private';

export const handle = async ({ event, resolve }) => {
  event.locals.db = process.env.DATABASE_URL;
  return resolve(event);
};
```
