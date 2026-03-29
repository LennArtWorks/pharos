# File System API Routes (`/api/filesystem`)

These endpoints act as the **nervous system** between the Svelte frontend, the Node.js RAM cache, and the Sciebo WebDAV server. 

All endpoints here rigorously enforce Role-Based Access Control (RBAC) via `hasPermission()`.

### The Endpoints:

#### 1. `GET /api/filesystem` (`+server.ts`)
* **Purpose:** Loads the entire folder/file structure for the Sidebar UI.
* **How it works:** Reads the flat `meta.fsrsys` object from the ultra-fast RAM cache, converts it into a nested tree structure (parent/child relationships), and sends it to the frontend.

#### 2. `POST /api/filesystem/create`
* **Purpose:** Creates a new file or folder.
* **How it works:** 1. Creates the physical file on WebDAV (Sciebo) with default content.
  2. If successful, creates a new `node` object in the RAM Cache using the `generateBaseNode()` blueprint.
  3. Triggers a background sync.

#### 3. `POST /api/filesystem/delete`
* **Purpose:** Moves a file to the `.trash` folder.
* **How it works:**
  1. Physically moves the file on WebDAV to `/.trash/`.
  2. Recursively deletes the item (and all its children) from the RAM Cache.
  3. Triggers a background sync.

#### 4. `POST /api/filesystem/rename`
* **Purpose:** Changes the display name of a file.
* **How it works:** Purely logical. It updates the `name` property inside the RAM cache. The physical WebDAV file is NOT touched. Triggers a background sync.

#### 5. `POST /api/filesystem/sort`
* **Purpose:** Moves a file into a new folder (Drag & Drop).
* **How it works:** 1. Physically moves the file to the new folder path on WebDAV.
  2. Logically updates the `parentId` in the RAM cache. 
  3. Triggers a background sync.

#### 6. `GET & POST /api/file` (Content Endpoint)
* **Purpose:** Reads or writes the *actual text/content* inside a file.
* **How it works:** Bypasses the RAM cache completely. Reads/writes directly from/to the physical WebDAV server, applying AES-256 encryption on the fly if the file is an `.fsrsecure` system file.

---
**What is "Background Sync"?**
Whenever an endpoint modifies the RAM Cache (`meta.fsrsys`), it calls `queueMetaSync()`. This starts a 5-second countdown. If no other changes happen, the Node.js server uploads the new cache to WebDAV in the background, keeping the cloud perfectly in sync without making the user wait.