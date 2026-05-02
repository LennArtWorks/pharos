# PHAROS - Technical Status & Dependencies

## Current Implementation Status

### ✅ Completed (Foundation)

#### Frontend Architecture
- [x] SvelteKit project setup + configuration
- [x] Tailwind CSS integration (semantic ink system)
- [x] Svelte 5 rune patterns documented
- [x] Component system foundation (Button, Icon primitives)
- [x] Routing structure (authenticated vs. public)
- [x] State management framework ($state, $derived, $effect)

#### Backend Foundation
- [x] Node.js/Express server setup (via SvelteKit adapter)
- [x] Authentication structure (login/logout endpoints)
- [x] Session management (JWT/secure cookies)
- [x] Database schema (SQLite, better-sqlite3)
- [x] Environment configuration (.env support)

#### Real-Time Infrastructure
- [x] Hocuspocus WebSocket server setup
- [x] Yjs document management
- [x] Tiptap editor integration (basic)
- [x] Awareness protocol (cursor positions, typing indicators)

#### WebDAV/Sciebo Integration
- [x] WebDAV client library selection
- [x] OAuth credentials storage (encrypted in SQLite)
- [x] Basic file upload/download structure
- [x] Tenant routing setup

---

### 🔄 In Progress (50% Complete)

#### File System Implementation
- [x] meta.fsrsys index structure defined
- [x] File ID generation system
- [x] Permission model (roles.fsrsys, accounts.fsrsys)
- [ ] **IN PROGRESS:** Tree rendering with drag-and-drop
- [ ] **IN PROGRESS:** File rename/move operations
- [ ] **TODO:** Version history tracking

#### File Type Views
- [x] View component structure planned (ContentRoot dynamic registry)
- [x] **DONE:** ContentTypeFolder.svelte — grid view of children, double-click to navigate
- [x] **DONE:** ContentTypeWorkspace.svelte — grid view of children, double-click to navigate
- [x] **DONE:** ContentTypeDocument.svelte (Tiptap + Yjs binding, awareness, bubble menu)
- [x] **DONE:** ContentTypePreview.svelte (PDF, images)
- [ ] **TODO:** ContentTypeTasks.svelte (Kanban board, .fsrtasks)
- [ ] **TODO:** TableView.svelte (Spreadsheet grid)
- [ ] **TODO:** RosterView.svelte (Shift sign-ups)
- [ ] **TODO:** EventView.svelte (Event metadata display)

#### API Routes
- [x] Route structure created (`src/routes/api/`)
- [ ] **TODO:** `GET /api/files` - List files tree
- [ ] **TODO:** `POST /api/files` - Create file
- [ ] **TODO:** `PUT /api/files/[fileId]` - Update file metadata
- [ ] **TODO:** `DELETE /api/files/[fileId]` - Delete (trash)
- [ ] **TODO:** `POST /api/files/[fileId]/restore` - Restore from trash

#### Permission System
- [x] Permission constants defined (PERMISSIONS object)
- [x] Role hierarchy documented (Admin > Member > Guest > Anonymous)
- [x] `has(PERMISSION.X)` utility outlined
- [ ] **TODO:** Database queries with permission filtering
- [ ] **TODO:** Frontend permission checks in all components
- [ ] **TODO:** Backend permission validation in all API routes

#### WebDAV Sync
- [ ] **TODO:** Load .fsrdoc from Sciebo JSON
- [ ] **TODO:** Deserialize JSON → Yjs document
- [ ] **TODO:** Serialize Yjs → JSON and save back
- [ ] **TODO:** Periodic sync (every 30 seconds)
- [ ] **TODO:** Conflict resolution strategy

---

### ❌ Not Started (0% Complete)

#### Search & Global Features
- [ ] Global search (Cmd+K command palette)
- [ ] Cross-file variables ($budget, $event_date)
- [ ] File linking (fsr://[file_id])
- [ ] File previews on hover

#### Advanced Features
- [ ] Stripe checkout integration
- [ ] Form builder (fsrform)
- [ ] Chat file type (fsrchat)
- [ ] Template duplication
- [ ] Plugin architecture

#### Deployment & DevOps
- [ ] Docker container setup
- [ ] Caddy reverse proxy configuration
- [ ] SSL certificate auto-provisioning
- [ ] Health check endpoints
- [ ] Monitoring & logging (ELK/CloudWatch)

#### GDPR Tooling
- [ ] Data export API (right to data portability)
- [ ] Account deletion pipeline (right to erasure)
- [ ] Audit log queries
- [ ] Breach notification system
- [ ] Data retention policies (auto-delete old logs)

---

## Dependency Chain (What Blocks What)

```
START
  ├─ ✅ Basic Auth (login/logout)
  │   └─ ✅ Session management
  │
  ├─ ✅ WebDAV connection (OAuth credentials)
  │   ├─ 🔄 Load meta.fsrsys (file tree index)
  │   │   └─ 🔄 Render file tree UI + drag-and-drop
  │   │       └─ ❌ File rename/move operations
  │   │           └─ ❌ WebDAV MOVE + update meta.fsrsys
  │   │
  │   └─ ❌ Load .fsrdoc files from WebDAV
  │       └─ ❌ Deserialize JSON → Yjs document
  │           └─ ❌ Bind Tiptap to Yjs (DocumentView)
  │               └─ ❌ Periodic save back to WebDAV
  │
  ├─ ✅ Hocuspocus WebSocket server
  │   ├─ ✅ Yjs document persistence (RAM)
  │   └─ ✅ Awareness protocol
  │       └─ ❌ Multi-client editing demo
  │
  ├─ ❌ Permission validation
  │   ├─ ❌ Load roles.fsrsys (role definitions)
  │   ├─ ❌ Load user profile (assigned roles)
  │   └─ ❌ has(PERMISSION.X) returns true/false
  │       ├─ ❌ All API routes call has() before executing
  │       └─ ❌ All UI components show/hide based on has()
  │
  ├─ ❌ API Routes
  │   ├─ ❌ GET /api/files → List tree with permission filtering
  │   ├─ ❌ POST /api/files → Create file
  │   ├─ ❌ DELETE /api/files/[id] → Move to trash
  │   └─ ❌ POST /api/files/[id]/restore → Restore
  │
  └─ ❌ File Type Handling
      ├─ ❌ DocumentView.svelte (fsrdoc)
      ├─ ❌ TasksView.svelte (fsrtasks)
      ├─ ❌ TableView.svelte (fsrtable)
      ├─ ❌ RosterView.svelte (fsrroster)
      └─ ❌ EventView.svelte (fsrevt)

MILESTONE: "First document can be created, edited real-time, saved"
  └─ MILESTONE: "All file types working"
      └─ MILESTONE: "Drag-and-drop, rename, permissions"
          └─ MILESTONE: "Multi-org production ready"
```

---

## Critical Path to MVP

### Phase 1: Single Document Editing (Week 1-2)
1. Get `DocumentView.svelte` working with Tiptap + Yjs
2. Load .fsrdoc from Sciebo WebDAV
3. Save changes back to WebDAV (every 30 seconds)
4. **Result:** User can create, edit, save a document in real-time

### Phase 2: File Tree & Navigation (Week 2-3)
1. Render file tree from meta.fsrsys
2. Click to open different files
3. Rename files (update meta.fsrsys, no WebDAV MOVE)
4. **Result:** Full UI navigation + multi-document workspace

### Phase 3: Permissions (Week 3-4)
1. Load roles.fsrsys + user profile
2. Implement `has(PERMISSION.X)` check
3. Add permission validation to all API routes
4. Hide/disable UI elements based on permissions
5. **Result:** Multi-user access control working

### Phase 4: Additional File Types (Week 4-6)
1. TasksView.svelte (Kanban board)
2. TableView.svelte (Spreadsheet grid)
3. RosterView.svelte (Shift sign-ups)
4. **Result:** Diverse file type ecosystem

### Phase 5: Polish & Deploy (Week 6-8)
1. Error handling & edge cases
2. Performance optimization
3. Docker setup + deployment
4. Security hardening
5. **Result:** Ready for beta launch

---

## Technology Stack Verification

### Frontend Dependencies (npm list)
```
✅ svelte@5.51.0
✅ sveltekit@2.50.2
✅ tailwindcss@4.1.18
✅ @tiptap/core@3.20.1
✅ @tiptap/extension-* (multiple)
✅ yjs@13.x
✅ @hocuspocus/provider@3.4.4
✅ @tabler/icons-svelte@3.37.1
✅ TypeScript@5.9.3
❓ Need: svelte-dnd-action (drag-drop library - install if needed)
❓ Need: date-fns (date formatting - install if needed)
```

### Backend Dependencies
```
✅ @sveltejs/adapter-node@5.5.4
✅ @hocuspocus/server@3.4.4
✅ better-sqlite3@9.x (Or use sqlite3 package)
❓ Need: @hapi/boom (HTTP errors - check existing)
❓ Need: joi (validation - check existing)
❓ Need: crypto module (built-in Node.js, no install)
❓ Need: node-webdav or similar (WebDAV client)
```

### Missing Dependencies to Install
```bash
npm install svelte-dnd-action date-fns
npm install --save-dev @types/node
# WebDAV client - choose one:
# npm install node-webdav
# OR
# npm install webdav
# OR
# npm install davinci
```

---

## File Size & Performance Targets

### Bundle Size Targets
- **Client JS:** < 200KB (gzipped)
- **Tailwind CSS:** < 50KB (gzipped)
- **Total:** < 300KB (gzipped)

### Runtime Performance
- **Page load:** < 2 seconds
- **File tree render:** < 500ms (100+ items)
- **Document open:** < 1 second (re-render + WebDAV load)
- **Edit broadcast:** < 100ms (WebSocket round-trip)
- **WebDAV sync:** Non-blocking (background thread)

### Memory Usage
- **Server:** Expect ~100MB base + 1MB per open document (Yjs in RAM)
- **Client:** Expect ~50MB base + 10MB per open tab

---

## Testing Requirements

### Unit Tests (Vitest)
- [ ] Utility functions (formatters, validators, permissions)
- [ ] State management ($state, $derived logic)
- [ ] Permission checking logic (has() function)

### Component Tests (Svelte Testing Library)
- [ ] Button.svelte (tagName prop variations)
- [ ] NodeItem.svelte (extension stripping)
- [ ] TreeNodeItem.svelte (drag-drop, recursion)
- [ ] DocumentView.svelte (Yjs binding)

### Integration Tests
- [ ] Create file → load → edit → save
- [ ] Multi-user real-time editing
- [ ] Permission-based access control
- [ ] File deletion + restore

### E2E Tests (Playwright)
- [ ] Full user workflow (login → create → edit → invite → close)
- [ ] Offline sync (disconnect WebSocket, make edits, reconnect)
- [ ] Permission enforcement (guest user tries admin action)

---

## Code Quality Standards

### Linting (ESLint)
```bash
npm run lint
# Fix: npm run format
```

**Rules:**
- No unused variables
- No `console.log` in production code
- Proper error handling (no unhandled promises)
- Svelte-specific rules (rune usage, component nesting)

### Type Safety (TypeScript)
```bash
npm run check
# Don't commit code with type errors
```

**Requirements:**
- All functions typed (params + return)
- No `any` types (use `unknown` if needed)
- Component props strict (interface with `$props`)

### Code Formatting (Prettier)
```bash
npm run format
# Runs before every commit (husky git hook)
```

---

## Environment Configuration

### Development (.env.local)
```
VITE_API_URL=http://localhost:5173
VITE_WS_URL=ws://localhost:5173
DATABASE_URL=file:./aidev.db
SCIEBO_ENDPOINT=https://sciebo-test.example.de/remote.php/dav
LOG_LEVEL=debug
NODE_ENV=development
```

### Production (.env.production)
```
VITE_API_URL=https://pharos.example.de
VITE_WS_URL=wss://pharos.example.de
DATABASE_URL=file:/var/lib/pharos/db.sqlite
SCIEBO_ENDPOINT=https://sciebo.uni.de/remote.php/dav
LOG_LEVEL=info
NODE_ENV=production
```

---

## Known Limitations & TODOs

### Architectural
- [ ] Single server node (redundancy/failover not implemented)
- [ ] No distributed Yjs sync (Hocuspocus in-memory only)
- [ ] No load balancer (single VPS only)
- [ ] No database replication (SQLite single file)

### Features
- [ ] No real-time awareness across different browser tabs (same browser)
- [ ] No conflict markers for simultaneous edits to same line
- [ ] No edit suggestions or AI corrections
- [ ] No time-travel/undo across sessions

### Privacy/Security
- [ ] No field-level encryption (only file-level)
- [ ] No audit log deletion with data retention policies (TODO)
- [ ] No automatic right-to-erasure (manual process)
- [ ] No compliance reporting dashboard

### DevOps
- [ ] No automated backups
- [ ] No disaster recovery testing
- [ ] No synthetic monitoring (uptime checks)
- [ ] No rate limiting on API endpoints

---

## Getting Help

### Code-Related Questions
Check these docs:
1. `DEVELOPMENT_GUIDE.md` - How to code in this project
2. `../CLAUDE.md` - Component rules & patterns
3. `FILE_STRUCTURE.md` - Where to find things

### Architecture Questions
Check:
1. `ARCHITECTURE.md` - System design
2. `../../cursorrules/docs_meta-schema.md` - File format specifics
3. `../../cursorrules/docs_webdav-sync.md` - Sync details

### Privacy/Compliance Questions
Check:
1. `GDPR_COMPLIANCE.md` - Privacy & security
2. `../../cursorrules/docs_rbac-security.md` - Permission model

### Live Examples
- Existing component: `src/lib/components/Button.svelte`
- Existing server code: `src/hooks.server.ts`
- Existing route: `src/routes/+layout.server.ts`

---

## Success Criteria

By end of this phase, you'll know success when:

- [ ] Can create a new .fsrdoc file
- [ ] Can open it and see content in Tiptap editor
- [ ] Edits appear real-time in editor
- [ ] Changes persist to Sciebo WebDAV
- [ ] File appears in tree view (live update)
- [ ] Multi-user editing doesn't lose data (Yjs CRDT)
- [ ] User without edit permission sees document as read-only
- [ ] Admin can rename files without WebDAV moves
- [ ] Can switch between multiple open files
- [ ] Memory usage stays under control (no leaks)

Good luck! 🚀
