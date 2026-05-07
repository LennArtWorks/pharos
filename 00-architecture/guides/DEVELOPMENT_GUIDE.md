# PHAROS — Development Guide

How to write code in this project. Read this before touching any component.

---

## Svelte 5 Runes (Required)

PHAROS uses Svelte 5 strict rune mode. Every reactive value must use a rune.

```svelte
<script lang="ts">
  // State — mutable, reactive
  let count = $state(0);
  let items = $state<string[]>([]);

  // Derived — computed from state, read-only
  let doubled = $derived(count * 2);
  let hasItems = $derived(items.length > 0);

  // Complex derived
  let sorted = $derived.by(() => {
    return [...items].sort();
  });

  // Props
  let { name, count = 0 }: { name: string; count?: number } = $props();

  // Side effects
  $effect(() => {
    console.log('count changed:', count);
    // return cleanup fn if needed
    return () => cleanup();
  });
</script>
```

**When to use `onMount` vs `$effect`:**
- `$effect` — for reactive side effects that should re-run when dependencies change
- `onMount` — for one-time initialization after first render (e.g., permission guards, focus, external library init)
Both are valid. `onMount` does NOT re-run on state changes — use it intentionally.

---

## Component Patterns

### Button — Primary Interactive Primitive

Never put `<button>` inside `<a>` (illegal HTML). Use `Button.svelte`:

```svelte
<!-- Navigation -->
<Button tagName="a" href="/path">Open</Button>

<!-- Action -->
<Button variant="primary" onclick={handleSave}>Save</Button>
<Button variant="secondary" onclick={closeOverlay}>Cancel</Button>
<Button variant="tertiary" onclick={handleDelete}>Delete</Button>

<!-- With icon -->
<Button variant="primary" icon="add" onclick={create}>Add Item</Button>

<!-- Loading state -->
<Button variant="primary" {loading} onclick={submit}>Submit</Button>

<!-- Disabled -->
<Button variant="primary" disabled={!hasChanges} onclick={save}>Save</Button>
```

### Icon.svelte

```svelte
<Icon name="calendar" />
<Icon name="folder" size="s" />
```

Icon names map to the internal icon system (Tabler + custom). Browse available icons in Dev Portal → Design System → Icons.

### Input.svelte

```svelte
<Input label="Title" required bind:value={title} placeholder="Add a title..." />
<Input label="Date" type="date" bind:value={dateStr} />
```

---

## Permission System

### Frontend (UX gating)

```svelte
<script>
  import { has } from '$lib/utils/config/permissions';
  import { PERMISSIONS } from '$lib/config/permissions';
</script>

{#if has(PERMISSIONS.FILES.EDIT)}
  <Button onclick={edit}>Edit</Button>
{/if}

{#if has(PERMISSIONS.SYSTEM.SETTINGS.VIEW)}
  <a href="?overlay=settings-org">Settings</a>
{/if}
```

`has()` is reactive — reads from `session.user` and `session.orgRoles`. Automatically updates when session changes.

### Backend (Security enforcement)

In API routes, use the pure `hasPermission()` function:

```ts
// src/routes/api/filesystem/rename/+server.ts
import { hasPermission } from '$lib/utils/config/permissions';

export const POST: RequestHandler = async ({ request, locals }) => {
  const user = locals.user;
  if (!user || !hasPermission(user.role, PERMISSIONS.FILES.EDIT, locals.activeRoles, user.overrides)) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }
  // ... proceed
};
```

**Never skip the backend check.** Users can bypass frontend guards with direct API calls.

### Permission Flags

All flags are in `src/lib/config/permissions.ts`. Use the `PERMISSIONS` object — never hardcode strings.

```ts
// Examples
PERMISSIONS.GLOBAL_ADMIN        // '*' — grants everything
PERMISSIONS.FILES.ALL           // 'files.*'
PERMISSIONS.FILES.READ          // 'files.read'
PERMISSIONS.FILES.EDIT          // 'files.edit'
PERMISSIONS.WORKSPACE.CREATE    // 'workspace.create'
PERMISSIONS.SYSTEM.SETTINGS.VIEW
PERMISSIONS.SYSTEM.MANAGE_USERS
```

---

## Session & User State

The current user is available anywhere via the `session` singleton. **Never prop-drill user state.**

```svelte
<script>
  import { session } from '$lib/state/session.svelte';

  // session.user — typed as App.Locals['user']
  // Fields: id, role, name?, color?, overrides?

  // session.orgRoles — Record<string, string[]>
  // Role name → array of permission flags

  // Usage examples:
  const isAssignedToMe = (session.user?.id && entry.assignees?.includes(session.user.id)) ?? false;

  function handleSelfAssign() {
    if (!session.user) return;
    const userId = session.user.id;
    // ...
  }
</script>
```

`session` is set in `(organisation)/+layout.svelte` from `page.data`. It's already reactive — any component that reads `session.user` will re-render when it changes.

---

## Overlay System

Overlays (modals, panels) are driven by a URL search param (`?overlay=...`). Opening an overlay = navigating to that URL.

```svelte
<!-- Open an overlay -->
<Button tagName="a" href="?overlay=settings-org">Settings</Button>

<!-- Or programmatically -->
import { goto } from '$app/navigation';
goto('?overlay=date-create');
```

`OverlayRoot.svelte` reads the URL param and renders the matching overlay component. All overlay components receive a `closeOverlay` prop — they call it to navigate away.

---

## File Type Handlers

To add support for a new file extension, register it in `FILE_TYPE_CONFIG` in `src/lib/config/filesystem.ts`, then create the component.

```ts
// src/lib/config/filesystem.ts
export const FILE_TYPE_CONFIG = {
  internal: {
    myNewType: {
      active: true,
      type: "file",
      icon: 'custom-icon',
      ext: [APP_EXTENSIONS.MY_EXT],       // e.g. '.apptasks'
      component: "ContentTypeMyNew",       // component name in registry
      websocket: true,                     // true = Yjs/Hocuspocus; false = no real-time
      defaultContent: { name: "New File" }
    }
  }
}
```

Register the component in `ContentRoot.svelte`:
```ts
const componentRegistry: Record<string, AppComponent> = {
  ContentTypeFolder,
  ContentTypeDocument,
  ContentTypeMyNew,  // ← add here
  // ...
};
```

Then create `src/lib/components/layout/content/filetypes/ContentTypeMyNew.svelte`:
```svelte
<script lang="ts">
  import type { VNode } from '$lib/config/filesystem';
  let { node }: { node: VNode } = $props();
</script>

<div>
  <!-- Render content for {node.id} -->
</div>
```

For Yjs-backed types, see `ContentTypeDocument.svelte` as the reference pattern.

---

## Calendar State

### Dates CRUD

```ts
import { datesState } from '$lib/state/navigation/dates.svelte';

// Create
await datesState.createDate({ title, variant, timestamp, allDay });

// Update
await datesState.updateDate(dateId, { title: 'New title' });

// Delete
await datesState.deleteDate(dateId);

// Optimistic preview (during drag/resize)
datesState.previewUpdate(id, { timestamp: newTs });
// Commit
datesState.updateDate(id, { timestamp: newTs, timestampEnd: newEndTs });
```

### Date Panel (sidebar detail)

```ts
import { openDatePanelView, openDatePanelCreate } from '$lib/state/layout/datePanel.svelte';

// Open in view mode (click existing entry)
openDatePanelView(event, dateId);

// Open in create mode (click empty slot)
openDatePanelCreate(event, { timestamp: ts, timestampEnd: ts + 3600000 });
```

### Calendar Aggregator

```ts
import { aggregateCalendarEntries } from '$lib/utils/calendar/aggregator';

const entries: CalendarEntry[] = aggregateCalendarEntries(allDates, fileTree);
// CalendarEntry merges AppDate + optional attached VNode info (name, assignees)
```

---

## API Integration Pattern

```ts
// API route: validate → operate → respond
export const POST: RequestHandler = async ({ request, locals }) => {
  // 1. Auth check
  if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

  // 2. Permission check
  if (!hasPermission(locals.user.role, PERMISSIONS.FILES.EDIT, locals.activeRoles, locals.user.overrides)) {
    return json({ error: 'Forbidden' }, { status: 403 });
  }

  // 3. Validate input
  const body = await request.json();
  if (!body.nodeId) return json({ error: 'Missing nodeId' }, { status: 400 });

  // 4. Operate
  const result = await doOperation(locals.orgConfig, body.nodeId);

  // 5. Respond
  return json({ success: true, data: result });
};
```

Calling from a component:
```ts
const response = await fetch('/api/filesystem/rename', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ nodeId, name: newName })
});
const data = await response.json();
if (!data.success) {
  // show error
}
```

---

## State Management Pattern

| State type | Where | Example |
|-----------|-------|---------|
| Current user | `$lib/state/session.svelte` | `session.user` |
| Feature-specific state | `$lib/state/*/feature.svelte.ts` | `datesState`, `membersState` |
| UI-specific state (local) | Local `$state` in component | `let isOpen = $state(false)` |
| Layout/overlay state | `$lib/state/layout/*.svelte.ts` | `banners`, `overlayStack`, `datePanel` |

Avoid deeply nested prop passing. If a value is needed > 2 levels deep, put it in a state module.

---

## Tailwind CSS Conventions

### Semantic Ink Scale

```
ink-10  → Near white (backgrounds on dark themes)
ink-30  → Very light
ink-50  → Light (placeholder text, dimmed icons)
ink-70  → Medium-light (labels, secondary text)
ink-90  → Default text
ink-100 → Borders, subtle dividers
ink-200 → Stronger borders
```

### Semantic Level Scale

```
level-0  → Background (app bg)
level-1  → Cards, panels
level-2  → Inputs, nested elements
level-3  → Popovers, overlays
```

### Design Token Usage

```svelte
<div class="bg-level-1 text-ink-90 ring-1 ring-border rounded-m px-m">
  <span class="text-ink-50 font-label-s">Label</span>
</div>
```

Use semantic tokens (`bg-level-1`, `text-ink-90`, `ring-border`) over raw colors. This ensures light/dark mode compatibility.

---

## Common Pitfalls

### Forgetting to strip extensions in UI
```
✗ Display: "document.appdoc"
✓ Display: "document"
✓ API:     node.physicalName (has extension + id)
```

### Calling page.data.user in components
```svelte
✗ page.data.user.id      // only valid in route layouts
✓ session.user?.id       // valid everywhere
```

### Using $effect for one-time guards
```svelte
// $effect fires immediately — orgRoles may not be synced yet
✗ $effect(() => { if (!has(PERMISSION)) closeOverlay(); });

// onMount fires after layout effects — orgRoles is ready
✓ onMount(() => { if (!has(PERMISSION)) closeOverlay(); });
```

### Nesting interactive elements
```svelte
✗ <a href="..."><button>...</button></a>   // invalid HTML
✓ <Button tagName="a" href="...">...</Button>
```

### Hardcoding permission strings
```ts
✗ has('files.edit')
✓ has(PERMISSIONS.FILES.EDIT)
```
