import { GLOBAL_SETTINGS } from '../globalsettings';

export const SESSION_COOKIE = {
  NAME: 'fsr_session',
  OPTIONS: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: GLOBAL_SETTINGS.ACCOUNT.LOGIN_SESSION_DURATION
  }
};