# FSR-OS Server Architecture: "Two Hands and a Bridge"

Because WebDAV (Sciebo) is too slow for real-time collaborative UI, FSR-OS uses a **Write-Behind Cache** architecture for the file system structure.

## The Flow (Structural Changes: Rename, Move, Create Folder)
1. **Hand 1 (The App):** The user renames a file. SvelteKit sends a POST to `/api/filesystem/rename`.
2. **The Brain (RAM Cache):** The API updates the `meta.fsrsys` object living entirely in the Node.js memory (`src/lib/server/cache.ts`). It is instantly fast.
3. **The Bridge (`syncQueue.ts`):** The API tells the sync queue that the RAM cache is "dirty". The queue starts a 5-second countdown.
4. **Hand 2 (WebDAV):** When the countdown hits zero, the server takes the JSON from RAM and uploads the new `meta.fsrsys` to Sciebo. 

## Strict Rule: Logical vs. Physical
* **Logical Operations:** Changing names, parent IDs, or tags. These only happen in the RAM cache first, then sync to the cloud via the Queue.
* **Physical Operations:** Creating a new file, deleting a file, or moving a file between folders. These MUST be executed directly on the WebDAV client during the API call to ensure the physical file actually exists before we update the RAM cache.


# FSR-OS Architecture & Data Flow

FSR-OS uses a 3-Tier caching architecture to bridge the gap between instant UI expectations and slow WebDAV backend storage.

## The 3 Data Layers

### 1. The Client Cache (Browser RAM)
* **Where it lives:** Inside Svelte 5 `$state` runes and SvelteKit `page.data`.
* **What it does:** Powers the Optimistic UI. When a user moves a file, the Client Cache updates instantly, re-rendering the screen before the server even responds.
* **Lifespan:** Destroyed when the user closes the browser tab.

### 2. The Server Cache (Node.js RAM & SQLite)
* **Where it lives:** `src/lib/server/cache.ts` (RAM Map) and `src/lib/server/db.ts` (SQLite).
* **What it does:** * **RAM Map (`cache.ts`):** Stores the `meta.fsrsys` tree and user profiles for 5 minutes. This prevents the server from making slow HTTP requests to Sciebo every time a user clicks a folder.
  * **SQLite (`db.ts`):** Stores routing info (which subdomain maps to which Sciebo URL) and temporary session cookies. IT NEVER STORES TENANT FILES OR PII.
* **Lifespan:** RAM is destroyed on server restart. SQLite persists across restarts.

### 3. The Cloud Storage (Sciebo WebDAV)
* **Where it lives:** The university's physical servers.
* **What it does:** The ultimate Single Source of Truth. If the FSR-OS server burns down, 100% of the tenant's data is safely preserved as `.fsrsys` JSON files and standard folders on Sciebo.
* **Lifespan:** Permanent.

---

## File Headers Guide
*When creating new files in `src/lib/server`, use these headers to define their responsibility:*

**`// LAYER: BRIDGE (syncQueue.ts)`**
*Transfers data between the fast Server Cache and the slow Cloud Storage.*

**`// LAYER: ENGINE (cache.ts)`**
*Ultra-fast in-memory operations. Must never contain blocking `await` calls to external APIs.*

**`// LAYER: CLOUD (client.ts, secureHandler.ts)`**
*Direct physical communication with WebDAV. Slow, heavily asynchronous, and heavily error-handled.*