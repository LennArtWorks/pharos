import { createClient } from 'webdav';

export function getScieboClient(config: { url: string; user: string; pass: string }) {
  return createClient(config.url, {
    username: config.user,
    password: config.pass
  });
}