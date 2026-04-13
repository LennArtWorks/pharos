import type { FSRNode } from '$lib/config/filesystem';
import { apiRenameNode } from '$lib/utils/fileOperations'; // Import the API call

class FileSystemEngine {
  tree = $state<FSRNode[]>([]);
  nodeMap = $state<Map<string, FSRNode>>(new Map());
  isFetching = $state(false);

  // NEW: Globally shared editing state
  editingId = $state<string | null>(null);

  async fetchTree() {
    if (this.tree.length > 0 || this.isFetching) return;
    this.isFetching = true;
    try {
      const res = await fetch('/api/filesystem', { credentials: 'include' });
      if (res.ok) {
        this.tree = await res.json();
        this.rebuildMap();
      }
    } finally {
      this.isFetching = false;
    }
  }

  rebuildMap() {
    const map = new Map<string, FSRNode>();
    const traverse = (nodes: FSRNode[]) => {
      for (const n of nodes) {
        map.set(n.id, n);
        if (n.children) traverse(n.children);
      }
    };
    traverse(this.tree);
    this.nodeMap = map;
  }

  getNode(id: string) {
    return this.nodeMap.get(id);
  }

  getLineage(id: string): FSRNode[] {
    const lineage: FSRNode[] = [];
    let current = this.nodeMap.get(id);
    while (current) {
      lineage.unshift(current);
      current = current.parentId ? this.nodeMap.get(current.parentId) : undefined;
    }
    return lineage;
  }

  getSiblings(id: string): FSRNode[] {
    const node = this.nodeMap.get(id);
    if (!node) return [];
    if (!node.parentId) return this.tree.filter(n => n.parentId === null);
    const parent = this.nodeMap.get(node.parentId);
    return parent?.children || [];
  }

  // NEW: Centralized Rename Logic
  async renameNode(id: string, newName: string) {
    const node = this.nodeMap.get(id);
    if (!node) {
      this.editingId = null;
      return;
    }

    const cleanName = newName.trim();
    if (cleanName === '' || cleanName === node.name) {
      this.editingId = null;
      return;
    }

    const oldName = node.name;
    node.name = cleanName;
    this.editingId = null;
    this.rebuildMap(); // Update map so breadcrumbs react instantly

    try {
      await apiRenameNode(id, cleanName);
    } catch (err: any) {
      // Revert on failure
      node.name = oldName;
      this.rebuildMap();
    }
  }
}

export const fsState = new FileSystemEngine();