import { getScieboClient } from './sciebo';

// Explicit interface to ensure we always have the decrypted credentials
export interface CloudConfig {
  cloud_name: string;
  cloud_url: string;
  cloud_username: string;
  cloud_directory?: string; // Added directory
  decrypted_password?: string;
}

export function getCloudClient(orgConfig: CloudConfig) {
  switch (orgConfig.cloud_name) {
    case 'sciebo':
    default:
      // 1. Clean the base URL
      let baseUrl = orgConfig.cloud_url.endsWith('/')
        ? orgConfig.cloud_url
        : `${orgConfig.cloud_url}/`;

      // 2. Safely append the directory if it exists
      if (orgConfig.cloud_directory) {
        // Strip leading and trailing slashes from the directory name to prevent double slashes
        const cleanDir = orgConfig.cloud_directory.replace(/^\/+|\/+$/g, '');
        baseUrl = `${baseUrl}${cleanDir}/`;
      }

      return getScieboClient({
        url: baseUrl,
        user: orgConfig.cloud_username,
        pass: orgConfig.decrypted_password || ''
      });
  }
}