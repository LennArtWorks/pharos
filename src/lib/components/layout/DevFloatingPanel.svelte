<script lang="ts">
	import { page } from '$app/state';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import * as Popover from '$lib/components/ui/Popover';
	import * as Select from '$lib/components/ui/Select';
	import { invalidateAll } from '$app/navigation';
	import { opState } from '$lib/state/operator.svelte';

	let serverOperator = $derived(page.data.operator);
	// Bind the UI to the optimistic state engine
	let isSimulating = $derived(opState.optimisticSimulating ?? serverOperator?.isSimulating);
	let isDevMode = $derived(opState.optimisticDevMode ?? serverOperator?.isDevMode);
	let tier = $derived(serverOperator?.tier);

	// Add our special offline mode to the top of the array
	let availableRoles = $derived(['Not Logged In', ...Object.keys(page.data.activeRoles || {})]);
	let selectedRole = $state('');
	let isPersistent = $state(false);

	async function toggleSimulation(action: 'start' | 'stop') {
		if (action === 'start' && !selectedRole) return;

		// ⚡️ OPTIMISTIC UPDATE: Instantly change the UI
		opState.optimisticSimulating = action === 'start';
		if (action === 'start') opState.optimisticRole = selectedRole;

		// Fire API in background
		await fetch('/api/dev/simulate', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ action, role: selectedRole, persistent: isPersistent })
		});

		// Seamlessly fetch new server data and re-render!
		await invalidateAll();

		// Clear optimistic state once server is fully synced
		opState.optimisticSimulating = null;
		opState.optimisticRole = null;
	}

	async function toggleDevMode() {
		// Capture the target state before any reactivity triggers
		const targetMode = !isDevMode;

		// ⚡️ OPTIMISTIC UPDATE: Instantly flip the toggle
		opState.optimisticDevMode = targetMode;

		await fetch('/api/dev/simulate', {
			method: 'POST',
			credentials: 'include',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ devMode: targetMode })
		});

		// Seamlessly fetch new server data and re-render!
		await invalidateAll();

		// Clear optimistic state once server is fully synced
		opState.optimisticDevMode = null;
	}
</script>

<div class="fixed right-6 bottom-6 z-9999">
	<Popover.Root closeOnClick={false}>
		<Popover.Trigger>
			<div class="relative">
				{#if isSimulating}
					<span class="absolute -top-1 -right-1 z-10000 flex h-3 w-3">
						<span class="bg-accent-500 absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"></span>
						<span class="bg-accent-500 relative inline-flex h-3 w-3 rounded-full"></span>
					</span>
				{/if}
				<Button variant={isSimulating ? 'secondary' : 'tertiary'} size="l" icon class="bg-level-2 border-border border">
					<Icon name="code-block" class={isSimulating ? 'text-accent-500' : 'text-ink-90'} />
				</Button>
			</div>
		</Popover.Trigger>

		<Popover.Content side="top" align="end" class="bg-level-1 border-border rounded-m w-72 overflow-hidden p-0">
			<div class="bg-level-1 border-border border-b p-4">
				<div class="text-label-m text-ink-90 flex items-center justify-between font-bold">
					<div class="flex items-center gap-2"><Icon name="settings" class="h-4 w-4" /> Operator</div>

					<button
						onclick={toggleDevMode}
						class="bg-level-2 border-border text-label-xs hover:border-ink-50 flex items-center gap-1.5 rounded border px-2 py-1 font-bold transition-colors {isDevMode
							? 'text-accent-500'
							: 'text-ink-50'}">
						<div class="h-2 w-2 rounded-full {isDevMode ? 'bg-accent-500' : 'bg-ink-50'}"></div>
						DevMode
					</button>
				</div>
				<div class="text-label-s text-ink-50 mt-1">{tier} tier</div>
			</div>

			{#if tier === 'support' || tier === 'owner'}
				<div class="border-border bg-level-1/50 flex flex-col gap-4 border-b p-4">
					<div class="text-label-s text-ink-90 flex items-center gap-2 font-bold">
						<Icon name="person" class="text-ink-50 h-4 w-4" /> Role Simulation
					</div>

					{#if isSimulating}
						<div class="text-body-s text-ink-70 bg-level-2 rounded-m border-border border px-3 py-2 text-center">
							Simulating: <span class="text-ink-90 font-bold">{page.data.user.role}</span>
						</div>
						<Button variant="secondary" size="s" class="w-full justify-center" onclick={() => toggleSimulation('stop')}>End Simulation</Button>
					{:else}
						<div class="flex flex-col gap-3">
							<div class="flex gap-2">
								<div class="mb-l flex-1">
									<Select.Root bind:value={selectedRole}>
										<Select.Trigger class="text-label-s bg-level-2 rounded-m w-full">
											{selectedRole || 'Select role...'}
										</Select.Trigger>
										<Select.Content>
											{#each availableRoles as role}
												<Select.Item value={role}>{role}</Select.Item>
											{/each}
										</Select.Content>
									</Select.Root>
								</div>
								<Button variant="primary" size="m" onclick={() => toggleSimulation('start')}>Apply</Button>
							</div>
							<label class="text-label-s text-ink-70 flex w-fit cursor-pointer items-center gap-2">
								<input type="checkbox" bind:checked={isPersistent} class="border-border text-ink-90 h-3 w-3 rounded bg-transparent focus:ring-0" />
								Persistent session
							</label>
						</div>
					{/if}
				</div>
			{/if}

			<div class="bg-level-1 flex flex-col gap-1 p-2" data-sveltekit-preload-data="hover">
				<Button variant="tertiary" size="s" href="/dev/design-system" class="w-full justify-start">
					{#snippet leading()}<Icon name="shapes" />{/snippet} Design System
				</Button>
				{#if tier !== 'designer'}
					<Button variant="tertiary" size="s" href="/dev/aidev" class="w-full justify-start">
						{#snippet leading()}<Icon name="sparkles" />{/snippet} AI Context Hub
					</Button>
				{/if}
				{#if tier === 'support' || tier === 'owner'}
					<Button variant="tertiary" size="s" href="/dev/backend" class="w-full justify-start">
						{#snippet leading()}<Icon name="layout-boxes" />{/snippet} Backend & Data
					</Button>
				{/if}
				<Button variant="tertiary" size="s" href="/login" class="w-full justify-start">
					{#snippet leading()}<Icon name="key" />{/snippet} Login Page
				</Button>
			</div>
		</Popover.Content>
	</Popover.Root>
</div>
