# PHAROS - Claude Code Quick Start Guide

Welcome to PHAROS! This is a GDPR-compliant, real-time cloud operating system for organizations. Below is a curated reading path to get you oriented quickly.

## 📚 Reading Path (In This Order)

### 1. **PROJECT_OVERVIEW.md** (5 min read)
Start here to understand WHAT PHAROS is and WHY it exists.
- Core principles (BYOS, real-time, privacy, zero-config)
- Architecture snapshot
- Current development phase

### 2. **ARCHITECTURE.md** (10 min read)
Understand HOW the system is built.
- File system structure (WebDAV, meta.fsrsys)
- ID-only naming convention
- Real-time collaboration flow
- Tenant isolation model

### 3. **TECH_STACK.md** (5 min read)
Know the technologies and dependencies.
- Frontend: Svelte 5, SvelteKit, Tailwind CSS, Tiptap, Yjs
- Backend: Node.js, Hocuspocus, SQLite, WebDAV
- Real-time data flow diagram

### 4. **DEVELOPMENT_GUIDE.md** (15 min read)
Mandatory for writing code!
- Svelte 5 rune usage ($state, $derived, $effect, $props)
- Component architecture (Button, NodeItem, TreeNodeItem, Icon)
- Permission system (has(PERMISSIONS.X))
- File type handlers (DocumentView, TasksView, etc.)
- State management pattern
- API integration pattern
- Common pitfalls to avoid

### 5. **FILE_STRUCTURE.md** (5 min read)
Understand where everything lives.
- Project directory tree
- Component file naming conventions
- State file organization
- Server routes convention
- How to find things

### 6. **GDPR_COMPLIANCE.md** (10 min read - Skim for Context)
Understanding privacy architecture.
- Core principle: PHAROS doesn't own data
- Three-tier permission system
- Encryption and security measures
- User rights (access, deletion, portability)

### 7. **CLAUDE.md** (3 min reference)
In the fsr-os folder - design system & critical rules.
- Component rules (Button.svelte tagName prop)
- File system logic (extension stripping)
- Permissions utility

## 🎯 Key Concepts to Internalize

### Real-Time Collaboration
PHAROS uses **Yjs CRDTs** (Conflict-free Replicated Data Types). Multiple users editing simultaneously → all changes merge automatically with zero data loss. Changes broadcast via WebSocket < 100ms.

### BYOS (Bring Your Own Storage)
All organizational data lives on **their Sciebo/Nextcloud** (university servers). PHAROS is the "engine" (Node.js server in memory), not the vault. On restart, data is reloaded from WebDAV.

### Multi-Tenancy via Subdomains
Each organization gets a unique subdomain (e.g., `fsr-design.pharos.de`). Browser cookies/storage isolated at domain level. Database queries always filtered by `tenant_id`.

### ID-Only File Naming
Files on WebDAV are named by ID only (`1771675444568.fsrdoc`). Human-readable names stored in `meta.fsrsys` (the file index). Renaming = metadata update (no WebDAV MOVE command).

### Permission Model
Three-tier:
1. **Global roles** (Admin, Member, Guest, Anonymous) defined in `roles.fsrsys`
2. **Role inheritance** (Admin ⊃ Member ⊃ Guest)
3. **Workspace/file overrides** (specific users get special access)

Check permissions with: `has(PERMISSIONS.FILE_EDIT)`

## 🚀 First Tasks for Claude Code

### Task 1: Implement DocumentView Component
- Renders `.fsrdoc` files
- Binds Tiptap editor to Yjs Y.XmlFragment
- Shows live cursor positions from other users
- **Dependency:** `src/lib/components/views/DocumentView.svelte` doesn't exist yet

### Task 2: Implement TasksView Component
- Renders `.fsrtasks` files (Kanban boards)
- Data model: Y.Map with column IDs → Y.Array of task objects
- Drag-and-drop cards between columns
- **Dependency:** `src/lib/components/views/TasksView.svelte` doesn't exist yet

### Task 3: Complete API Routes
- `GET /api/files` - List files (filter by parent, apply permissions)
- `POST /api/files` - Create new file
- `DELETE /api/files/[fileId]` - Move to trash
- All must validate `has(PERMISSIONS.X)` on backend

### Task 4: WebDAV Sync Implementation
- Load `.fsrdoc` files from Sciebo
- Deserialize JSON → Yjs document
- Periodically save Yjs state back to WebDAV
- Handle conflicts gracefully

### Task 5: File Tree Rendering
- Load `meta.fsrsys` index
- Render hierarchical file tree in sidebar
- Support drag-and-drop (move files between folders)
- Show permission locks on restricted folders

## 🔧 Development Setup

### Prerequisites
```bash
node --version  # v20+
npm --version   # v10+
```

### Getting Started
```bash
cd /Users/lennartahlfeldt/Desktop/temp/dev/02-FSR-OS/fsr-os

# Install dependencies
npm install

# Start dev server
npm run dev

# In another terminal, build types
npm run check

# Format & lint
npm run format
```

### Access Local App
- Frontend: http://localhost:5173
- API: http://localhost:5173/api/...
- WebSocket: ws://localhost:5173/socket

## ⚠️ Critical Rules (Non-Negotiable)

### 1. Svelte 5 Runes (MANDATORY)
```
✓ GOOD: let count = $state(0);
✗ BAD: let count = 0; (not reactive)

✓ GOOD: let doubled = $derived(count * 2);
✗ BAD: let doubled = count * 2; (not reactive)

✓ GOOD: $effect(() => { localStorage.set(count); });
✗ BAD: onMount(() => { ... }); (use $effect)
```

### 2. Button Nesting (MANDATORY)
```
✗ BAD: <a href="/open"><button onclick={...}>Delete</button></a>
        (illegal HTML: button inside anchor)

✓ GOOD: <Button tagName="a" href="/open">Open</Button>
        (uses div, not nesting)

✓ GOOD: <Button tagName="button" onclick={...}>Delete</Button>
        (pure button)
```

### 3. Permission Checks (MANDATORY)
```
✓ GOOD (Frontend UX): {#if has(PERMISSIONS.FILE_EDIT)}...{/if}
✓ GOOD (Backend Security): if (!has(PERMISSIONS.FILE_EDIT)) return 403;
✗ BAD: Showing edit button without backend permission check
       (Users could bypass frontend, make direct API calls)
```

### 4. File Extension Handling (MANDATORY)
```
✓ GOOD: 
  let displayName = "document";  // Show without extension
  let apiName = "document.fsrdoc"; // Send with extension

✗ BAD:
  let name = "document.fsrdoc";  // Confuse UI rendering
  // API call with name (might lose extension)
```

## 📖 Documentation Files Available

All in `/Users/lennartahlfeldt/Desktop/temp/dev/02-FSR-OS/`:

1. **PROJECT_OVERVIEW.md** - High-level intro
2. **TECH_STACK.md** - Technologies & deps
3. **ARCHITECTURE.md** - System design deep-dive
4. **DEVELOPMENT_GUIDE.md** - How to code (in this project)
5. **FILE_STRUCTURE.md** - Where things live
6. **GDPR_COMPLIANCE.md** - Privacy & security
7. **../CLAUDE.md** - Component-specific rules
8. **../../cursorrules/docs_*.md** - Detailed domain docs (RBAC, WebDAV, meta-schema)

## 🆘 When Stuck

1. **Component question?** → See `DEVELOPMENT_GUIDE.md` + `../CLAUDE.md`
2. **File system question?** → See `ARCHITECTURE.md` + `FILE_STRUCTURE.md`
3. **Permission question?** → See `../../cursorrules/docs_rbac-security.md`
4. **WebDAV sync question?** → See `../../cursorrules/docs_webdav-sync.md`
5. **Privacy question?** → See `GDPR_COMPLIANCE.md`

## 🎓 Learning Goal

After reading these docs, you should be able to:
- [ ] Explain PHAROS' core architecture (BYOS + real-time + GDPR)
- [ ] Build a new file type view (e.g., TableView)
- [ ] Implement an API route with permission checks
- [ ] Write Svelte 5 components using runes
- [ ] Understand how data flows from browser → server → WebDAV → Sciebo
- [ ] Explain why ID-only naming reduces sync conflicts
- [ ] Enforce permission model on both frontend (UX) and backend (security)

## 📊 Project Status

- **Frontend:** ~60% (components, UI, state management)
- **Backend:** ~40% (file operations, permissions, WebDAV sync)
- **Real-time (Yjs/Hocuspocus):** ~70% (infrastructure ready, needs views)
- **GDPR/Security:** ~80% (framework in place, needs hardening)

**Next 2-4 weeks:** Build out missing file type views + complete API routes.

---

**Questions?** Check the relevant doc file → search for keywords → if still unclear, inspect existing code examples in `src/lib/`.

Happy coding! 🚀
