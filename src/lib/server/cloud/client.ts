import { getScieboClient } from './sciebo';
// import { getNextcloudClient } from './nextcloud';
// import { getAWSClient } from './aws';

export function getCloudClient(orgConfig: any) {
  // Read the cloud_name from the database to determine which adapter to use
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