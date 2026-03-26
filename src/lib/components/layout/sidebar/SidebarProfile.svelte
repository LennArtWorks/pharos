<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { SETUP_ROLES } from '$lib/config/permissions'; // Import your roles!

	let { user } = $props<{ user: { id: string; name: string; role: string; color?: string } | null }>();
</script>

<div class="border-border gap-xs py-l mt-auto flex flex-col justify-center border-t">
	{#if user && user.role !== SETUP_ROLES.GUEST}
		<div class="px-2xs flex items-center justify-between">
			<button class="gap-xs flex min-w-0 items-center transition-opacity hover:opacity-80">
				<div class="bg-purpur-500/20 text-purpur-700 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold" style="background-color: {user.color}33; color: {user.color}">
					{user.name.charAt(0).toUpperCase()}
				</div>
				<span class="font-label-s text-ink-90 truncate">{user.name}</span>
			</button>

			<form method="POST" action="/logout">
				<Button type="submit" variant="tertiary" size="s" aria-label="Logout" icon>
					<Icon name="collapse" class="h-main-2xs" />
				</Button>
			</form>
		</div>
	{:else}
		<div class="px-2xs mb-2 flex items-center justify-between">
			<div class="gap-xs flex min-w-0 items-center">
				<div class="bg-level-3 text-ink-60 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold" style="background-color: {user?.color}33; color: {user?.color}">?</div>
				<span class="font-label-s text-ink-60 truncate">{user?.name}</span>
			</div>
		</div>
		<Button variant="tertiary" size="s" href="/login" class="text-ink-60 justify-start">
			{#snippet children()}
				<span class="font-label-s">Login / Account erstellen</span>
			{/snippet}
		</Button>
	{/if}
</div>
