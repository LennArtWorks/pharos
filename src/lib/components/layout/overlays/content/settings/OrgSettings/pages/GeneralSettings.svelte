<script lang="ts">
	import Input from '$lib/components/ui/Input.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import * as Select from '$lib/components/ui/Select';
	import SyncButton from './SyncButton.svelte';

	let { hasUnsavedChanges = $bindable(false) } = $props();

	// Mock initial state
	let orgName = $state('FSR Design');
	let subdomain = $state('fsr07');
	let primaryColor = $state('#8533DC');
	let startRole = $state('Member');

	function markDirty() {
		hasUnsavedChanges = true;
	}
</script>

<div class="flex flex-col gap-12 pb-12">
	<section class="flex flex-col gap-6">
		<div>
			<h2 class="text-label-xl text-ink-90 font-bold">Branding & Identity</h2>
			<p class="text-body-m text-ink-50 mt-1">Manage your organization's core details and appearance.</p>
		</div>

		<div class="grid grid-cols-2 gap-6">
			<Input label="Organisation Name" bind:value={orgName} oninput={markDirty} />
			<Input label="Subdomain" bind:value={subdomain} readonly tooltip="Subdomain routing cannot be changed after creation." />
		</div>

		<div class="grid grid-cols-2 gap-6">
			<div class="flex flex-col gap-1">
				<label class="font-label-s text-ink-70 font-semibold">Logo</label>
				<Button variant="secondary" class="w-full justify-start" onclick={() => alert('Upload logo...')}>
					{#snippet leading()}<Icon name="image" />{/snippet}
					Upload Image...
				</Button>
			</div>
			<div class="flex flex-col gap-1">
				<label class="font-label-s text-ink-70 font-semibold">Login Background</label>
				<Button variant="secondary" class="w-full justify-start" onclick={() => alert('Upload background...')}>
					{#snippet leading()}<Icon name="image" />{/snippet}
					Upload Image...
				</Button>
			</div>
		</div>

		<div class="grid grid-cols-2 gap-6">
			<div class="flex flex-col gap-1">
				<label class="font-label-s text-ink-70 font-semibold">Primary Color</label>
				<div class="bg-level-2 border-border h-main-m rounded-m focus-within:ring-ink-90 flex items-center overflow-hidden border focus-within:ring-2">
					<input type="color" bind:value={primaryColor} oninput={markDirty} class="h-full w-12 cursor-pointer border-none bg-transparent p-0 outline-none" />
					<input type="text" bind:value={primaryColor} oninput={markDirty} class="text-label-s text-ink-90 h-full flex-1 border-none bg-transparent px-2 font-mono uppercase outline-none" />
				</div>
			</div>
		</div>
	</section>

	<Divider />

	<section class="flex flex-col gap-6">
		<div>
			<h2 class="text-label-xl text-ink-90 font-bold">Sync & Cloud</h2>
			<p class="text-body-m text-ink-50 mt-1">Force a manual sync between the OS and the Sciebo WebDAV backend.</p>
		</div>

		<div class="bg-level-0 border-border rounded-m border p-6">
			<div class="flex items-center justify-between">
				<div class="flex flex-col">
					<span class="text-label-m text-ink-90 font-bold">Force Cloud Sync</span>
					<span class="text-body-m text-ink-50">Manually rebuild the file index if inconsistencies occur.</span>
				</div>
				<div class="w-48">
					<SyncButton />
				</div>
			</div>
		</div>
	</section>

	<Divider />

	<section class="flex flex-col gap-6">
		<div>
			<h2 class="text-label-xl text-ink-90 font-bold">New Members</h2>
			<p class="text-body-m text-ink-50 mt-1">Configure default settings and roles for newly invited users.</p>
		</div>

		<div class="grid grid-cols-2 gap-6">
			<div class="flex flex-col gap-1">
				<label class="font-label-s text-ink-70 font-semibold">Default Start Role</label>
				<Select.Root bind:value={startRole}>
					<Select.Trigger class="w-full text-left" />
					<Select.Content>
						<Select.Item value="Member">Member</Select.Item>
						<Select.Item value="Guest">Guest</Select.Item>
						<Select.Item value="NewUser">New User</Select.Item>
					</Select.Content>
				</Select.Root>
			</div>
		</div>

		<div class="flex flex-col gap-1">
			<label class="font-label-s text-ink-70 font-semibold">Pinned Files (Default)</label>
			<div class="bg-level-0 border-border border-custom-dashed hover:bg-level-1 rounded-m flex cursor-pointer items-center justify-center p-4 transition-colors">
				<span class="text-body-s text-ink-50 font-medium">+ Select files or folders to pin for new users</span>
			</div>
		</div>
	</section>
</div>
