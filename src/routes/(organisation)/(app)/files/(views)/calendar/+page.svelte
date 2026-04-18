<script lang="ts">
	import { onMount } from 'svelte';
	import { datesState } from '$lib/state/navigation/dates.svelte';
	import { fsState } from '$lib/state/navigation/filesystem.svelte';
	import { aggregateCalendarEntries, sortByTimestamp, groupByDay } from '$lib/utils/calendar/aggregator';
	import { FLOATING_ITEM_CONFIG } from '$lib/config/filesystem';
	import { openDateCreate } from '$lib/state/layout/dateCreate.svelte';
	import { contextMenu, openContextMenu, type ContextMenuItem } from '$lib/state/layout/contextMenu.svelte';
	import type { CalendarEntry } from '$lib/utils/calendar/aggregator';

	// ── Data loading ────────────────────────────────────────────────────────────
	onMount(() => {
		datesState.fetchDates();
		fsState.fetchTree();
	});

	// ── Handle date-entry context menu actions ───────────────────────────────────
	$effect(() => {
		if (contextMenu.actionRequested && contextMenu.type === 'date-entry') {
			const action = contextMenu.actionRequested;
			const entry = contextMenu.payload as CalendarEntry | null;
			contextMenu.actionRequested = null;

			if (!entry) return;

			if (action === 'delete-date' && entry.source.type === 'floating') {
				datesState.deleteDate(entry.calendarId);
			}
			// 'edit-date' → phase 3 detail popover (placeholder)
		}
	});

	// ── Month navigation state ───────────────────────────────────────────────────
	let currentDate = $state(new Date());
	const currentYear = $derived(currentDate.getFullYear());
	const currentMonth = $derived(currentDate.getMonth()); // 0-indexed

	function prevMonth() {
		currentDate = new Date(currentYear, currentMonth - 1, 1);
	}
	function nextMonth() {
		currentDate = new Date(currentYear, currentMonth + 1, 1);
	}
	function goToToday() {
		currentDate = new Date();
	}

	const monthLabel = $derived(currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }));
	const todayKey = new Date().toLocaleDateString('sv-SE');

	// ── Aggregation ─────────────────────────────────────────────────────────────
	const allEntries = $derived(sortByTimestamp(aggregateCalendarEntries(fsState.nodeMap, datesState.dates)));
	const entriesByDay = $derived(groupByDay(allEntries));

	// ── Calendar grid generation ─────────────────────────────────────────────────
	const calendarDays = $derived.by(() => {
		const firstOfMonth = new Date(currentYear, currentMonth, 1);
		const startWeekday = (firstOfMonth.getDay() + 6) % 7; // 0=Mon…6=Sun
		const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

		const days: { date: Date; dateKey: string; isCurrentMonth: boolean }[] = [];

		for (let i = startWeekday - 1; i >= 0; i--) {
			const d = new Date(currentYear, currentMonth, -i);
			days.push({ date: d, dateKey: d.toLocaleDateString('sv-SE'), isCurrentMonth: false });
		}
		for (let d = 1; d <= daysInMonth; d++) {
			const date = new Date(currentYear, currentMonth, d);
			days.push({ date, dateKey: date.toLocaleDateString('sv-SE'), isCurrentMonth: true });
		}
		let trailing = 7 - (days.length % 7);
		if (trailing === 7) trailing = 0;
		for (let d = 1; d <= trailing; d++) {
			const date = new Date(currentYear, currentMonth + 1, d);
			days.push({ date, dateKey: date.toLocaleDateString('sv-SE'), isCurrentMonth: false });
		}

		return days;
	});

	// ── Variant styling ──────────────────────────────────────────────────────────
	const variantColor: Record<string, string> = {
		standard: 'bg-accent-100 text-accent-600',
		start: 'bg-green-100 text-green-700',
		deadline: 'bg-red-100 text-red-600'
	};

	const variantLabel: Record<string, string> = {
		...Object.fromEntries(Object.entries(FLOATING_ITEM_CONFIG.dates).map(([k, v]) => [k, v.label])),
		event: 'Event'
	};

	function formatEntryTime(entry: CalendarEntry): string {
		if (entry.allDay) return '';
		return new Date(entry.timestamp).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
	}

	// ── Context menu for entry pills ─────────────────────────────────────────────
	function getEntryContextItems(entry: CalendarEntry): ContextMenuItem[] {
		const items: ContextMenuItem[] = [
			{ id: 'edit-date', type: 'action', label: 'View / Edit', icon: 'pencil', action: 'edit-date' }
		];
		// Only floating dates can be deleted from here; node-embedded dates must be
		// managed from the node itself (phase 3)
		if (entry.source.type === 'floating') {
			items.push({ id: 'div', type: 'divider' });
			items.push({ id: 'delete-date', type: 'action', label: 'Delete', icon: 'trash', action: 'delete-date', danger: true });
		}
		return items;
	}

	const WEEKDAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
</script>

<div class="flex flex-col h-full">
	<!-- ── Header: month navigation ──────────────────────────────────────────── -->
	<div class="border-border px-xl py-s flex shrink-0 items-center justify-between border-b">
		<div class="gap-m flex items-center">
			<button onclick={prevMonth} class="font-label-s text-ink-60 hover:text-ink-90 h-main-s w-main-s rounded-m flex items-center justify-center">‹</button>
			<span class="font-label-m text-ink-90">{monthLabel}</span>
			<button onclick={nextMonth} class="font-label-s text-ink-60 hover:text-ink-90 h-main-s w-main-s rounded-m flex items-center justify-center">›</button>
		</div>

		<div class="flex items-center gap-3">
			<button
				onclick={() => openDateCreate()}
				class="font-label-s text-ink-60 hover:text-ink-90 border-border rounded-m px-m py-xs border flex items-center gap-1">
				+ New Date
			</button>
			<button onclick={goToToday} class="font-label-s text-ink-60 hover:text-ink-90 border-border rounded-m px-m py-xs border">
				Today
			</button>
		</div>
	</div>

	<!-- ── Grid ──────────────────────────────────────────────────────────────── -->
	<div class="px-xl py-m min-h-0 flex-1 overflow-y-auto">
		<!-- Weekday header row -->
		<div class="mb-xs grid grid-cols-7">
			{#each WEEKDAYS as day}
				<div class="font-label-xs text-ink-40 py-xs text-center">{day}</div>
			{/each}
		</div>

		<!-- Day cells grid -->
		<div class="gap-3xs grid grid-cols-7">
			{#each calendarDays as { date, dateKey, isCurrentMonth } (dateKey)}
				{@const dayNumber = date.getDate()}
				{@const isToday = dateKey === todayKey}
				{@const dayEntries = entriesByDay.get(dateKey) ?? []}

				<!-- Day cell — click to create a new date on this day -->
				<div
					role="button"
					tabindex="0"
					class="border-border gap-3xs rounded-m p-xs flex min-h-30 flex-col border cursor-pointer hover:bg-level-1 transition-colors {isCurrentMonth ? '' : 'opacity-30'}"
					onclick={() => openDateCreate({ timestamp: date.getTime() })}
					onkeydown={(e) => e.key === 'Enter' && openDateCreate({ timestamp: date.getTime() })}>

					<!-- Day number -->
					<div class="flex items-center justify-end">
						<span class="font-label-xs {isToday ? 'bg-accent-500 h-main-2xs w-main-2xs flex items-center justify-center rounded-full text-neutral-50' : 'text-ink-50'}">
							{dayNumber}
						</span>
					</div>

					<!-- Entry pills for this day -->
					{#each dayEntries as entry (entry.calendarId)}
						<div
							role="button"
							tabindex="0"
							class="font-label-xs px-xs py-3xs rounded gap-1 flex flex-col cursor-pointer {variantColor[entry.variant] ?? 'bg-level-1 text-ink-60'}"
							title="{variantLabel[entry.variant] ?? entry.variant}: {entry.title}"
							onclick={(e) => e.stopPropagation()}
							onkeydown={(e) => { if (e.key === 'Enter') e.stopPropagation(); }}
							oncontextmenu={(e) => { e.stopPropagation(); openContextMenu(e, 'date-entry', null, getEntryContextItems(entry)); contextMenu.payload = entry; }}>

							<!-- Title row -->
							<span class="line-clamp-1 font-semibold leading-tight">{entry.title}</span>

							<!-- Time (if not all-day) -->
							{#if !entry.allDay}
								<span class="opacity-70">{formatEntryTime(entry)}</span>
							{/if}

							<!-- Attached node name (if from a node source) -->
							{#if entry.source.type === 'node'}
								<span class="opacity-60 truncate">{entry.source.nodeName}</span>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
