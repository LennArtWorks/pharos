import { FILE_TYPE_CONFIG, type FSRNode } from '$lib/config/filesystem';
import { PERMISSIONS } from '$lib/config/permissions';
import { has } from '$lib/utils/config/permissions';
import type { ContextMenuItem } from '$lib/state/layout/contextMenu.svelte';
import type { FigmaIconName } from '$lib/components/ui/Icon.svelte';

export function getFileContextMenuItems(node: FSRNode): ContextMenuItem[] {
  const items: ContextMenuItem[] = [];

  if (has(PERMISSIONS.FILES.EDIT)) {
    items.push({ id: 'rename', type: 'action', label: 'Rename', icon: 'pencil', action: 'rename' });
  }

  if (has(PERMISSIONS.FILES.CREATE)) {
    const fileTypeItems: ContextMenuItem[] = Object.entries(FILE_TYPE_CONFIG.internal)
      .filter(([id, config]) => config.active && !['sysfolder', 'sysfile'].includes(id))
      .map(([id, config]) => ({
        id: `create-${id}`,
        type: 'action',
        label: id === 'workspace' ? 'Workspace' : id,
        icon: config.icon as FigmaIconName,
        action: `create:${id}`
      }));

    items.push({
      id: 'create-menu',
      type: 'submenu',
      label: 'Create New...',
      icon: 'add',
      items: [...fileTypeItems, { id: 'div-upload', type: 'divider' }, { id: 'upload-file', type: 'action', label: 'Upload File...', icon: 'upload', action: 'create:upload' }]
    });
  }

  if (has(PERMISSIONS.FILES.DELETE)) {
    if (items.length > 0) items.push({ id: 'div-delete', type: 'divider' });
    items.push({ id: 'delete', type: 'action', label: 'Move to Trash', icon: 'trash', action: 'delete', danger: true });
  }

  return items;
}