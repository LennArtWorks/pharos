# PHAROS — Project Overview

## What Is PHAROS?

PHAROS is a high-performance, real-time, GDPR-compliant cloud operating system designed for organizations: university student councils (FSRs), academic departments, event-driven teams. It delivers a Notion-like workspace experience — without data lock-in, without privacy violations, and with genuine German GDPR compliance.

---

## North Star Principles

These four principles are non-negotiable. Every architectural decision must serve them.

### 1. Bring Your Own Storage (BYOS)
We are the "engine," the university is the "vault." PHAROS processes data in real-time but never owns it. All organizational data lives on their Sciebo/Nextcloud — under their control, governed by their institutional agreements with the university IT.

### 2. Real-Time or Nothing
Every interaction must feel instant and simultaneous. Dragging a card, editing a document, assigning a team member — all must broadcast to other connected users in under 100ms. Batch sync jobs and polling are not acceptable for interactive operations.

### 3. Institutional Privacy
Built for the strict German GDPR (DSGVO) landscape. Data lives in NRW, is processed in NRW, and stays under the organization's control. PHAROS holds no organizational data long-term — only session tokens and audit logs (SQLite, auto-expire). See [architecture/GDPR_COMPLIANCE.md](../architecture/GDPR_COMPLIANCE.md).

### 4. Zero Configuration
An organization should connect their Sciebo and have a functional workspace in under 60 seconds. No database migrations, no file format conversions, no onboarding wizard. Connect credentials → sync → work.

---

## Architecture Snapshot

```
┌──────────────────────────────────────────────────────────┐
│                   PHAROS System                          │
├────────────────────┬─────────────────────────────────────┤
│  Browser (Svelte 5)│  Node.js Server                     │
│                    │                                      │
│  • Components      │  • SvelteKit API routes             │
│  • UI State        │  • Hocuspocus WebSocket              │
│  • Tiptap Editor   │  • Yjs document management          │
│  • File Tree       │  • WebDAV sync to Sciebo            │
│  • Calendar        │  • SQLite (tenants, sessions, audit) │
│                    │  • Permission validation             │
├────────────────────┴─────────────────────────────────────┤
│  Storage: WebDAV (Sciebo / Nextcloud)                    │
│  • meta.appsys      — file tree index                    │
│  • dates.appsys     — calendar dates                     │
│  • roles.appsys     — RBAC config                        │
│  • accounts.appsys.appsecure — encrypted auth registry   │
│  • {id}.appdoc      — collaborative documents            │
└──────────────────────────────────────────────────────────┘
```

---

## Multi-Tenancy

Each organization gets a unique subdomain (e.g., `fsr-design.pharos.de`). Tenants are fully isolated:
- Browser cookies isolated at subdomain level
- Separate WebDAV root directory per org
- SQLite queries always include `WHERE tenant_id = ?`
- RAM cache keyed by `organisation_id`

Adding a new org = registering credentials in SQLite. No code changes, no deployments.

---

## Dual View Modes (Planned)

### OS / Backend View (current focus)
Internal file directory system. Authenticated members use tools (documents, Kanban, calendar). Permission-gated. This is what's built.

### Web Preview / Public View (future)
Stylized public-facing website for the organization. Lists events, public documents. Uses organizational branding. Stripe checkout integration for event tickets.

---

## Project Phase

**Current:** Working MVP. Core infrastructure complete. Main feature set functional (file system, calendar, documents, permissions, settings). Building out remaining content types and polish.

**Completion estimates (May 2026):**
- Frontend: ~75%
- Backend: ~70%
- Real-time (Yjs/Hocuspocus): ~75%
- GDPR/Security: ~60% (framework in place; data export/deletion APIs pending)

→ See [project/STATUS.md](./STATUS.md) for detailed phase breakdown.
→ See [project/BACKLOG.md](./BACKLOG.md) for what's next.
