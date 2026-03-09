import { encrypt, decrypt } from '$lib/server/auth/crypto';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';
import { SYSTEM_CONFIG } from '$lib/config/filesystem';

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

export async function writeSecureFileWithBackup(orgConfig: CloudConfig, relativePath: string, data: any) {
  const client = getCloudClient(orgConfig);

  const fullPath = `/${relativePath}`.replace(/\/+/g, '/');
  const configDir = `/${SYSTEM_CONFIG.CONFIG_FOLDER}`;
  const backupDir = `${configDir}/backups`;

  try {
    if (await client.exists(configDir) === false) await client.createDirectory(configDir);
    if (await client.exists(backupDir) === false) await client.createDirectory(backupDir);

    if (await client.exists(fullPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = fullPath.split('/').pop();
      const backupPath = `${backupDir}/${filename}.${timestamp}.bak`;

      await client.copyFile(fullPath, backupPath);
      console.log(`Created permanent secure backup at ${backupPath}`);
    }

    const rawJson = JSON.stringify(data, null, 2);
    const encryptedContent = encrypt(rawJson);

    await client.putFileContents(fullPath, encryptedContent);
    console.log(`Successfully wrote encrypted file to ${fullPath}`);

  } catch (err) {
    console.error(`Failed to write secure file: ${fullPath}`, err);
    throw new Error('Secure file write failed.');
  }
}