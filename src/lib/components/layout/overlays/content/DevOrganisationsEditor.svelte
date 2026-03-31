<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import Form from '$lib/components/layout/Form.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import OverlayTemplateStandard from '$lib/components/layout/overlays/templates/OverlayTemplateStandard.svelte';

	interface EditorOrg {
		organisation_id: string;
		subdomain: string;
		organization_name: string;
		cloud_url: string;
		cloud_username: string;
		cloud_directory: string;
		is_active: number;
	}

	let { id, closeOverlay }: { id: string | null; closeOverlay: () => void } = $props();

	// We still read from page.data.organisations (assuming the dev dashboard is loaded in the background)
	let orgs = $derived((page.data.organisations as EditorOrg[]) || []);
	let org = $derived(id ? orgs.find((o) => o.organisation_id === id) : null);
	let isEditing = $derived(!!org);

	let sub = $state('');
	let name = $state('');
	let cloudUrl = $state('');
	let cloudUser = $state('');
	let cloudPass = $state('');
	let cloudDir = $state('');
	let isActive = $state(true);

	$effect(() => {
		if (org) {
			sub = org.subdomain;
			name = org.organization_name;
			cloudUrl = org.cloud_url;
			cloudUser = org.cloud_username;
			cloudPass = '';
			cloudDir = org.cloud_directory || '';
			isActive = org.is_active === 1;
		} else {
			sub = '';
			name = '';
			cloudUrl = '';
			cloudUser = '';
			cloudPass = '';
			cloudDir = '';
			isActive = true;
		}
	});

	let actionPath = $derived(isEditing ? '/dev/backend/organisations?/update' : '/dev/backend/organisations?/create');
</script>

<OverlayTemplateStandard title={isEditing ? 'Edit Organisation' : 'New Organisation'} onclose={closeOverlay}>
	<Form
		id="org-form"
		action={actionPath}
		enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'success') closeOverlay();
				await update();
			};
		}}>
		{#if isEditing}
			<input type="hidden" name="organisation_id" value={id} />
		{/if}

		<div class="grid grid-cols-2 gap-8">
			<div class="flex flex-col gap-6">
				<div>
					<h3 class="text-label-m text-ink-90 mb-4 font-bold">Tenant Identity</h3>
					<Input label="Organization Name" name="organization_name" bind:value={name} required placeholder="e.g. FSR Design" />
					<div class="mt-4">
						<Input label="Subdomain" name="subdomain" bind:value={sub} required placeholder="e.g. design" tooltip="Will be used as subdomain: {sub || '...'}.fsr-os.de">
							{#snippet leading()}<Icon name="web" />{/snippet}
						</Input>
					</div>
				</div>

				{#if isEditing}
					<Divider />
					<div class="flex items-center justify-between">
						<span class="text-label-m text-ink-90 font-bold">Active Status</span>
						<label class="relative inline-flex cursor-pointer items-center">
							<input type="checkbox" name="is_active" value="true" checked={isActive} class="peer sr-only" />
							<div
								class="peer bg-level-2 border-border after:border-border after:bg-ink-50 peer-checked:bg-accent-500 h-6 w-11 rounded-full border after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:border after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:after:bg-white">
							</div>
						</label>
					</div>
				{/if}
			</div>

			<div class="flex flex-col gap-4">
				<h3 class="text-label-m text-ink-90 mb-2 flex items-center gap-2 font-bold">
					<Icon name="cloud" class="text-accent-500 h-4 w-4" /> Cloud Connection (WebDAV)
				</h3>
				<Input label="WebDAV URL" name="cloud_url" bind:value={cloudUrl} required placeholder="https://uni.sciebo.de/remote.php/webdav" />
				<Input label="Username / Email" name="cloud_username" bind:value={cloudUser} required placeholder="admin@uni.de" />
				<Input
					label="Password"
					name="cloud_password"
					type="password"
					bind:value={cloudPass}
					required={!isEditing}
					placeholder={isEditing ? 'Leave blank to keep existing password' : 'Enter WebDAV App-Password'}
					tooltip="Passwords are encrypted instantly via AES-256 before touching the database." />
				<Input label="Base Directory (Optional)" name="cloud_directory" bind:value={cloudDir} placeholder="e.g. FSR-OS" tooltip="Leave blank to use the root directory of the cloud." />
			</div>
		</div>
	</Form>

	{#snippet footer()}
		<Button variant="secondary" onclick={closeOverlay}>Cancel</Button>
		<Button variant="primary" type="submit" form="org-form">{isEditing ? 'Save Changes' : 'Create Tenant'}</Button>
	{/snippet}
</OverlayTemplateStandard>
