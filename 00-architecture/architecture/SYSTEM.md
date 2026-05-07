# PHAROS — System Architecture

## File System on WebDAV

All organizational data lives on Sciebo/Nextcloud (WebDAV). PHAROS never stores operational data on its own disk.

### ID-Only File Naming

Files on WebDAV are named purely by internal ID: `{id}.{extension}`

Example: `abc123def456.appdoc`

**Why?** Renaming a file only updates `meta.appsys` — no WebDAV MOVE needed. This eliminates rename-related sync conflicts and makes the file tree fast (no WebDAV listings per rename).

### Directory Structure on WebDAV

```
/{org-webdav-root}/
│
├─ .config/
│  ├─ meta.appsys              # File tree index (ID → name, parent, metadata)
│  ├─ dates.appsys             # Calendar dates index (all dates, flat)
│  ├─ roles.appsys             # RBAC: role definitions + permission flags
│  ├─ accounts.appsys.appsecure  # Encrypted: master auth registry
│  └─ accounts.sysfolder/
│     └─ {accountId}.appsys.appsecure  # Encrypted: per-user profile
│
├─ Workspace1.workspace/       # Workspace folder
├─ Workspace2.workspace/
│  ├─ folder1/
│  │  ├─ abc123.appdoc         # Rich-text document
│  │  ├─ def456.apptasks       # Kanban board (planned)
│  │  └─ ghi789.appevt         # Event folder
│  └─ folder2/
│
└─ .trash/                     # Soft-deleted files (restorable)
```

→ See [CLOUD_SCHEMAS.md](./CLOUD_SCHEMAS.md) for the JSON structure of each `.appsys` file.

---

## File Extensions

All custom extensions are derived from `FILE_EXT_PREFIX` in `globalsettings.ts` (currently `'app'`):

| Extension | Purpose |
|-----------|---------|
| `.appdoc` | Rich-text documents (Tiptap + Yjs) |
| `.apptasks` | Kanban boards (Yjs-backed) |
| `.appevt` | Event metadata |
| `.appsys` | System index files (meta, dates, roles, profiles) |
| `.appsecure` | Encrypted modifier — appended after base ext |
| `.workspace` | Workspace directories |
| `.sysfolder` | System-only directories (not shown in file tree) |

Change `FILE_EXT_PREFIX` → all extensions update automatically.

---

## Real-Time Collaboration Flow

```
Browser (User A)
  │
  │ 1. Opens /files/{id}
  ▼
SvelteKit server
  │ Loads meta.appsys → resolves file path → permission check
  ▼
Browser renders ContentTypeDocument
  │
  │ 2. Hocuspocus WebSocket connect (wss://host/ws/{docId})
  ▼
Hocuspocus server
  │ If document not in RAM: loads {id}.appdoc from WebDAV → parses Yjs state
  │ Sends current Yjs state to new client
  ▼
Browser (Tiptap binds to Y.XmlFragment)
  │
  │ 3. User types
  │ → Yjs update applied locally
  │ → Sent to server via WebSocket
  ▼
Hocuspocus server
  │ → Broadcasts to all connected clients
  │ → Browser B receives update → merges into local Yjs state
  │
  │ 4. Every SERVER_SYNC_INTERVAL_MS (10s default):
  │ → Serializes Yjs state → JSON
  │ → Writes {id}.appdoc to WebDAV
  ▼
Sciebo/Nextcloud (data safely persisted)
```

**Calendar dates** follow a different pattern: REST API (`/api/dates`) reads/writes `dates.appsys` directly. Dates are atomic entities — no collaborative text editing, no CRDT needed.

---

## Permission & Role System

### Three-Tier Model

1. **Global Roles** (`roles.appsys`)
   - Each role maps to an array of permission flags
   - Example: `{ Admin: ['*'], Member: ['files.*', 'workspace.create'], Guest: ['files.read'] }`

2. **Hierarchical Wildcard Matching**
   - `files.*` grants all `files.X` permissions
   - `*` grants everything (Admin shortcut)
   - Logic lives in `hasPermission()` in `src/lib/utils/config/permissions.ts`

3. **Per-User Overrides**
   - Stored in `accounts.appsys.appsecure` under `access.overrides`
   - Can grant permissions beyond the role (e.g., a Member with `system.settings.view`)
   - Cannot reduce permissions — overrides only add

### Frontend Check
```ts
import { has } from '$lib/utils/config/permissions';
has('files.edit')  // boolean — reactive, reads from session
```

### Backend Check (API routes / hooks)
```ts
import { hasPermission } from '$lib/utils/config/permissions';
hasPermission(user.role, 'files.edit', orgRoles, user.overrides)  // pure function
```

### Permission Constants
All flags defined in `src/lib/config/permissions.ts`. Use `PERMISSIONS.X.Y` — never hardcode string flags.

---

## Security Layers

### Layer 1: Encryption at Rest
- `accounts.appsys.appsecure` and user profiles encrypted with AES-256-GCM before WebDAV upload
- Decrypted only in server memory during authentication

### Layer 2: Transport Security
- All WebDAV communication over HTTPS
- WebSocket connections over WSS
- TLS 1.3+

### Layer 3: Access Control
- Permission checks before every operation
- Validated on both frontend (UX) and backend (security)
- Fine-grained per-file scope planned (currently org-wide role + overrides)

### Layer 4: Audit Trail
- SQLite `audit_log` table tracks all writes
- GDPR compliance: who changed what, when
- 90-day retention

### Layer 5: Data Partitioning (Cache TTLs)
| Data Type | Cache TTL |
|-----------|-----------|
| Auth registry (accounts) | 1 minute |
| User profiles | 5 minutes |
| File index (meta) | Until invalidated on write |
| Dates index | Until invalidated on write |

All cache purged on server restart.

---

## Tenant Isolation

Each organization's data is fully isolated at every layer:

| Layer | Isolation mechanism |
|-------|-------------------|
| Browser | Cookie domain = subdomain |
| SvelteKit | `orgConfig` resolved per-request from `hooks.server.ts` |
| WebDAV | Separate root directory per org (`cloud_directory`) |
| SQLite | `tenant_id` on every table row |
| RAM cache | Keyed by `organisation_id` |
| Hocuspocus | Document room names include org prefix |

---

## Component Communication

### Frontend State Pattern

Session (current user) — one singleton, read everywhere:
```ts
import { session } from '$lib/state/session.svelte';
// session.user, session.orgRoles
```

Specialized state modules for features:
- `datesState` — calendar date CRUD + optimistic updates
- `membersState` — lightweight member list for assignment UI
- `overlayStack` — overlay open/close system
- `banners` — system notification banners
- `datePanel` — sidebar date detail panel open/close state

### API Pattern
```ts
// Component calls fetch, reads optimistic state from svelte state
// Server route validates permission, writes to WebDAV, returns result
// State module updates on response
```

### Component Hierarchy (actual)
```
(organisation)/+layout.svelte    ← sets session.user, session.orgRoles
  OverlayRoot                    ← portal for all modals/overlays
  SystemBanner                   ← dev/simulation banners
  Sidebar
    FileTree                     ← renders VNode tree
      TreeNodeItem (recursive)
        NodeItem                 ← single file/folder row
    SidebarProfile               ← user avatar (popover pending)
  ContentRoot                    ← dynamic file type renderer
    ContentTypeDocument
    ContentTypeFolder
    ContentTypePreview
    ContentTypeNotSupported
    ContentTypeForbidden
  CalendarPage (route)
    CalendarHeader
    MonthView / WeekView / DayView
      CalendarNode / WeekNode
```

---

## Error Handling

### Conflict Resolution (Yjs)
Multiple users edit simultaneously → Yjs merges automatically. Operations are commutative. No data loss.

### Network Failures
- Client queues Yjs edits if WebSocket drops; resends on reconnect
- REST API calls show error state in UI; optimistic updates are rolled back

### WebDAV Sync Failures
- Failed saves are logged; server retries on next sync interval
- User is not blocked — in-memory state stays valid; worst case is a sync delay
