<script lang="ts">
	import { onMount } from 'svelte';

	let visible = $state(false);
	let content = $state('');
	let x = $state(0);
	let y = $state(0);

	let width = $state(0);
	let height = $state(0);

	let currentEl: HTMLElement | null = null;
	let observer: MutationObserver | null = null;

	onMount(() => {
		// 1. Setup the observer to watch for attribute changes on the hovered element
		observer = new MutationObserver((mutations) => {
			for (const m of mutations) {
				if (m.type === 'attributes' && m.attributeName === 'data-tooltip' && currentEl) {
					content = currentEl.getAttribute('data-tooltip') || '';
				}
			}
		});

		function handleMouseMove(e: MouseEvent) {
			const target = e.target as HTMLElement;
			const tooltipEl = target?.closest('[data-tooltip]') as HTMLElement;

			if (tooltipEl) {
				// If we hovered over a NEW element, switch the observer to watch this new one
				if (currentEl !== tooltipEl) {
					currentEl = tooltipEl;
					observer?.disconnect();
					observer?.observe(currentEl, { attributes: true, attributeFilter: ['data-tooltip'] });
				}

				content = currentEl.getAttribute('data-tooltip') || '';
				visible = true;
				x = e.clientX;
				y = e.clientY;
			} else {
				visible = false;
				currentEl = null;
				observer?.disconnect();
			}
		}

		function handleMouseLeave() {
			visible = false;
			currentEl = null;
			observer?.disconnect();
		}

		document.addEventListener('mousemove', handleMouseMove);
		document.addEventListener('mouseleave', handleMouseLeave);

		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseleave', handleMouseLeave);
			observer?.disconnect();
		};
	});

	let safeX = $derived(typeof window !== 'undefined' && x + 15 + width > window.innerWidth ? x - width - 15 : x + 15);

	let safeY = $derived(typeof window !== 'undefined' && y + 15 + height > window.innerHeight ? y - height - 15 : y + 15);
</script>

{#if visible && content}
	<div
		bind:clientWidth={width}
		bind:clientHeight={height}
		class="rounded-m border-border bg-level-2 px-s py-2xs text-label-xs text-ink-90 pointer-events-none fixed z-[9999] max-w-xs border shadow-sm"
		style="left: {safeX}px; top: {safeY}px;">
		{@html content}
	</div>
{/if}
