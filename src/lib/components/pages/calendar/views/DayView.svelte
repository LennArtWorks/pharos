<script lang="ts">
	import type { CalendarEntry } from '$lib/utils/calendar/aggregator';

	interface Props {
		currentDate: Date;
		entries: CalendarEntry[];
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	let { currentDate, entries }: Props = $props();
</script>

<div class="flex flex-1 items-center justify-center text-ink-40 font-label-m">
	Day view — coming soon
</div>
