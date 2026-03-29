import { FILE_TYPE_CONFIG, FILE_MODIFIERS, type UIFileIconType } from '$lib/config/filesystem';

/**
 * Parses a physical filename from the cloud into its logical components.
 */
export function parseNodeFilename(basename: string) {
  let isSecure = false;
  let isTemplate = false;
  let logicalName = basename;

  if (logicalName.endsWith(FILE_MODIFIERS.SECURE)) {
    isSecure = true;
    logicalName = logicalName.slice(0, -FILE_MODIFIERS.SECURE.length);
  }

  // (Optional: add TEMPLATE logic here later if you add it to FILE_MODIFIERS)

  const parts = logicalName.split('.');
  const id = parts[0];
  const baseExtension = parts.length > 1 ? `.${parts.slice(1).join('.')}` : '';

  return { id, baseExtension, logicalName, isSecure, isTemplate };
}

/**
 * Builds the physical filename used in the cloud.
 */
export function buildNodeFilename(id: string, baseExtension: string, flags: { isSecure?: boolean, isTemplate?: boolean } = {}) {
  let name = `${id}${baseExtension}`;
  // if (flags.isTemplate) name += FILE_MODIFIERS.TEMPLATE; // for later
  if (flags.isSecure) name += FILE_MODIFIERS.SECURE;
  return name;
}

export function getFileConfig(extension: string) {
  const ext = (extension || '').toLowerCase();

  for (const cfg of Object.values(FILE_TYPE_CONFIG.internal)) {
    if ((cfg.ext as readonly string[]).includes(ext)) return cfg;
  }
  for (const cfg of Object.values(FILE_TYPE_CONFIG.external)) {
    if ((cfg.ext as readonly string[]).includes(ext)) return cfg;
  }

  return FILE_TYPE_CONFIG.external.unknown;
}

export function isInternalExtension(extension: string): boolean {
  const ext = (extension || '').toLowerCase();
  return Object.values(FILE_TYPE_CONFIG.internal).some(cfg =>
    (cfg.ext as readonly string[]).includes(ext)
  );
}

export function getUIFileType(extension: string | undefined): UIFileIconType {
  const ext = (extension || '').toLowerCase();

  for (const [key, cfg] of Object.entries(FILE_TYPE_CONFIG.internal)) {
    if ((cfg.ext as readonly string[]).includes(ext)) return key as UIFileIconType;
  }
  for (const [key, cfg] of Object.entries(FILE_TYPE_CONFIG.external)) {
    if ((cfg.ext as readonly string[]).includes(ext)) return key as UIFileIconType;
  }
  return 'unknown';
}

export function isWebsocketEnabled(extension: string): boolean {
  return getFileConfig(extension).websocket;
}