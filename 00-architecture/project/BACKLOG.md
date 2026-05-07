# PHAROS — Feature Backlog

Items planned but not yet implemented. Add new entries here instead of leaving TODOs scattered in source files.

---

## High Priority

### ContentTypeTasks — `.apptasks` Kanban board
- Yjs-backed Y.Map (column IDs → Y.Array of task objects)
- Drag-and-drop cards between columns
- Component: `ContentTypeDocument.svelte` is the reference pattern (Yjs binding)
- File type already registered in `FILE_TYPE_CONFIG.internal.tasks`

### Calendar Agenda view
- Flat chronological list of dates, grouped by date header
- Self-contained, no new infrastructure needed
- Design reference: `design-concepts/calendar view/View_ Calendar (Agenda).png`

### SidebarProfile popover
- The user avatar button in the bottom-left sidebar is currently dead (no handler)
- Should open a popover with: Settings link + Logout form
- Settings link: `?overlay=settings-org` (existing overlay system)
- Logout: reuse existing logout `<form method="POST" action="/logout">`

---

## Calendar

### Entry detail popover (Phase 4)
- Floating popover on entry click (currently opens DatePanel in sidebar)
- Shows: title, date/time, attached node chip, description, location, assignee stack
- Needs `@floating-ui/svelte`

### DateCreateModal — assignees field
- DatePanel (edit view) already has AssigneeSelector ✅
- DateCreateModal (create form) still missing the assignees field — add AssigneeSelector

### Mini-calendar picker (CalendarHeader)
- The calendar icon button in CalendarHeader is a stub (no-op)
- Should open a small month-grid picker to jump to any date

### "Assigned to me" filter
- Filters button in CalendarHeader is a stub (no-op)
- Toggle to show only entries assigned to current user

### Week-row hover coordination (spanning bars)
- `hoveredCalendarId` state already in MonthView — verify correct behavior across all spanning cells

---

## Assign Feature

### Assign-others permission gate
- Currently any authenticated member can assign anyone
- Future: gate "assign/unassign others" behind a `FILES.MANAGE_ASSIGNEES` permission
- Self-assign (add/remove yourself) always open to all roles

### "Assign me?" prompt on creation
- When creating a date/file inside a node the user is already assigned to, show a checkbox: "Assign me to this too?"
- Pre-check state follows user preference: Auto-assign in assigned areas → Ask / Always / Never
- DateCreateModal: show checkbox when `targetNodeId` belongs to an assigned node
- File creation: show non-blocking chip/toast after creation

### User preference: Auto-assign in assigned areas
- Lives in user preferences panel (not yet built)
- Options: Ask (default, unchecked checkbox) / Always (pre-check) / Never (hide prompt)
- Stored in user profile: `preferences.autoAssignInContext`

### AssigneeSelector — avatar display
- Current: list toggle (name + checkbox)
- Upgrade to: colored circle with initials (or photo), name on hover
- Use `profile.color` for circle background

### Assignee display in ContentHeader
- Show avatar stack (or assign button) in the content area header
- `customFields?.assigned` is read there but not displayed meaningfully

---

## File System / Node Views

### ContentTypeEvent
- File type config already exists (`.appevt`, icon `calendar`)
- Component: display event metadata (title, date, attendees, location, description)
- Can reuse DatePanel patterns

### Version history
- Track file changes over time
- Yjs history is in-memory only; would need periodic snapshots to WebDAV
- UI: version timeline panel

---

## General UI

### Keyboard navigation
- Context menus: arrow keys, Enter, Escape
- Modals: focus trap, Escape to close
- Context menu keyboard trigger: Shift+F10 or context menu key

### Split view (future)
- Day view has a stub "+ add split view" panel on the right; clicking it does nothing
- Full split view: two time-grid columns (e.g. two different days)
- App-wide: two files open side-by-side in the content area
- Deferred until ContentHeader architecture is settled — split view affects the entire layout system

---

## Architecture / Infrastructure

### Global search
- Cmd+K command palette
- Search across file names (from meta.appsys cache)
- Future: full-text search across document content

### StorageAdapter interface
- `sync.ts` and `service.ts` currently call WebDAV client methods directly
- Extract a `StorageAdapter` interface to enable non-WebDAV providers (Google Drive, Dropbox)
- See [architecture/SCALABILITY.md](../architecture/SCALABILITY.md) for details

---

## GDPR / Compliance

### Data export API (Art. 20 — Portability)
- `GET /api/user/data` — structured export of all user data
- Markdown export of document content is a natural portability format here

### Account deletion pipeline (Art. 17 — Right to Erasure)
- `DELETE /api/user/account`
- Anonymize in collaborative files, remove from rosters, delete profile from WebDAV
- 30-day grace period before hard delete

---

## DevOps

### Docker setup
- Production containerization
- Read-only filesystem (except SQLite volume)
- Health check endpoint

### Rate limiting
- Per-tenant API rate limits
- Protect against abuse across shared infrastructure
