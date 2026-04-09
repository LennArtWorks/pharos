import type { FSRNode } from '$lib/config/filesystem';

class FileSystemEngine {
  tree = $state<FSRNode[]>([]);
  nodeMap = $state<Map<string, FSRNode>>(new Map());
  isFetching = $state(false);

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

  // Flattens the tree into a Map for instant O(1) lookups
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

  // Walks upwards to build: [Workspace, Folder, File]
  getLineage(id: string): FSRNode[] {
    const lineage: FSRNode[] = [];
    let current = this.nodeMap.get(id);
    while (current) {
      lineage.unshift(current);
      current = current.parentId ? this.nodeMap.get(current.parentId) : undefined;
    }
    return lineage;
  }

  // Gets files residing in the same directory
  getSiblings(id: string): FSRNode[] {
    const node = this.nodeMap.get(id);
    if (!node) return [];
    if (!node.parentId) {
      // If it's a root workspace, siblings are other root workspaces
      return this.tree.filter(n => n.parentId === null);
    }
    const parent = this.nodeMap.get(node.parentId);
    return parent?.children || [];
  }
}

export const fsState = new FileSystemEngine();