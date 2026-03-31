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
      active: true, type: "file", icon: 'settings', ext: ['.fsrsys'],
      component: "ContentTypeNotSupported", websocket: false, defaultContent: { name: "New Sysfile" }
    },
    sysfolder: {
      active: true, type: "folder", icon: 'folder', ext: ['.sysfolder'],
      component: "ContentTypeFolder", websocket: false, defaultContent: { name: "New Sysfolder" }
    },
    folder: {
      active: true, type: "folder", icon: 'folder', ext: [''],
      component: "ContentTypeFolder", websocket: false, defaultContent: { name: "New Folder" }
    },
    workspace: {
      active: true, type: "workspace", icon: '', ext: ['.workspace'],
      component: "ContentTypeWorkspace", websocket: false, defaultContent: { name: "New Workspace" }
    },
    document: {
      active: true, type: "file", icon: 'file', ext: ['.fsrdoc'],
      component: "ContentTypeDocument", websocket: true,
      defaultContent: { name: "New Document", type: "doc", content: [{ type: "paragraph", content: [] }] }
    },
    tasks: {
      active: false, type: "file", icon: 'checkbox', ext: ['.fsrtasks'],
      component: "ContentTypeTasks", websocket: true,
      defaultContent: { name: "New Tasksboard", columns: [{ id: "todo", title: "To Do", tasks: [] }] }
    },
    event: {
      active: false, type: "file", icon: 'calendar', ext: ['.fsrevt'],
      component: "ContentTypeNotSupported", websocket: true,
      defaultContent: { name: "New Event", date: null, attendees: [] }
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
  // extension for ecrypted files (they will be encrypted when laying on the cloud)
  SECURE: '.fsrsecure',
};

export const SYSTEM_CONFIG = {
  // The OS-internal folder for meta.fsrsys
  ID_PREFIX: 'fsr',
  CONFIG_FOLDER: '.config', // stores the special system files (like meta, roles, accounts)
  META_FILE: ['meta', FILE_TYPE_CONFIG.internal.sysfile.ext[0]],
  ROLES_FILE: ['roles', FILE_TYPE_CONFIG.internal.sysfile.ext[0]],
  ACCOUNTS_FILE: ['accounts', `${FILE_TYPE_CONFIG.internal.sysfile.ext[0]}${FILE_MODIFIERS.SECURE}`],
  ACCOUNTS_FOLDER: ['accounts', `${FILE_TYPE_CONFIG.internal.sysfolder.ext[0]}`],
  SECURE_BACKUP_FOLDER: ['backups-secure', `${FILE_TYPE_CONFIG.internal.sysfolder.ext[0]}`], // stores only backups for system relevant secure files
  DEFAULT_WORKSPACE: 'Workspace',
  HIDDEN_PREFIXES: ['.', '_'], // completely hidden from the os at any time

  // Maps UIFileIconType keys that require the "system.files.*" permission scope
  SYSTEM_FILE_TYPES: ['sysfolder', 'sysfile'] as const
} as const;

// Types
export type UIFileIconType =
  | keyof typeof VIEW_CONFIG
  | keyof typeof FILE_TYPE_CONFIG.internal
  | keyof typeof FILE_TYPE_CONFIG.external;

// structure of a node/file listed in meta.fsrsys
export interface FSRNode {
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
  children?: FSRNode[];
}

// header of the meta.fsrsys
export interface FSRMeta {
  _meta: { schemaVersion: string; lastUpdated: number; description: string };
  nodes: Record<string, Omit<FSRNode, 'id' | 'children' | 'uiFileType' | 'physicalName' | 'type'> & { isSecure?: boolean }>;
}