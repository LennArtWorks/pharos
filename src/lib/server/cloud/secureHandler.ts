import { encrypt, decrypt } from '$lib/server/auth/crypto';
import { getCloudClient, type CloudConfig } from '$lib/server/cloud/origin/client';

const BACKUP_DIR = '.config/backups';

export async function readSecureFile(orgConfig: CloudConfig, filePath: string) {
  const client = getCloudClient(orgConfig);

  try {
    if (await client.exists(filePath) === false) {
      return null;
    }

    // Assuming your client returns a string for text formats
    const encryptedContent = (await client.getFileContents(filePath, { format: 'text' })) as string;
    const decryptedText = decrypt(encryptedContent);

    return JSON.parse(decryptedText);
  } catch (err) {
    console.error(`Failed to read or decrypt secure file: ${filePath}`, err);
    throw err;
  }
}

export async function writeSecureFileWithBackup(orgConfig: CloudConfig, filePath: string, data: any) {
  const client = getCloudClient(orgConfig);

  try {
    // 1. Ensure the backup directory exists
    if (await client.exists(BACKUP_DIR) === false) {
      await client.createDirectory(BACKUP_DIR);
    }

    // 2. Create a permanent, timestamped backup of the current state
    if (await client.exists(filePath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = filePath.split('/').pop();
      const backupPath = `${BACKUP_DIR}/${filename}.${timestamp}.bak`;

      // Copy the existing file to the backup directory
      await client.copyFile(filePath, backupPath);
      console.log(`Created permanent secure backup at ${backupPath}`);
    }

    // 3. Encrypt the new payload
    const rawJson = JSON.stringify(data, null, 2); // Indented just in case someone looks at the raw encrypted string
    const encryptedContent = encrypt(rawJson);

    // 4. Write the encrypted string to the cloud
    await client.putFileContents(filePath, encryptedContent);
    console.log(`Successfully wrote encrypted file to ${filePath}`);

  } catch (err) {
    console.error(`Failed to write secure file: ${filePath}`, err);
    throw new Error('Secure file write failed. Check server logs.');
  }
}