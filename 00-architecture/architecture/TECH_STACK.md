# PHAROS — Technology Stack

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Svelte 5** | latest | UI framework with strict rune mode (`$state`, `$derived`, `$effect`, `$props`) |
| **SvelteKit** | 2.x | Meta-framework: routing, SSR, API routes, form actions |
| **Tailwind CSS v4** | 4.x | Utility-first CSS with semantic ink/level token system |
| **Tiptap** | 3.x | Headless rich-text editor, mapped to collaborative documents |
| **Yjs** | 13.x | Conflict-free Replicated Data Types (CRDTs) for real-time sync |
| **@hocuspocus/provider** | 3.x | Yjs WebSocket client — connects browser to Hocuspocus server |
| **@tabler/icons-svelte** | 3.x | Icon set; mapped through `Icon.svelte` component |
| **@floating-ui/svelte** | latest | Tooltip and popover positioning |

---

## Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 20+ | Server runtime via `@sveltejs/adapter-node` |
| **@hocuspocus/server** | 3.x | WebSocket server for Yjs — receives updates, broadcasts, manages rooms |
| **better-sqlite3** | 9.x | SQLite — tenants, sessions, audit log |
| **webdav** | latest | WebDAV client — talks to Sciebo/Nextcloud |
| **crypto** (built-in) | — | AES-256-GCM encryption for sensitive files |

---

## Build & Tooling

| Tool | Purpose |
|------|---------|
| **Vite** | Dev server, HMR, bundler |
| **TypeScript** | Type safety across frontend + backend |
| **ESLint + Prettier** | Linting and formatting |
| **svelte-check** | Svelte-specific type checking |

---

## File Formats

All PHAROS custom files use the `app` prefix (configured in `globalsettings.ts → FILE_EXT_PREFIX`):

| Extension | Format | Content |
|-----------|--------|---------|
| `.appdoc` | JSON (Yjs wrapper) | Rich-text documents — Yjs CRDT state + Tiptap schema |
| `.apptasks` | JSON (Yjs wrapper) | Kanban boards — Yjs Y.Map columns, Y.Array tasks |
| `.appevt` | JSON | Event metadata |
| `.appsys` | JSON | System index files (meta, dates, roles, profiles) |
| `.appsecure` | Encrypted JSON | Applied after base ext — e.g., `accounts.appsys.appsecure` |
| `.workspace` | Directory | Workspace container |
| `.sysfolder` | Directory | System-only container (hidden from users) |

External file formats supported for preview: `.pdf`, `.jpg`, `.jpeg`, `.png`, `.gif`, `.webp`, `.xlsx`, `.csv`

---

## Real-Time Data Flow

```
Browser (User A)                 Server (Hocuspocus)          WebDAV (Sciebo)
    │                                    │                          │
    │── WebSocket connect ──────────────►│                          │
    │                                    │── Load {id}.appdoc ─────►│
    │                                    │◄── Yjs state ────────────│
    │◄── Yjs state ──────────────────────│                          │
    │                                    │                          │
    │  (User types)                       │                          │
    │── Yjs update ─────────────────────►│                          │
    │                                    │── broadcast ────────────►│ Browser B
    │                                    │                          │
    │          (every 10s)               │── putFileContents ──────►│
    │                                    │                          │
```

**Calendar dates** use REST (`/api/dates/*`) instead of WebSockets — they are atomic JSON records, not collaborative text.

---

## Database Schema (SQLite)

| Table | Purpose |
|-------|---------|
| `organisations` | Tenant registration: subdomain, cloud credentials (encrypted) |
| `sessions` | Active user sessions (auto-expire after 30 days) |
| `audit_log` | GDPR audit trail: who, what, when |
| `operators` | Dev/admin operators for god mode (not org-level users) |

---

## Infrastructure (Planned)

| Component | Technology |
|-----------|-----------|
| Reverse proxy | Caddy (auto-SSL, subdomain routing) |
| Containerization | Docker (read-only filesystem, health checks) |
| Scaling | Single VPS for alpha; Hocuspocus Redis adapter for multi-instance |

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Page load | < 2 seconds |
| Collaborative edit broadcast | < 100ms |
| WebDAV sync | Background, non-blocking |
| File tree render | < 500ms for 100+ items |
| Real-time awareness updates | Instant (WebSocket) |
