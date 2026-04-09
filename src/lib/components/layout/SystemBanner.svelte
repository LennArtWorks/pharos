<script lang="ts">
	import { bannerState, removeBanner } from '$lib/state/layout/banners.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import { cn } from '$lib/utils';

	let banners = $derived(bannerState.banners);
	let activeId = $derived(bannerState.activeId);
	let confirmCloseId = $state<string | null>(null);

	const variants = {
		info: 'bg-level-2 text-ink-90 border-r border-border',
		warning: 'bg-orange-500 text-white border-r border-black/20',
		error: 'bg-error text-white border-r border-black/20',
		success: 'bg-emerald-500 text-white border-r border-black/20',
		dev: 'bg-accent-500 text-ink-90 border-r border-black/20'
	};

	async function handleStop(banner: any) {
		confirmCloseId = null;
		if (banner.onStop) await banner.onStop();
		removeBanner(banner.id);
	}

	function handleXClick(e: MouseEvent, banner: any) {
		e.stopPropagation();
		if (banner.isProcess) {
			confirmCloseId = confirmCloseId === banner.id ? null : banner.id;
		} else {
			removeBanner(banner.id);
		}
	}
</script>

<svelte:window onclick={() => (confirmCloseId = null)} />

{#if banners.length > 0}
	<div class="bg-level-1 relative z-[9999] flex w-full shrink-0 overflow-visible">
		{#each banners as banner (banner.id)}
			{@const isActive = banner.id === activeId}

			<div
				class={cn(
					'text-label-s relative flex h-9 min-w-0 shrink-0 cursor-pointer items-center px-4 py-1.5 font-bold transition-all',
					variants[banner.variant],
					isActive ? 'flex-1' : 'max-w-main-3xl hover:opacity-100'
				)}
				onclick={(e) => {
					e.stopPropagation();
					bannerState.activeId = banner.id;
					confirmCloseId = null;
				}}>
				<div class={cn('flex min-w-0 flex-1 items-center gap-3', isActive ? 'justify-center' : 'justify-start')}>
					<div class="flex min-w-0 items-center gap-2">
						{#if banner.icon}
							<Icon name={banner.icon} class="h-4 w-4 shrink-0" />
						{/if}
						<span class="truncate">{banner.text}</span>
					</div>

					{#if banner.isProcess}
						<button
							onclick={(e) => {
								e.stopPropagation();
								handleStop(banner);
							}}
							class="rounded border border-white/50 px-2 py-0.5 text-xs transition-colors hover:bg-white/20">
							Stop
						</button>
					{/if}
				</div>

				<div class={cn('flex shrink-0 items-center', isActive ? 'absolute right-4' : 'ml-4')}>
					<button onclick={(e) => handleXClick(e, banner)} class="hit-area-expand flex items-center justify-center opacity-70 transition-opacity outline-none hover:opacity-100">
						<Icon name="x" class="h-4 w-4" />
					</button>

					{#if confirmCloseId === banner.id}
						<div
							class="bg-level-1 border-border rounded-m text-ink-90 absolute top-11 right-0 z-[10000] flex w-72 cursor-default flex-col gap-3 border p-4 shadow-2xl"
							onclick={(e) => e.stopPropagation()}>
							<div class="text-label-s font-bold">Stop running process?</div>
							<div class="text-body-s text-ink-50 leading-relaxed whitespace-normal">
								This will terminate <span class="bg-level-2 rounded px-1 font-mono">{banner.text}</span>.
							</div>
							<div class="mt-2 flex justify-end gap-2">
								<Button variant="secondary" size="s" class="flex-1 justify-center" onclick={() => (confirmCloseId = null)}>Cancel</Button>
								<Button variant="primary" size="s" class="bg-error hover:bg-error/80 flex-1 justify-center border-transparent text-white" onclick={() => handleStop(banner)}>Stop Function</Button>
							</div>
						</div>
					{/if}
				</div>
			</div>
		{/each}
	</div>
{/if}
