/**
 * Generic JSON handler for WebDAV.
 * Can be used for Tiptap documents, Kanban boards, Excalidraw files, etc.
 */

export async function readJsonDocument(client: any, physicalPath: string) {
  try {
    const content = await client.getFileContents(physicalPath, { format: 'text' });

    if (!content || content.trim() === '') {
      return null;
    }

    return JSON.parse(content as string);
  } catch (e: any) {
    if (e.status === 404) {
      return null;
    }
    throw new Error('Failed to read document from cloud storage.');
  }
}

export async function writeJsonDocument(client: any, physicalPath: string, data: any) {
  try {
    const stringifiedContent = JSON.stringify(data, null, 2);
    await client.putFileContents(physicalPath, stringifiedContent, { format: 'text' });
    return true;
  } catch (e) {
    console.error(`Failed to write JSON document at ${physicalPath}:`, e);
    throw new Error('Failed to save document to cloud storage.');
  }
}