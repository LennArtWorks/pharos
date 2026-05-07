# PHAROS — Quick Start Guide

Welcome. This is the entry point for understanding PHAROS. Read this first, then follow the links to deeper docs.

---

## What Is PHAROS?

PHAROS is a real-time, GDPR-compliant cloud operating system for organizations (university FSRs, student councils, event-driven teams). It works like Notion, but the organization owns all its data — stored on their own Sciebo/Nextcloud, never on PHAROS servers.

**North Star Principles:**
1. **Bring Your Own Storage (BYOS)** — We are the "engine," the university is the "vault."
2. **Real-time or Nothing** — Every interaction must feel instant and simultaneous.
3. **Institutional Privacy** — Built for the German GDPR landscape. Data stays in NRW.
4. **Zero Configuration** — Connect Sciebo → functional workspace in under 60 seconds.

---

## Current State (May 2026)

The app is a working MVP. Core infrastructure and the main feature set are done.

**Done:** File tree (drag-drop, CRUD, rename, move), Documents (Tiptap + Yjs real-time), Calendar (Month/Week/Day views, dates, assign), Permissions system, Settings panel, Members, WebDAV sync, Login/logout.

**In progress:** ContentTypeEvent, SidebarProfile popover.

**Not started:** ContentTypeTasks (Kanban), Calendar Agenda view, Global search, GDPR data export/deletion APIs, Docker deployment.

→ See [project/STATUS.md](./project/STATUS.md) for the full breakdown.

---

## Project Path & Dev Setup

```
Project root: /path/to/02-Pharos/pharos/
```

```bash
cd pharos
npm install
npm run dev         # Dev server at http://localhost:5173
npm run check       # TypeScript check
npm run format      # Prettier
```

---

## Reading Path

| If you want to... | Read |
|---|---|
| Understand the system architecture | [architecture/SYSTEM.md](./architecture/SYSTEM.md) |
| Understand the tech stack | [architecture/TECH_STACK.md](./architecture/TECH_STACK.md) |
| Know where files live in `src/` | [architecture/FILE_STRUCTURE.md](./architecture/FILE_STRUCTURE.md) |
| Understand cloud-side JSON schemas | [architecture/CLOUD_SCHEMAS.md](./architecture/CLOUD_SCHEMAS.md) |
| Understand scalability & multi-tenancy | [architecture/SCALABILITY.md](./architecture/SCALABILITY.md) |
| Write code in this project | [guides/DEVELOPMENT_GUIDE.md](./guides/DEVELOPMENT_GUIDE.md) |
| Understand motion/animation rules | [guides/ANIMATION_GUIDELINES.md](./guides/ANIMATION_GUIDELINES.md) |
| Know what's done / what's next | [project/STATUS.md](./project/STATUS.md) |
| See the feature backlog | [project/BACKLOG.md](./project/BACKLOG.md) |
| Understand GDPR compliance posture | [architecture/GDPR_COMPLIANCE.md](./architecture/GDPR_COMPLIANCE.md) |

---

## Key Architecture Concepts (internalize these)

### BYOS — Data lives on the org's cloud
All organizational data is stored on **their Sciebo/Nextcloud** (university servers in NRW). PHAROS is the processing engine — it loads data into RAM, serves it in real-time, and syncs it back. On server restart, all in-memory state is reloaded from WebDAV.

### ID-Only File Naming
Files on WebDAV are named by internal ID only: `{id}.{extension}` (e.g., `abc123def456.appdoc`).
Human-readable names live in `meta.appsys` — the file tree index. **Renaming = metadata update only, no WebDAV MOVE needed.**

### File Extensions — `.app*` Prefix
All custom file types use the `app` prefix defined in `globalsettings.ts`:
- `.appdoc` — rich-text documents (Tiptap + Yjs)
- `.apptasks` — Kanban boards
- `.appevt` — event metadata
- `.appsys` — system/index files (meta, dates, roles)
- `.appsecure` — encrypted modifier (appended after base ext)

Change `FILE_EXT_PREFIX` in `globalsettings.ts` and all extensions update automatically.

### Real-Time Collaboration (Yjs)
Documents use **Yjs CRDTs** (Conflict-free Replicated Data Types). Multiple users can edit simultaneously — all changes merge automatically with zero data loss. Broadcast via Hocuspocus WebSocket < 100ms.

Calendar dates use a simpler REST API pattern (not Yjs) — they are atomic entities, not collaborative text.

### Session Singleton
The current user is available globally via `session` from `$lib/state/session.svelte`:
```ts
import { session } from '$lib/state/session.svelte';
// session.user — typed as App.Locals['user'] (id, role, name, color, overrides)
// session.orgRoles — Record<string, string[]> (role name → permission flags)
```
Set once in `(organisation)/+layout.svelte` from `page.data`. Never prop-drill user state.

### Permission System
Check permissions with `has()` from `$lib/utils/config/permissions`:
```ts
import { has } from '$lib/utils/config/permissions';
import { PERMISSIONS } from '$lib/config/permissions';

// In Svelte template:
{#if has(PERMISSIONS.FILES.EDIT)}...{/if}

// In server handlers:
if (!has(PERMISSIONS.FILES.EDIT)) return json({ error: 'Forbidden' }, { status: 403 });
```
`has()` reads from `session` — reactive, hierarchical wildcard matching (`files.*` covers `files.edit`, `files.read`, etc.).

### Multi-Tenancy
Each organization has a unique subdomain (`org.pharos.de`). Tenants are fully isolated: separate WebDAV roots, separate RAM cache, SQLite rows filtered by `tenant_id`. Adding a new org = adding credentials to SQLite — no code changes needed.

---

## Critical Rules (Non-Negotiable)

### 1. Svelte 5 Runes
```svelte
✓ let count = $state(0);          // reactive
✗ let count = 0;                  // NOT reactive

✓ let doubled = $derived(count * 2);
✗ let doubled = count * 2;        // NOT reactive

✓ $effect(() => { ... });         // side effects
✓ onMount(() => { ... });         // also valid for post-render initialization
```

### 2. Button Nesting (invalid HTML)
```svelte
✗ <a href="/open"><button>Click</button></a>   // illegal nesting
✓ <Button tagName="a" href="/open">Open</Button>
✓ <Button tagName="button" onclick={fn}>Action</Button>
```

### 3. Permission Checks (both frontend AND backend)
```
Frontend UX:   {#if has(PERMISSIONS.FILES.EDIT)}...{/if}
Backend guard: if (!has(PERMISSIONS.FILES.EDIT)) return 403;
```
Never show UI for an action without backend validation. Users can bypass frontend checks with direct API calls.

### 4. File Extensions
```
Display name (UI):  "Meeting Notes"      (no extension shown)
API / WebDAV:       "Meeting Notes.appdoc" or just the node ID
```
Strip extensions in UI; re-attach before any API call that needs the physical filename.

### 5. Session vs page.data
```svelte
✓ import { session } from '$lib/state/session.svelte';
  // session.user — anywhere in the component tree
✗ page.data.user  — only in top-level route layouts
```

---

## What to Work on Next

See [project/BACKLOG.md](./project/BACKLOG.md). Highest-value items for current phase:
1. **ContentTypeTasks** — `.apptasks` Kanban board (Yjs-backed, drag-drop columns)
2. **Calendar Agenda view** — flat chronological list, self-contained
3. **SidebarProfile popover** — Settings + Logout actions (avatar button currently dead)
4. **DateCreateModal assignees** — add AssigneeSelector to the create form (edit panel already has it)

---

## Quick Reference

| Question | Where to look |
|---|---|
| How to check permissions? | [guides/DEVELOPMENT_GUIDE.md](./guides/DEVELOPMENT_GUIDE.md) → Permission System |
| How does WebDAV sync work? | [architecture/SYSTEM.md](./architecture/SYSTEM.md) → Real-Time Flow |
| What is `meta.appsys`? | [architecture/CLOUD_SCHEMAS.md](./architecture/CLOUD_SCHEMAS.md) |
| What permissions exist? | `src/lib/config/permissions.ts` |
| What file extensions exist? | `src/lib/config/globalsettings.ts` → `APP_EXTENSIONS` |
| What's the cloud folder structure? | [architecture/CLOUD_SCHEMAS.md](./architecture/CLOUD_SCHEMAS.md) |
| How to add a new file type? | [guides/DEVELOPMENT_GUIDE.md](./guides/DEVELOPMENT_GUIDE.md) → File Type Handlers |
| How does the overlay/modal system work? | [guides/DEVELOPMENT_GUIDE.md](./guides/DEVELOPMENT_GUIDE.md) → Overlay System |
| What's done vs planned? | [project/STATUS.md](./project/STATUS.md) |
| Can we add Google Drive? | [architecture/SCALABILITY.md](./architecture/SCALABILITY.md) |
