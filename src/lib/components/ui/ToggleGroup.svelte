<script lang="ts">
	import { spring } from 'svelte/motion';
	import { cn } from '$lib/utils';

	interface Item {
		id: string;
		label: string;
	}

	interface Props {
		items: Item[];
		value: string;
		onchange: (id: string) => void;
		size?: 's' | 'm';
		class?: string;
	}

	let { items, value, onchange, size = 'm', class: className = '' }: Props = $props();

	const activeIndex = $derived(
		Math.max(
			0,
			items.findIndex((item) => item.id === value)
		)
	);

	// Spring initialised at the correct index so there is no animation on first render
	const pillX = spring(activeIndex, { stiffness: 0.28, damping: 0.52 });

	$effect(() => {
		pillX.set(activeIndex);
	});

	const sizeClasses = {
		s: 'h-main-s font-label-s font-semibold',
		m: 'h-main-m font-label-m font-semibold'
	};

	const paddingClasses = {
		s: 'px-s',
		m: 'px-m'
	};
</script>

<!--
	ToggleGroup — mutually exclusive tab/toggle switcher with spring-animated active pill.
	No flex gap between buttons: pill width = (100% - 4px) / n and transform is a clean
	multiple of 100%, avoiding sub-pixel rounding drift that gaps introduce.
	Raw <button> is intentional — Button.svelte's hover bg and hit-area pseudo-element
	fight the pill layout.
-->
<div
	class={cn(
		'relative flex overflow-hidden rounded-m ring-1 ring-inset ring-border bg-level-0',
		className
	)}
	style="padding: 2px;">
	<!-- Spring-animated active pill — translates by its own width (100%) per step -->
	<div
		class="pointer-events-none absolute rounded-[calc(var(--radius-m)-1px)] bg-button"
		style="
			top: 2px;
			bottom: 2px;
			left: 2px;
			width: calc((100% - 4px) / {items.length});
			transform: translateX(calc({$pillX} * 100%));
		">
	</div>

	<!-- Tab buttons — text colour only, pill provides the active background -->
	{#each items as item}
		<button
			type="button"
			onclick={() => onchange(item.id)}
			class={cn(
				'relative z-10 flex-1 cursor-pointer font-semibold transition-colors',
				sizeClasses[size],
				paddingClasses[size],
				value === item.id ? 'text-ink-10' : 'text-ink-70 hover:text-ink-90'
			)}>
			{item.label}
		</button>
	{/each}
</div>
