# PHAROS — Scalability & Interchangeability

---

## Multi-Tenancy: Current State

Each organization is fully isolated at every layer. Adding a new org requires only adding credentials to SQLite — no code changes, no deployments.

### Isolation Guarantees

| Layer | Mechanism |
|-------|-----------|
| Browser | Cookies scoped to subdomain (`org.pharos.de`) |
| Request | `orgConfig` resolved per-request in `hooks.server.ts` from subdomain |
| WebDAV | Separate root directory per org (`orgConfig.cloud_directory`) |
| SQLite | `tenant_id` column on every table; all queries include `WHERE tenant_id = ?` |
| RAM cache | Keyed by `organisation_id` — one cache entry per org, never shared |
| Hocuspocus | Document room names scoped to org |

### Current Bottlenecks (non-blocking for alpha)

**SQLite is single-writer.** One VPS with one SQLite file is fine for up to hundreds of orgs. Multi-instance deployment would require switching to PostgreSQL or using SQLite with Litestream replication.

**Hocuspocus is in-memory.** WebSocket connections for one document must all hit the same server instance. Horizontal scaling with load balancers would split clients across instances, breaking real-time sync. Fix: add the Hocuspocus Redis adapter to share Yjs state across instances.

**No rate limiting per-tenant.** One tenant could monopolize the server. Add per-tenant rate limiting at the API layer before production deployment.

### Scaling Roadmap

| Phase | Action |
|-------|--------|
| Current (alpha) | Single VPS, SQLite, in-memory Hocuspocus — good for dozens of orgs |
| Phase 2 | Hocuspocus + Redis adapter for horizontal scaling |
| Phase 3 | SQLite → PostgreSQL (or Litestream) for multi-instance SQLite replication |
| Phase 4 | Load balancer, multi-region deployment |

---

## Cloud Provider Interchangeability

PHAROS officially supports **WebDAV-compatible storage**. Today that means Sciebo and any other Nextcloud/ownCloud instance.

### What Works Today (Zero Code Changes)

Any WebDAV-compatible provider works immediately because the underlying client is the `webdav` npm package, and the provider switch just passes different credentials:

```ts
// src/lib/server/cloud/origin/client.ts
export function getCloudClient(orgConfig: CloudConfig) {
  switch (orgConfig.cloud_name) {
    case 'sciebo':
    default:
      return getScieboClient({ url, user, pass });
  }
}
```

| Provider | Status | Notes |
|----------|--------|-------|
| Sciebo | ✅ Supported | University Nextcloud instance |
| Nextcloud (generic) | ✅ Supported | Same WebDAV protocol |
| ownCloud | ✅ Supported | Same WebDAV protocol |
| Any WebDAV server | ✅ Supported | Switch default handles it |

### What Requires Work

**Google Drive, Dropbox, OneDrive** — these use proprietary REST APIs, not WebDAV. Adding them requires wrapping their APIs to match the interface that `sync.ts` and `service.ts` expect.

### The Architectural Gap

`sync.ts` and `service.ts` call WebDAV client methods directly:
```ts
client.getFileContents(path, { format: 'text' })
client.putFileContents(path, content)
client.getDirectoryContents(path, { deep: true })
client.createDirectory(path)
```

These are methods from the `webdav` npm package. Swapping to Google Drive requires either wrapping the Drive API to match this interface, or refactoring to a `StorageAdapter` abstraction.

### Planned: StorageAdapter Interface

When adding a non-WebDAV provider, extract an adapter interface first:

```ts
interface StorageAdapter {
  getFile(path: string): Promise<string>;
  putFile(path: string, content: string): Promise<void>;
  listDirectory(path: string, opts?: { deep: boolean }): Promise<FileEntry[]>;
  createDirectory(path: string): Promise<void>;
  moveFile(from: string, to: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
}
```

- `WebDAVAdapter` — current code, wraps the `webdav` library (zero user-facing change)
- `GoogleDriveAdapter` — future implementation, maps Drive API to this interface
- `sync.ts` and `service.ts` depend on `StorageAdapter`, not the concrete `webdav` client

This refactor is not needed until a non-WebDAV provider is actually being integrated.

### JSON File Format — Provider Agnostic

The `.appdoc`, `.appsys` etc. file format is pure JSON — it's not WebDAV-specific. If PHAROS switches to Google Drive storage, the same file formats work unchanged. Only the transport layer changes.

---

## Why BYOS Scales

The Bring Your Own Storage model has a natural scalability advantage: **storage scales with the user, not with PHAROS.**

Each org brings their own Sciebo quota. PHAROS's server only holds in-memory state (Yjs docs + cache). A document-heavy org with 10GB of files costs PHAROS nothing in disk — it's all on the university's Sciebo. PHAROS's resource consumption is proportional to concurrent active users, not total data stored.
