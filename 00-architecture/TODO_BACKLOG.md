# PHAROS — Feature Backlog

Items discussed but not yet implemented. Add new entries here rather than leaving TODOs scattered in source files.

---

## Calendar

### Views (stub routes exist, no content)
- **Week view** — time-grid layout, columns per day, events positioned by time + height proportional to duration
- **Day view** — same as week but single-column; used as target for "+N more" overflow click
- **Agenda view** — flat chronological list, grouped by date

### Entry detail popover (Phase 4)
- Floating popover on entry click (needs `@floating-ui/svelte`)
- Shows: `• assigned` badge (if current user assigned), title, date/time, attached node chip, description, location, attached files, assignee avatar stack
- Edit mode: inline editing of all fields
- Assignee avatar stack: overlapping circles, "+N" overflow → opens full AssigneeSelector

### Quick-add popover (Phase 4)
- Clicking an empty cell opens a simplified create form (title + date pre-filled)
- Currently falls through to full DateCreateModal

### Mini-calendar popover (header)
- The calendar icon button in CalendarHeader is a no-op stub
- Should open a small month-grid picker to jump to any date

### "Assigned to me" filter (Filters button)
- Filters button in CalendarHeader is a no-op stub
- Should toggle showing only entries assigned to current user

### Calendar entry coloring — "assigned to me" (Phase 4)
- All-day bars: `bg-accent-100 text-accent-600` (purple) when current user is in assignees
- Timed pills: dot prefix `•` when current user is in assignees
- Logic: check BOTH `date.assignees` AND `node.assignees` (node's file-level assignees), show purple if current user is in either
- Requires session user to be passed to aggregator / MonthNode

### Week-row hover coordination (spanning bars)
- Currently each segment of a spanning bar highlights independently on hover
- Shared `hoveredCalendarId` state already added to MonthView — verify it works correctly across all spanning cells

---

## Assign Feature

### Assign others (permission gate)
- Currently planned as: any authenticated member can assign anyone
- Future: gate "assign/unassign others" behind `FILES.MANAGE_ASSIGNEES` (permission not yet added to `permissions.ts`)
- Self-assign (add/remove yourself) should always be allowed regardless of role

### "Assign me?" prompt on creation in assigned areas
- When a user creates a date or file inside a node they are already assigned to, show a small checkbox: "Assign me to this too?" 
- Pre-checked state follows a user preference: **Auto-assign in assigned areas** → Ask (default) / Always yes / Always no
- DateCreateModal: add checkbox when `targetNodeId` belongs to a node the current user is assigned to
- File creation flow: same prompt after creation dialog — show a non-blocking chip/toast "You created this in an area you're assigned to — assign me?" 
- No silent propagation, no cascade; just a one-time nudge

### User preference: "Auto-assign in assigned areas"
- Lives in user preferences panel (not yet built)
- Options: Ask (show checkbox, default unchecked) / Always (pre-check the checkbox) / Never (hide the prompt entirely)
- Stored in user profile (`preferences.autoAssignInContext`)

### Assignee display in NodeItem (sidebar)
- Dot indicator `•` on the LEFT side of NodeItem when current user is in the file's `assignees`
- See `design-concepts/calendar view/View_ Calendar (Month).png` for reference

### Assignee display in ContentHeader
- Show avatar stack (or assign button) in the file header area
- Currently `customFields?.assigned` is read there but not displayed meaningfully

### AssigneeSelector — avatar display
- After initial list-toggle implementation, upgrade to proper avatar circles
- Each member shows: colored circle with initials (or photo if available), name on hover
- Use `profile.color` from user profile for the circle background

---

## File System / Node Views

- **ContentTypeTasks.svelte** — Kanban board for `.fsrtasks` files (Yjs-backed, drag-and-drop columns)
- **EventView.svelte** — Display `.event` node content (attendees, location, description)
- **TableView.svelte** — Spreadsheet grid
- **Version history** — Track file changes over time

---

## Architecture

### session.svelte.ts — ContentRoot migration
- `ContentRoot.svelte` derives `currentUser` from `page.data.user` to call `hasPermission(user.role, ...)`
- Should eventually read from `session.user` instead, but the PERMISSIONS system may deserve its own state (`permissionsState`) that wraps `session.user.role` and exposes `can(permission)` directly
- Deferring until the permissions architecture is clearer — the `has()` helper already exists in `$lib/utils/config/permissions`, so this is a refactor of how components access it, not a logic change

## General UI

- **DateCreateModal — assignees field** — Currently the create form has no assignee picker; add AssigneeSelector into the form
- **Keyboard navigation** — Context menus, popovers, and modals should be keyboard-accessible (arrow keys, Escape)
- **Context menu — keyboard trigger** — Right-click equivalent via keyboard (Shift+F10 or context menu key)

### Split view (future)
- Day view has a stub "+ add split view" panel on the right; clicking it does nothing yet
- Full split view: two time-grid columns side by side (e.g. two different days shown at once)
- App-wide: split view concept extends to the content area (two files open side-by-side)
- Deferring until ContentHeader architecture is settled — split view affects the entire layout system, including how the main content area is structured and how the ContentHeader handles multiple open files
