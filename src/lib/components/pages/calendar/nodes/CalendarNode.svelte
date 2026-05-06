<script lang="ts">
	/**
	 * CalendarNode — renders a single CalendarEntry inside any calendar view cell.
	 *
	 * Formerly MonthNode — renamed because it is reused in Week and Day views as well.
	 *
	 * Two structural variants:
	 *   bar  — allDay entries: full-width coloured bar
	 *   pill — timed entries: compact row with time + icon + title (used in month view only)
	 *
	 * Visual colour rules:
	 *   Event node   → bg-button / text-ink-10 (dark)
	 *   All others   → bg-button-active / text-ink-90 (neutral gray)
	 *
	 * start / deadline bars: fully rounded bar + a small dark pip at the
	 * relevant edge. Button's overflow-hidden clips the pip to the bar's radius.
	 *
	 * Spanning bars: negative margin closes the grid gap so the bar looks
	 * continuous across cells. border-radius encodes which end of the span
	 * this cell represents.
	 *
	 * border-radius uses inline style — Tailwind shorthand (rounded-m) vs
	 * individual corner overrides share equal specificity and fight; inline wins.
	 */
	import Button from '$lib/components/ui/Button.svelte';
	import Icon, { type FigmaIconName } from '$lib/components/ui/Icon.svelte';
	import AssignedIndicator from '$lib/components/ui/AssignedIndicator.svelte';
	import type { CalendarEntry } from '$lib/utils/calendar/aggregator';
	import { APP_EXTENSIONS } from '$lib/config/globalsettings';
	import { getFileConfig } from '$lib/utils/config/filesystem';
	import { session } from '$lib/state/session.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		entry: CalendarEntry;
		/** Position of this cell within a multi-day spanning bar. */
		spanState?: 'full' | 'start' | 'middle' | 'end';
		/** Shared hover state — true when ANY segment of this entry is hovered. */
		isHovered?: boolean;
		onclick?: (e: MouseEvent) => void;
		oncontextmenu?: (e: MouseEvent) => void;
		onmouseenter?: (e: MouseEvent) => void;
		onmouseleave?: (e: MouseEvent) => void;
		ondragstart?: (e: DragEvent) => void;
		ondragend?: (e: DragEvent) => void;
	}

	let { entry, spanState = 'full', isHovered = false, onclick, oncontextmenu, onmouseenter, onmouseleave, ondragstart, ondragend }: Props = $props();

	function handleDragStart(e: DragEvent) {
		e.dataTransfer?.setData('application/calendar-entry-id', entry.calendarId);
		e.dataTransfer?.setData('application/calendar-entry-timestamp', String(entry.timestamp));
		e.dataTransfer?.setData('application/calendar-entry-allday', String(entry.allDay));
		if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
		e.stopPropagation();
		ondragstart?.(e);
	}

	const isAssignedToMe = $derived(!!session.user && ((entry.assignees ?? []).includes(session.user.id) || (entry.nodeAssignees ?? []).includes(session.user.id)));

	const R = 'var(--radius-s)';
	const Z = '0';

	const isEventNode = $derived(entry.source.type === 'node' && entry.source.nodeExtension === APP_EXTENSIONS.EVENT);

	const isSpanning = $derived(!!entry.timestampEnd && new Date(entry.timestamp).toLocaleDateString('sv-SE') !== new Date(entry.timestampEnd).toLocaleDateString('sv-SE'));

	const nodeIcon = $derived.by<FigmaIconName>(() => {
		if (entry.source.type !== 'node') return 'file';
		return (getFileConfig(entry.source.nodeExtension).icon || 'file') as FigmaIconName;
	});

	// Border-radius (tl tr br bl). start/deadline are fully rounded — the pip
	// communicates direction, not the border-radius shape.
	const barRadius = $derived.by(() => {
		if (entry.variant === 'start' || entry.variant === 'deadline') return R;
		if (isSpanning) {
			if (spanState === 'start') return `${R} ${Z} ${Z} ${R}`; // continues right
			if (spanState === 'middle') return Z; // continues both sides
			if (spanState === 'end') return `${Z} ${R} ${R} ${Z}`; // continues left
		}
		return R;
	});

	// theme-accent remaps semantic tokens to accent values — bg-button-active becomes
	// accent-300, text-ink-90 becomes accent-600, etc. Applied to non-event assigned items.
	const nodeTheme = $derived(!isEventNode && isAssignedToMe ? 'theme-accent' : '');

	// JS-driven hover: isHovered is true when ANY segment of this entry is hovered,
	// so all segments highlight together.
	const barColors = $derived(
		isEventNode ? (isHovered ? 'bg-button-hover-high text-ink-10' : 'bg-button text-ink-10 hover:bg-button-hover-high') : isHovered ? 'bg-button-hover-low text-ink-90' : 'bg-button-active text-ink-90'
	);

	const pillColors = $derived(isHovered ? 'bg-button-hover-low' : '');

	// Inline style for spanning bars: bridge the gap between adjacent cells.
	// Total horizontal gap per junction = cell padding (p-xs) + grid gap (gap-s) + next cell padding (p-xs).
	// Each segment extends by (p-xs + gap-s) on the relevant side, which makes both bars
	// meet at the exact cell boundary with a gap-s overlap (invisible, same colour).
	const barSpanStyle = $derived.by(() => {
		if (!isSpanning || spanState === 'full') return '';
		const P = 'calc(var(--spacing-xs) + var(--spacing-s))';
		if (spanState === 'start') return `width: calc(100% + ${P});`;
		if (spanState === 'middle') return `width: calc(100% + 2 * ${P}); margin-left: calc(-1 * ${P});`;
		if (spanState === 'end') return `width: calc(100% + ${P}); margin-left: calc(-1 * ${P});`;
		return '';
	});

	function formatTime(ts: number): string {
		return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	}
</script>

{#if entry.allDay}
	<!-- ── Bar variant (all-day) ────────────────────────────────────────────── -->
	<!--
		Inline style for bg/text/radius overrides Button's variant classes.
		Pips are absolutely positioned inside Button (position:relative + overflow:hidden),
		so they get clipped to the bar's border-radius automatically — no pip radius needed.
	-->
	<Button
		size="xs"
		variant="tertiary"
		class={cn(nodeTheme, barColors, 'w-full justify-start gap-1 transition-all duration-75')}
		active
		draggable={true}
		style="border-radius: {barRadius}; {barSpanStyle}"
		{onclick}
		{oncontextmenu}
		{onmouseenter}
		{onmouseleave}
		ondragstart={handleDragStart}
		{ondragend}>
		{#snippet leading()}
			{#if entry.variant === 'start'}
				<!-- Left-edge pip: outer corners clipped to bar's radius by overflow-hidden -->
				<div class="bg-button pointer-events-none absolute top-0 bottom-0 left-0 w-2xs"></div>
			{:else if entry.variant === 'deadline'}
				<!-- Right-edge pip: same clip behaviour -->
				<div class="bg-button pointer-events-none absolute top-0 right-0 bottom-0 w-2xs"></div>
			{/if}
			{#if isAssignedToMe}
				<AssignedIndicator />
			{/if}
			{#if entry.source.type === 'node' && !isEventNode}
				<Icon name={nodeIcon} class="shrink-0 opacity-60" />
			{/if}
		{/snippet}
		{#snippet label()}
			{#if spanState != 'middle' && spanState != 'end'}
				<span class="truncate">{entry.title}</span>
			{/if}
		{/snippet}
	</Button>
{:else}
	<!-- ── Pill variant (timed) ─────────────────────────────────────────────── -->
	<Button
		size="xs"
		variant="tertiary"
		class={cn(nodeTheme, pillColors, 'gap-m w-full justify-start transition-all duration-75')}
		draggable={true}
		{onclick}
		{oncontextmenu}
		{onmouseenter}
		{onmouseleave}
		ondragstart={handleDragStart}
		{ondragend}>
		{#snippet leading()}
			{#if isAssignedToMe}
				<AssignedIndicator />
			{/if}
			{#if entry.source.type === 'node'}
				<Icon name={nodeIcon} class="shrink-0 opacity-60" />
			{/if}
		{/snippet}
		{#snippet label()}
			<div class="gap-3xs">
				<span class={cn('shrink-0 tabular-nums', isAssignedToMe ? 'text-accent-400' : 'text-ink-40')}>{formatTime(entry.timestamp)}</span>
				<span class="truncate">{entry.title}</span>
			</div>
		{/snippet}
	</Button>
{/if}
