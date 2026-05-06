<script lang="ts">
	import { contextMenu, openContextMenu, type ContextMenuItem } from '$lib/state/layout/contextMenu.svelte';
	import { openDatePanelCreate } from '$lib/state/layout/datePanel.svelte';
	import { datesState } from '$lib/state/navigation/dates.svelte';
	import { has } from '$lib/utils/config/permissions';
	import { PERMISSIONS } from '$lib/config/permissions';
	import type { CalendarEntry } from '$lib/utils/calendar/aggregator';
	import { APP_EXTENSIONS } from '$lib/config/globalsettings';
	import CalendarNode from '../nodes/CalendarNode.svelte';
	import WeekNode from '../nodes/WeekNode.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { session } from '$lib/state/session.svelte';

	interface Props {
		currentDate: Date;
		entries: CalendarEntry[];
		onEntryClick?: (e: MouseEvent, entry: CalendarEntry) => void;
		onDateDrop?: (calendarId: string, date: Date) => void;
		onTimedDrop?: (calendarId: string, newTimestamp: number) => void;
	}

	let { currentDate, entries, onEntryClick, onDateDrop, onTimedDrop }: Props = $props();

	// ── Constants ────────────────────────────────────────────────────────────────
	const HOUR_H = 64;
	const HOURS = Array.from({ length: 24 }, (_, i) => i);
	const TOTAL_H = HOUR_H * 24;
	const todayKey = new Date().toLocaleDateString('sv-SE');

	const dateKey = $derived(currentDate.toLocaleDateString('sv-SE'));
	const isToday = $derived(dateKey === todayKey);

	const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const weekdayName = $derived(WEEKDAY_NAMES[currentDate.getDay()]);

	// ── Scroll to 7am on mount ───────────────────────────────────────────────────
	let scrollEl = $state<HTMLElement | null>(null);
	$effect(() => {
		if (scrollEl) scrollEl.scrollTop = 7 * HOUR_H;
	});

	// ── All-day entries ──────────────────────────────────────────────────────────
	type CellItem = { entry: CalendarEntry; spanState: 'full' | 'start' | 'middle' | 'end' };

	const allDayItems = $derived.by((): CellItem[] => {
		const items: CellItem[] = [];
		for (const entry of entries) {
			const startKey = new Date(entry.timestamp).toLocaleDateString('sv-SE');
			const endKey = entry.timestampEnd ? new Date(entry.timestampEnd).toLocaleDateString('sv-SE') : null;
			const isMultiDay = endKey && endKey !== startKey;
			if (!entry.allDay && !isMultiDay) continue;

			if (!entry.timestampEnd || !isMultiDay) {
				if (startKey === dateKey) items.push({ entry, spanState: 'full' });
			} else {
				const cur = new Date(currentDate);
				cur.setHours(0, 0, 0, 0);
				const start = new Date(entry.timestamp);
				start.setHours(0, 0, 0, 0);
				const end = new Date(entry.timestampEnd);
				end.setHours(0, 0, 0, 0);
				if (cur >= start && cur <= end) {
					const spanState: CellItem['spanState'] = dateKey === startKey ? 'start' : dateKey === endKey ? 'end' : 'middle';
					items.push({ entry, spanState });
				}
			}
		}
		return items.sort((a, b) => {
			const p = (item: CellItem) => {
				const e = item.entry;
				const isEventNode = e.source.type === 'node' && e.source.nodeExtension === APP_EXTENSIONS.EVENT;
				if (isEventNode) return 0;
				const isSpanning = !!e.timestampEnd && new Date(e.timestamp).toLocaleDateString('sv-SE') !== new Date(e.timestampEnd).toLocaleDateString('sv-SE');
				return isSpanning ? 1 : 2;
			};
			return p(a) - p(b);
		});
	});

	// ── Timed entries ────────────────────────────────────────────────────────────
	const timedEntries = $derived(
		entries.filter((e) => {
			if (e.allDay) return false;
			const startKey = new Date(e.timestamp).toLocaleDateString('sv-SE');
			if (startKey !== dateKey) return false;
			const endKey = e.timestampEnd ? new Date(e.timestampEnd).toLocaleDateString('sv-SE') : startKey;
			return endKey === startKey;
		})
	);

	// ── Lane assignment ──────────────────────────────────────────────────────────
	type LanedEntry = { entry: CalendarEntry; laneIndex: number; laneCount: number };

	function computeLanes(dayEntries: CalendarEntry[]): LanedEntry[] {
		const sorted = [...dayEntries].sort((a, b) => a.timestamp - b.timestamp);
		const laneEnds: number[] = [];
		const assignments: { entry: CalendarEntry; lane: number }[] = [];
		for (const entry of sorted) {
			const end = entry.timestampEnd ?? entry.timestamp + 30 * 60 * 1000;
			let placed = false;
			for (let i = 0; i < laneEnds.length; i++) {
				if (laneEnds[i] <= entry.timestamp) {
					laneEnds[i] = end;
					assignments.push({ entry, lane: i });
					placed = true;
					break;
				}
			}
			if (!placed) {
				assignments.push({ entry, lane: laneEnds.length });
				laneEnds.push(end);
			}
		}
		const laneCount = laneEnds.length;
		return assignments.map(({ entry, lane }) => ({ entry, laneIndex: lane, laneCount }));
	}

	const laned = $derived(computeLanes(timedEntries));

	// ── Positioning ──────────────────────────────────────────────────────────────
	function entryTop(ts: number) {
		const d = new Date(ts);
		return ((d.getHours() * 60 + d.getMinutes()) / 60) * HOUR_H;
	}
	function entryHeight(start: number, end: number) {
		return Math.max(32, ((end - start) / 60000 / 60) * HOUR_H);
	}

	// ── Now indicator ────────────────────────────────────────────────────────────
	let nowMinutes = $state(new Date().getHours() * 60 + new Date().getMinutes());
	$effect(() => {
		const t = setInterval(() => {
			nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
		}, 60_000);
		return () => clearInterval(t);
	});
	const nowTop = $derived((nowMinutes / 60) * HOUR_H);

	// ── Hover ────────────────────────────────────────────────────────────────────
	let hoveredCalendarId = $state<string | null>(null);

	// ── All-day drag ─────────────────────────────────────────────────────────────
	let allDayDragOver = $state(false);

	// ── Timed drag ───────────────────────────────────────────────────────────────
	let timedDragOver = $state(false);

	function handleTimedDrop(e: DragEvent) {
		e.preventDefault();
		timedDragOver = false;
		const calendarId = e.dataTransfer?.getData('application/calendar-entry-id');
		if (!calendarId) return;
		const offsetMin = Number(e.dataTransfer?.getData('application/calendar-entry-drag-offset-min') || 0);
		const colTop = (e.currentTarget as HTMLElement).getBoundingClientRect().top;
		const rawMin = ((e.clientY - colTop) / HOUR_H) * 60 - offsetMin;
		const snappedMin = Math.round(rawMin / 15) * 15;
		const h = Math.max(0, Math.min(23, Math.floor(snappedMin / 60)));
		const m = ((snappedMin % 60) + 60) % 60;
		onTimedDrop?.(calendarId, new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), h, m).getTime());
	}

	// ── Slot click ───────────────────────────────────────────────────────────────
	function handleSlotClick(e: MouseEvent) {
		if (e.target !== e.currentTarget) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const rawMin = ((e.clientY - rect.top) / HOUR_H) * 60;
		const snappedMin = Math.round(rawMin / 15) * 15;
		const h = Math.max(0, Math.min(23, Math.floor(snappedMin / 60)));
		const m = ((snappedMin % 60) + 60) % 60;
		const ts = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), h, m).getTime();
		openDatePanelCreate(e, { timestamp: ts, timestampEnd: ts + 60 * 60 * 1000 });
	}

	// ── Resize ───────────────────────────────────────────────────────────────────
	let resizeState = $state<{ entryId: string; direction: 'top' | 'bottom'; startY: number; origTimestamp: number; origTimestampEnd: number } | null>(null);

	function handleResizeStart(e: MouseEvent, entry: CalendarEntry, direction: 'top' | 'bottom') {
		e.preventDefault();
		resizeState = { entryId: entry.calendarId, direction, startY: e.clientY, origTimestamp: entry.timestamp, origTimestampEnd: entry.timestampEnd ?? entry.timestamp + 3600000 };
	}

	function handleGlobalMouseMove(e: MouseEvent) {
		if (!resizeState) return;
		const deltaMs = Math.round((((e.clientY - resizeState.startY) / HOUR_H) * 60) / 15) * 15 * 60000;
		if (resizeState.direction === 'bottom') {
			datesState.previewUpdate(resizeState.entryId, { timestampEnd: Math.max(resizeState.origTimestamp + 15 * 60000, resizeState.origTimestampEnd + deltaMs) });
		} else {
			datesState.previewUpdate(resizeState.entryId, { timestamp: Math.min(resizeState.origTimestampEnd - 15 * 60000, resizeState.origTimestamp + deltaMs) });
		}
	}

	function handleGlobalMouseUp() {
		if (!resizeState) return;
		const entry = entries.find((e) => e.calendarId === resizeState!.entryId);
		if (entry) datesState.updateDate(resizeState.entryId, { timestamp: entry.timestamp, timestampEnd: entry.timestampEnd });
		resizeState = null;
	}

	// ── Context menu ─────────────────────────────────────────────────────────────
	function getEntryContextItems(entry: CalendarEntry): ContextMenuItem[] {
		const isSelfAssigned = !!session.user && (entry.assignees ?? []).includes(session.user.id);
		const items: ContextMenuItem[] = [
			{ id: 'edit-date', type: 'action', label: 'View / Edit', icon: 'pencil', action: 'edit-date' },
			{ id: 'div-assign', type: 'divider' },
			{ id: 'assign-self', type: 'action', label: isSelfAssigned ? 'Unassign me' : 'Assign me', icon: 'person', action: 'assign-self' }
		];
		if (has(PERMISSIONS.FILES.EDIT)) items.push({ id: 'assign-others', type: 'action', label: 'Assign to...', icon: 'person', action: 'assign-others' });
		if (entry.source.type === 'floating') {
			items.push({ id: 'div-delete', type: 'divider' });
			items.push({ id: 'delete-date', type: 'action', label: 'Delete', icon: 'trash', action: 'delete-date', danger: true });
		}
		return items;
	}
</script>

<svelte:window onmousemove={handleGlobalMouseMove} onmouseup={handleGlobalMouseUp} />

<div class="flex min-h-0 flex-1" class:cursor-ns-resize={!!resizeState}>
	<!-- ── Left: time grid ───────────────────────────────────────────────── -->
	<div class="flex min-h-0 flex-1 flex-col">
		<!-- Day header -->
		<div class="grid shrink-0 grid-cols-[var(--spacing-3xl)_1fr]">
			<div></div>
			<div class="py-xs flex flex-col items-center gap-0.5">
				<span class="font-label-xs text-ink-50 font-bold">{weekdayName}</span>
				{#if isToday}
					<span class="bg-accent-600 h-main-xs w-main-xs font-label-s flex items-center justify-center rounded-full font-bold text-neutral-50">
						{currentDate.getDate()}
					</span>
				{:else}
					<span class="font-label-s h-main-xs w-main-xs text-ink-60 inline-flex items-center justify-center font-bold">{currentDate.getDate()}</span>
				{/if}
			</div>
		</div>

		<Divider />

		<!-- All-day band -->
		<div class="grid shrink-0 grid-cols-[var(--spacing-3xl)_1fr]">
			<div class="py-3xs px-xs"><span class="font-label-xs text-ink-40 leading-none">all day</span></div>
			<div
				role="region"
				aria-label="All-day entries"
				class="p-3xs gap-3xs flex flex-col transition-colors duration-100 {allDayDragOver ? 'bg-accent-50' : ''}"
				ondragover={(e) => {
					if (e.dataTransfer?.types.includes('application/calendar-entry-id')) {
						e.preventDefault();
						allDayDragOver = true;
					}
				}}
				ondragleave={() => {
					allDayDragOver = false;
				}}
				ondrop={(e) => {
					e.preventDefault();
					allDayDragOver = false;
					const id = e.dataTransfer?.getData('application/calendar-entry-id');
					if (id) onDateDrop?.(id, currentDate);
				}}>
				{#each allDayItems as { entry, spanState } (entry.calendarId)}
					<CalendarNode
						{entry}
						{spanState}
												isHovered={hoveredCalendarId === entry.calendarId}
						onclick={(e) => {
							e.stopPropagation();
							onEntryClick?.(e, entry);
						}}
						oncontextmenu={(e) => {
							e.stopPropagation();
							openContextMenu(e, 'date-entry', null, getEntryContextItems(entry));
							contextMenu.payload = entry;
						}}
						onmouseenter={() => {
							hoveredCalendarId = entry.calendarId;
						}}
						onmouseleave={() => {
							hoveredCalendarId = null;
						}}
						ondragend={() => {
							allDayDragOver = false;
						}} />
				{/each}
			</div>
		</div>

		<Divider />

		<!-- Time grid -->
		<div bind:this={scrollEl} class="min-h-0 flex-1 overflow-y-auto">
			<div class="relative grid grid-cols-[var(--spacing-3xl)_1fr]" style="height: {TOTAL_H}px;">
				<div class="relative">
					{#each HOURS as h (h)}
						<div class="font-label-xs text-ink-40 pr-s pointer-events-none absolute right-0 flex w-full items-center justify-end tabular-nums" style="top: {h * HOUR_H - 8}px; line-height: 1;">
							{String(h).padStart(2, '0')}:00
						</div>
					{/each}
				</div>

				<div
					role="button"
					tabindex="0"
					class="border-ink-10 relative border-l transition-colors duration-100 {timedDragOver ? 'bg-accent-50/30' : ''}"
					onclick={handleSlotClick}
					onkeydown={(e) => {
						if (e.key === 'Enter') handleSlotClick(e as unknown as MouseEvent);
					}}
					ondragover={(e) => {
						if (e.dataTransfer?.types.includes('application/calendar-entry-id')) {
							e.preventDefault();
							timedDragOver = true;
						}
					}}
					ondragleave={(e) => {
						const rel = e.relatedTarget as Node | null;
						if (!(e.currentTarget as HTMLElement).contains(rel)) timedDragOver = false;
					}}
					ondrop={handleTimedDrop}>
					{#each HOURS as h (h)}
						<div class="border-border pointer-events-none absolute w-full border-t" style="top: {h * HOUR_H}px;"></div>
					{/each}
					{#each HOURS as h (h)}
						<div class="border-ink-10 pointer-events-none absolute w-full border-t opacity-50" style="top: {h * HOUR_H + HOUR_H / 2}px;"></div>
					{/each}

					{#each laned as { entry, laneIndex, laneCount } (entry.calendarId)}
						<WeekNode
							{entry}
							top={entryTop(entry.timestamp)}
							height={entryHeight(entry.timestamp, entry.timestampEnd ?? entry.timestamp + 3600000)}
							left={laneIndex / laneCount}
							width={1 / laneCount}
														isHovered={hoveredCalendarId === entry.calendarId}
							onclick={(e) => {
								e.stopPropagation();
								onEntryClick?.(e, entry);
							}}
							oncontextmenu={(e) => {
								e.stopPropagation();
								openContextMenu(e, 'date-entry', null, getEntryContextItems(entry));
								contextMenu.payload = entry;
							}}
							onmouseenter={() => {
								hoveredCalendarId = entry.calendarId;
							}}
							onmouseleave={() => {
								hoveredCalendarId = null;
							}}
							ondragend={() => {
								timedDragOver = false;
							}}
							onResizeStart={(e, dir) => handleResizeStart(e, entry, dir)} />
					{/each}
				</div>

				{#if isToday}
					<div class="pointer-events-none absolute" style="top: {nowTop}px; left: var(--spacing-3xl); right: 0;">
						<div class="relative flex items-center">
							<span class="absolute -left-1.5 size-3 rounded-full bg-red-500"></span>
							<div class="w-full border-t-2 border-red-500"></div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- ── Right: split view panel (stub) ───────────────────────────────── -->
	<div class="flex flex-1 items-center justify-center">
		<Button variant="secondary" size="sm">
			{#snippet leading()}<Icon name="add" />{/snippet}
			{#snippet label()}add split view{/snippet}
		</Button>
	</div>
</div>
