# PHAROS — GDPR & Privacy Compliance

## Core Privacy Principle

**PHAROS never owns organizational data. It is the "processing engine"; the organization is the "vault."**

All data is:
- **Stored** on the organization's own Sciebo/Nextcloud (WebDAV)
- **Processed** by PHAROS in real-time (RAM only — no disk writes by the app process)
- **Controlled** entirely by the organization
- **Compliant** with German GDPR (DSGVO) and institutional policies

---

## Implementation Status

| GDPR Requirement | Status | Notes |
|-----------------|--------|-------|
| Data minimization | ✅ | Only session tokens + audit log in SQLite. No PII stored long-term on server. |
| Encryption at rest | ✅ | `accounts.appsys.appsecure` + user profiles encrypted AES-256-GCM |
| Encryption in transit | ✅ | HTTPS/WSS required; WebDAV over HTTPS |
| Access control | ✅ | Three-tier permission system (roles, wildcard matching, per-user overrides) |
| Audit trail | ✅ | SQLite `audit_log` — every modifying action logged (90-day retention) |
| Right to Access (Art. 15) | ⚠️ Planned | Data export API not yet implemented |
| Right to Erasure (Art. 17) | ⚠️ Planned | Account deletion pipeline not yet implemented |
| Right to Portability (Art. 20) | ⚠️ Planned | Data export + markdown document export not yet implemented |
| Breach notification (Art. 33) | 📋 Procedure documented | Not automated — manual process for now |
| Data residency | ✅ | Server in Germany/NRW; data stored on university Sciebo (NRW) |

---

## GDPR Compliance Architecture

### Data Processing Agreement (Art. 28)
- **Controller:** The organization (FSR, university department)
- **Processor:** PHAROS (processes data on behalf of controller)
- **Data location:** Organization's Sciebo (university servers, Germany/NRW)
- **Processing location:** PHAROS server (Node.js, in-memory only)

### Data Minimization

**In SQLite (PHAROS server):**
- Tenant registration: org name, subdomain, encrypted cloud credentials
- Session tokens (auto-expire after 30 days)
- Audit log (who changed what, when — 90-day retention)
- No PII stored long-term

**Sensitive data lives on WebDAV (organization-controlled):**
- Email addresses (in `accounts.appsys.appsecure`, encrypted)
- Password hashes (Argon2id, in encrypted accounts file)
- User profiles (in per-user `.appsys.appsecure`, encrypted)

**In-memory only (cleared on server restart):**
- File tree cache (`meta.appsys` parsed JSON)
- Dates cache
- Active Yjs documents
- Decrypted auth credentials (max 1-minute TTL)
- User profiles (max 5-minute TTL)
- Session state for active WebSocket connections

**The `session.svelte.ts` singleton** — contains `session.user` (id, role, name, color) and `session.orgRoles`. This is transient JavaScript module-level state — cleared on tab close, not persisted to localStorage, IndexedDB, or cookies. Same data already present in the HTML response. No new GDPR risk.

### Encryption

```
accounts.appsys.appsecure  →  AES-256-GCM before WebDAV upload
{userId}.appsys.appsecure  →  AES-256-GCM before WebDAV upload
                               Decrypted only in server memory during auth/profile fetch
```

Key derivation: organization master key (stored encrypted in SQLite, never on disk in plaintext).

### Cache TTLs

| Data | TTL | Reason |
|------|-----|--------|
| Auth registry (accounts) | 1 minute | Sensitive — minimize exposure window |
| User profiles | 5 minutes | Sensitive — balance performance vs. freshness |
| File index (meta) | Until next write | Structural — updated on every file operation |
| Dates | Until next write | Structural |

---

## User Rights Under GDPR

### Right to Access (Art. 15) — Not yet implemented
Planned: `GET /api/user/data` — returns all user-associated data as structured JSON.

### Right to Rectification (Art. 16) — Available
Users can edit their profile in settings. Admins can update user roles and access in Accounts settings.

### Right to Erasure (Art. 17) — Not yet implemented
Planned: `DELETE /api/user/account`
1. Anonymize user in all collaborative documents (replace user ID with anonymous placeholder)
2. Remove from all date assignees
3. Delete `{userId}.appsys.appsecure` from WebDAV
4. Remove from `accounts.appsys.appsecure`
5. Log final audit entry
30-day grace period before hard delete (user can recover).

### Right to Data Portability (Art. 20) — Not yet implemented
Planned: `GET /api/user/export` — structured JSON export.
Document content export as Markdown is a natural portability format — planned alongside Art. 17/20 implementation.

### Right to Object (Art. 21)
Admins can remove users from specific teams and workspaces. Full opt-out requires account deletion (Art. 17).

---

## Cookie Policy

| Cookie | Purpose | Retention | Required |
|--------|---------|-----------|---------|
| `phrs_session` | Session management | 30 days | Yes (HttpOnly, Secure) |
| `phrs_devmode` | Dev mode state | Session | No (dev only) |
| `phrs_simulation` | Role simulation state | Session | No (dev only) |

No third-party cookies. No advertising networks. No behavioral tracking.

---

## Data Retention

| Data type | Retention | Basis |
|-----------|-----------|-------|
| User profile | Until deletion | Contract (user agreement) |
| File content | Until deletion | Contract + org consent |
| Audit logs | 90 days | Legal obligation |
| Session tokens | 30 days | Security |
| Error logs | 30 days | Legitimate interest |

---

## Audit Trail

Every modifying action is logged in SQLite:
```ts
// audit_log row
{
  id, timestamp, tenantId, userId,
  action,       // 'FILE_CREATE', 'FILE_DELETE', 'PERMISSION_UPDATE', etc.
  resourceId, resourceType,
  changes: { before, after },
  ipAddress     // anonymized after 90 days
}
```

Events logged (configured in `GLOBAL_SETTINGS.AUDIT_LOG_EVENTS`):
`FILE_CREATE`, `FILE_DELETE`, `FILE_RENAME`, `FILE_MOVE`, `FILE_DOWNLOAD`, `WORKSPACE_CREATE`, `WORKSPACE_DELETE`, `PERMISSION_UPDATE`, `OPERATOR_SIMULATION`

---

## Data Flows

### Login
```
Browser: email + password [HTTPS]
  → Server: lookup accounts.appsys.appsecure (decrypt in memory)
  → Validate password (Argon2id)
  → Create session (JWT or secure cookie, store in SQLite)
  → Browser: HttpOnly session cookie
```

### File Edit (Collaborative)
```
Browser: Yjs update [WSS]
  → Hocuspocus: validate permission
  → Merge into Yjs doc (in-memory)
  → Log audit entry
  → Broadcast to all connected clients
  → Every 10s: serialize Yjs → JSON → putFileContents to WebDAV
```

### File Deletion
```
Browser: DELETE /api/filesystem/delete [HTTPS]
  → Server: validate permission
  → Move file to .trash/ on WebDAV (soft delete — restorable)
  → Update meta.appsys (mark deleted)
  → Log audit entry
  (Hard delete: scheduled after 30-day grace period — not yet automated)
```

---

## Developer Compliance Checklist

- [ ] No sensitive data in plaintext logs
- [ ] All WebDAV traffic over HTTPS
- [ ] All WebSocket connections over WSS
- [ ] All SQL queries parameterized (no string interpolation)
- [ ] Permission check (`has()`) before every file operation on backend
- [ ] Audit event logged for every write operation
- [ ] Error messages don't leak system paths or credentials
- [ ] Secrets in environment variables, never in source code
- [ ] Encrypted files (`*.appsecure`) never decrypted on client

---

## Data Residency

All data processed and stored in Germany/NRW:
- PHAROS server: German/NRW infrastructure (VPS)
- Data storage: Organization's university Sciebo (NRW university servers)
- No cross-border data transfers

Compliant with GDPR territoriality rules (Art. 3) and NRW institutional data governance requirements.
