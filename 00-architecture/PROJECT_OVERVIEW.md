# PHAROS - Project Overview

## What is PHAROS?

**PHAROS** is a high-performance, real-time, GDPR-compliant cloud operating system designed for organizations (universities FSRs, student councils, event-driven organizations). It provides a Notion-like workspace experience without data lock-in or privacy violations.

### Core Principles ("North Star")

1. **Bring Your Own Storage (BYOS):** We are the "engine," the university is the "vault." We process data in real-time but never own it.
2. **Real-time or Nothing:** Every interaction—from dragging a card to editing a document—must feel instant and simultaneous.
3. **Institutional Privacy:** Built for the strict German GDPR landscape. Data lives in NRW, is processed in NRW, and stays under organizational control.
4. **Zero Configuration:** An organization should connect their Sciebo and have a functional workspace in under 60 seconds.

## Architecture Snapshot

```
┌─────────────────────────────────────────────────────────────┐
│                    PHAROS System                            │
├─────────────────────┬───────────────────────────────────────┤
│ Frontend (Svelte 5) │ Real-time Engine (Node.js + Yjs)     │
│                     │                                       │
│ • Components        │ • WebSocket Server                    │
│ • UI State ($state) │ • CRDT Synchronization                │
│ • Tiptap Editor     │ • Yjs Document Management             │
│ • Drag & Drop       │ • WebDAV Sync to Sciebo/Nextcloud     │
│ • File Tree         │ • SQLite Tenant Database              │
│                     │ • Permission Validation               │
├─────────────────────┴───────────────────────────────────────┤
│ Storage Layer: WebDAV (Sciebo/Nextcloud)                   │
│ • All org data stored securely                             │
│ • Server never owns data                                   │
│ • Full GDPR compliance                                     │
└─────────────────────────────────────────────────────────────┘
```

## Multi-Tenancy Model

- **Subdomain Isolation:** Each organization gets a unique subdomain (e.g., `fsr-design.pharos.de`)
- **Tenant Registration:** SQLite database on the server maps subdomains → tenant credentials
- **Cookie/Storage Isolation:** Subdomains ensure strict browser-level data isolation
- **Reverse Proxy:** Caddy/Nginx handles routing and auto-provisions SSL certificates

## Dual View Modes

### OS / Backend View
- Internal file directory system
- Authenticated members use tools (Kanban, tables, documents)
- Permissions, roles, and team management
- Guest access possible (configurable)

### Web Preview / Frontend View
- Stylized, public-facing website for the organization
- Uses organizational branding (logo, colors)
- Lists active events, public documents, helper rosters
- Stripe checkout integration for tickets

## Project Phase

**Currently:** In final webapp build using Svelte 5 + SvelteKit + Tailwind CSS. Switching to Claude Code for accelerated progress.

## Key Files Already Delivered

- `CLAUDE.md` - Design system, component architecture, critical rules
- `../../cursorrules/` - RBAC, WebDAV sync, meta-schema documentation
- `src/lib/components/` - Pre-built UI primitives (Button, NodeItem, TreeNodeItem)
- `src/lib/state/` - State management with Svelte 5 runes
- `src/lib/server/` - Backend logic, WebDAV integration

## Next Steps for Claude Code

1. **Implement missing components** based on file type handlers
2. **Build file rendering pipeline** (documents, spreadsheets, rosters, tasks, events)
3. **Implement drag-and-drop** with proper permission checks
4. **Complete API endpoints** for file operations
5. **Finalize WebDAV sync** and conflict resolution
6. **Security hardening** (CSP, input validation, session management)
