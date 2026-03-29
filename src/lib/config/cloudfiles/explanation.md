# Cloud Files Blueprints (`config/cloudfiles/`)

This directory is the **Single Source of Truth** for the JSON structures written to the Sciebo WebDAV cloud. 

Because we do not use a traditional database (like Postgres or MongoDB) to store organisation data, the `.fsrsys` and `.fsrsecure` files acting as our database must have strictly defined schemas. 

Whenever a new file, user, role, or organisation is created, the system must call the generator functions in this directory to ensure the JSON structure is flawless before uploading it to the cloud.

### Files in this directory:
* **`meta.ts`**: Defines `meta.fsrsys` and the standard `FSRNode` (Lean JSON standard). One Node for each element on the cloud
* **`accounts.ts`**: Defines the master auth registry `accounts.fsrsys.fsrsecure` (used for fast table lookups).
* **`user.ts`**: Defines the individual user profile `usr_XXXX.fsrsys.fsrsecure` (stores detailed UI preferences and pinned workspaces).
* **`roles.ts`**: Defines the dynamic RBAC (Role-Based Access Control) structure saved in `roles.fsrsys`.

**Rules:**
1. **Never** hardcode JSON structures directly in `sync.ts`, API routes, or auth logic. 
2. Always import the generator functions from these files.