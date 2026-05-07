# PHAROS — Cloud File Schemas

All system files live at `{org-webdav-root}/.config/`. The TypeScript files in `src/lib/config/cloudfiles/` are the canonical source of truth for each file's structure — this document provides a human-readable overview and links to them.

---

## The Lean JSON Principle

PHAROS stores only what cannot be computed from context. This keeps files small, decoupled from UI logic, and easy to migrate.

**Rules:**
- `id` is always the **map key**, never stored inside the value
- Fields like `uiFileType`, `physicalName`, `type` are computed at runtime in SvelteKit — never stored
- Optional fields are omitted when empty/undefined (no `null` placeholders)

---

## meta.appsys — File Tree Index

**Source of truth:** [`src/lib/config/cloudfiles/meta.ts`](../../src/lib/config/cloudfiles/meta.ts)  
**TypeScript interface:** `AppMeta` in `src/lib/config/filesystem.ts`

The file tree index. Every file, folder, and workspace the org has is listed here. The UI renders the entire tree from this single file — no WebDAV directory listings needed.

```json
{
  "_meta": {
    "schemaVersion": "1.4",
    "lastUpdated": 1746700000000,
    "description": "Global index"
  },
  "nodes": {
    "{nodeId}": {
      "name": "Meeting Notes",
      "parentId": "{parentNodeId}",
      "extension": ".appdoc",
      "updatedAt": 1746700000000,
      "createdAt": 1746600000000,
      "isSecure": false,
      "isTemplate": false,
      "tags": [],
      "assignees": ["usr_abc123"],
      "customFields": {}
    }
  }
}
```

**Key behaviors:**
- Renaming a file = update `name` here only; no WebDAV MOVE
- Moving a file = update `parentId` here only; no WebDAV MOVE
- `extension` determines which content type component renders the file
- `assignees` is an array of user IDs (`usr_*` prefix)
- Workspaces have `extension: ".workspace"`, folders have `extension: ""`

---

## dates.appsys — Calendar Dates Index

**Source of truth:** [`src/lib/config/cloudfiles/dates.ts`](../../src/lib/config/cloudfiles/dates.ts)  
**TypeScript interface:** `AppDates`, `AppDate` in `src/lib/config/filesystem.ts`

All calendar dates live here — both standalone (floating) and attached to specific files (`targetNodeId` set). Flat structure, no hierarchy.

```json
{
  "_meta": {
    "schemaVersion": "1.0",
    "lastUpdated": 1746700000000,
    "description": "Floating dates index"
  },
  "dates": {
    "{dateId}": {
      "title": "FSR Meeting",
      "variant": "standard",
      "timestamp": 1746700000000,
      "timestampEnd": 1746707200000,
      "allDay": false,
      "description": "Monthly team sync",
      "location": "Room 3.14",
      "assignees": ["usr_abc123", "usr_def456"],
      "targetNodeId": "{nodeId}",
      "createdAt": 1746600000000
    }
  }
}
```

**Date variants:**
- `standard` — timeframe with optional end time; `timestampEnd` meaningful here
- `start` — single start date; `timestampEnd` must not be set
- `deadline` — single deadline; `timestampEnd` must not be set

**Attachment:** `targetNodeId` links a date to a VNode. Absent = floating/standalone date in the calendar.

---

## roles.appsys — RBAC Configuration

**Source of truth:** [`src/lib/config/cloudfiles/roles.ts`](../../src/lib/config/cloudfiles/roles.ts)

Defines what each role can do. Loaded on every authenticated request. Cached per-org in RAM (5-minute TTL).

```json
{
  "guestRole": "Guest",
  "newUserRole": "Member",
  "roles": {
    "Admin": ["*"],
    "Member": ["workspace.create", "files.*", "interaction.*"],
    "NewUser": ["files.read", "interaction.book_shifts", "interaction.submit_forms"],
    "Guest": ["files.read", "interaction.submit_forms"]
  }
}
```

**Permission flag format:** `{scope}.{action}` or `{scope}.*` for wildcard.  
**All flags defined in:** `src/lib/config/permissions.ts`

Wildcard matching is hierarchical: `files.*` covers `files.edit`, `files.read`, `files.delete`, etc. The `*` flag grants everything (Admin shortcut).

---

## accounts.appsys.appsecure — Master Auth Registry

**Source of truth:** [`src/lib/config/cloudfiles/accounts.ts`](../../src/lib/config/cloudfiles/accounts.ts)

**Encrypted** with AES-256-GCM before being written to WebDAV. Decrypted only in server memory during authentication. Never logged, never cached beyond 1 minute.

```json
{
  "_meta": {
    "schemaVersion": "1.0",
    "lastUpdated": 1746700000000
  },
  "identities": {
    "user@example.com": {
      "accountId": "usr_abc123",
      "authType": "email",
      "mfaSecret": null,
      "isActive": true,
      "email": "user@example.com",
      "displayName": "Maria Mustermann",
      "access": {
        "roles": ["Member"],
        "teams": [],
        "workspaces": [],
        "overrides": []
      }
    }
  }
}
```

**`access.overrides`** is an array of permission flags that apply directly to this user, regardless of their role. Use to grant specific permissions without changing the role (e.g., give a Member `system.settings.view`).

---

## {accountId}.appsys.appsecure — Per-User Profile

**Source of truth:** [`src/lib/config/cloudfiles/user.ts`](../../src/lib/config/cloudfiles/user.ts)

Stored at `.config/accounts.sysfolder/{accountId}.appsys.appsecure`. **Encrypted.**  
Contains user preferences and profile data — not auth credentials.

```json
{
  "_meta": {
    "schemaVersion": "1.0",
    "accountId": "usr_abc123"
  },
  "profile": {
    "firstName": "Maria",
    "lastName": "Mustermann",
    "avatarUrl": "",
    "color": "#7C3AED",
    "statusMessage": ""
  },
  "preferences": {
    "language": "de-DE",
    "notifications": { "emailMentions": true },
    "ui": {
      "pinnedWorkspaces": [],
      "defaultStartupView": "dashboard"
    }
  }
}
```

---

## {id}.appdoc — Collaborative Document

**Not a config/blueprint file** — the structure is managed by Hocuspocus + Yjs.

The file contains a JSON wrapper around binary-encoded Yjs CRDT state:
```json
{
  "_meta": {
    "schemaVersion": "1.0",
    "type": "appdoc",
    "lastUpdated": 1746700000000
  },
  "yjs": { ... }
}
```

**Do not edit manually.** The Yjs state is the document — it encodes the full edit history needed for conflict-free merging. Tiptap (via Hocuspocus) is the only intended writer.

For human-readable export, markdown serialization is a planned future feature (GDPR Art. 20 portability).

---

## Summary

| Cloud file | Location | Encrypted | Managed by |
|-----------|----------|-----------|-----------|
| `meta.appsys` | `.config/` | No | `service.ts`, `sync.ts`, `/api/filesystem/*` |
| `dates.appsys` | `.config/` | No | `cloud/dates.ts`, `/api/dates/*` |
| `roles.appsys` | `.config/` | No | `/api/settings/organisation/roles` |
| `accounts.appsys.appsecure` | `.config/` | **Yes** | `/api/settings/organisation/accounts`, auth hooks |
| `{accountId}.appsys.appsecure` | `.config/accounts.sysfolder/` | **Yes** | User settings (future) |
| `{id}.appdoc` | Anywhere in tree | No | Hocuspocus (WebSocket sync) |
