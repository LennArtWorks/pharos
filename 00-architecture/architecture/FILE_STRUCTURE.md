# PHAROS — File Structure

## Project Root

```
pharos/
├─ 00-architecture/          ← All documentation
│  ├─ START_HERE.md          ← Entry point for new developers
│  ├─ project/               ← Project management docs
│  ├─ architecture/          ← Technical architecture docs
│  ├─ guides/                ← How-to coding guides
│  └─ design-concepts/       ← UI design reference images
│
├─ src/                      ← Application source
├─ static/                   ← Public static files
├─ build/                    ← Build output (generated, gitignored)
├─ .svelte-kit/              ← SvelteKit cache (generated, gitignored)
├─ CLAUDE.md                 ← Component rules (design system)
├─ package.json
├─ svelte.config.js
├─ vite.config.ts
└─ tsconfig.json
```

---

## src/ Structure

```
src/
├─ app.d.ts                  ← Global type declarations (App.Locals, App.PageData, etc.)
├─ app.html                  ← Root HTML template
├─ hooks.server.ts           ← SvelteKit server hooks (auth, session, orgConfig)
│
├─ lib/                      ← Shared code (imported as $lib/...)
│  ├─ assets/                ← Static assets (favicon, images)
│  │
│  ├─ components/
│  │  ├─ blocks/
│  │  │  └─ NodeItem/        ← File/folder row component (used in FileTree)
│  │  │     └─ NodeItem.svelte
│  │  │
│  │  ├─ layout/
│  │  │  ├─ ContextMenu/     ← Right-click context menu system
│  │  │  │  └─ menus/        ← Per-context menu definitions (file, folder, date, etc.)
│  │  │  ├─ content/
│  │  │  │  ├─ ContentRoot.svelte        ← Dynamic file type renderer
│  │  │  │  ├─ ContentHeader.svelte      ← Content area top bar
│  │  │  │  └─ filetypes/               ← Content type components
│  │  │  │     ├─ ContentTypeDocument.svelte
│  │  │  │     ├─ ContentTypeFolder.svelte
│  │  │  │     ├─ ContentTypePreview.svelte
│  │  │  │     ├─ ContentTypeForbidden.svelte
│  │  │  │     └─ ContentTypeNotSupported.svelte
│  │  │  ├─ overlays/
│  │  │  │  ├─ OverlayRoot.svelte        ← Portal for all overlays/modals
│  │  │  │  ├─ templates/               ← Overlay layout templates
│  │  │  │  └─ content/                 ← Overlay content components
│  │  │  │     └─ settings/OrgSettings/ ← Org settings panel
│  │  │  │        └─ pages/             ← GeneralSettings, AccountsSettings, RolesSettings
│  │  │  ├─ sidebar/
│  │  │  │  ├─ Sidebar.svelte
│  │  │  │  ├─ FileTree.svelte          ← Recursive file tree
│  │  │  │  └─ SidebarProfile.svelte    ← User avatar (popover pending)
│  │  │  ├─ DevFloatingPanel.svelte     ← Dev/godmode floating controls
│  │  │  └─ SystemBanner.svelte         ← Top banners (devmode, simulation)
│  │  │
│  │  ├─ pages/
│  │  │  ├─ calendar/
│  │  │  │  ├─ CalendarHeader.svelte    ← View switcher, navigation, "+ add date"
│  │  │  │  ├─ DateCreateModal.svelte   ← Create date overlay
│  │  │  │  ├─ DatePanel.svelte         ← Sidebar date detail/edit panel
│  │  │  │  ├─ nodes/                  ← Calendar entry components
│  │  │  │  │  ├─ CalendarNode.svelte  ← Bar/pill variant (all-day entries)
│  │  │  │  │  └─ WeekNode.svelte      ← Timed block (week/day grid)
│  │  │  │  └─ views/                  ← Calendar view pages
│  │  │  │     ├─ MonthView.svelte
│  │  │  │     ├─ WeekView.svelte
│  │  │  │     ├─ DayView.svelte
│  │  │  │     └─ AgendaView.svelte    ← Stub
│  │  │  └─ root/                      ← Home/recent pages
│  │  │
│  │  └─ ui/                           ← Primitive UI components
│  │     ├─ Button.svelte              ← Primary interactive primitive
│  │     ├─ Icon.svelte                ← Icon wrapper (Tabler + custom)
│  │     ├─ Input.svelte
│  │     ├─ MouseTooltip.svelte
│  │     ├─ AssigneeSelector.svelte    ← Member picker (floating panel)
│  │     ├─ Select/                    ← Custom select component
│  │     ├─ TriggerPopover/            ← Popover primitive
│  │     └─ custom-icons/
│  │
│  ├─ config/                          ← Configuration & constants
│  │  ├─ filesystem.ts                 ← VNode, AppDate, AppMeta interfaces + FILE_TYPE_CONFIG
│  │  ├─ globalsettings.ts             ← APP_EXTENSIONS, GLOBAL_SETTINGS, APP_COOKIE
│  │  ├─ permissions.ts                ← PERMISSIONS constant tree
│  │  ├─ cloudfiles/                   ← Cloud file blueprints (source of truth for schemas)
│  │  │  ├─ meta.ts                    ← meta.appsys blueprint
│  │  │  ├─ dates.ts                   ← dates.appsys blueprint
│  │  │  ├─ roles.ts                   ← roles.appsys blueprint + SETUP_ROLES
│  │  │  ├─ accounts.ts               ← accounts.appsys.appsecure blueprint
│  │  │  └─ user.ts                    ← per-user profile blueprint
│  │  └─ cookies/
│  │     └─ session.ts                 ← Cookie name constants
│  │
│  ├─ server/                          ← Server-only code (never imported on client)
│  │  ├─ auth/
│  │  │  └─ login/                     ← Login logic, credential validation
│  │  ├─ cloud/
│  │  │  ├─ origin/
│  │  │  │  ├─ client.ts              ← getCloudClient() — provider switch
│  │  │  │  └─ sciebo.ts              ← Sciebo/WebDAV client factory
│  │  │  ├─ filetypes/
│  │  │  │  ├─ json.ts                ← JSON file read/write helpers
│  │  │  │  └─ binary.ts             ← Binary file helpers
│  │  │  ├─ dates.ts                  ← dates.appsys CRUD operations
│  │  │  ├─ service.ts                ← File system operations (getFileSystemMeta, etc.)
│  │  │  ├─ sync.ts                   ← syncCloudIndex() — re-index from WebDAV
│  │  │  └─ syncQueue.ts             ← Queued writes for debounced tree updates
│  │  ├─ notifications/               ← Server-side notification utilities
│  │  └─ cache.ts                     ← In-memory cache (meta, dates, per-org)
│  │
│  ├─ state/                          ← Client-side reactive state (Svelte 5 $state)
│  │  ├─ session.svelte.ts            ← Current user: session.user, session.orgRoles
│  │  ├─ members.svelte.ts            ← Lightweight member list {id, name}[] for UI
│  │  ├─ dev/
│  │  │  └─ operator.svelte.ts        ← Dev/god mode optimistic state
│  │  ├─ layout/
│  │  │  ├─ banners.svelte.ts         ← System banner add/remove
│  │  │  ├─ datePanel.svelte.ts       ← Date panel open/close + context
│  │  │  ├─ dateCreate.svelte.ts      ← Date create modal context
│  │  │  └─ overlayStack.svelte.ts    ← Overlay open/close by URL param
│  │  └─ navigation/
│  │     ├─ filesystem.svelte.ts      ← File tree state, active node
│  │     └─ dates.svelte.ts           ← datesState — calendar date CRUD + cache
│  │
│  ├─ utils/                          ← Utility functions (pure, no Svelte dependency)
│  │  ├─ calendar/
│  │  │  └─ aggregator.ts             ← Aggregates VNode + AppDate → CalendarEntry[]
│  │  └─ config/
│  │     ├─ filesystem.ts             ← getFileConfig(), getUIFileType(), buildNodeFilename()
│  │     ├─ permissions.ts            ← has(), hasPermission()
│  │     └─ cloudfiles/
│  │        └─ user.ts                ← User ID/color/name generators
│  │
│  └─ language/                       ← i18n (future)
│
├─ routes/
│  ├─ +layout.svelte                  ← Root layout (minimal)
│  ├─ +layout.server.ts              ← Root server (tenant resolution)
│  ├─ layout.css                      ← Global styles
│  │
│  ├─ (main)/                         ← Pre-auth / public routes
│  │  └─ main-home/                   ← Landing page
│  │
│  ├─ (organisation)/                 ← All authenticated org routes
│  │  ├─ +layout.svelte              ← Org layout: sets session, renders Sidebar + ContentRoot
│  │  ├─ +layout.server.ts           ← Loads user, orgRoles, file tree
│  │  ├─ organisation-home/           ← Org dashboard
│  │  └─ (app)/                       ← App-specific routes
│  │     ├─ +layout.svelte
│  │     ├─ dev/                      ← Developer tools (design system, aidev, backend debug)
│  │     └─ files/
│  │        ├─ [id]/                  ← File viewer (renders ContentRoot for a specific node)
│  │        └─ (views)/              ← Non-file views
│  │           ├─ calendar/           ← Calendar page + data loading
│  │           ├─ recent/             ← Recent activity
│  │           ├─ tasks/              ← My Tasks view
│  │           └─ mail/               ← Mail (stub)
│  │
│  ├─ api/
│  │  ├─ admin/sync/                 ← Force re-sync WebDAV index
│  │  ├─ dates/
│  │  │  ├─ delete/                  ← DELETE date
│  │  │  └─ update/                  ← PATCH date
│  │  ├─ filesystem/
│  │  │  ├─ +server.ts               ← GET file tree
│  │  │  ├─ assign/                  ← POST assign users to node
│  │  │  ├─ create/                  ← POST create file/folder
│  │  │  ├─ delete/                  ← POST soft-delete node
│  │  │  ├─ download/                ← GET download file from WebDAV
│  │  │  ├─ file/                    ← GET file content (for Hocuspocus)
│  │  │  ├─ rename/                  ← POST rename node
│  │  │  └─ sort/                    ← POST reorder nodes
│  │  ├─ organisation/
│  │  │  └─ members/                 ← GET lightweight member list
│  │  └─ settings/organisation/
│  │     ├─ accounts/                ← GET/POST org accounts (admin-only)
│  │     └─ roles/                   ← GET/POST org roles (admin-only)
│  │
│  ├─ login/                          ← Login page + form action
│  └─ logout/                         ← Logout action
│
└─ styles/
   ├─ app.css                         ← Tailwind directives + global resets
   └─ dictionaries/                   ← Semantic token definitions (ink, level, etc.)
```

---

## Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Svelte components | PascalCase | `NodeItem.svelte`, `CalendarHeader.svelte` |
| State files | camelCase + `.svelte.ts` | `session.svelte.ts`, `datesState.svelte.ts` |
| Utility functions | camelCase + `.ts` | `permissions.ts`, `aggregator.ts` |
| SvelteKit pages | `+page.svelte` / `+server.ts` | — |
| Config constants | UPPER_SNAKE_CASE | `PERMISSIONS`, `APP_EXTENSIONS`, `SYSTEM_CONFIG` |

---

## How to Find Things

| Looking for... | Where |
|----------------|-------|
| Button component | `src/lib/components/ui/Button.svelte` |
| Icon component | `src/lib/components/ui/Icon.svelte` |
| Permission flags | `src/lib/config/permissions.ts` |
| Permission check helper | `src/lib/utils/config/permissions.ts` |
| File type registry | `src/lib/config/filesystem.ts → FILE_TYPE_CONFIG` |
| File extensions | `src/lib/config/globalsettings.ts → APP_EXTENSIONS` |
| Cloud file blueprints | `src/lib/config/cloudfiles/` |
| Current user in component | `import { session } from '$lib/state/session.svelte'` |
| Calendar date state | `import { datesState } from '$lib/state/navigation/dates.svelte'` |
| WebDAV operations | `src/lib/server/cloud/service.ts`, `sync.ts` |
| Auth logic | `src/lib/server/auth/` |
