import { getScieboClient } from './sciebo';

// Explicit interface to ensure we always have the decrypted credentials
export interface CloudConfig {
  cloud_name: string;
  cloud_url: string;
  cloud_username: string;
  decrypted_password?: string; // The OS must provide this
}

export function getCloudClient(orgConfig: CloudConfig) {
  switch (orgConfig.cloud_name) {
    case 'sciebo':
    default:
      return getScieboClient({
        url: orgConfig.cloud_url,
        user: orgConfig.cloud_username,
        pass: orgConfig.decrypted_password || ''
      });
  }
}