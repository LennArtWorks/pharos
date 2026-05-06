<script lang="ts">
	/**
	 * WeekNode — absolutely positioned timed event block for the week/day time grid.
	 *
	 * Positioned by the parent via inline style (top, height, left, width).
	 * Content adapts based on available height — more fields shown as the block grows.
	 *
	 * Resize: top/bottom 6px zones change cursor to ns-resize. Mousedown in those zones
	 * starts a resize drag that calls onResizeStart with direction and initial position.
	 *
	 * Drag: same data-transfer format as CalendarNode, plus drag-offset-min for
	 * smooth time-aware repositioning on drop.
	 */
	import { fly } from 'svelte/transition';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import AssignedIndicator from '$lib/components/ui/AssignedIndicator.svelte';
	import type { CalendarEntry } from '$lib/utils/calendar/aggregator';
	import { APP_EXTENSIONS } from '$lib/config/globalsettings';
	import { getFileConfig } from '$lib/utils/config/filesystem';
	import { session } from '$lib/state/session.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		entry: CalendarEntry;
		top: number;
		height: number;
		left: number;
		width: number;
		isHovered?: boolean;
		onclick?: (e: MouseEvent) => void;
		oncontextmenu?: (e: MouseEvent) => void;
		onmouseenter?: () => void;
		onmouseleave?: () => void;
		ondragend?: () => void;
		/** Called when user starts resizing from top or bottom edge. */
		onResizeStart?: (e: MouseEvent, direction: 'top' | 'bottom') => void;
	}

	let { entry, top, height, left, width, isHovered = false, onclick, oncontextmenu, onmouseenter, onmouseleave, ondragend, onResizeStart }: Props = $props();

	const RESIZE_ZONE = 6; // px — cursor zone at top/bottom for resize

	let isDragging = $state(false);

	// ── Derived flags ──────────────────────────────────────────────────────────
	const isAssignedToMe = $derived(!!session.user && ((entry.assignees ?? []).includes(session.user.id) || (entry.nodeAssignees ?? []).includes(session.user.id)));
	const isEventNode = $derived(entry.source.type === 'node' && entry.source.nodeExtension === APP_EXTENSIONS.EVENT);
	const nodeIcon = $derived.by<FigmaIconName>(() => {
		if (entry.source.type !== 'node') return 'file';
		return (getFileConfig(entry.source.nodeExtension).icon || 'file') as FigmaIconName;
	});

	// ── Colors (same rules as CalendarNode) ───────────────────────────────────
	const bgColor = $derived.by(() => {
		if (isEventNode) return isHovered ? 'bg-button-hover-high' : 'bg-button';
		if (isAssignedToMe) return isHovered ? 'bg-accent-400' : 'bg-accent-300';
		return isHovered ? 'bg-button-hover-low' : 'bg-button-active';
	});
	const textColor = $derived(isEventNode ? 'text-ink-10' : isAssignedToMe ? 'text-accent-700' : 'text-ink-90');

	// ── Time formatting ────────────────────────────────────────────────────────
	function fmt(ts: number) {
		return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	}
	const timeLabel = $derived(entry.timestampEnd ? `${fmt(entry.timestamp)} – ${fmt(entry.timestampEnd)}` : fmt(entry.timestamp));

	// ── Drag handling ──────────────────────────────────────────────────────────
	function handleDragStart(e: DragEvent) {
		const offsetMin = Math.round((e.offsetY / height) * ((entry.timestampEnd ?? entry.timestamp + 3600000) - entry.timestamp) / 60000);
		e.dataTransfer?.setData('application/calendar-entry-id', entry.calendarId);
		e.dataTransfer?.setData('application/calendar-entry-timestamp', String(entry.timestamp));
		e.dataTransfer?.setData('application/calendar-entry-allday', 'false');
		e.dataTransfer?.setData('application/calendar-entry-drag-offset-min', String(offsetMin));
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
		isDragging = true;
		e.stopPropagation();
	}

	function handleDragEnd() {
		isDragging = false;
		ondragend?.();
	}

	// ── Resize zone detection ──────────────────────────────────────────────────
	function getCursorZone(offsetY: number): 'top' | 'bottom' | 'body' {
		if (offsetY <= RESIZE_ZONE) return 'top';
		if (offsetY >= height - RESIZE_ZONE) return 'bottom';
		return 'body';
	}

	let hoverZone = $state<'top' | 'bottom' | 'body'>('body');

	function handleMouseMove(e: MouseEvent) {
		hoverZone = getCursorZone(e.offsetY);
	}

	function handleMouseLeave() {
		hoverZone = 'body';
		onmouseleave?.();
	}

	function handleMouseDown(e: MouseEvent) {
		const zone = getCursorZone(e.offsetY);
		if (zone !== 'body') {
			e.preventDefault();
			e.stopPropagation();
			onResizeStart?.(e, zone);
		}
	}

	const cursor = $derived(hoverZone !== 'body' ? 'cursor-ns-resize' : 'cursor-pointer');
</script>

<!-- Fly transition on mount for a lively feel -->
<div
	transition:fly={{ y: 4, duration: 120 }}
	role="button"
	tabindex="0"
	draggable={hoverZone === 'body'}
	class={cn(
		'absolute overflow-hidden rounded-s p-xs select-none transition-all duration-75',
		bgColor,
		textColor,
		cursor,
		isDragging ? 'opacity-60 scale-[0.98]' : ''
	)}
	style="top: {top}px; height: {height}px; left: calc({left * 100}% + 2px); width: calc({width * 100}% - 4px);"
	{onclick}
	{oncontextmenu}
	onmouseenter={() => onmouseenter?.()}
	onmouseleave={handleMouseLeave}
	onmousemove={handleMouseMove}
	onmousedown={handleMouseDown}
	ondragstart={handleDragStart}
	ondragend={handleDragEnd}
	onkeydown={(e) => { if (e.key === 'Enter') onclick?.(e as unknown as MouseEvent); }}>

	<!-- Always: title row -->
	<div class="flex items-start gap-1 leading-tight">
		{#if isAssignedToMe}
			<span class="mt-0.5 shrink-0"><AssignedIndicator /></span>
		{/if}
		<span class="font-label-s min-w-0 truncate font-bold">{entry.title}</span>
	</div>

	<!-- >= 48px: time range -->
	{#if height >= 48}
		<div class="font-label-xs mt-0.5 truncate opacity-70">{timeLabel}</div>
	{/if}

	<!-- >= 64px: attached node (parent file) -->
	{#if height >= 64 && entry.source.type === 'node'}
		<div class="font-label-xs mt-0.5 flex items-center gap-0.5 truncate opacity-60">
			<Icon name={nodeIcon} class="size-3 shrink-0" />
			<span class="truncate">{entry.source.nodeName}</span>
		</div>
	{/if}

	<!-- >= 80px: assignees (initials) -->
	{#if height >= 80 && (entry.assignees?.length ?? 0) > 0}
		<div class="mt-1 flex gap-0.5">
			{#each (entry.assignees ?? []).slice(0, 3) as assigneeId (assigneeId)}
				<span class="bg-button-active text-ink-60 font-label-xs inline-flex size-4 items-center justify-center rounded-full font-bold uppercase">
					{assigneeId.charAt(0)}
				</span>
			{/each}
		</div>
	{/if}

	<!-- >= 96px: location -->
	{#if height >= 96 && entry.location}
		<div class="font-label-xs mt-0.5 truncate opacity-50">{entry.location}</div>
	{/if}
</div>
