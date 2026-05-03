<script lang="ts">
	import { contextMenu, openContextMenu, type ContextMenuItem } from '$lib/state/layout/contextMenu.svelte';
	import type { CalendarEntry } from '$lib/utils/calendar/aggregator';
	import { PERMISSIONS } from '$lib/config/permissions';
	import { has } from '$lib/utils/config/permissions';
	import { APP_EXTENSIONS } from '$lib/config/globalsettings';
	import MonthNode from '../nodes/MonthNode.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';

	interface Props {
		currentDate: Date;
		entries: CalendarEntry[];
		currentUserId?: string;
		onDayClick: (e: MouseEvent, date: Date) => void;
		onEntryClick?: (e: MouseEvent, entry: CalendarEntry) => void;
		onMoreClick: (date: Date) => void;
		onDateDrop?: (calendarId: string, date: Date) => void;
	}

	let { currentDate, entries, currentUserId, onDayClick, onEntryClick, onMoreClick, onDateDrop }: Props = $props();

	// ── Drag state ──────────────────────────────────────────────────────────────
	let dragOverDateKey = $state<string | null>(null);

	function handleDragOver(e: DragEvent, dateKey: string) {
		if (!e.dataTransfer?.types.includes('application/calendar-entry-id')) return;
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
		dragOverDateKey = dateKey;
	}

	function handleDragLeave(e: DragEvent) {
		// Only clear if leaving the cell entirely (not moving into a child)
		const related = e.relatedTarget as Node | null;
		if (!(e.currentTarget as HTMLElement).contains(related)) {
			dragOverDateKey = null;
		}
	}

	function handleDrop(e: DragEvent, date: Date, dateKey: string) {
		e.preventDefault();
		dragOverDateKey = null;
		const calendarId = e.dataTransfer?.getData('application/calendar-entry-id');
		if (!calendarId) return;
		onDateDrop?.(calendarId, date);
	}

	// Dynamic slot calculation: read actual token sizes so the layout stays
	// correct if spacing tokens change. slotH = item height + gap between items.
	// baseH = cell padding (top+bottom) + header row height — consumed before items start.
	let cellH = $state(0);
	let slotH = $state(26); // fallback until $effect runs (h-main-xs 24 + gap-3xs 2)
	let baseH = $state(28); // fallback (h-main-xs 24 + gap-3xs*2 4)

	$effect(() => {
		const style = getComputedStyle(document.documentElement);
		const fs = parseFloat(style.fontSize) || 16;
		const rem = (v: string) => parseFloat(v.trim()) * fs;
		const mainXs = rem(style.getPropertyValue('--spacing-main-xs')); // Button xs height
		const gap3xs = rem(style.getPropertyValue('--spacing-3xs'));      // cell gap
		slotH = mainXs + gap3xs;
		baseH = mainXs + 2 * gap3xs; // header + top-padding + bottom-padding
	});

	const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
	const todayKey = new Date().toLocaleDateString('sv-SE');

	let hoveredCalendarId: string | null = $state(null);

	// ── Calendar grid ───────────────────────────────────────────────────────────
	const calendarDays = $derived.by(() => {
		const year = currentDate.getFullYear();
		const month = currentDate.getMonth();
		const firstOfMonth = new Date(year, month, 1);
		const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Mon…6=Sun
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		const days: { date: Date; dateKey: string; isCurrentMonth: boolean }[] = [];

		for (let i = startWeekday - 1; i >= 0; i--) {
			const d = new Date(year, month, -i);
			days.push({ date: d, dateKey: d.toLocaleDateString('sv-SE'), isCurrentMonth: false });
		}
		for (let d = 1; d <= daysInMonth; d++) {
			const date = new Date(year, month, d);
			days.push({ date, dateKey: date.toLocaleDateString('sv-SE'), isCurrentMonth: true });
		}
		let trailing = 7 - (days.length % 7);
		if (trailing === 7) trailing = 0;
		for (let d = 1; d <= trailing; d++) {
			const date = new Date(year, month + 1, d);
			days.push({ date, dateKey: date.toLocaleDateString('sv-SE'), isCurrentMonth: false });
		}
		return days;
	});

	const numWeeks = $derived(calendarDays.length / 7);

	// ── Expanded entries map ────────────────────────────────────────────────────
	// For each visible day key, compute which entries appear and their spanState.
	// Point-in-time entries appear only on their start day.
	// Spanning entries (timestampEnd set + different end day) appear on every day in range.
	type CellItem = { entry: CalendarEntry; spanState: 'full' | 'start' | 'middle' | 'end' };

	const cellEntriesMap = $derived.by(() => {
		const dayKeySet = new Set(calendarDays.map((d) => d.dateKey));
		const map = new Map<string, CellItem[]>();
		for (const { dateKey } of calendarDays) map.set(dateKey, []);

		for (const entry of entries) {
			const startKey = new Date(entry.timestamp).toLocaleDateString('sv-SE');

			if (!entry.timestampEnd) {
				// Point-in-time — appears only on start day
				map.get(startKey)?.push({ entry, spanState: 'full' });
			} else {
				const endKey = new Date(entry.timestampEnd).toLocaleDateString('sv-SE');
				if (startKey === endKey) {
					// Same-day timestampEnd (e.g. event from 10:00–12:00 same day)
					map.get(startKey)?.push({ entry, spanState: 'full' });
				} else {
					// Multi-day span — walk through each day in the range
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
		}
		return map;
	});

	// ── Entry sort within a cell ────────────────────────────────────────────────
	// Order: event nodes → spanning timeframes → other all-day → timed (by timestamp)
	function sortCellItems(items: CellItem[]): CellItem[] {
		return [...items].sort((a, b) => {
			const priority = (item: CellItem) => {
				const e = item.entry;
				if (!e.allDay) return 1000 + e.timestamp; // timed entries last, sorted by time
				const isEventNode = e.source.type === 'node' && e.source.nodeExtension === APP_EXTENSIONS.EVENT;
				if (isEventNode) return 0;
				const isSpanning = !!e.timestampEnd && new Date(e.timestamp).toLocaleDateString('sv-SE') !== new Date(e.timestampEnd).toLocaleDateString('sv-SE');
				if (isSpanning) return 1;
				return 2;
			};
			return priority(a) - priority(b);
		});
	}

	// ── Context menu for entries ────────────────────────────────────────────────
	function getEntryContextItems(entry: CalendarEntry): ContextMenuItem[] {
		const isSelfAssigned = !!currentUserId && (entry.assignees ?? []).includes(currentUserId);
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

<div class="flex h-full flex-col">
	<!-- Weekday header -->
	<div class="gap-s grid shrink-0 grid-cols-7">
		{#each WEEKDAYS as day}
			<div class="font-label-xs text-ink-50 py-xs text-center font-bold">{day}</div>
		{/each}
	</div>
	<Divider />

	<!-- Week rows — one grid per row so Dividers can sit between them.
	     MonthNode extends spanning bars via barSpanStyle to bridge the gap-s + padding gap. -->
	<div class="flex min-h-0 flex-1 flex-col">
		{#each { length: numWeeks } as _, weekIdx}
			{#if weekIdx > 0}
				<Divider />
			{/if}

			<div class="gap-s grid min-h-0 flex-1 grid-cols-7">
				{#each calendarDays.slice(weekIdx * 7, (weekIdx + 1) * 7) as { date, dateKey, isCurrentMonth } (dateKey)}
					{@const isToday = dateKey === todayKey}
					{@const sortedItems = sortCellItems(cellEntriesMap.get(dateKey) ?? [])}
					{@const totalSlots = cellH ? Math.max(1, Math.floor((cellH - baseH) / slotH)) : 3}
					{@const hasOverflow = sortedItems.length > totalSlots}
					{@const visibleCount = hasOverflow ? Math.max(1, totalSlots - 1) : sortedItems.length}
					{@const visibleItems = sortedItems.slice(0, visibleCount)}
					{@const overflow = sortedItems.length - visibleCount}

					<div
						role="button"
						tabindex="0"
						data-calendar-cell
						bind:clientHeight={cellH}
						class="p-3xs rounded-m gap-3xs hover:ring-border flex cursor-pointer flex-col ring transition-colors {isCurrentMonth ? '' : 'opacity-30'} {dragOverDateKey === dateKey ? 'ring-accent-400' : 'ring-transparent'}"
						onclick={(e: MouseEvent) => onDayClick(e, date)}
						onkeydown={(e: KeyboardEvent) => {
							if (e.key === 'Enter') onDayClick(e as unknown as MouseEvent, date);
						}}
						ondragover={(e: DragEvent) => handleDragOver(e, dateKey)}
						ondragleave={handleDragLeave}
						ondrop={(e: DragEvent) => handleDrop(e, date, dateKey)}>
						<!-- Day number -->
						<div class="flex w-full items-center justify-center">
							{#if isToday}
								<span class="bg-accent-600 h-main-xs w-main-xs font-label-s rounded-t-s rounded-b-s flex items-center justify-center font-bold text-neutral-50">
									{date.getDate()}
								</span>
							{:else}
								<span class="font-label-s h-main-xs w-main-xs text-ink-60 inline-flex items-center justify-center font-bold">{date.getDate()}</span>
							{/if}
						</div>

						<!-- Entry nodes -->
						{#each visibleItems as { entry, spanState } (entry.calendarId)}
							<MonthNode
								{entry}
								{spanState}
								{currentUserId}
								isHovered={hoveredCalendarId === entry.calendarId}
								onclick={(e: MouseEvent) => {
									e.stopPropagation();
									onEntryClick?.(e, entry);
								}}
								oncontextmenu={(e: MouseEvent) => {
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
								ondragend={() => { dragOverDateKey = null; }} />
						{/each}

						<!-- Overflow chip -->
						{#if overflow > 0}
							<Button
								variant="unstyled"
								class="font-label-xs text-ink-50 hover:text-ink-90 px-xs shrink-0 text-left"
								onclick={(e: MouseEvent) => {
									e.stopPropagation();
									onMoreClick(date);
								}}>
								+{overflow} more
							</Button>
						{/if}
					</div>
				{/each}
			</div>
		{/each}
	</div>
</div>
