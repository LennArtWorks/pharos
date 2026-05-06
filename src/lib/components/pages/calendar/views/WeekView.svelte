<script lang="ts">
	import { contextMenu, openContextMenu, type ContextMenuItem } from '$lib/state/layout/contextMenu.svelte';
	import { openDatePanelCreate, openDatePanelView } from '$lib/state/layout/datePanel.svelte';
	import { datesState } from '$lib/state/navigation/dates.svelte';
	import { has } from '$lib/utils/config/permissions';
	import { PERMISSIONS } from '$lib/config/permissions';
	import type { CalendarEntry } from '$lib/utils/calendar/aggregator';
	import { APP_EXTENSIONS } from '$lib/config/globalsettings';
	import CalendarNode from '../nodes/CalendarNode.svelte';
	import WeekNode from '../nodes/WeekNode.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
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
	const HOUR_H = 64; // px per hour
	const HOURS = Array.from({ length: 24 }, (_, i) => i);
	const TOTAL_H = HOUR_H * 24;
	const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const todayKey = new Date().toLocaleDateString('sv-SE');

	// ── Snappy easing (matches TreeNodeItem) ─────────────────────────────────────
	const snappyBezier = (t: number) => --t * t * ((1.7 + 1) * t + 1.7) + 1;
	void snappyBezier; // used via fly transition in WeekNode

	// ── Week calculation ─────────────────────────────────────────────────────────
	const weekDays = $derived.by(() => {
		const dow = (currentDate.getDay() + 6) % 7; // 0 = Mon
		const monday = new Date(currentDate);
		monday.setDate(currentDate.getDate() - dow);
		monday.setHours(0, 0, 0, 0);
		return Array.from({ length: 7 }, (_, i) => {
			const d = new Date(monday);
			d.setDate(monday.getDate() + i);
			return { date: d, dateKey: d.toLocaleDateString('sv-SE') };
		});
	});

	const isTodayVisible = $derived(weekDays.some((d) => d.dateKey === todayKey));

	// ── Scroll to 7am on mount ───────────────────────────────────────────────────
	let scrollEl = $state<HTMLElement | null>(null);
	$effect(() => {
		if (scrollEl) scrollEl.scrollTop = 7 * HOUR_H;
	});

	// ── All-day entries: spanning logic (same as MonthView cellEntriesMap) ───────
	type CellItem = { entry: CalendarEntry; spanState: 'full' | 'start' | 'middle' | 'end' };

	const allDayMap = $derived.by(() => {
		const dayKeySet = new Set(weekDays.map((d) => d.dateKey));
		const map = new Map<string, CellItem[]>();
		for (const { dateKey } of weekDays) map.set(dateKey, []);

		for (const entry of entries) {
			// Only all-day entries or multi-day spanning entries go in the all-day band
			const startKey = new Date(entry.timestamp).toLocaleDateString('sv-SE');
			const endKey = entry.timestampEnd ? new Date(entry.timestampEnd).toLocaleDateString('sv-SE') : null;
			const isMultiDay = endKey && endKey !== startKey;

			if (!entry.allDay && !isMultiDay) continue;

			if (!entry.timestampEnd || !isMultiDay) {
				map.get(startKey)?.push({ entry, spanState: 'full' });
			} else {
				const end = new Date(entry.timestampEnd);
				end.setHours(0, 0, 0, 0);
				const cur = new Date(entry.timestamp);
				cur.setHours(0, 0, 0, 0);
				while (cur <= end) {
					const key = cur.toLocaleDateString('sv-SE');
					if (dayKeySet.has(key)) {
						const spanState: CellItem['spanState'] = key === startKey ? 'start' : key === endKey ? 'end' : 'middle';
						map.get(key)!.push({ entry, spanState });
					}
					cur.setDate(cur.getDate() + 1);
				}
			}
		}
		return map;
	});

	function sortAllDayItems(items: CellItem[]): CellItem[] {
		return [...items].sort((a, b) => {
			const priority = (item: CellItem) => {
				const e = item.entry;
				const isEventNode = e.source.type === 'node' && e.source.nodeExtension === APP_EXTENSIONS.EVENT;
				if (isEventNode) return 0;
				const isSpanning = !!e.timestampEnd && new Date(e.timestamp).toLocaleDateString('sv-SE') !== new Date(e.timestampEnd).toLocaleDateString('sv-SE');
				if (isSpanning) return 1;
				return 2;
			};
			return priority(a) - priority(b);
		});
	}

	// ── Timed entries per day ────────────────────────────────────────────────────
	// Only entries that are NOT all-day and don't span multiple days
	const timedEntriesMap = $derived.by(() => {
		const map = new Map<string, CalendarEntry[]>();
		for (const { dateKey } of weekDays) map.set(dateKey, []);

		for (const entry of entries) {
			if (entry.allDay) continue;
			const startKey = new Date(entry.timestamp).toLocaleDateString('sv-SE');
			if (!map.has(startKey)) continue;
			const endKey = entry.timestampEnd ? new Date(entry.timestampEnd).toLocaleDateString('sv-SE') : startKey;
			if (endKey !== startKey) continue; // multi-day timed → shown in all-day band
			map.get(startKey)!.push(entry);
		}
		return map;
	});

	// ── Overlap / lane assignment ────────────────────────────────────────────────
	type LanedEntry = { entry: CalendarEntry; laneIndex: number; laneCount: number };

	function computeLanes(dayEntries: CalendarEntry[]): LanedEntry[] {
		const sorted = [...dayEntries].sort((a, b) => a.timestamp - b.timestamp);
		// lanes[i] = end timestamp of the last entry placed in lane i
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

	// ── Positioning helpers ──────────────────────────────────────────────────────
	function entryTop(ts: number): number {
		const d = new Date(ts);
		return ((d.getHours() * 60 + d.getMinutes()) / 60) * HOUR_H;
	}

	function entryHeight(start: number, end: number): number {
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

	// ── Hover coordination ───────────────────────────────────────────────────────
	let hoveredCalendarId = $state<string | null>(null);

	// ── Drag & drop (all-day row) ────────────────────────────────────────────────
	let dragOverDateKey = $state<string | null>(null);

	function handleAllDayDragOver(e: DragEvent, dateKey: string) {
		if (!e.dataTransfer?.types.includes('application/calendar-entry-id')) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverDateKey = dateKey;
	}

	function handleAllDayDragLeave(e: DragEvent) {
		const related = e.relatedTarget as Node | null;
		if (!(e.currentTarget as HTMLElement).contains(related)) dragOverDateKey = null;
	}

	function handleAllDayDrop(e: DragEvent, date: Date, dateKey: string) {
		e.preventDefault();
		dragOverDateKey = null;
		const calendarId = e.dataTransfer?.getData('application/calendar-entry-id');
		if (!calendarId) return;
		onDateDrop?.(calendarId, date);
	}

	// ── Drag & drop (time grid) ──────────────────────────────────────────────────
	let dragOverTimedKey = $state<string | null>(null);

	function handleTimedDragOver(e: DragEvent, dateKey: string) {
		if (!e.dataTransfer?.types.includes('application/calendar-entry-id')) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverTimedKey = dateKey;
	}

	function handleTimedDragLeave(e: DragEvent) {
		const related = e.relatedTarget as Node | null;
		if (!(e.currentTarget as HTMLElement).contains(related)) dragOverTimedKey = null;
	}

	function handleTimedDrop(e: DragEvent, date: Date, dateKey: string) {
		e.preventDefault();
		dragOverTimedKey = null;
		const calendarId = e.dataTransfer?.getData('application/calendar-entry-id');
		if (!calendarId) return;
		const offsetMin = Number(e.dataTransfer?.getData('application/calendar-entry-drag-offset-min') || 0);
		const colTop = (e.currentTarget as HTMLElement).getBoundingClientRect().top;
		const rawMin = ((e.clientY - colTop) / HOUR_H) * 60 - offsetMin;
		const snappedMin = Math.round(rawMin / 15) * 15;
		const h = Math.max(0, Math.min(23, Math.floor(snappedMin / 60)));
		const m = ((snappedMin % 60) + 60) % 60;
		const newTs = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m).getTime();
		onTimedDrop?.(calendarId, newTs);
	}

	// ── Slot click → DatePanel with 1-hour default duration ─────────────────────
	function handleSlotClick(e: MouseEvent, date: Date) {
		if (e.target !== e.currentTarget) return;
		const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
		const rawMin = ((e.clientY - rect.top) / HOUR_H) * 60;
		const snappedMin = Math.round(rawMin / 15) * 15;
		const h = Math.max(0, Math.min(23, Math.floor(snappedMin / 60)));
		const m = ((snappedMin % 60) + 60) % 60;
		const ts = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, m).getTime();
		openDatePanelCreate(e, { timestamp: ts, timestampEnd: ts + 60 * 60 * 1000 });
	}

	// ── Resize ───────────────────────────────────────────────────────────────────
	let resizeState = $state<{
		entryId: string;
		direction: 'top' | 'bottom';
		startY: number;
		origTimestamp: number;
		origTimestampEnd: number;
	} | null>(null);

	function handleResizeStart(e: MouseEvent, entry: CalendarEntry, direction: 'top' | 'bottom') {
		e.preventDefault();
		resizeState = {
			entryId: entry.calendarId,
			direction,
			startY: e.clientY,
			origTimestamp: entry.timestamp,
			origTimestampEnd: entry.timestampEnd ?? entry.timestamp + 3600000
		};
	}

	function handleGlobalMouseMove(e: MouseEvent) {
		if (!resizeState) return;
		const deltaY = e.clientY - resizeState.startY;
		const deltaMs = Math.round((deltaY / HOUR_H) * 60 / 15) * 15 * 60000;

		if (resizeState.direction === 'bottom') {
			const newEnd = Math.max(resizeState.origTimestamp + 15 * 60000, resizeState.origTimestampEnd + deltaMs);
			datesState.previewUpdate(resizeState.entryId, { timestampEnd: newEnd });
		} else {
			const newStart = Math.min(resizeState.origTimestampEnd - 15 * 60000, resizeState.origTimestamp + deltaMs);
			datesState.previewUpdate(resizeState.entryId, { timestamp: newStart });
		}
	}

	function handleGlobalMouseUp() {
		if (!resizeState) return;
		const entry = entries.find((e) => e.calendarId === resizeState!.entryId);
		if (entry) {
			datesState.updateDate(resizeState.entryId, {
				timestamp: entry.timestamp,
				timestampEnd: entry.timestampEnd
			});
		}
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
		if (has(PERMISSIONS.FILES.EDIT)) {
			items.push({ id: 'assign-others', type: 'action', label: 'Assign to...', icon: 'person', action: 'assign-others' });
		}
		if (entry.source.type === 'floating') {
			items.push({ id: 'div-delete', type: 'divider' });
			items.push({ id: 'delete-date', type: 'action', label: 'Delete', icon: 'trash', action: 'delete-date', danger: true });
		}
		return items;
	}
</script>

<!-- Global mouse handlers for resize -->
<svelte:window onmousemove={handleGlobalMouseMove} onmouseup={handleGlobalMouseUp} />

<div class="flex min-h-0 flex-1 flex-col" class:cursor-ns-resize={!!resizeState}>
	<!-- ── Column header row ─────────────────────────────────────────────── -->
	<div class="grid shrink-0 grid-cols-[var(--spacing-3xl)_repeat(7,1fr)]">
		<div></div>
		{#each weekDays as { date, dateKey }, i (dateKey)}
			{@const isToday = dateKey === todayKey}
			<div class="py-xs flex flex-col items-center gap-0.5">
				<span class="font-label-xs text-ink-50 font-bold">{WEEKDAYS[i]}</span>
				{#if isToday}
					<span class="bg-accent-600 h-main-xs w-main-xs font-label-s flex items-center justify-center rounded-full font-bold text-neutral-50">
						{date.getDate()}
					</span>
				{:else}
					<span class="font-label-s h-main-xs w-main-xs text-ink-60 inline-flex items-center justify-center font-bold">{date.getDate()}</span>
				{/if}
			</div>
		{/each}
	</div>

	<Divider />

	<!-- ── All-day band ──────────────────────────────────────────────────── -->
	<div class="grid shrink-0 grid-cols-[var(--spacing-3xl)_repeat(7,1fr)]">
		<div class="py-3xs px-xs">
			<span class="font-label-xs text-ink-40 leading-none">all day</span>
		</div>
		{#each weekDays as { date, dateKey } (dateKey)}
			{@const items = sortAllDayItems(allDayMap.get(dateKey) ?? [])}
			<div
				role="region"
				aria-label="All-day entries"
				class="p-3xs gap-3xs flex flex-col transition-colors duration-100 {dragOverDateKey === dateKey ? 'bg-accent-50' : ''}"
				ondragover={(e) => handleAllDayDragOver(e, dateKey)}
				ondragleave={handleAllDayDragLeave}
				ondrop={(e) => handleAllDayDrop(e, date, dateKey)}>
				{#each items as { entry, spanState } (entry.calendarId)}
					<CalendarNode
						{entry}
						{spanState}
						isHovered={hoveredCalendarId === entry.calendarId}
						onclick={(e) => { e.stopPropagation(); onEntryClick?.(e, entry); }}
						oncontextmenu={(e) => {
							e.stopPropagation();
							openContextMenu(e, 'date-entry', null, getEntryContextItems(entry));
							contextMenu.payload = entry;
						}}
						onmouseenter={() => { hoveredCalendarId = entry.calendarId; }}
						onmouseleave={() => { hoveredCalendarId = null; }}
						ondragend={() => { dragOverDateKey = null; }} />
				{/each}
			</div>
		{/each}
	</div>

	<Divider />

	<!-- ── Scrollable time grid ──────────────────────────────────────────── -->
	<div bind:this={scrollEl} class="min-h-0 flex-1 overflow-y-auto">
		<div class="relative grid grid-cols-[var(--spacing-3xl)_repeat(7,1fr)]" style="height: {TOTAL_H}px;">

			<!-- Time labels column -->
			<div class="relative">
				{#each HOURS as h (h)}
					<div
						class="font-label-xs text-ink-40 pointer-events-none absolute right-0 flex w-full items-center justify-end pr-s tabular-nums"
						style="top: {h * HOUR_H - 8}px; line-height: 1;">
						{String(h).padStart(2, '0')}:00
					</div>
				{/each}
			</div>

			<!-- Day columns -->
			{#each weekDays as { date, dateKey } (dateKey)}
				{@const laned = computeLanes(timedEntriesMap.get(dateKey) ?? [])}
				<div
					role="button"
					tabindex="0"
					class="relative border-l border-ink-10 transition-colors duration-100 {dragOverTimedKey === dateKey ? 'bg-accent-50/30' : ''}"
					onclick={(e) => handleSlotClick(e, date)}
					onkeydown={(e) => { if (e.key === 'Enter') handleSlotClick(e as unknown as MouseEvent, date); }}
					ondragover={(e) => handleTimedDragOver(e, dateKey)}
					ondragleave={handleTimedDragLeave}
					ondrop={(e) => handleTimedDrop(e, date, dateKey)}>

					<!-- Hour grid lines -->
					{#each HOURS as h (h)}
						<div class="border-border pointer-events-none absolute w-full border-t" style="top: {h * HOUR_H}px;"></div>
					{/each}

					<!-- Half-hour lines (subtler) -->
					{#each HOURS as h (h)}
						<div class="pointer-events-none absolute w-full border-t border-ink-10 opacity-50" style="top: {h * HOUR_H + HOUR_H / 2}px;"></div>
					{/each}

					<!-- Timed entries -->
					{#each laned as { entry, laneIndex, laneCount } (entry.calendarId)}
						<WeekNode
							{entry}
							top={entryTop(entry.timestamp)}
							height={entryHeight(entry.timestamp, entry.timestampEnd ?? entry.timestamp + 3600000)}
							left={laneIndex / laneCount}
							width={1 / laneCount}
								isHovered={hoveredCalendarId === entry.calendarId}
							onclick={(e) => { e.stopPropagation(); onEntryClick?.(e, entry); }}
							oncontextmenu={(e) => {
								e.stopPropagation();
								openContextMenu(e, 'date-entry', null, getEntryContextItems(entry));
								contextMenu.payload = entry;
							}}
							onmouseenter={() => { hoveredCalendarId = entry.calendarId; }}
							onmouseleave={() => { hoveredCalendarId = null; }}
							ondragend={() => { dragOverTimedKey = null; }}
							onResizeStart={(e, dir) => handleResizeStart(e, entry, dir)} />
					{/each}
				</div>
			{/each}

			<!-- Now indicator (spans all day columns) -->
			{#if isTodayVisible}
				<div
					class="pointer-events-none absolute"
					style="top: {nowTop}px; left: var(--spacing-3xl); right: 0;">
					<div class="relative flex items-center">
						<span class="bg-red-500 absolute -left-1.5 size-3 rounded-full"></span>
						<div class="border-red-500 w-full border-t-2"></div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
