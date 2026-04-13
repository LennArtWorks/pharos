# PHAROS - Technology Stack

## Frontend

### Core Framework
- **Svelte 5** (Latest, with strict rune usage)
  - `$state` for reactive variables
  - `$derived` for computed values
  - `$effect` for side effects
  - `$props` for component props
- **SvelteKit** (Meta-framework for routing and server-side logic)
- **Tailwind CSS v4** (Semantic ink/level system)

### Key Dependencies
- **Tiptap** (`@tiptap/core`, `@tiptap/*/extension-*`)
  - Headless rich-text editor
  - Mapped to collaborative documents
  - Custom nodes for variables and embeds

- **Yjs** (`yjs`)
  - Conflict-free Replicated Data Type (CRDT)
  - Real-time document synchronization
  - Peer awareness for live cursors/typing indicators

- **Hocuspocus** (`@hocuspocus/provider`, `@hocuspocus/server`)
  - WebSocket provider for Yjs
  - Real-time sync bridge between clients and server

- **Tabler Icons** (`@tabler/icons-svelte`)
  - Pre-built icon set (can map custom Figma icons)

### UI/UX
- **Drag & Drop:** Custom implementation or `svelte-dnd-action`
- **Icons:** Custom `Icon.svelte` component mapped to Figma
- **Theme System:** Tailwind semantic color levels (ink-30 to ink-900)

---

## Backend

### Runtime
- **Node.js** (Stateful VPS via SvelteKit adapter)
- **Adapter:** `@sveltejs/adapter-node` (for production deployment)

### Core Libraries
- **@hocuspocus/server** (`@hocuspocus/server`)
  - Receives WebSocket connections
  - Broadcasts Yjs updates to all connected clients
  - Manages session lifecycle

### Storage & Persistence
- **WebDAV Client** (Node.js library or custom HTTP client)
  - Talks to Sciebo/Nextcloud
  - Uploads/downloads Yjs documents as JSON or binary
  - Handles file operations (MOVE, COPY, DELETE)

- **SQLite** (`better-sqlite3`)
  - Lightweight local database on the VPS
  - Stores tenant credentials (encrypted)
  - Session management
  - Audit logs

- **Encryption** (`crypto` module + AES-256-GCM)
  - Encrypts sensitive files at rest (e.g., `accounts.fsrsecure`)
  - Decrypts only in server memory for authentication

### Utilities
- **tsup** - Fast bundler for backend code
- **tsx** - TypeScript execution for Node.js

---

## Development & Deployment

### Build Tools
- **Vite** (Dev server, HMR)
- **SvelteKit Sync** (Route generation, type safety)
- **TypeScript** (Type safety)

### Code Quality
- **ESLint** (Code linting with SvelteKit/Svelte rules)
- **Prettier** (Code formatting)
  - Includes Svelte and Tailwind CSS plugin support
- **Svelte Check** (Type-checking)

### Infrastructure
- **Reverse Proxy:** Caddy or Nginx
  - Subdomain routing for multi-tenancy
  - Auto SSL certificate provisioning
  - Environment isolation

- **Docker** (For packaging + deployment)
  - Read-only root filesystem for security
  - Health checks for availability

- **SSL/TLS:** Automatic via Caddy/Nginx

---

## Real-Time Architecture

### Data Flow (Simplified)

```
Browser1               Server (Hocuspocus)        WebDAV (Sciebo)
  |                          |                          |
  |--- WebSocket Connect -----|                          |
  |                           |---- Load .json File ----→
  |                           |← Returns CRDT State ----←
  |← Ack + Yjs State ---------|                          |
  |                           |                          |
  | User edits text          |                          |
  |------ Yjs Update ------→ |                          |
  |                           |--- Broadcast to All ----→ Browser2
  |                           |                          |
  | (Every 30 seconds)       |                          |
  |                           |------ Save to WebDAV -→ |
  |                           |← Ack ----------------←  |
  |                           |                          |
```

### Syncing Strategy
- **In-Memory State:** Yjs documents loaded into server RAM
- **Periodic Flush:** Server writes RAM state to WebDAV every ~30 seconds (configurable)
- **On Close:** Final state saved when last client disconnects
- **Recovery:** On server restart, latest file re-loaded from WebDAV

---

## File Formats & Types

All FSR-OS files use custom extensions starting with `.fsr`:

- `.fsrdoc` - Rich-text documents
- `.fsrtasks` - Kanban/List boards
- `.fsrtable` - Spreadsheets/grids
- `.fsrroster` - Shift sign-up sheets
- `.fsrevt` - Event metadata
- `.fsrform` - Survey/form files
- `.fsrchat` - Chat logs
- `.fsrcheckout` - Stripe payment forms

Plus standard binary formats:
- `.jpg`, `.png`, `.svg`, `.pdf`, `.zip`, `.docx`

---

## Database Schema (SQLite)

### Tables (Planned)
- `tenants` - Organization registrations
- `sessions` - User sessions
- `audit_log` - GDPR audit trail
- `file_versions` - Version history metadata
- `permissions_cache` - Cached permission checks

---

## Security & Compliance

### GDPR Features
- **Data Partitioning:** Caching based on sensitivity
- **Encryption:** AES-256-GCM for sensitive files
- **Read-Only Filesystem:** Docker container prevents disk writes
- **Stateless:** All state in RAM (lost on restart)
- **Access Logs:** SQLite audit trail

### Authentication Methods Supported
- Local (email + password)
- SSO (Google, Oauth 2.0)
- Magic links
- LDAP (future)

---

## Performance Targets

- Page load: < 2 seconds
- Collaborative edit broadcast: < 100ms
- WebDAV sync: Background, non-blocking
- Real-time awareness updates: Instant (via WebSockets)

---

## Deployment Architecture

### Single Instance (Phase 1 - Current)
- One central VPS (e.g., Netcup VPS 1000)
- Multi-tenant via subdomains
- Caddy reverse proxy + Node.js app

### Future Scaling (Phase 2)
- Load balancer
- Multiple Node.js instances
- Shared Redis for session store
- Distributed Yjs awareness
