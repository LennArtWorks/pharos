<script lang="ts">
	import '@fontsource/open-sans/400.css';
	import '@fontsource/open-sans/600.css';
	import '@fontsource/open-sans/700.css';

	import '../app.css';
	import './layout.css';

	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.svg';
	import OverlayRoot from '$lib/components/layout/overlays/OverlayRoot.svelte';
	import MouseTooltip from '$lib/components/ui/MouseTooltip.svelte';

	let { children } = $props();

	/* ---------------------------------------------------------------- *
	 *  lightmode / darkmode setup
	 * ---------------------------------------------------------------- */

	function applyAutoTheme(el: HTMLElement) {
		// 1. Clear existing mode classes
		const modes = ['mode-light', 'mode-dark'];
		el.classList.remove(...modes);

		// 2. Handle Auto vs Manual

		const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		el.classList.add(isDark ? 'mode-dark' : 'mode-light');
	}

	onMount(() => {
		const el = document.documentElement;

		const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		const sync = () => {
			if (el.classList.contains('mode-auto')) {
				applyAutoTheme(el);
			}
		};

		// Run once on mount
		sync();

		// Listen for system changes
		mediaQuery.addEventListener('change', sync);
		return () => mediaQuery.removeEventListener('change', sync);
	});
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>

{@render children()}

<OverlayRoot />
<MouseTooltip />
