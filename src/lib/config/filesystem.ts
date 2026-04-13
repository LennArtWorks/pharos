import { APP_EXTENSIONS, GLOBAL_SETTINGS } from './globalsettings';

// Navigation views mapped to their icons and route paths
export const VIEW_CONFIG = {
  recentTopics: { active: true, icon: 'home', label: "Recent Topics", path: '/files/recent' },
  myTasks: { active: true, icon: 'person', label: "My Tasks", path: '/files/tasks' },
  calendar: { active: true, icon: 'calendar', label: "Calendar", path: '/files/calendar' },
  eMails: { active: false, icon: 'mail', label: "Mails", path: '/files/mail' }
  // devPortal: { active: true, icon: 'code-block', label: "Dev Portal", path: '/dev' }
} as const;

export const FILE_TYPE_CONFIG = {
  // Internal OS files mapped to their icons and extensions
  internal: {
    sysfile: {
      active: true, type: "file", icon: 'settings', ext: [APP_EXTENSIONS.SYS],
      component: "ContentTypeNotSupported", websocket: false, defaultContent: { name: "New Sysfile" }
    },
    sysfolder: {
      active: true, type: "folder", icon: 'folder', ext: [APP_EXTENSIONS.SYSFOLDER],
      component: "ContentTypeFolder", websocket: false, defaultContent: { name: "New Sysfolder" }
    },
    folder: {
      active: true, type: "folder", icon: 'folder', ext: [''],
      component: "ContentTypeFolder", websocket: false, defaultContent: { name: "New Folder" }
    },
    workspace: {
      active: true, type: "workspace", icon: '', ext: [APP_EXTENSIONS.WORKSPACE],
      component: "ContentTypeFolder", websocket: false, defaultContent: { name: "New Workspace" }
    },
    document: {
      active: true, type: "file", icon: 'file', ext: [APP_EXTENSIONS.DOC],
      component: "ContentTypeDocument", websocket: true,
      defaultContent: { name: "New Document", type: "doc", content: [{ type: "paragraph", content: [] }] }
    },
    event: {
      active: true, type: "folder", icon: 'calendar', ext: [APP_EXTENSIONS.EVENT],
      component: "ContentTypeEvent", websocket: false,
      defaultContent: { name: "New Event", date: null, attendees: [] }
    },
    tasks: {
      active: false, type: "file", icon: 'checkbox', ext: [APP_EXTENSIONS.TASKS],
      component: "ContentTypeTasks", websocket: true,
      defaultContent: { name: "New Tasksboard", columns: [{ id: "todo", title: "To Do", tasks: [] }] }
    },
  },
  // Standard external files
  external: {
    pdf: { active: true, type: "file", icon: 'file', ext: ['.pdf'], component: "ContentTypePreview", websocket: false },
    spreadsheet: { active: true, type: "file", icon: 'file-table', ext: ['.xlsx', '.csv'], component: "ContentTypeNotSupported", websocket: false },
    image: { active: true, type: "file", icon: 'castle', ext: ['.jpg', '.jpeg', '.png', '.gif', '.webp'], component: "ContentTypePreview", websocket: false },
    unknown: { active: true, type: "file", icon: 'circled-question-small', ext: [''], component: "ContentTypeNotSupported", websocket: false }
  }
} as const;

export const FILE_MODIFIERS = {
  // Extension appended to encrypted files laying on the cloud
  SECURE: APP_EXTENSIONS.SECURE_MODIFIER,
};

export const SYSTEM_CONFIG = {
  // Prefix for node IDs. Derived from APP_INFO — '' means pure UUID with no prefix.
  ID_PREFIX: GLOBAL_SETTINGS.APP_INFO.NODE_ID_PREFIX,
  CONFIG_FOLDER: '.config', // stores the special system files (like meta, roles, accounts)
  META_FILE: ['meta', APP_EXTENSIONS.SYS],
  DATES_FILE: ['dates', APP_EXTENSIONS.SYS],
  OUTDATED_DATES_FILE: ['outdated-dates', APP_EXTENSIONS.SYS],
  ROLES_FILE: ['roles', APP_EXTENSIONS.SYS],
  ACCOUNTS_FILE: ['accounts', `${APP_EXTENSIONS.SYS}${APP_EXTENSIONS.SECURE_MODIFIER}`],
  ACCOUNTS_FOLDER: ['accounts', APP_EXTENSIONS.SYSFOLDER],
  SECURE_BACKUP_FOLDER: ['backups-secure', APP_EXTENSIONS.SYSFOLDER],
  DEFAULT_WORKSPACE: 'Workspace',
  HIDDEN_PREFIXES: ['.', '_'], // completely hidden from the os at any time

  // Maps UIFileIconType keys that require the "system.files.*" permission scope
  SYSTEM_FILE_TYPES: ['sysfolder', 'sysfile'] as const
} as const;

// Configuration for floating/metadata items that don't represent physical WebDAV files
export const FLOATING_ITEM_CONFIG = {
  dates: {
    standard: { icon: 'calendar', label: 'Date' },
    start: { icon: 'play', label: 'Start Date' },
    deadline: { icon: 'flag', label: 'Deadline' }
  }
  // Future additions: 'assignments', 'status', etc. can go here
} as const;

export type DateVariant = keyof typeof FLOATING_ITEM_CONFIG.dates;

// Types
export type UIFileIconType =
  | keyof typeof VIEW_CONFIG
  | keyof typeof FILE_TYPE_CONFIG.internal
  | keyof typeof FILE_TYPE_CONFIG.external;

// Structure of a node/file listed in the meta index.
// "Virtual Node" — represents a logical file system entry; the physical file lives on WebDAV.
export interface VNode {
  id: string;
  parentId: string | null;
  type: 'workspace' | 'folder' | 'file';
  name: string;
  physicalName: string; // Dynamically generated in SvelteKit: id + extension
  extension: string;
  uiFileType: UIFileIconType; // Dynamically generated in SvelteKit via getUIFileType
  updatedAt: number;
  createdAt: number;
  isTemplate?: boolean;
  isSecure?: boolean;
  tags?: string[];
  customFields?: Record<string, any>;
  children?: VNode[];
}

// Structure of a standalone floating date entry (stored in dates.appsys)
export interface FloatingDate {
  id: string;
  title: string;
  variant: DateVariant;
  timestamp: number; // The actual target date/time
  createdAt: number;
  targetNodeId?: string; // Optional: If the date gets assigned to a specific VNode later
}

// Header of the meta index file (meta.appsys)
export interface AppMeta {
  _meta: { schemaVersion: string; lastUpdated: number; description: string };
  nodes: Record<string, Omit<VNode, 'id' | 'children' | 'uiFileType' | 'physicalName' | 'type'> & { isSecure?: boolean }>;
}
