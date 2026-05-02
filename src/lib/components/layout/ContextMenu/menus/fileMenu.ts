import { FILE_TYPE_CONFIG, type VNode } from '$lib/config/filesystem';
import { PERMISSIONS } from '$lib/config/permissions';
import { has } from '$lib/utils/config/permissions';
import type { ContextMenuItem } from '$lib/state/layout/contextMenu.svelte';
import type { FigmaIconName } from '$lib/components/ui/Icon.svelte';

export function getFileContextMenuItems(node: VNode, hasDates: boolean = false, currentUserId?: string): ContextMenuItem[] {
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

  // "Add Date" / "Edit Date" for files and folders — workspaces are excluded
  if (node.type !== 'workspace') {
    if (items.length > 0) items.push({ id: 'div-date', type: 'divider' });

    if (hasDates) {
      // TODO (Phase 3): Clicking "Edit Date" should open the date detail popover for the
      // existing date(s) on this node. Currently the action is a no-op placeholder.
      items.push({ id: 'edit-date', type: 'action', label: 'Edit Date', icon: 'calendar', action: 'edit-date' });
    } else {
      items.push({ id: 'add-date', type: 'action', label: 'Add Date', icon: 'calendar', action: 'add-date' });
    }
  }

  if (items.length > 0) items.push({ id: 'div-assign', type: 'divider' });
  const isSelfAssigned = !!currentUserId && (node.assignees ?? []).includes(currentUserId);
  items.push({ id: 'assign-self', type: 'action', label: isSelfAssigned ? 'Unassign me' : 'Assign me', icon: 'person', action: 'assign-self' });
  if (has(PERMISSIONS.FILES.EDIT)) {
    items.push({ id: 'assign-others', type: 'action', label: 'Assign to...', icon: 'person', action: 'assign-others' });
  }

  if (has(PERMISSIONS.FILES.DELETE)) {
    if (items.length > 0) items.push({ id: 'div-delete', type: 'divider' });
    items.push({ id: 'delete', type: 'action', label: 'Move to Trash', icon: 'trash', action: 'delete', danger: true });
  }

  return items;
}