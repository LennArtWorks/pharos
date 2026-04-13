# PHAROS - GDPR & Privacy Compliance

## Core Privacy Principle

**PHAROS never owns organizational data. It is the "processing engine"; the organization is the "vault."**

All data is:
- **Stored** on the organization's own Sciebo/Nextcloud (WebDAV)
- **Processed** by PHAROS in real-time (RAM only, no disk writes)
- **Controlled** entirely by the organization
- **Compliant** with German GDPR (DSGVO) and institutional policies

---

## GDPR Compliance Architecture

### 1. Data Processing Agreement (DPA)

PHAROS operates as a **Data Processor** under Article 28 GDPR:
- **Controller:** The organization (FSR, university)
- **Processor:** PHAROS (processes data on behalf of controller)
- **Data Location:** Organization's Sciebo/Nextcloud (Germany/NRW)
- **Processing Location:** PHAROS server (Node.js, in-memory only)

### 2. Data Minimization

**Rule:** Collect only what's necessary.

**Minimal Data in SQLite:**
- Tenant registration (organization name, subdomain)
- Session tokens (encrypted, auto-expire)
- Audit logs (who changed what, when)
- NO PII (Personally Identifiable Information) stored long-term

**Sensitive Data (accounts.fsrsecure) in WebDAV:**
- Email addresses
- Password hashes (Argon2id, never plaintext)
- SSO provider IDs
- Encrypted at rest (AES-256-GCM)
- Decrypted only in server memory during authentication

### 3. Security Measures

#### 3.1 Encryption at Rest
```typescript
// accounts.fsrsecure - Always encrypted
const encrypted = await aesCrypt.encrypt(
  JSON.stringify(accountsData),
  organizationMasterKey,
  { algorithm: 'aes-256-gcm' }
);
await webdav.writeFile('config.sysfolder/accounts.fsrsecure', encrypted);
```

#### 3.2 Encryption in Transit
- All WebDAV requests over HTTPS (TLS 1.3+)
- WebSocket connections over WSS (TLS 1.3+)
- Certificate pinning recommended for high-security orgs

#### 3.3 Read-Only Filesystem
```dockerfile
# Docker container runtime
RUN chmod a-w /app
VOLUME [ "/var/lib/pharos/db" ]  # Only writable volume
```

**Effect:** Server cannot write to disk except for SQLite. Memory leaks don't expose to disk. On restart, all in-memory data lost.

#### 3.4 Memory Isolation
- Sensitive files (accounts) cached for ≤ 1 minute
- Structural files (meta) cached for 15 minutes
- All cache purged on server restart
- No swapfile used (configure with `vm.swappiness=0`)

### 4. User Rights under GDPR

#### 4.1 Right to Access (Article 15)
Implement endpoint: `GET /api/user/data`
- Returns all user data in structured format (JSON)
- Includes all files where user has access

```typescript
export const GET = async ({ locals }) => {
  const userId = locals.userId;
  const userData = await collectUserData(userId);
  return json(userData, { 'Content-Disposition': 'attachment; filename="data.json"' });
};
```

#### 4.2 Right to Rectification (Article 16)
- Users can edit their profile via settings
- Users can edit documents they have `files.edit` permission for
- Changes logged in `audit_log` table

#### 4.3 Right to Erasure (Article 17, "Right to be Forgotten")
Implement endpoint: `DELETE /api/user/account`
- Marks user as deleted in SQLite
- Adds to right-to-forget queue
- Background job removes user from all:
  - File collaborators
  - Rosters (shift assignments)
  - Comments
  - Audit logs (retention period finalizes)

```typescript
export const DELETE = async ({ locals }) => {
  const userId = locals.userId;
  
  // 1. Anonymize user in all collaborative documents
  await anonymizeUserInFiles(userId);
  
  // 2. Remove from all rosters
  await removeUserFromRosters(userId);
  
  // 3. Delete account
  await db
    .prepare('DELETE FROM users WHERE id = ?')
    .run(userId);
  
  return json({ success: true });
};
```

#### 4.4 Right to Data Portability (Article 20)
Provide data export in standard formats:
```typescript
export const GET = async ({ locals }) => {
  const userId = locals.userId;
  
  // Export as JSON
  const data = await collectUserData(userId);
  
  // Or export as CSV (for spreadsheets)
  // Or export as ZIP (all files)
  
  return json(data);
};
```

#### 4.5 Right to Object (Article 21)
- Users can opt out of marketing communications
- Users can request removal from specific rosters/teams
- Org admins must honor within 30 days

### 5. Data Processing Timeline (Retention)

| Data Type | Retention | Legal Basis |
|-----------|-----------|------------|
| User profile | Until deletion | Contract (user agreement) |
| File content | Until deletion | Contract + Org consent |
| Audit logs | 90 days | Legal obligation (compliance) |
| Session tokens | 30 days | Security |
| Error logs | 30 days | Legitimate interest (debugging) |
| Analytics | 12 months | Legitimate interest (improvement) |

**Deletion Process:**
1. Data marked as deleted in database
2. 30-day grace period (user can recover)
3. Hard delete from database + WebDAV
4. Final audit log entry (who deleted, when)

### 6. Audit Trail & Logging

Every modifying action is logged:

```typescript
// audit_log table schema
{
  id: 'audit_001',
  timestamp: '2025-04-13T10:30:00Z',
  tenantId: 'org_001',
  userId: 'usr_123',
  action: 'file.edit',  // files.create, files.delete, permission.change, etc.
  resourceId: 'fsr_doc123',
  resourceType: 'file',
  changes: {
    before: { permissions: ['admin'] },
    after: { permissions: ['admin', 'member'] }
  },
  ipAddress: '192.168.1.1',  // Anonymized in logs after 90 days
  userAgent: 'Mozilla/5.0...'  // Stored for compliance
}
```

**Compliance Query:**
"What did user X do on date Y?"
```sql
SELECT * FROM audit_log
WHERE userId = 'usr_X'
  AND DATE(timestamp) = '2025-04-13'
ORDER BY timestamp DESC;
```

### 7. Third-Party Integrations

#### Stripe (Payment Processing)
- **Purpose:** Ticket sales, event payment
- **Data:** Card details, email, name
- **Compliance:** PCI DSS Level 1
- **Agreement:** Stripe Data Processing Addendum (DPA)
- **User Consent:** Required before checkout

#### Google SSO / OAuth
- **Purpose:** User authentication
- **Data:** Email, name, profile picture (optional)
- **Compliance:** Google's privacy policy applies
- **Agreement:** Implicit through SvelteKit provider

#### Sciebo/Nextcloud
- **Purpose:** Data storage
- **Data:** All organizational files
- **Compliance:** Institutional responsibility
- **Agreement:** Organization's existing DPA with university IT

### 8. Breach Notification (Article 33)

**Procedures if data breach occurs:**
1. **Immediate:** Assess impact, secure the breach
2. **Within 72 hours:** Notify competent authority (DPA - Data Protection Authority)
3. **Without undue delay:** Notify affected individuals
4. **Documentation:** Log breach in `breach_log` table

```typescript
// Breach notification template
const breachNotification = `
To: [Competent Authority]
Date: [72 hours after discovery]
Organization: [Org Name]
Breach Type: [Unauthorized access to accounts.fsrsecure]
Affected Users: [Count]
Likely Risk: [High/Medium/Low]
Mitigating Actions: [AES-256-GCM encryption prevented plaintext exposure]
`;
```

### 9. Privacy by Design

**implemented in PHAROS:**

#### Privacy by Design Principle 1: Data Minimization
```
✓ No tracking pixels
✓ No analytics cookies
✓ No persistent user profiling
✓ Only essential logs retained
```

#### Privacy by Design Principle 2: Security by Default
```
✓ Files encrypted at rest (AES-256-GCM)
✓ Transport encrypted (HTTPS/WSS)
✓ No plaintext passwords stored
✓ Sessions expire after 24 hours
```

#### Privacy by Design Principle 3: User Control
```
✓ Users control permissions per file
✓ Users can export their data anytime
✓ Users can request deletion anytime
✓ Users can see audit logs of who accessed their data
```

#### Privacy by Design Principle 4: Transparency
```
✓ Privacy policy clearly states data usage
✓ Data processing addendum provided
✓ Users see who has access to each file
✓ Audit logs publicly visible to admins
```

### 10. Cookie Policy

**Cookies used in PHAROS:**

| Cookie | Purpose | Retention | Consent |
|--------|---------|-----------|---------|
| `pharos_session` | Session management | 30 days | Implicit (required to function) |
| `theme` | UI preference (light/dark) | 1 year | Implied |
| `language` | Language selection | 1 year | Implied |

**No third-party cookies.** No advertising networks. No behavioral tracking.

### 11. Data Transfer & Cross-Border

**Data Location Rules:**
- All data processed in Germany/NRW (PHAROS server location)
- All data stored on organization's Sciebo (university servers in Germany)
- No data transferred to other countries
- Compliant with GDPR **territoriality rules** (Art. 3)

### 12. Compliance Checklist for Org Admins

**When setting up an FSR/organization:**

- [ ] Review and sign Data Processing Addendum (DPA) with PHAROS team
- [ ] Configure retention policies (default: 90 days for audit logs)
- [ ] Set up Sciebo WebDAV integration (ensure SSL certificates valid)
- [ ] Train users on privacy policies
- [ ] Designate Data Protection Officer if required
- [ ] Document purposes of processing (meeting minutes, event management, etc.)
- [ ] Implement consent mechanism for guest access (if public files)
- [ ] Enable audit logging (default on)
- [ ] Schedule regular data backups
- [ ] Test data deletion processes

### 13. Legal Basis for Processing

| Activity | GDPR Legal Basis |
|----------|-----------------|
| User authentication | Article 6(1)(b) - Contract |
| File editing (collaboration) | Article 6(1)(b) - Contract |
| Permission enforcement | Article 6(1)(b) - Contract |
| Audit logging | Article 6(1)(c) - Legal obligation |
| Error tracking | Article 6(1)(f) - Legitimate interest |
| Backup/recovery | Article 6(1)(f) - Legitimate interest |

### 14. Data Protection Impact Assessment (DPIA)

**Recommended** for high-risk organizations (handling medical data, financial records, etc.):

```
1. What data is processed? (Sensitivity level)
2. How long is it stored? (Retention period)
3. Who has access? (Access control matrix)
4. What are the risks? (Breach scenarios)
5. What mitigations exist? (Encryption, access control, audit)
6. What is residual risk? (Acceptable?)
```

See `docs_rbac-security.md` for detailed DPIA template.

---

## Compliance Checklists

### For Developers
- [ ] Sensitive data never logged in plaintext
- [ ] All WebDAV traffic over HTTPS
- [ ] WebSocket connections over WSS only
- [ ] Database queries parameterized (prevent SQL injection)
- [ ] File operations validated against permissions via `has(PERMISSION.X)`
- [ ] Audit events logged for every modification
- [ ] Error messages don't leak system paths or credentials
- [ ] Secrets stored in environment variables, never in code

### For Operations
- [ ] PHAROS server deployed on German/NRW infrastructure
- [ ] SSL certificates valid and auto-renewed
- [ ] Database backups encrypted and stored securely
- [ ] Read-only filesystem enforced at container level
- [ ] Swap disabled, memory limits set
- [ ] Log aggregation configured (CloudWatch, ELK)
- [ ] Incident response procedures documented
- [ ] Disaster recovery plan tested quarterly

### For Organization Admins
- [ ] Privacy policy reviewed and published
- [ ] Data Processing Addendum signed with PHAROS
- [ ] User consent documented (opt-in for public access)
- [ ] Data inventory maintained (what data, where, why)
- [ ] Deletion requests processed within 30 days
- [ ] Audit logs reviewed monthly
- [ ] Breach response procedures documented
- [ ] Staff trained on GDPR obligations

---

## Quick Reference: Data Flows

### Data Flow 1: User Login
```
Browser
  ↓ Email + Password [HTTPS]
Node.js Server
  ↓ Lookup in accounts.fsrsecure (encrypted)
  ↓ Decrypt in memory
  ↓ Validate password hash (Argon2id)
  ↓ Create session (encrypt token)
  ↓ Store in SQLite
Browser ← Session token (JWT or secure cookie)
  ↓ Store in browser (HttpOnly cookie)
```

**GDPR Impact:** Minimal. Session tokens are temporary. No permanent PII stored outside WebDAV.

### Data Flow 2: File Collaborative Edit
```
Browser (User A)
  ↓ Yjs update [WSS]
Node.js Server (Hocuspocus)
  ↓ Validate permission (has(PERMISSIONS.FILE_EDIT))
  ↓ Merge into Yjs document (in-memory)
  ↓ Log audit entry (user, action, file, timestamp)
  ↓ Broadcast to all connected clients [WSS]
Browsers (Users A, B, C) ← Yjs update
  ↓ Apply to local document
  ↓ Render in editor
```

**GDPR Impact:** All collaborative data stays encrypted (Sciebo storage). Audit logs kept for 90 days. No tracking of typing.

### Data Flow 3: File Deletion (Right to Erasure)
```
Browser (Admin)
  ↓ DELETE /api/files/[fileId] [HTTPS]
Node.js Server
  ↓ Validate permission (PERMISSIONS.FILE_DELETE)
  ↓ Move file to .trash/ (WebDAV MOVE)
  ↓ Log audit entry (deletion event)
  ↓ Schedule hard delete (30 days grace period)
  ↓ Return success
Browser ← { success: true }
  ↓ Wait 30 days...
  ↓ Cron job: Permanently delete from WebDAV + Sciebo
```

**GDPR Impact:** User data deleted per right-to-erasure request. Audit logs show "deletion event" but actual content removed. Non-repudiation maintained (deletion logged).

---

## Resources

- **GDPR Text:** https://gdpr-info.eu/
- **Germany's DSGVO:** https://www.gesetze-im-internet.de/bdsg_2018/
- **EDPB Guidelines:** https://edpb.ec.europa.eu/
- **NIST Privacy Engineering:** https://pages.nist.gov/privacy-engineering-playbook/
- **CWE/OWASP Top 10:** https://owasp.org/
- **Sciebo DPA:** Contact your university IT department
