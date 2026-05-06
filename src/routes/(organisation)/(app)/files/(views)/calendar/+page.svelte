<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	import { datesState } from '$lib/state/navigation/dates.svelte';
	import { fsState } from '$lib/state/navigation/filesystem.svelte';
	import { contextMenu } from '$lib/state/layout/contextMenu.svelte';
	import { openAssign } from '$lib/state/layout/assign.svelte';
	import { datePanel, openDatePanelCreate, openDatePanelView } from '$lib/state/layout/datePanel.svelte';
	import { aggregateCalendarEntries, sortByTimestamp } from '$lib/utils/calendar/aggregator';
	import type { CalendarEntry } from '$lib/utils/calendar/aggregator';
	import { session } from '$lib/state/session.svelte';

	import CalendarHeader, { type CalendarView } from '$lib/components/pages/calendar/CalendarHeader.svelte';
	import MonthView from '$lib/components/pages/calendar/views/MonthView.svelte';
	import WeekView from '$lib/components/pages/calendar/views/WeekView.svelte';
	import DayView from '$lib/components/pages/calendar/views/DayView.svelte';
	import AgendaView from '$lib/components/pages/calendar/views/AgendaView.svelte';
	import DatePanel from '$lib/components/pages/calendar/DatePanel.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	// ── Data loading ─────────────────────────────────────────────────────────────
	onMount(() => {
		datesState.fetchDates();
		fsState.fetchTree();
	});


	// ── Context menu: handle date-entry actions ──────────────────────────────────
	$effect(() => {
		if (contextMenu.actionRequested && contextMenu.type === 'date-entry') {
			const action = contextMenu.actionRequested;
			const entry = contextMenu.payload as CalendarEntry | null;
			contextMenu.actionRequested = null;
			if (!entry) return;

			if (action === 'delete-date' && entry.source.type === 'floating') {
				datesState.deleteDate(entry.calendarId);
			} else if (action === 'assign-self' && session.user) {
				const cur = entry.assignees ?? [];
				const next = cur.includes(session.user.id) ? cur.filter((id) => id !== session.user!.id) : [...cur, session.user.id];
				datesState.updateDate(entry.calendarId, { assignees: next });
			} else if (action === 'assign-others') {
				openAssign({ clientX: contextMenu.x, clientY: contextMenu.y } as MouseEvent, {
					type: 'date',
					entryId: entry.calendarId,
					currentAssignees: entry.assignees ?? []
				});
			} else if (action === 'edit-date') {
				openDatePanelView({ clientX: contextMenu.x, clientY: contextMenu.y } as MouseEvent, entry.calendarId);
			}
		}
	});

	// ── View routing via URL search param ───────────────────────────────────────
	const view = $derived((page.url.searchParams.get('view') ?? 'month') as CalendarView);

	function setView(v: CalendarView) {
		goto(`?view=${v}`, { replaceState: true });
	}

	// ── Current date & navigation ────────────────────────────────────────────────
	let currentDate = $state(new Date());

	function goToToday() {
		currentDate = new Date();
	}

	function goToPrev() {
		if (view === 'day') {
			currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
		} else if (view === 'week') {
			currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 7);
		} else {
			currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
		}
	}

	function goToNext() {
		if (view === 'day') {
			currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
		} else if (view === 'week') {
			currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 7);
		} else {
			currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
		}
	}

	// ── Entries ──────────────────────────────────────────────────────────────────
	const allEntries = $derived(sortByTimestamp(aggregateCalendarEntries(fsState.nodeMap, datesState.dates)));

	// ── Cell interaction handlers ────────────────────────────────────────────────
	function handleDayClick(e: MouseEvent, date: Date) {
		if (datePanel.isOpen && (datePanel.mode === 'create' || datePanel.mode === 'edit')) {
			// Panel is already open — just update the date field without resetting the form
			datePanel.initialTimestamp = date.getTime();
		} else {
			openDatePanelCreate(e, { timestamp: date.getTime() });
		}
	}

	function handleEntryClick(e: MouseEvent, entry: CalendarEntry) {
		openDatePanelView(e, entry.calendarId);
	}

	function handleMoreClick(date: Date) {
		currentDate = date;
		setView('day');
	}

	function handleTimedDrop(calendarId: string, newTimestamp: number) {
		const entry = allEntries.find((e) => e.calendarId === calendarId);
		if (!entry) return;
		const delta = newTimestamp - entry.timestamp;
		const updates: { timestamp: number; timestampEnd?: number } = { timestamp: newTimestamp };
		if (entry.timestampEnd) updates.timestampEnd = entry.timestampEnd + delta;
		datesState.updateDate(calendarId, updates);
	}

	function handleDateDrop(calendarId: string, targetDate: Date) {
		const entry = allEntries.find((e) => e.calendarId === calendarId);
		if (!entry) return;
		const orig = new Date(entry.timestamp);
		const y = targetDate.getFullYear();
		const m = targetDate.getMonth();
		const d = targetDate.getDate();
		const newTs = entry.allDay
			? new Date(y, m, d).getTime()
			: new Date(y, m, d, orig.getHours(), orig.getMinutes()).getTime();
		const updates: { timestamp: number; timestampEnd?: number } = { timestamp: newTs };
		if (entry.timestampEnd) {
			updates.timestampEnd = entry.timestampEnd + (newTs - entry.timestamp);
		}
		datesState.updateDate(calendarId, updates);
	}
</script>

<div class="px-2xl pt-2xl gap-xl flex h-full flex-col">
	<!-- <div class="gap-m flex items-center">
		<Icon name="calendar" class="size-2xl" />
		<h1 class="font-label-xl font-bold">Calendar</h1>
	</div> -->

	<CalendarHeader {view} {currentDate} onViewChange={setView} onPrev={goToPrev} onNext={goToNext} onToday={goToToday} />

	{#if view === 'month'}
		<MonthView {currentDate} entries={allEntries} onDayClick={handleDayClick} onEntryClick={handleEntryClick} onMoreClick={handleMoreClick} onDateDrop={handleDateDrop} />
	{:else if view === 'week'}
		<WeekView {currentDate} entries={allEntries} onEntryClick={handleEntryClick} onDateDrop={handleDateDrop} onTimedDrop={handleTimedDrop} />
	{:else if view === 'day'}
		<DayView {currentDate} entries={allEntries} onEntryClick={handleEntryClick} onDateDrop={handleDateDrop} onTimedDrop={handleTimedDrop} />
	{:else}
		<AgendaView {currentDate} entries={allEntries} />
	{/if}
</div>

<DatePanel />
