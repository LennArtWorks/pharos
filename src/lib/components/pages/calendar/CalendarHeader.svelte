<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import ToggleGroup from '$lib/components/ui/ToggleGroup.svelte';
	import { openDateCreate } from '$lib/state/layout/dateCreate.svelte';
	import { DRAG_HOVER_DELAY } from '$lib/config/globalsettings';

	export type CalendarView = 'agenda' | 'month' | 'week' | 'day';

	interface Props {
		view: CalendarView;
		currentDate: Date;
		onViewChange: (v: CalendarView) => void;
		onPrev: () => void;
		onNext: () => void;
		onToday: () => void;
	}

	let { view, currentDate, onViewChange, onPrev, onNext, onToday }: Props = $props();

	const VIEWS: { id: CalendarView; label: string }[] = [
		{ id: 'agenda', label: 'Agenda' },
		{ id: 'month', label: 'Month' },
		{ id: 'week', label: 'Week' },
		{ id: 'day', label: 'Day' }
	];

	function getISOWeek(date: Date): number {
		const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
		const dayNum = d.getUTCDay() || 7;
		d.setUTCDate(d.getUTCDate() + 4 - dayNum);
		const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
		return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
	}

	let navSwitchTimer: ReturnType<typeof setTimeout> | null = null;
	let dragOverNav = $state<'prev' | 'next' | null>(null);
	let flickerNav = $state<'prev' | 'next' | null>(null);

	function onNavDragEnter(e: DragEvent, direction: 'prev' | 'next') {
		if (!e.dataTransfer?.types.includes('application/calendar-entry-id')) return;
		e.preventDefault();
		dragOverNav = direction;
		if (navSwitchTimer) return;
		navSwitchTimer = setTimeout(() => {
			navSwitchTimer = null;
			dragOverNav = null;
			flickerNav = direction;
			if (direction === 'prev') onPrev();
			else onNext();
			setTimeout(() => { flickerNav = null; }, 180);
		}, DRAG_HOVER_DELAY);
	}

	function onNavDragLeave(direction: 'prev' | 'next') {
		if (dragOverNav === direction) dragOverNav = null;
		if (navSwitchTimer) { clearTimeout(navSwitchTimer); navSwitchTimer = null; }
	}

	const periodLabel = $derived.by(() => {
		const week = getISOWeek(currentDate);
		const month = currentDate.toLocaleDateString(undefined, { month: 'long' });
		const year = currentDate.getFullYear();
		const day = currentDate.getDate();
		if (view === 'month' || view === 'agenda') return `${month} ${year}`;
		if (view === 'week') return `${month} (KW ${week})`;
		return `${day}. ${month} (KW ${week})`;
	});
</script>

<div class="gap-m flex shrink-0 items-center justify-between">
	<!-- Left: + add date + view switcher -->
	<div class="flex items-center gap-2">
		<Button variant="primary" size="sm" onclick={() => openDateCreate()}>
			{#snippet leading()}<Icon name="add" />{/snippet}
			{#snippet label()}add date{/snippet}
		</Button>

		<ToggleGroup items={VIEWS} value={view} onchange={(v: string) => onViewChange(v as CalendarView)} size="s" class="w-70" />

		<Button variant="secondary" size="sm">
			{#snippet leading()}<Icon name="filter" />{/snippet}
			{#snippet label()}Filters{/snippet}
		</Button>
	</div>

	<!-- Right: navigation -->
	<div class="flex items-center gap-1">
		<Button variant="secondary" size="sm" onclick={onToday}>
			{#snippet label()}today{/snippet}
		</Button>

		<Button variant="tertiary" size="s" iconOnly onclick={onPrev} aria-label="Previous"
				active={dragOverNav === 'prev'}
				class="{dragOverNav === 'prev' ? 'theme-accent' : ''} {flickerNav === 'prev' ? 'opacity-40' : ''} transition-opacity"
				ondragenter={(e: DragEvent) => onNavDragEnter(e, 'prev')}
				ondragleave={() => onNavDragLeave('prev')}>
			{#snippet leading()}<Icon name="arrow-left" />{/snippet}
		</Button>

		<Button variant="tertiary" size="s" iconOnly onclick={onNext} aria-label="Next"
				active={dragOverNav === 'next'}
				class="{dragOverNav === 'next' ? 'theme-accent' : ''} {flickerNav === 'next' ? 'opacity-40' : ''} transition-opacity"
				ondragenter={(e: DragEvent) => onNavDragEnter(e, 'next')}
				ondragleave={() => onNavDragLeave('next')}>
			{#snippet leading()}<Icon name="arrow-right" />{/snippet}
		</Button>

		<span class="font-label-m text-ink-90 px-xs min-w-36 text-center">{periodLabel}</span>

		<Button variant="tertiary" size="s" iconOnly aria-label="Open mini calendar">
			{#snippet leading()}<Icon name="calendar" />{/snippet}
		</Button>
	</div>
</div>
