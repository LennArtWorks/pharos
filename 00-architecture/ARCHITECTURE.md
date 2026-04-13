# PHAROS - System Architecture

## File System Structure (WebDAV/Sciebo)

All data lives on Sciebo/Nextcloud. PHAROS never stores operational data on the server disk.

### ID-Only Naming Convention

Files on WebDAV are named purely by internal ID: `{id}.{extension}`

Example: `1771675444568.fsrdoc`

**Why?** Renaming a file only updates metadata in `meta.fsrsys` (no WebDAV MOVE command needed, reducing sync conflicts).

### Directory Structure

```
/organization-name/
├─ .system/
│  ├─ meta.fsrsys          # Global file index (ID → name, parent, metadata)
│  ├─ .trash/              # Deleted files (can be restored)
│  ├─ .assets/             # Embedded images, PDFs (hidden from users)
│  ├─ .history/            # Version snapshots (Yjs document history)
│  └─ .locks/              # Lock files for race condition prevention
│
├─ config.sysfolder/       # Admin-only configuration
│  ├─ accounts.fsrsecure   # Encrypted: email → account-id + password hash
│  ├─ roles.fsrsys         # Plain-text: role definitions + permissions
│  └─ accounts.sysfolder/
│     └─ {account-id}.fsrsys  # User profile: roles, teams, preferences
│
├─ Workspace1.workspace/   # Treated as a group of files
├─ Workspace2.workspace/
│  ├─ folder1/
│  │  ├─ 1771675444568.fsrdoc      # Document file
│  │  ├─ 1771675444569.fsrtasks    # Kanban board
│  │  └─ 1771675444570.fsrtable    # Spreadsheet
│  └─ folder2/
│
└─ Global_Events.workspace/
   ├─ event_metadata.fsrevt
   └─ event_roster.fsrroster
```

---

## File Format: Generic JSON + Yjs

All `.fsr*` files are **JSON-serialized Yjs documents**:

```json
{
  "_meta": {
    "schemaVersion": "1.0",
    "lastUpdated": 1771678000000,
    "type": "fsrdoc|fsrtasks|fsrtable|...",
    "createdAt": 1771675444000,
    "ownerId": "usr_1771675444568"
  },
  "yjs": {
    // Binary-encoded or decoded CRDT state
    // Includes Y.XmlFragment (Tiptap documents),
    // Y.Array (task lists, rosters),
    // Y.Map (spreadsheet cells, event metadata)
  }
}
```

---

## Metadata Index (meta.fsrsys)

This is the "file explorer lookup table." It maps IDs to human-readable names and hierarchy.

```json
{
  "_meta": {
    "schemaVersion": "1.3",
    "lastUpdated": 1772988642243,
    "description": "Global index"
  },
  "nodes": {
    "fsr_d12a87731e34": {
      "name": "fsr_c5daf639f200",
      "parentId": null,
      "extension": ".workspace",
      "updatedAt": 1772986091000,
      "createdAt": 1772986092221,
      "tags": [],
      "customFields": { "isTemplate": false }
    },
    "fsr_18a287a8f1f3": {
      "name": "fsr_9f9b53660c27",
      "parentId": "fsr_d12a87731e34",
      "extension": "",  // Folders have no extension
      "updatedAt": 1772986088000,
      "createdAt": 1772986092222,
      "tags": [],
      "customFields": { "isTemplate": false }
    }
    // ... more nodes
  }
}
```

**Frontend caches this entirely** for instant file tree rendering (no WebDAV queries needed).

---

## Permission & Role Management

### Three-Tier Permission System

1. **Global Roles** (`roles.fsrsys`)
   - Defines baseline permissions for each role (Admin, Member, Guest, Anonymous)

2. **Role Inheritance**
   - `Admin` inherits all `Member` permissions
   - `Member` inherits all `Guest` permissions

3. **Workspace-Level Overrides**
   - Specific users can be granted/denied access to specific workspaces
   - Example: Finance team can only see Finance workspace

### Permission Flags

**System Permissions:** `system.manage_users`, `system.manage_roles`, `system.view_sysfolders`, `system.settings_write`

**Workspace Permissions:** `workspace.create`, `workspace.edit`, `workspace.delete`, `workspace.manage_access`

**File Permissions:** `files.read`, `files.create`, `files.edit`, `files.delete`, `files.move`, `files.publish`

**Interaction Permissions:** `interaction.submit_forms`, `interaction.book_shifts`, `interaction.checkout`

---

## Real-Time Collaboration Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User Opens Document                                         │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Browser Opens WebSocket to Hocuspocus Server            │
│    (Server identifies tenant via subdomain)                │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Server Loads .fsrdoc from WebDAV into RAM               │
│    - Creates Yjs.Doc from serialized state                 │
│    - Deserializes into Y.XmlFragment (Tiptap)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. Browser Receives Yjs State + Awareness                   │
│    - Tiptap binds to Y.XmlFragment                         │
│    - Renders document in SvelteKit component               │
│    - Shows live cursor positions (awareness)               │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. User Makes Edit                                          │
│    - Client applies change to local Y.XmlFragment          │
│    - Change sent to server via WebSocket                   │
│    - Server broadcasts to all connected clients            │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. Periodic Sync (Every ~30 Seconds)                        │
│    - Server serializes Yjs state to JSON                   │
│    - Writes to WebDAV via HTTP                             │
│    - Yjs state saved to Sciebo                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security & Privacy Layers

### Layer 1: Encryption at Rest
- `accounts.fsrsecure` encrypted with AES-256-GCM before WebDAV upload
- Decrypted only in server memory during authentication
- All other files can be encrypted by the organization if needed

### Layer 2: Transport Security
- All WebDAV communication over HTTPS
- WebSocket connections over WSS
- SSL certificates auto-provisioned by Caddy

### Layer 3: Access Control
- Permission checks before every operation
- Validated on both frontend (UX) and backend (security)
- Fine-grained per-file and per-workspace permission model

### Layer 4: Audit Trail
- SQLite audit log tracks all writes
- GDPR compliance: who changed what, when
- Non-repudiation: changes cannot be denied

### Layer 5: Data Partitioning
- Sensitive files (accounts) cached for < 1 minute
- Structural files (meta) cached for 15 minutes
- All cache lost on server restart

---

## Tenant Isolation

### Subdomain Routing
- Organization A: `fsra.pharos.de`
- Organization B: `fsrb.pharos.de`
- Browser cookie isolation at domain level
- LocalStorage isolation at subdomain level

### Database Isolation
- SQLite stores `tenant_id` for each row
- Queries always filtered: `WHERE tenant_id = ?`
- Credentials per tenant-id stored securely

### File System Isolation
- Each tenants Sciebo folder is completely separate
- No cross-tenant access at any layer
- Multitenancy enforced at HTTP layer (routing)

---

## Component Communication

### Frontend State Management (Svelte 5 Runes)
```javascript
// Components use reactive state bindings
let fileTree = $state([]);           // Reactive file list
let selectedFile = $derived(...)     // Computed from state
let sidebarOpen = $state(false);     // Toggle state

$effect(() => {
  // Sync to localStorage when state changes
  localStorage.setItem('sidebar', sidebarOpen);
});
```

### Backend State Management
```javascript
// Hocuspocus maintains Yjs docs per room
const docs = new Map(); // documentname → Yjs.Doc

// When client connects:
// 1. Load docstate from WebDAV
// 2. Create/use existing Yjs.Doc
// 3. Send docstate to client
// 4. Subscribe to updates
```

### Component Hierarchy
```
App.svelte
├─ Layout.svelte
│  ├─ Sidebar.svelte (file tree)
│  │  └─ TreeNodeItem.svelte (recursive)
│  │     └─ NodeItem.svelte (single node + actions)
│  └─ MainView.svelte
│     ├─ DocumentView.svelte (for .fsrdoc)
│     ├─ TasksView.svelte (for .fsrtasks)
│     ├─ TableView.svelte (for .fsrtable)
│     └─ etc...
```

---

## Error Handling & Recovery

### Conflict Resolution (Yjs handles automatically)
- Client A and Client B edit same line → Yjs merges changes
- Operations are commutative → no data loss
- Last write doesn't win → all edits preserved

### Network Failures
- Client-side queues edits if WebSocket drops
- Resends when connection re-established
- Server-side: Disconnected clients purged after timeout

### WebDAV Sync Failures
- Failed save marked with `status: "pending_sync"`
- Retries on background thread
- User warned if sync hasn't completed after N minutes

---

## Deployment Pipeline

```
┌──────────────┐
│ Source Code  │
│ (TypeScript) │
└──────┬───────┘
       │
       ▼
┌──────────────────────┐
│ Build (Vite + SvelteKit) │
│ • Bundles frontend    │
│ • Compiles backend    │
│ • Generates types     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   Docker Build       │
│ • Creates image      │
│ • Tags with version  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│   Deploy to VPS      │
│ • Stop old container │
│ • Start new container│
│ • Verify health      │
└──────────────────────┘
```

---

## Monitoring & Observability

- **Health Check:** GET `/health` returns tenant status
- **Logs:** Structured JSON logs to stdout (Docker captures)
- **Metrics:** (Future) Prometheus metrics for performance
- **Audit Trail:** SQLite for compliance investigation
