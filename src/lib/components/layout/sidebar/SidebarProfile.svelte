<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { SETUP_ROLES } from '$lib/config/cloudfiles/roles'; // FIXED PATH

	let { user } = $props<{ user: { id: string; name: string; role: string; color?: string } | null }>();
</script>

<div data-uiname="SidebarProfile-Wrapper" class="border-border gap-xs py-l mt-auto flex flex-col justify-center">
	{#if user && user.role !== SETUP_ROLES.GUEST}
		<div data-uiname="Authenticated-User-Card" class="px-2xs flex items-center justify-between">
			<button data-uiname="User-Profile-Trigger" class="gap-xs flex min-w-0 items-center transition-opacity hover:opacity-80">
				<div
					data-uiname="User-Avatar"
					class="bg-purpur-500/20 text-purpur-700 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
					style="background-color: {user.color}33; color: {user.color}">
					{user.name.charAt(0).toUpperCase()}
				</div>
				<span data-uiname="User-Name" class="font-label-s text-ink-90 truncate">{user.name}</span>
			</button>

			<form method="POST" action="/logout" data-uiname="Logout-Form">
				<Button type="submit" variant="tertiary" size="s" aria-label="Logout" iconOnly>
					<Icon name="collapse" class="h-main-2xs" />
				</Button>
			</form>
		</div>
	{:else}
		<div data-uiname="Guest-User-Card" class="px-2xs mb-2 flex items-center justify-between">
			<div class="gap-xs flex min-w-0 items-center">
				<div
					data-uiname="Guest-Avatar"
					class="bg-level-3 text-ink-60 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
					style="background-color: {user?.color}33; color: {user?.color}">
					?
				</div>
				<span data-uiname="Guest-Name" class="font-label-s text-ink-60 truncate">{user?.name}</span>
			</div>
		</div>
		<Button data-uiname="Login-Button" variant="tertiary" size="s" href="/login" class="text-ink-60 justify-start">
			{#snippet children()}
				<span class="font-label-s">Login / Account erstellen</span>
			{/snippet}
		</Button>
	{/if}
</div>
