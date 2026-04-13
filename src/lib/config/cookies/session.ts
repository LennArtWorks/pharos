import { GLOBAL_SETTINGS, APP_COOKIE } from '../globalsettings';

export const SESSION_COOKIE = {
  NAME: APP_COOKIE.SESSION,
  OPTIONS: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: GLOBAL_SETTINGS.ACCOUNT.LOGIN_SESSION_DURATION
  }
};