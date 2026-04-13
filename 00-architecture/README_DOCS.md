# PHAROS - Documentation Index

> **IMPORTANT:** Start with [CLAUDE_CODE_START_HERE.md](./CLAUDE_CODE_START_HERE.md) ← Click here first!

## Complete Documentation Set

This project includes comprehensive documentation to help you understand and contribute to PHAROS. Below is the recommended reading order and a reference guide.

---

## 🎯 Quick Navigation

### For New Developers (Start Here)
1. **[CLAUDE_CODE_START_HERE.md](./CLAUDE_CODE_START_HERE.md)** ← BEGIN HERE
   - Quick orientation (5 min)
   - Reading path guide
   - Critical rules summary
   - First tasks for Claude Code

### For Understanding PHAROS
2. **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - What & Why
   - What is PHAROS?
   - Core principles
   - Architecture snapshot
   - Project phase

3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - How It Works
   - File system structure (WebDAV, meta.fsrsys)
   - Real-time collaboration flow
   - Tenant isolation
   - Security layers
   - Component communication

4. **[TECH_STACK.md](./TECH_STACK.md)** - Technologies
   - Frontend (Svelte 5, SvelteKit, Tailwind, Tiptap, Yjs)
   - Backend (Node.js, Hocuspocus, SQLite, WebDAV)
   - Real-time architecture
   - Performance targets

### For Coding
5. **[DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md)** - How to Code
   - Svelte 5 runes ($state, $derived, $effect, $props)
   - Component architecture (Button, NodeItem, TreeNodeItem, Icon)
   - Permission system (has(PERMISSIONS.X))
   - File type handlers
   - State management pattern
   - API integration pattern
   - Common pitfalls

6. **[FILE_STRUCTURE.md](./FILE_STRUCTURE.md)** - Where Things Are
   - Project directory tree
   - File naming conventions
   - State file organization
   - Server routes structure
   - CSS organization
   - Type definitions

### For Project Management
7. **[TECHNICAL_STATUS.md](./TECHNICAL_STATUS.md)** - Current State
   - What's completed (✅)
   - What's in progress (🔄)
   - What's not started (❌)
   - Dependency chain (what blocks what)
   - Critical path to MVP
   - Testing requirements
   - Known limitations

### For Privacy & Compliance
8. **[GDPR_COMPLIANCE.md](./GDPR_COMPLIANCE.md)** - Privacy & Security
   - GDPR principles implemented
   - Encryption & security measures
   - User rights (access, deletion, portability)
   - Audit trail & logging
   - Breach procedures
   - Privacy by design
   - Compliance checklists

### For Component-Specific Rules
9. **[../CLAUDE.md](../CLAUDE.md)** - Design System
   - Tech stack for webapp
   - Design system architecture
   - File system logic
   - Component rules (critical!)

### For Advanced Topics
10. **[../../cursorrules/docs_rbac-security.md](../../cursorrules/docs_rbac-security.md)** - Access Control
    - Detailed RBAC model
    - Permission scopes
    - Role hierarchy
    - DPIA template

11. **[../../cursorrules/docs_webdav-sync.md](../../cursorrules/docs_webdav-sync.md)** - Data Sync
    - WebDAV integration
    - Sync strategy
    - Conflict resolution
    - Error handling

12. **[../../cursorrules/docs_meta-schema.md](../../cursorrules/docs_meta-schema.md)** - File Schema
    - meta.fsrsys structure
    - File type definitions
    - Metadata format

---

## 📋 Reading Paths by Role

### 👨‍💻 Frontend Developer
1. CLAUDE_CODE_START_HERE.md (5 min)
2. PROJECT_OVERVIEW.md (5 min)
3. DEVELOPMENT_GUIDE.md (15 min)
4. FILE_STRUCTURE.md (5 min)
5. ../CLAUDE.md (3 min)
6. ARCHITECTURE.md (skim for context)

**Total time:** ~35 minutes to get productive

### 🔧 Backend Developer
1. CLAUDE_CODE_START_HERE.md (5 min)
2. ARCHITECTURE.md (10 min)
3. TECH_STACK.md (5 min)
4. cursorrules/docs_webdav-sync.md (10 min)
5. cursorrules/docs_rbac-security.md (10 min)
6. TECHNICAL_STATUS.md (10 min)

**Total time:** ~50 minutes to get productive

### 🔐 Security/Privacy Engineer
1. GDPR_COMPLIANCE.md (10 min)
2. ARCHITECTURE.md (5 min - security layers section)
3. cursorrules/docs_rbac-security.md (20 min)
4. TECHNICAL_STATUS.md (5 min - limitations)

**Total time:** ~40 minutes

### 📊 Project Manager
1. PROJECT_OVERVIEW.md (5 min)
2. TECHNICAL_STATUS.md (20 min)
3. CLAUDE_CODE_START_HERE.md (5 min - first tasks)
4. GDPR_COMPLIANCE.md (10 min - intro + checklists)

**Total time:** ~40 minutes

---

## 🔍 Quick Reference by Topic

### "How do I...?"

| Question | Document | Section |
|----------|----------|---------|
| ...create a new component? | DEVELOPMENT_GUIDE.md | Component Architecture |
| ...use Svelte 5 runes? | DEVELOPMENT_GUIDE.md | Svelte 5 Runes |
| ...check user permissions? | DEVELOPMENT_GUIDE.md | Permission System |
| ...implement a file view? | DEVELOPMENT_GUIDE.md | File Type Handlers |
| ...make an API call? | DEVELOPMENT_GUIDE.md | API Integration Pattern |
| ...find the Button component? | FILE_STRUCTURE.md | How to Find Things |
| ...understand file naming? | ARCHITECTURE.md | ID-Only Naming Convention |
| ...sync data to WebDAV? | cursorrules/docs_webdav-sync.md | All |
| ...implement permissions? | cursorrules/docs_rbac-security.md | All |
| ...handle user deletion? | GDPR_COMPLIANCE.md | Right to Erasure |
| ...log changes? | GDPR_COMPLIANCE.md | Audit Trail & Logging |
| ...understand meta.fsrsys? | cursorrules/docs_meta-schema.md | All |

### "What is...?"

| Concept | Document | Section |
|---------|----------|---------|
| **BYOS** | PROJECT_OVERVIEW.md | Core Principles |
| **Yjs** | TECH_STACK.md | Real-Time Collaboration |
| **Hocuspocus** | TECH_STACK.md | Real-Time Collaboration |
| **meta.fsrsys** | ARCHITECTURE.md | File System Structure |
| **ID-Only Naming** | ARCHITECTURE.md | ID-Only Naming Convention |
| **Tenant Isolation** | ARCHITECTURE.md | Tenant Isolation |
| **Permission Model** | cursorrules/docs_rbac-security.md | Core Philosophy |
| **Role Hierarchy** | GDPR_COMPLIANCE.md | GDPR Compliance Architecture |
| **Encryption Method** | GDPR_COMPLIANCE.md | Security Measures |
| **Audit Trail** | GDPR_COMPLIANCE.md | Audit Trail & Logging |

---

## 📚 Document Descriptions

### 🟢 CLAUDE_CODE_START_HERE.md
**Length:** 10 min | **Type:** Quick Start  
Entry point for new developers. Reading path, critical rules, first tasks, troubleshooting tips.

### 🟢 PROJECT_OVERVIEW.md
**Length:** 5 min | **Type:** Conceptual  
High-level intro. What PHAROS does, why it exists, core principles, current phase.

### 🔵 TECH_STACK.md
**Length:** 5 min | **Type:** Reference  
Technologies, dependencies, real-time architecture, deployment architecture.

### 🔵 ARCHITECTURE.md
**Length:** 10 min | **Type:** Technical Deep-Dive  
System design. File system, real-time flow, multi-tenancy, security layers, monitoring.

### 🟡 DEVELOPMENT_GUIDE.md
**Length:** 15 min | **Type:** How-To / Tutorial  
How to code in this project. Svelte 5 runes, components, permissions, state management, API patterns, testing, debugging, performance.

### 🟡 FILE_STRUCTURE.md
**Length:** 5 min | **Type:** Reference  
Project organization. Directory tree, file naming, types, CSS strategy.

### 🟣 TECHNICAL_STATUS.md
**Length:** 20 min | **Type:** Project Status  
Completed/in-progress/todo. Dependency chain, MVP path, testing, limitations.

### 🟣 GDPR_COMPLIANCE.md
**Length:** 10 min | **Type:** Policy / Best Practices  
Privacy & security. GDPR principles, encryption, user rights, audit logs, breach procedures, checklists.

### 🟤 ../CLAUDE.md
**Length:** 3 min | **Type:** Reference (Component-Specific)  
Component rules. Tech stack for webapp, design system, critical button nesting rules.

### 🟤 cursorrules/docs_rbac-security.md
**Length:** 20 min | **Type:** Technical Deep-Dive  
Role-Based Access Control (RBAC). Permission model, role hierarchy, advanced scenarios.

### 🟤 cursorrules/docs_webdav-sync.md
**Length:** 15 min | **Type:** Technical Deep-Dive  
WebDAV integration & sync strategy. Upload/download, periodic flush, conflict resolution, error handling.

### 🟤 cursorrules/docs_meta-schema.md
**Length:** 10 min | **Type:** Technical Spec  
File format specification. meta.fsrsys structure, file types, JSON schema.

---

## 🎯 Key Concepts Summary

### PHAROS Philosophy
- **BYOS (Bring Your Own Storage):** Data lives on organization's cloud (Sciebo), not ours
- **Real-time:** Every interaction feels instant (< 100ms broadcast)
- **Privacy First:** GDPR compliant, German data residency, user control
- **Zero Config:** Connect Sciebo → start working in 60 seconds

### Architecture
- **Frontend:** Svelte 5 + SvelteKit + Tailwind CSS + Tiptap + Yjs
- **Backend:** Node.js + Hocuspocus + SQLite + WebDAV
- **Real-Time:** WebSockets + CRDT (Yjs) + Operational Transformation
- **Multi-Tenant:** Subdomains + tenant_id filtering

### Data Model
- **Files:** Stored by ID only on WebDAV (e.g., `1771675444568.fsrdoc`)
- **Index:** Human-readable names in `meta.fsrsys` (cached 15 min)
- **Permissions:** Three-tier (global roles + inheritance + workspace overrides)
- **Sync:** RAM → WebDAV every 30 seconds (non-blocking)

### Security
- **Sensitive Data:** Encrypted at rest (AES-256-GCM)
- **Read-Only Filesystem:** Server can't write to disk
- **Permission Checks:** Frontend UX + backend security
- **Audit Logs:** Every modification logged

---

## 🚀 Next Steps

1. **Read:** [CLAUDE_CODE_START_HERE.md](./CLAUDE_CODE_START_HERE.md) (10 min)
2. **Explore:** Project structure in `fsr-os/src/`
3. **Check:** What's marked as TODO in [TECHNICAL_STATUS.md](./TECHNICAL_STATUS.md)
4. **Ask:** Questions? Cross-reference the topic table above

---

## 📞 Support

- **Questions on core concepts?** → Check PROJECT_OVERVIEW.md + ARCHITECTURE.md
- **Questions on coding?** → Check DEVELOPMENT_GUIDE.md + ../CLAUDE.md
- **Questions on process?** → Check FILE_STRUCTURE.md
- **Questions on privacy?** → Check GDPR_COMPLIANCE.md
- **Questions on project status?** → Check TECHNICAL_STATUS.md
- **Questions on advanced topics?** → Check cursorrules/ folder

---

**Last Updated:** April 13, 2025  
**Project:** PHAROS (GDPR-Compliant Cloud OS for Organizations)  
**Tech Stack:** Svelte 5 + SvelteKit + Yjs + Hocuspocus  
**Status:** Alpha (MVP phase)
