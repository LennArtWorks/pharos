export const GLOBAL_SETTINGS = {
  ACCOUNT: {
    LOGIN_SESSION_DURATION: 30 * 24 * 60 * 60
  },
  SECURITY: {
    // TTL for the central identity registry (used only during login)
    REGISTRY_CACHE_TTL_MS: 1 * 60 * 1000, // 1 minute

    // TTL for active user profiles (checked on every navigation)
    PROFILE_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minute
  },
  APP_INFO: {
    // Used in titles, emails, and UI
    NAME: 'FSR-OS',
    // The production root domain
    BASE_DOMAIN: 'fsr-os.net',
  },
  FILES: {
    AUTOSAVE_DELAY_MS: 1500,
  },
  WEBSOCKETS: {
    SERVER_SYNC_INTERVAL_MS: 10000,

    // Dynamically generate the WebSocket URL based on where the app is currently running
    getDynamicUrl(documentId: string): string {
      if (typeof window === 'undefined') return ''; // Prevent SSR errors

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;

      // e.g., ws://localhost:5173/ws/fsr_123 or wss://design.fsr-os.net/ws/fsr_123
      return `${protocol}//${host}/ws/${documentId}`;
    }
  }
};