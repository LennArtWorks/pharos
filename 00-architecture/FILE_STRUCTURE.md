# PHAROS - File Structure & Organization

## Project Root Layout

```
/02-FSR-OS/
├─ PROJECT_OVERVIEW.md          ← START HERE
├─ TECH_STACK.md                ← Technology details
├─ ARCHITECTURE.md              ← System design
├─ DEVELOPMENT_GUIDE.md         ← How to code
├─ GDPR_COMPLIANCE.md           ← Privacy & security
├─ FILE_STRUCTURE.md            ← This file
│
├─ fsr-os/                      ← Main webapp
│  ├─ CLAUDE.md                 ← Component/design rules
│  ├─ README.md
│  ├─ package.json
│  ├─ svelte.config.js
│  ├─ vite.config.ts
│  ├─ tsconfig.json
│  ├─ .env.example
│  │
│  ├─ src/
│  │  ├─ app.d.ts              ← Type definitions
│  │  ├─ app.html              ← Root HTML
│  │  ├─ hooks.server.ts       ← Server lifecycle
│  │  ├─ hooks.ts              ← Universal hooks
│  │  │
│  │  ├─ lib/                  ← Shared code
│  │  │  ├─ index.ts           ← Public exports
│  │  │  ├─ utils.ts           ← Utility functions
│  │  │  │
│  │  │  ├─ components/        ← Svelte components
│  │  │  │  ├─ Button.svelte
│  │  │  │  ├─ Icon.svelte
│  │  │  │  ├─ Input.svelte
│  │  │  │  ├─ NodeItem.svelte
│  │  │  │  ├─ TreeNodeItem.svelte
│  │  │  │  │
│  │  │  │  ├─ views/          ← File type views
│  │  │  │  │  ├─ DocumentView.svelte
│  │  │  │  │  ├─ TasksView.svelte
│  │  │  │  │  ├─ TableView.svelte
│  │  │  │  │  ├─ RosterView.svelte
│  │  │  │  │  └─ EventView.svelte
│  │  │  │  │
│  │  │  │  ├─ modals/         ← Modal dialogs
│  │  │  │  │  ├─ CreateFile.svelte
│  │  │  │  │  ├─ RenameFile.svelte
│  │  │  │  │  └─ Settings.svelte
│  │  │  │  │
│  │  │  │  ├─ layouts/        ← Layout wrappers
│  │  │  │  │  ├─ Sidebar.svelte
│  │  │  │  │  ├─ MainView.svelte
│  │  │  │  │  └─ TopBar.svelte
│  │  │  │  │
│  │  │  │  └─ forms/          ← Form inputs
│  │  │  │     ├─ TextField.svelte
│  │  │  │     ├─ Select.svelte
│  │  │  │     └─ Checkbox.svelte
│  │  │  │
│  │  │  ├─ state/             ← State management
│  │  │  │  ├─ app.svelte.ts  ← Global app state
│  │  │  │  ├─ file.svelte.ts ← File operations
│  │  │  │  ├─ user.svelte.ts ← User/auth state
│  │  │  │  └─ ui.svelte.ts   ← UI state (modals, etc)
│  │  │  │
│  │  │  ├─ server/            ← Server-side utilities
│  │  │  │  ├─ db.ts           ← SQLite client
│  │  │  │  ├─ webdav.ts       ← WebDAV API
│  │  │  │  ├─ yjs.ts          ← Yjs management
│  │  │  │  ├─ auth.ts         ← Authentication
│  │  │  │  ├─ permissions.ts  ← Permission checks
│  │  │  │  ├─ logger.ts       ← Structured logging
│  │  │  │  └─ hocuspocus.ts   ← WebSocket server
│  │  │  │
│  │  │  ├─ utils/             ← Frontend utilities
│  │  │  │  ├─ permissions.ts  ← has(PERMISSION.X)
│  │  │  │  ├─ validators.ts   ← Input validation
│  │  │  │  ├─ formatters.ts   ← Date, number formatting
│  │  │  │  ├─ debounce.ts     ← Debounce function
│  │  │  │  ├─ requests.ts     ← API calls
│  │  │  │  └─ extensions/     ← Tiptap extensions
│  │  │  │     ├─ Variable.ts
│  │  │  │     └─ FileLink.ts
│  │  │  │
│  │  │  ├─ config/            ← Configuration
│  │  │  │  ├─ constants.ts    ← App constants
│  │  │  │  ├─ permissions.ts  ← Permission definitions
│  │  │  │  └─ themes.ts       ← Color themes
│  │  │  │
│  │  │  ├─ language/          ← i18n
│  │  │  │  ├─ de.json
│  │  │  │  ├─ en.json
│  │  │  │  └─ index.ts        ← Language switcher
│  │  │  │
│  │  │  └─ assets/            ← Static assets
│  │  │     ├─ fonts/
│  │  │     ├─ icons/          ← SVG icons
│  │  │     └─ images/
│  │  │
│  │  ├─ routes/               ← SvelteKit pages
│  │  │  ├─ +layout.svelte     ← Root layout
│  │  │  ├─ +layout.server.ts  ← Root server logic
│  │  │  ├─ layout.css         ← Global styles
│  │  │  │
│  │  │  ├─ (main)/            ← Authenticated pages
│  │  │  │  ├─ +page.svelte    ← Dashboard
│  │  │  │  ├─ +page.server.ts
│  │  │  │  └─ [fileId]/       ← File editor
│  │  │  │     ├─ +page.svelte
│  │  │  │     └─ +page.server.ts
│  │  │  │
│  │  │  ├─ (organisation)/    ← Org public pages
│  │  │  │  ├─ +page.svelte    ← Org home/preview
│  │  │  │  └─ event/
│  │  │  │     └─ [eventId]/
│  │  │  │
│  │  │  ├─ api/               ← Server API routes
│  │  │  │  ├─ files/
│  │  │  │  │  ├─ +server.ts   ← POST (create), GET (list), DELETE (trash)
│  │  │  │  │  └─ [fileId]/    ← Single file CRUD
│  │  │  │  │
│  │  │  │  ├─ auth/
│  │  │  │  │  ├─ login/
│  │  │  │  │  ├─ logout/
│  │  │  │  │  └─ register/
│  │  │  │  │
│  │  │  │  ├─ permissions/
│  │  │  │  ├─ workspaces/
│  │  │  │  └─ users/
│  │  │  │
│  │  │  ├─ login/             ← Auth pages
│  │  │  │  └─ +page.svelte
│  │  │  │
│  │  │  └─ logout/
│  │  │     └─ +server.ts
│  │  │
│  │  └─ styles/              ← Global styles
│  │     ├─ app.css           ← Tailwind + global
│  │     ├─ main.css          ← Component styles
│  │     └─ dictionaries/     ← Tailwind config
│  │        └─ semantic-ink.css
│  │
│  ├─ static/                 ← Public files
│  │  └─ robots.txt
│  │
│  ├─ build/                  ← Build output (generated)
│  ├─ .svelte-kit/            ← SvelteKit cache (generated)
│  └─ node_modules/           ← Dependencies
│
├─ fsr-os_backup/            ← Previous version
│
├─ ../../cursorrules/              ← Documentation
│  ├─ cursorrules.md
│  ├─ docs_meta-schema.md
│  ├─ docs_rbac-security.md
│  └─ docs_webdav-sync.md
│
└─ Design/                   ← Design assets
```

---

## Component File Naming

- **Components:** `PascalCase.svelte` (e.g., `Button.svelte`)
- **Pages:** `+page.svelte` (SvelteKit convention)
- **Layouts:** `+layout.svelte` (SvelteKit convention)
- **Server:** `+server.ts` (SvelteKit API routes)
- **Utilities:** `camelCase.ts` (e.g., `permissions.ts`)

---

## State File Organization

### app.svelte.ts - Global State
```typescript
// Current file being edited
export let currentFileId = $state<string | null>(null);

// File tree cache
export let fileTree = $state<FileNode[]>([]);

// Currently logged-in user
export let currentUser = $state<User | null>(null);

// Network status
export let isOffline = $state(false);

// Last successful sync to WebDAV
export let lastSync = $state<Date | null>(null);
```

### file.svelte.ts - File Operations
```typescript
// Map of open file editors
export let openFiles = $state<Map<string, YDoc>>(new Map());

// File rename state
export let renamingFileId = $state<string | null>(null);

// File creation form state
export let newFileName = $state('');
```

### ui.svelte.ts - UI State
```typescript
// Sidebar visibility
export let sidebarOpen = $state(true);

// Modal dialogs
export let modals = $state({
  createFile: false,
  renameFile: false,
  settings: false
});

// Toast notifications
export let toasts = $state<Toast[]>([]);
```

### user.svelte.ts - Auth State
```typescript
// User session
export let session = $state<Session | null>(null);

// User permissions (cached)
export let permissions = $state<string[]>([]);

// User profile
export let profile = $state<UserProfile | null>(null);
```

---

## Server Routes Convention

### Files API
```
GET    /api/files                    → List files
POST   /api/files                    → Create file
GET    /api/files/[fileId]          → Get file
PUT    /api/files/[fileId]          → Update file
DELETE /api/files/[fileId]          → Delete file (to trash)
POST   /api/files/[fileId]/restore  → Restore from trash
```

### Auth API
```
POST   /api/auth/login              → Login
POST   /api/auth/logout             → Logout
POST   /api/auth/register           → Register new user
GET    /api/auth/me                 → Get current user
POST   /api/auth/refresh            → Refresh session
```

### WebSocket
```
WS     /socket                      → Hocuspocus WebSocket
         connects to document rooms
         e.g., ?docname=fileId_123
```

---

## CSS Organization

### Global Styles (src/styles/app.css)
```css
/* Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Global variables */
:root {
  --font-sans: 'Open Sans', system-ui, sans-serif;
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base resets */
* {
  @apply box-border;
}

body {
  @apply font-sans text-ink-900 bg-white;
}
```

### Component-Specific Styles (in .svelte file)
```svelte
<style>
  .button {
    @apply inline-flex items-center justify-center;
    @apply px-4 py-2 rounded-md;
    @apply bg-ink-50 text-ink-900;
    @apply hover:bg-ink-100 transition-colors;
  }
</style>
```

### Custom Tailwind Config (tailwind.config.js)
```javascript
export default {
  theme: {
    extend: {
      colors: {
        ink: {
          30: '#f9fafb',
          50: '#f3f4f6',
          100: '#e5e7eb',
          // ... etc
        }
      },
      fontFamily: {
        sans: ['Open Sans', 'system-ui']
      }
    }
  }
};
```

---

## API Response Format

**Success (200 OK):**
```json
{
  "success": true,
  "data": {
    "fileId": "fsr_abc123",
    "name": "My Document",
    "extension": ".fsrdoc"
  }
}
```

**Error (4xx/5xx):**
```json
{
  "success": false,
  "error": "File not found",
  "code": "FILE_NOT_FOUND",
  "details": {
    "fileId": "fsr_notexist"
  }
}
```

---

## Type Definition Strategy

### Shared Types (src/lib/types.ts)
```typescript
export interface FileNode {
  id: string;
  name: string;
  extension: string;
  parentId: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: string[];
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  teams: string[];
}

export interface Session {
  token: string;
  expiresAt: Date;
  user: User;
}
```

### App Types (src/app.d.ts)
```typescript
/// <reference types="@sveltejs/kit" />

declare global {
  namespace App {
    interface Locals {
      userId: string;
      session: Session;
      tenantId: string;
    }

    interface PageData {
      currentUser: User;
      permissions: string[];
    }

    interface PageState {
      query?: string;
    }
  }
}

export {};
```

---

## Environment Variables

### .env.local (local development)
```
PUBLIC_API_URL=http://localhost:5173
VITE_WS_URL=ws://localhost:5173
DATABASE_URL=file:./aidev.db
SCIEBO_ENDPOINT=https://sciebo-dev.example.de/remote.php/dav
LOG_LEVEL=debug
```

### .env.production
```
PUBLIC_API_URL=https://pharos.example.de
VITE_WS_URL=wss://pharos.example.de
DATABASE_URL=file:/var/lib/pharos/db.sqlite
SCIEBO_ENDPOINT=https://sciebo.nrw.de/remote.php/dav
LOG_LEVEL=info
```

---

## Build Outputs

After `npm run build`:

```
/build/
├─ client/                    ← Browser bundle
│  ├─ _app/
│  │  ├─ immutable/          ← Versioned assets
│  │  └─ version.json
│  └─ [route-files]/
│
├─ server/                    ← Node.js server bundle
│  ├─ index.js              ← Entry point
│  └─ chunks/
│
└─ robots.txt
```

---

## How to Find Things

**Looking for...** 
- Button component? → `src/lib/components/Button.svelte`
- Permission logic? → `src/lib/utils/permissions.ts`
- File upload handler? → `src/routes/api/files/+server.ts`
- Document viewer? → `src/lib/components/views/DocumentView.svelte`
- Global state? → `src/lib/state/app.svelte.ts`
- Authentication? → `src/routes/api/auth/...`
- WebDAV integration? → `src/lib/server/webdav.ts`
- Styling? → `src/styles/...` or component `<style>` block
