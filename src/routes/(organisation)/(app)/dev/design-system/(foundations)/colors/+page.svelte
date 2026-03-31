<script lang="ts">
	import Icon from '$lib/components/ui/Icon.svelte';
	import Button from '$lib/components/ui/Button.svelte';

	// NEW: Fetch context directly from data registry
	import { foundations } from '../../../data';
	const colorData = foundations.find((f) => f.name === 'Colors');
	const aiContext = colorData?.context || '';

	let copiedItem = $state<string | null>(null);
	let copiedAI = $state(false);

	async function copyToClipboard(text: string, isAI = false) {
		try {
			await navigator.clipboard.writeText(text);
			if (isAI) {
				copiedAI = true;
				setTimeout(() => (copiedAI = false), 2000);
			} else {
				copiedItem = text;
				setTimeout(() => {
					if (copiedItem === text) copiedItem = null;
				}, 2000);
			}
		} catch (err) {
			console.error(err);
		}
	}

	const getTooltip = (item: string) => (copiedItem === item ? '<b>Copied!</b>' : `Copy <b>${item}</b>`);

	const primitives = ['neutral', 'accent', 'purpur', 'purple', 'blue', 'cyan', 'green', 'yellow', 'orange', 'red', 'magenta'];
	const steps = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950];
</script>

<div class="gap-2xl flex flex-col">
	<header class="border-border pb-m border-b">
		<div class="gap-l mb-l flex items-center">
			<Button href="/dev/design-system" variant="secondary" size="s" icon data-tooltip="Back to UI">
				<Icon name="arrow-left" />
			</Button>
			<h1 class="text-label-xl text-ink-90 font-bold">Color Foundations</h1>
		</div>

		<div class="flex items-start justify-between">
			<p class="text-body-m text-ink-50 mb-m max-w-2xl">Base tokens dynamically rendered from CSS variables.</p>

			<Button variant="secondary" size="s" data-tooltip={copiedAI ? '<b>Context Copied!</b>' : 'Copy instructions for AI Prompting'} onclick={() => copyToClipboard(aiContext, true)}>
				<Icon name="code-block" class="mr-2" /> AI Context
			</Button>
		</div>
	</header>

	<div class="gap-3xl flex flex-col">
		<section>
			<div class="mb-l">
				<h2 class="text-label-m text-ink-90 font-bold">Text & Ink</h2>
				<p class="text-body-s text-ink-50 mt-1">Tailwind classes map directly to the neutral scale.</p>
			</div>
			<div class="gap-m grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
				{#each [900, 800, 700, 600, 500, 400, 300, 200, 100] as step, index}
					{@const inkNumber = (9 - index) * 10}
					<button
						class="bg-level-1 border-border hover:bg-level-1-hover rounded-m flex flex-col overflow-hidden border transition-all duration-200 hover:-translate-y-1"
						data-tooltip={getTooltip(`text-ink-${inkNumber}`)}
						onclick={() => copyToClipboard(`text-ink-${inkNumber}`)}>
						<div class="h-16 w-full" style="background-color: var(--color-neutral-{step})"></div>
						<div class="p-xs w-full text-center">
							<code class="text-label-xs text-ink-90 font-mono">
								ink-{inkNumber}
							</code>
						</div>
					</button>
				{/each}
			</div>
		</section>

		<section>
			<div class="mb-l">
				<h2 class="text-label-m text-ink-90 font-bold">Primitives</h2>
				<p class="text-body-s text-ink-50 mt-1">Raw foundation colors. Hover to inspect.</p>
			</div>
			<div class="flex flex-col gap-6">
				{#each primitives as palette}
					<div class="flex items-center gap-4">
						<div class="w-20 shrink-0">
							<h3 class="text-label-s text-ink-50 font-bold capitalize">{palette}</h3>
						</div>

						<div class="border-border flex h-16 flex-1 overflow-hidden rounded-lg border">
							{#each steps as step}
								{#if palette === 'neutral' || step % 100 === 0}
									<button
										class="group relative flex-1 border-r border-black/5 transition-all duration-500 ease-out last:border-0 hover:flex-[1.5]"
										style="background-color: var(--color-{palette}-{step})"
										data-tooltip={getTooltip(`bg-${palette}-{step}`)}
										onclick={() => copyToClipboard(`bg-${palette}-{step}`)}>
										<div class="absolute inset-0 flex flex-col items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
											<span class="mb-0.5 text-[10px] font-bold text-white">{step}</span>
											<Icon name="copy" class="h-3 w-3 text-white/70" />
										</div>
									</button>
								{/if}
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
