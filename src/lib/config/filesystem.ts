import type { FigmaIconName } from '$lib/components/ui/Icon.svelte';

export const SYSTEM_CONFIG = {
  // The OS-internal folder for meta.fsrsys
  ID_PREFIX: 'fsr',
  CONFIG_FOLDER: '.config', // ends with .{SYSTEM_FOLDER}
  META_FILENAME: 'meta', // ends with .{SYSTEM_FILE}
  DEFAULT_WORKSPACE: 'Workspace', // this one will be created if there is no workspace in root
  HIDDEN_PREFIXES: ['.', '_'], // hidden for everyone accept the os itself
  EXTENSIONS: {
    SYSTEM_FOLDER: '.sysfolder',      // Folders for privileged users
    WORKSPACE: '.workspace',    // Root-level organizational folders
    SYSTEM_FILE: '.fsrsys',           // Meta file extension
    SECURE_FILE: '.fsrsecure'         // Encrypted/Privileged file extension
  }
} as const;

export const FILE_TYPE_CONFIG = {
  // Navigation views mapped to their icons and route paths
  views: {
    recentTopics: { icon: 'home', path: '/dashboard/recent' },
    myTasks: { icon: 'person', path: '/dashboard/tasks' },
    calendar: { icon: 'calendar', path: '/dashboard/calendar' },
    eMails: { icon: 'mail', path: '/dashboard/mail' }
  },
  // Internal OS files mapped to their icons and extensions
  internal: {
    document: { icon: 'file', ext: '.fsrdoc' },
    tasks: { icon: 'checkbox', ext: '.fsrtask' },
    event: { icon: 'calendar', ext: '.fsrevt' }
  },
  // Standard external files
  external: {
    pdf: { icon: 'file', ext: '.pdf' },
    spreadsheet: { icon: 'file-table', ext: '.xlsx' },
    image: { icon: 'castle', ext: '.jpg' },
    folder: { icon: 'folder', ext: '' },
    unknown: { icon: 'circled-question-small', ext: '' }
  }
} as const;

export type UIFileIconType =
  | keyof typeof FILE_TYPE_CONFIG.views
  | keyof typeof FILE_TYPE_CONFIG.internal
  | keyof typeof FILE_TYPE_CONFIG.external;

export interface FSRNode {
  id: string;
  parentId: string | null;
  type: 'workspace' | 'folder' | 'file';
  name: string;
  physicalName: string;
  extension: string;
  uiFileType: UIFileIconType;
  updatedAt: number;
  createdAt: number;
  isTemplate?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
  children?: FSRNode[];
}

export interface FSRMeta {
  _meta: { schemaVersion: string; lastUpdated: number; description: string };
  nodes: Record<string, Omit<FSRNode, 'id' | 'children' | 'uiFileType'>>;
}

export function isInternalExtension(ext: string): boolean {
  return Object.values(FILE_TYPE_CONFIG.internal).some(config => config.ext === ext);
}

export function getUIFileType(extension: string | undefined): UIFileIconType {
  if (!extension) return 'unknown';
  const ext = extension.toLowerCase();

  for (const [key, cfg] of Object.entries(FILE_TYPE_CONFIG.internal)) {
    if (cfg.ext === ext) return key as UIFileIconType;
  }
  for (const [key, cfg] of Object.entries(FILE_TYPE_CONFIG.external)) {
    if ((cfg as any).ext === ext) return key as UIFileIconType;
  }
  return 'unknown';
}