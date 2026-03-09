// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			orgConfig?: {
				organisation_id: string;
				subdomain: string;
				organization_name: string;
				cloud_name: string;
				cloud_url: string;
				cloud_username: string;
				cloud_directory: string;
				decrypted_password?: string;
				roles?: Record<string, string[]>;
				roles_json?: string | null;
			};
			user: {
				id: string;
				role: string;
				name?: string;
				color?: string;
			} | null;
		}
	}
}

export { };
