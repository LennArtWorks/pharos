import { encrypt, decrypt } from '$lib/server/auth/crypto';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';
import { parseNodeFilename, getUIFileType } from '$lib/utils/filesystem';

export async function readSecureFile(orgConfig: CloudConfig, relativePath: string) {
  const client = getCloudClient(orgConfig);
  const fullPath = `/${relativePath}`.replace(/\/+/g, '/');

  try {
    if (await client.exists(fullPath) === false) return null;

    const encryptedContent = (await client.getFileContents(fullPath, { format: 'text' })) as string;
    const decryptedText = decrypt(encryptedContent);

    return JSON.parse(decryptedText);
  } catch (err) {
    console.error(`Failed to read secure file: ${fullPath}`, err);
    throw err;
  }
}

// Unified write function with automated, context-aware backups
export async function writeSecureFile(orgConfig: CloudConfig, relativePath: string, data: any) {
  const client = getCloudClient(orgConfig);
  const fullPath = `/${relativePath}`.replace(/\/+/g, '/');

  const pathParts = fullPath.split('/').filter(Boolean);
  const filename = pathParts.pop() || '';
  const parentDir = '/' + pathParts.join('/');

  try {
    const rawJson = JSON.stringify(data, null, 2);
    const encryptedContent = encrypt(rawJson);

    // 1. Determine if this file needs a backup
    const parsed = parseNodeFilename(filename);
    const uiType = getUIFileType(parsed.baseExtension);

    // Check if the UI type is included in SYSTEM_FILE_TYPES ('sysfile', 'sysfolder')
    const isSystemFile = (SYSTEM_CONFIG.SYSTEM_FILE_TYPES as readonly string[]).includes(uiType);

    // 2. Execute backup only for critical system files wrapped in .fsrsecure
    if (isSystemFile && parsed.isSecure) {
      const backupDir = `/${SYSTEM_CONFIG.CONFIG_FOLDER}/${SYSTEM_CONFIG.ACCOUNTS_FOLDER.join('')}`;

      if (await client.exists(parentDir) === false) await client.createDirectory(parentDir);
      if (await client.exists(backupDir) === false) await client.createDirectory(backupDir);

      if (await client.exists(fullPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = `${backupDir}/${filename}.${timestamp}.bak`;

        await client.copyFile(fullPath, backupPath);

        // PRUNING: Keep max 5 backups
        const allBackups = await client.getDirectoryContents(backupDir) as Array<{ filename: string, basename: string }>;
        const relatedBackups = allBackups
          .filter(f => f.basename.startsWith(filename))
          .sort((a, b) => b.basename.localeCompare(a.basename)); // Newest first

        if (relatedBackups.length > 5) {
          for (let i = 5; i < relatedBackups.length; i++) {
            await client.deleteFile(relatedBackups[i].filename);
          }
        }
      }
    }

    // 3. Write the actual file
    await client.putFileContents(fullPath, encryptedContent);

  } catch (err) {
    console.error(`Failed to write secure file: ${fullPath}`, err);
    throw new Error('Secure file write failed.');
  }
}