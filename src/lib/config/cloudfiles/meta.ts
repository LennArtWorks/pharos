/**
 * BLUEPRINT: meta.fsrsys
 * Defines the logical structure of the file tree.
 */
export function generateDefaultMetaIndex() {
  return {
    _meta: { schemaVersion: "1.4", lastUpdated: Date.now(), description: "Global index" },
    nodes: {} as Record<string, any>
  };
}

export function generateBaseNode(
  name: string,
  parentId: string | null,
  extension: string,
  isSecure: boolean = false,
  isTemplate: boolean = false
) {
  // LEAN JSON Standard: No redundant data like physical paths or UI types.
  return {
    name,
    parentId,
    extension,
    isSecure,
    isTemplate,
    updatedAt: Date.now(),
    createdAt: Date.now(),
    tags: [],
    customFields: {}
  };
}