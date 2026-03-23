<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import * as Popover from '$lib/components/ui/Popover';

	let { data } = $props();
	const { context, stats, system, config } = data;

	const formatDate = (ts: number) =>
		new Intl.DateTimeFormat('de-DE', {
			dateStyle: 'medium',
			timeStyle: 'medium'
		}).format(new Date(ts));
</script>

<div class="gap-3xl flex min-h-screen flex-col">
	<header class="border-border border-b pb-8">
		<div class="mb-4 flex items-center gap-4">
			<Button href="/files/dev" variant="secondary" size="s" icon><Icon name="arrow-left" /></Button>
			<h1 class="text-label-xl text-ink-90 font-bold">Backend & Infrastructure</h1>
		</div>
		<p class="text-body-m text-ink-50 max-w-3xl">Live server state, active context, database metrics, and static configuration properties.</p>
	</header>

	<div class="grid grid-cols-1 gap-6 xl:grid-cols-2">
		<div class="bg-level-1 border-border flex flex-col rounded-xl border">
			<div class="border-border bg-level-2 flex items-center gap-3 rounded-t-xl border-b p-4">
				<Icon name="web" class="text-ink-50 h-5 w-5" />
				<h2 class="text-label-m text-ink-90 font-bold">Active Runtime Context</h2>
			</div>
			<div class="flex flex-col gap-6 p-6">
				{#if context.org}
					<div class="flex flex-col gap-1">
						<span class="text-label-s text-ink-70 font-bold">Organisation Identity</span>
						<div class="flex items-center justify-between">
							<span class="text-label-l text-ink-90 font-bold">{context.org.name}</span>
							<span class="bg-accent-500/10 text-accent-500 text-label-s rounded-md px-2 py-1 font-mono">{context.org.subdomain}.fsr-os.de</span>
						</div>
						<div class="mt-2 flex items-center justify-between">
							<span class="text-body-s text-ink-50 font-mono">ID: {context.org.id}</span>
							<span class="text-body-s text-ink-50 font-mono">Cloud: {context.org.cloud} ({context.org.dir || '/'})</span>
						</div>
					</div>

					<Divider />

					<div class="flex flex-col gap-1">
						<span class="text-label-s text-ink-70 font-bold">Session State</span>
						{#if context.user}
							<div class="mt-2 flex items-center gap-3">
								<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-full border">
									<Icon name="person" class="text-ink-50 h-5 w-5" />
								</div>
								<div class="flex flex-col">
									<span class="text-label-m text-ink-90 font-bold">{context.user.name}</span>
									<span class="text-body-s text-ink-50 font-mono">Role: {context.user.role} | ID: {context.user.id}</span>
								</div>
							</div>
						{:else}
							<div class="mt-2 flex items-center gap-3">
								<div class="bg-level-2 border-border flex h-10 w-10 items-center justify-center rounded-full border">
									<Icon name="person" class="text-ink-30 h-5 w-5" />
								</div>
								<div class="flex flex-col">
									<span class="text-label-m text-ink-90 font-bold italic">Guest Connection</span>
									<span class="text-body-s text-ink-50">No secure session cookie found.</span>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div class="flex flex-col items-center justify-center py-6 text-center">
						<Icon name="circled-alert" class="text-error mb-2 h-8 w-8" />
						<span class="text-label-m text-ink-90 font-bold">No Context</span>
						<span class="text-body-s text-ink-50">App running without valid subdomain.</span>
					</div>
				{/if}
			</div>
		</div>

		<div class="bg-level-1 border-border flex flex-col rounded-xl border">
			<div class="border-border bg-level-2 flex items-center gap-3 rounded-t-xl border-b p-4">
				<Icon name="layout-boxes" class="text-accent-500 h-5 w-5" />
				<h2 class="text-label-m text-ink-90 font-bold">SQLite Telemetry (organisations.db)</h2>
			</div>
			<div class="grid grid-cols-2 gap-4 p-6">
				<a href="/files/dev/backend/organisations" class="bg-level-0 border-border group hover:border-accent-500 flex flex-col gap-2 rounded-lg border p-4 transition-colors">
					<span class="text-label-s text-ink-70 flex items-center justify-between font-bold">
						Organisations <Icon name="arrow-right" class="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
					</span>
					<span class="text-ink-90 text-4xl font-bold">{stats.orgs}</span>
				</a>

				<Popover.Root closeOnClick={false}>
					<Popover.Trigger class="w-full text-left outline-none">
						<div class="bg-level-0 border-border hover:border-accent-500 flex w-full cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-colors">
							<span class="text-label-s text-ink-70 flex items-center justify-between font-bold">
								Sessions <Icon name="arrow-down" class="text-ink-50 h-4 w-4" />
							</span>
							<div class="mt-auto flex items-end gap-2">
								<span class="text-ink-90 text-4xl font-bold">{stats.sessions.total}</span>
								<span class="text-ink-50 text-body-s mb-1">({stats.sessions.active} active, {stats.sessions.expired} exp)</span>
							</div>

							{#if Object.keys(stats.sessions.roles).length > 0}
								<div class="border-border mt-2 flex gap-2 border-t pt-2">
									{#each Object.entries(stats.sessions.roles) as [role, count]}
										<span class="text-label-xs bg-level-2 text-ink-70 rounded-sm px-1.5 py-0.5 font-bold">{role}: {count}</span>
									{/each}
								</div>
							{/if}
						</div>
					</Popover.Trigger>
					<Popover.Content class="z-50 w-[450px] p-2">
						<div class="text-label-s text-ink-90 border-border mb-2 border-b px-2 pb-2 font-bold">Session Activity</div>
						{#if stats.sessions.list.length === 0}
							<div class="text-body-s text-ink-50 p-2">No active database sessions. Guests are not tracked via SQLite to ensure DSGVO compliance.</div>
						{:else}
							<div class="flex max-h-64 flex-col gap-2 overflow-y-auto">
								{#each stats.sessions.list as session}
									<div class="bg-level-1 rounded-m border-border flex flex-col gap-2 border p-3 {session.isActive ? 'border-accent-500/30' : 'opacity-50'}">
										<div class="text-label-s text-ink-90 flex justify-between">
											<span class="flex items-center gap-2 font-bold">
												<Icon name="person" class="text-ink-50 h-3 w-3" />
												{session.name}
											</span>
											<span class="text-label-xs bg-level-2 rounded px-2 py-0.5 font-bold">{session.role}</span>
										</div>
										<div class="text-body-s flex items-center justify-between">
											<span class="text-ink-50 text-label-xs font-mono">Acc: {session.account_id}</span>
											<span class={session.isActive ? 'text-accent-500 font-bold' : 'text-error'}>
												{session.isActive ? 'Active' : 'Expired'}
											</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</Popover.Content>
				</Popover.Root>

				<Popover.Root closeOnClick={false}>
					<Popover.Trigger class="w-full text-left outline-none">
						<div class="bg-level-0 border-border hover:border-accent-500 flex w-full cursor-pointer flex-col gap-2 rounded-lg border p-4 transition-colors">
							<span class="text-label-s text-ink-70 flex items-center justify-between font-bold">
								Rate Limits <Icon name="arrow-down" class="text-ink-50 h-4 w-4" />
							</span>
							<span class="text-ink-90 text-4xl font-bold">{stats.rateLimits.length}</span>
						</div>
					</Popover.Trigger>
					<Popover.Content class="z-50 w-[400px] p-2">
						<div class="text-label-s text-ink-90 border-border mb-2 border-b px-2 pb-2 font-bold">Tracked Rate Limits</div>
						{#if stats.rateLimits.length === 0}
							<div class="text-body-s text-ink-50 p-2">No limits tracked. Rate limits reset every 15 minutes.</div>
						{:else}
							<div class="flex max-h-64 flex-col gap-2 overflow-y-auto">
								{#each stats.rateLimits as rl}
									<div class="bg-level-1 rounded-m border-border flex flex-col gap-2 border p-3">
										<span class="text-label-s text-ink-90 font-mono leading-tight break-all">{rl.key}</span>
										<div class="text-body-s text-ink-50 mt-1 flex items-center justify-between">
											<span class="font-bold {rl.hits >= 5 ? 'text-error' : 'text-accent-500'} bg-level-2 rounded px-2 py-0.5">{rl.hits} Hits</span>
											<span>{formatDate(rl.window_start)}</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</Popover.Content>
				</Popover.Root>

				<div class="bg-level-0 border-border flex flex-col gap-2 rounded-lg border p-4">
					<span class="text-label-s text-ink-70 flex items-center justify-between font-bold">
						WS Connections <Icon name="circled-question-small" class="text-ink-50 h-4 w-4" data-tooltip="Requires Node.js Server API" />
					</span>
					<span class="text-ink-50 mt-auto text-2xl font-bold italic">Unlinked</span>
				</div>
			</div>
		</div>

		<a href="/files/dev/backend/cache" class="bg-level-1 border-border group hover:border-accent-500 flex flex-col rounded-xl border transition-colors">
			<div class="border-border bg-level-2 flex items-center justify-between rounded-t-xl border-b p-4">
				<div class="flex items-center gap-3">
					<Icon name="layout" class="text-ink-50 h-5 w-5" />
					<h2 class="text-label-m text-ink-90 font-bold">System Constants & RAM Cache</h2>
				</div>
				<Icon name="arrow-right" class="text-ink-50 h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
			</div>
			<div class="grid grid-cols-2 gap-6 p-6">
				<div class="flex flex-col gap-2">
					<span class="text-label-s text-ink-70 font-bold">Global Settings</span>
					<div class="text-body-s text-ink-50 flex flex-col gap-1 font-mono">
						<div>Session TTL: {config.global.ACCOUNT.LOGIN_SESSION_DURATION / 86400} Days</div>
						<div>Profile Cache: {config.global.SECURITY.PROFILE_CACHE_TTL_MS / 60000} Min</div>
						<div>Registry Cache: {config.global.SECURITY.REGISTRY_CACHE_TTL_MS / 60000} Min</div>
						<div>Autosave: {config.global.FILES.AUTOSAVE_DELAY_MS}ms</div>
					</div>
				</div>

				<div class="flex flex-col gap-2">
					<span class="text-label-s text-ink-70 font-bold">File Configuration</span>
					<div class="text-body-s text-ink-50 flex flex-col gap-1 font-mono">
						<div>Config Dir: {config.sys.CONFIG_FOLDER}</div>
						<div>ID Prefix: {config.sys.ID_PREFIX}_</div>
						<div>Hidden: {config.sys.HIDDEN_PREFIXES.join(', ')}</div>
						<div>Secure Ext: {config.sys.ACCOUNTS_FILE[1]}</div>
					</div>
				</div>
			</div>
		</a>

		<div class="bg-level-1 border-border flex flex-col rounded-xl border">
			<div class="border-border bg-level-2 flex items-center gap-3 rounded-t-xl border-b p-4">
				<Icon name="code-block" class="text-ink-50 h-5 w-5" />
				<h2 class="text-label-m text-ink-90 font-bold">Dependencies (v{system.version})</h2>
			</div>
			<div class="h-64 overflow-y-auto p-6">
				<div class="grid grid-cols-2 gap-x-8 gap-y-2">
					{#each Object.entries(system.deps) as [name, version]}
						<div class="border-border/50 flex items-center justify-between border-b py-1">
							<span class="text-label-s text-ink-90 truncate pr-4 font-bold">{name}</span>
							<span class="text-body-s text-ink-50 font-mono">{version}</span>
						</div>
					{/each}
					{#each Object.entries(system.devDeps) as [name, version]}
						<div class="border-border/50 flex items-center justify-between border-b py-1 opacity-70">
							<span class="text-label-s text-ink-90 truncate pr-4 font-bold">{name}</span>
							<span class="text-body-s text-ink-50 font-mono">{version}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>
</div>
