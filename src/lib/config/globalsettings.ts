export const GLOBAL_SETTINGS = {
  DEV: {
    IS_DEVMODE: false,
    // DEV_ACCOUNTS: {
    //   DEV_ADMIN: { id: 'dev_admin', name: "Dev Admin", email: 'dev@admin', role: 'Admin', overrides: [] },
    //   DEV_READONLY: { id: 'dev_readonly', name: "Dev Readonly", email: 'dev@readonly', role: 'Admin', overrides: [] },
    //   DEV_NOACCESS: { id: 'dev_noaccess', name: "Dev Noaccess", email: 'dev@noaccess', role: 'Admin', overrides: [] },
    // }
  },
  APP_INFO: {
    NAME: 'PHAROS',              // Display name — used in titles, emails, and UI
    BASE_DOMAIN: 'phar-os.app',   // The production root domain

    // -- Identity prefixes & extension prefix --
    // Change FILE_EXT_PREFIX to rename all app file extensions in one place.
    // e.g. 'app' → .appdoc / .apptasks / .appevt / .appsys / .appsecure
    // e.g. 'phrs' → .phrsdoc / .phrssys / etc.
    FILE_EXT_PREFIX: 'app' as string,

    // Prefix for browser cookies and localStorage. e.g. 'phrs' → phrs_session, phrs_lang
    COOKIE_PREFIX: 'phrs' as string,

    // Prefix for node IDs. Set to '' for pure UUIDs (recommended).
    // Set to e.g. 'node' to produce 'node_abc123' IDs.
    NODE_ID_PREFIX: '' as string,

    // Prefix for user account IDs. Kept stable — changing this requires a user migration.
    USER_ID_PREFIX: 'usr' as string,
  },
  APP_SETTINGS: {
    MAX_APPNAV_HISTORY: 50,
    MAX_OPEN_TABS: 10
  },
  ACCOUNT: {
    LOGIN_SESSION_DURATION: 30 * 24 * 60 * 60
  },
  SECURITY: {
    // TTL for the central identity registry (used only during login)
    REGISTRY_CACHE_TTL_MS: 1 * 60 * 1000, // 1 minute

    // TTL for active user profiles (checked on every navigation)
    PROFILE_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minute
  },
  FILES: {
    AUTOSAVE_DELAY_MS: 1500,

    // 5 seconds groups rapid changes (like a burst of renaming/moving) into one API call.
    TREE_SYNC_DEBOUNCE_MS: 5000,
  },
  // Central definition of what should actually trigger a WebDAV log
  AUDIT_LOG_EVENTS: [
    'FILE_CREATE',
    'FILE_DELETE',
    'FILE_RENAME',
    'FILE_MOVE',
    'FILE_DOWNLOAD',
    'WORKSPACE_CREATE',
    'WORKSPACE_DELETE',
    'PERMISSION_UPDATE',
    'OPERATOR_SIMULATION'
  ] as const,
  WEBSOCKETS: {
    SERVER_SYNC_INTERVAL_MS: 10000,

    // Dynamically generate the WebSocket URL based on where the app is currently running
    getDynamicUrl(documentId: string): string {
      if (typeof window === 'undefined') return ''; // Prevent SSR errors

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;

      return `${protocol}//${host}/ws/${documentId}`;
    }
  }
};

// ---------------------------------------------------------------------------
// APP_EXTENSIONS — derived from APP_INFO.FILE_EXT_PREFIX
// This is the single source of truth for all app file extensions.
// Change FILE_EXT_PREFIX above and all extensions update automatically.
// ---------------------------------------------------------------------------
const _p = GLOBAL_SETTINGS.APP_INFO.FILE_EXT_PREFIX;
export const APP_EXTENSIONS = {
  DOC:              `.${_p}doc`,       // e.g. .appdoc
  TASKS:            `.${_p}tasks`,     // e.g. .apptasks
  EVENT:            `.${_p}evt`,       // e.g. .appevt
  SYS:              `.${_p}sys`,       // e.g. .appsys  (meta, roles index files)
  SECURE_MODIFIER:  `.${_p}secure`,    // e.g. .appsecure (appended after base ext for encrypted files)
  // Structural/neutral — not prefixed so they remain readable in any WebDAV browser
  WORKSPACE:        `.workspace`,
  SYSFOLDER:        `.sysfolder`,
} as const;

export const APP_COOKIE = {
  SESSION:    `${GLOBAL_SETTINGS.APP_INFO.COOKIE_PREFIX}_session`,
  DEVMODE:    `${GLOBAL_SETTINGS.APP_INFO.COOKIE_PREFIX}_devmode`,
  SIMULATION: `${GLOBAL_SETTINGS.APP_INFO.COOKIE_PREFIX}_simulation`,
} as const;