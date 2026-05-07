# PHAROS — Technical Status

Last updated: May 2026

---

## Phase 1 — Foundation ✅ Complete

- SvelteKit project setup, routing, TypeScript
- Tailwind CSS v4 with semantic ink/level token system
- Authentication (login, logout, session cookies)
- SQLite database (better-sqlite3) — tenants, sessions, audit log
- Hocuspocus WebSocket server
- WebDAV client (Sciebo/Nextcloud)
- Multi-tenant subdomain routing + credential storage (encrypted)
- Svelte 5 rune patterns established

---

## Phase 2 — File System ✅ Complete

- `meta.appsys` index: load, cache, write-back
- File tree rendering with recursive expand/collapse
- Drag-and-drop (move files between folders, with DRAG_HOVER_DELAY on nav zones)
- File operations: create, rename, move, delete (soft), sort, download
- Permission system: `has(flag)`, `hasPermission()`, hierarchical wildcard matching
- Session singleton: `session.user`, `session.orgRoles` — replaces `page.data` drilling
- OrgSettings panel: General, Accounts, Roles pages
- Role simulation + DevMode (operator system, banners)
- Context menus: file tree nodes
- Members state: lightweight `{id, name}[]` for assignment UI

---

## Phase 3 — Calendar ✅ Complete

- `dates.appsys` index: create, update, delete, assign
- Calendar views: Month, Week, Day (with time grid + lane overlap algorithm)
- CalendarNode + WeekNode + spanning bars
- Drag-and-drop calendar entries: date reassignment + timed drop (15-min snapping)
- Resize handles (WeekNode top/bottom, 15-min snapping)
- Now indicator (red line at current time, updates every 60s)
- Assign feature: files and calendar entries → `AssigneeSelector`
- Accent coloring when current user is assigned
- DatePanel: create, view, edit dates (with assignees, description, location)
- DateCreateModal: create from context (click, context menu, "+")

---

## Phase 4 — Content Types 🔄 Partial

| Type | Extension | Status |
|------|-----------|--------|
| Document | `.appdoc` | ✅ Tiptap + Yjs + Hocuspocus, awareness, bubble menu |
| Folder | (dir) | ✅ Grid view, double-click navigate |
| Workspace | `.workspace` | ✅ Same as Folder |
| Preview | `.pdf`, images | ✅ Inline preview |
| Event | `.appevt` | 🔄 File type config exists; ContentTypeEvent component pending |
| Tasks | `.apptasks` | ❌ Not started — Kanban board (Yjs-backed) |

---

## Phase 5 — Polish ❌ Not Started

| Feature | Notes |
|---------|-------|
| ContentTypeTasks | `.apptasks` Kanban; highest priority next task |
| Calendar Agenda view | Flat chronological list; self-contained |
| SidebarProfile popover | Settings + Logout; avatar button currently dead |
| DateCreateModal assignees | DatePanel (edit) has it ✅; create modal still missing |
| Global search | Cmd+K command palette |
| Keyboard navigation | Context menus, modals (arrow keys, Escape) |
| Mini-calendar picker | CalendarHeader icon button (stub) |
| Day view split panel | "+ add split view" (stub) |
| Data export API | GDPR Art. 20 — portability endpoint |
| Account deletion | GDPR Art. 17 — right to erasure pipeline |
| Docker setup | Production containerization |
| Rate limiting | Per-tenant API protection |

---

## Known Limitations

**Architecture:**
- SQLite is single-writer — fine for one VPS, blocks multi-instance scaling
- Hocuspocus is in-memory — WebSocket load balancing not supported (needs Redis adapter for horizontal scaling)
- No distributed Yjs sync across server instances
- No rate limiting on API endpoints

**Features:**
- No real-time awareness across different browser tabs (same browser)
- No time-travel / undo across sessions
- No version history UI (Yjs history is in-memory only)
- ContentTypeEvent is a stub
- Stripe integration not started (not in scope for alpha)

**GDPR:**
- Data export API (Art. 20 portability) — not implemented
- Account deletion pipeline (Art. 17 erasure) — not implemented
- These are planned but non-blocking for alpha/demo

---

## Dependency Chain

```
✅ Auth → ✅ Session → ✅ Permissions → ✅ File tree → ✅ File CRUD
                                    → ✅ Calendar → ✅ Dates → ✅ Assign
                                    → ✅ Documents (Yjs)
                                    → 🔄 Events → ❌ Tasks
                                    → ❌ Agenda → ❌ Search
```
