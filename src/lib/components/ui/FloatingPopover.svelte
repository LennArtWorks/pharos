<script lang="ts">
	/**
	 * FloatingPopover — base primitive for x/y-anchored floating panels.
	 *
	 * Portals to document.body, clamps to viewport, handles click-outside and
	 * Escape via `onclose`. Drag support: any child element with data-drag-handle
	 * attribute becomes a drag trigger (interactive elements inside it are excluded).
	 *
	 * Usage:
	 *   <FloatingPopover x={state.x} y={state.y} onclose={close}>
	 *     <div data-drag-handle class="header">...</div>
	 *     <div class="body">...</div>
	 *   </FloatingPopover>
	 */
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	interface Props {
		x: number;
		y: number;
		onclose: () => void;
		children: Snippet;
		/** Additional Tailwind classes applied to the panel container. */
		class?: string;
		/** Additional inline styles merged with the computed position. */
		style?: string;
		/** aria-label forwarded to the dialog element. */
		'aria-label'?: string;
	}

	let { x, y, onclose, children, class: className = '', style: additionalStyle = '', 'aria-label': ariaLabel }: Props = $props();

	const MARGIN = 10;

	let panelEl: HTMLDivElement | undefined = $state();
	let panelW = $state(0);
	let panelH = $state(0);

	// Drag offset — accumulated via mouse events, reset when x/y props change
	let dragX = $state(0);
	let dragY = $state(0);
	let dragStartMouseX = 0;
	let dragStartMouseY = 0;
	let dragStartOffX = 0;
	let dragStartOffY = 0;

	$effect(() => {
		// Reset drag offset when anchor position changes (new panel opened)
		x; y; // eslint-disable-line @typescript-eslint/no-unused-expressions
		dragX = 0;
		dragY = 0;
	});

	const safeLeft = $derived.by(() => {
		const vw = typeof window !== 'undefined' ? window.innerWidth : 1200;
		return Math.max(MARGIN, Math.min(x + dragX, vw - panelW - MARGIN));
	});

	const safeTop = $derived.by(() => {
		const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
		return Math.max(MARGIN, Math.min(y + dragY, vh - Math.max(panelH, 80) - MARGIN));
	});

	// ── Drag ─────────────────────────────────────────────────────────────────
	let isDragging = $state(false);

	function startDrag(e: MouseEvent) {
		isDragging = true;
		dragStartMouseX = e.clientX;
		dragStartMouseY = e.clientY;
		dragStartOffX = dragX;
		dragStartOffY = dragY;
		window.addEventListener('mousemove', onDragMove);
		window.addEventListener('mouseup', stopDrag);
	}

	function onDragMove(e: MouseEvent) {
		dragX = dragStartOffX + (e.clientX - dragStartMouseX);
		dragY = dragStartOffY + (e.clientY - dragStartMouseY);
	}

	function stopDrag() {
		isDragging = false;
		window.removeEventListener('mousemove', onDragMove);
		window.removeEventListener('mouseup', stopDrag);
	}

	function handleMouseDown(e: MouseEvent) {
		const target = e.target as HTMLElement;
		// Interactive elements inside a drag handle are excluded from drag
		if (target.closest('button, input, select, textarea, a, [role="button"]')) return;
		if (target.closest('[data-drag-handle]')) {
			e.preventDefault();
			startDrag(e);
		}
	}

	// ── Click-outside ────────────────────────────────────────────────────────
	function handleWindowMouseDown(e: MouseEvent) {
		if (!panelEl) return;
		if (panelEl.contains(e.target as Node)) return;
		onclose();
	}

	// ── Portal ───────────────────────────────────────────────────────────────
	function portal(node: HTMLElement) {
		document.body.appendChild(node);
		return {
			destroy() {
				if (node.parentElement) node.parentElement.removeChild(node);
			}
		};
	}
</script>

<svelte:window
	onmousedown={handleWindowMouseDown}
	onkeydown={(e) => e.key === 'Escape' && onclose()} />

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
	use:portal
	bind:this={panelEl}
	bind:clientWidth={panelW}
	bind:clientHeight={panelH}
	style="left:{safeLeft}px; top:{safeTop}px; {additionalStyle}"
	class={cn(
		'bg-level-2 border-border shadow-lg fixed z-50 flex flex-col rounded-m border',
		isDragging && 'select-none',
		className
	)}
	onmousedown={handleMouseDown}
	role="dialog"
	aria-label={ariaLabel}>
	{@render children()}
</div>
