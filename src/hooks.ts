// src/hooks.ts
import { GLOBAL_SETTINGS } from '$lib/config/globalsettings';

export function reroute({ url }) {
  const host = url.hostname;
  const isMainDomain = host === GLOBAL_SETTINGS.APP_INFO.BASE_DOMAIN || host === 'localhost' || host === '127.0.0.1';

  // If the user visits the absolute root "/"
  if (url.pathname === '/') {
    if (isMainDomain) {
      // Secretly load the marketing page
      return '/main-home';
    } else {
      // Secretly load the tenant's public page
      return '/organisation-home';
    }
  }

  // Otherwise, let the route behave normally (e.g., /files, /login)
  return url.pathname;
}