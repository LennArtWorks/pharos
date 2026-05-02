<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import OverlayTemplateStandard from '$lib/components/layout/overlays/templates/OverlayTemplateStandard.svelte';
	import { dateCreateContext } from '$lib/state/layout/dateCreate.svelte';
	import { datesState } from '$lib/state/navigation/dates.svelte';
	import type { DateVariant } from '$lib/config/filesystem';
	import { FLOATING_ITEM_CONFIG } from '$lib/config/filesystem';

	let { closeOverlay }: { closeOverlay: () => void } = $props();

	// ── Form state ───────────────────────────────────────────────────────────────
	let title = $state('');
	let variant = $state<DateVariant>('standard');
	let allDay = $state(true);
	let dateStr = $state('');
	let timeStr = $state('09:00');
	let endDateStr = $state('');
	let endTimeStr = $state('10:00');
	let description = $state('');
	let formError = $state('');
	let loading = $state(false);

	const variants = Object.entries(FLOATING_ITEM_CONFIG.dates).map(([key, cfg]) => ({
		key: key as DateVariant,
		label: cfg.label
	}));

	// Pre-fill from context whenever the modal mounts/re-opens
	$effect(() => {
		const ts = dateCreateContext.initialTimestamp ?? Date.now();
		dateStr = new Date(ts).toLocaleDateString('sv-SE');
		title = '';
		variant = 'standard';
		allDay = true;
		timeStr = '09:00';
		endDateStr = '';
		endTimeStr = '10:00';
		description = '';
		formError = '';
		loading = false;
	});

	const modalTitle = $derived(dateCreateContext.targetNodeName ? `Add Date to "${dateCreateContext.targetNodeName}"` : 'New Date');

	function handleEscape(e: KeyboardEvent) {
		if (e.key === 'Escape') closeOverlay();
	}

	async function handleSubmit() {
		if (!title.trim()) {
			formError = 'Title is required';
			return;
		}
		if (!dateStr) {
			formError = 'Date is required';
			return;
		}

		formError = '';
		loading = true;

		try {
			const startTs = new Date(`${dateStr}T${allDay ? '00:00' : timeStr}`).getTime();

			let endTs: number | undefined;
			if (variant === 'standard' && endDateStr) {
				endTs = new Date(`${endDateStr}T${allDay ? '00:00' : endTimeStr}`).getTime();
				if (endTs <= startTs) {
					formError = 'End date must be after start date';
					loading = false;
					return;
				}
			}

			await datesState.createDate({
				title: title.trim(),
				variant,
				timestamp: startTs,
				...(endTs !== undefined && { timestampEnd: endTs }),
				allDay,
				description: description.trim() || undefined,
				targetNodeId: dateCreateContext.targetNodeId ?? undefined
			});

			closeOverlay();
		} catch (err: any) {
			formError = err.message ?? 'Failed to create date';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:window onkeydown={handleEscape} />

<OverlayTemplateStandard title={modalTitle} onclose={closeOverlay}>
	<!-- Body -->
	<div class="flex flex-col gap-5">
		<!-- Title -->
		<Input label="Title" required bind:value={title} placeholder="Add a title..." />

		<!-- Variant toggle group -->
		<div class="flex flex-col gap-1">
			<span class="font-label-s text-ink-70 font-semibold">Type</span>
			<div class="ring-border rounded-m flex overflow-hidden ring-1 ring-inset" role="group" aria-label="Date type">
				{#each variants as v}
					<button
						type="button"
						class="h-main-m px-m font-label-s flex-1 font-semibold transition-colors
							{variant === v.key ? 'bg-button text-ink-10' : 'text-ink-90 hover:bg-button-hover-low bg-transparent'}"
						onclick={() => (variant = v.key)}>
						{v.label}
					</button>
				{/each}
			</div>
		</div>

		<!-- Date row + all-day toggle -->
		<div class="flex items-end gap-3">
			<div class="flex-1">
				<Input label="Date" type="date" required bind:value={dateStr} />
			</div>
			{#if !allDay}
				<div class="w-32 shrink-0">
					<Input label="Time" type="time" bind:value={timeStr} />
				</div>
			{/if}
			<label class="h-main-m flex shrink-0 cursor-pointer items-center gap-2">
				<input type="checkbox" bind:checked={allDay} class="accent-accent-500 h-4 w-4" />
				<span class="font-label-s text-ink-70 font-semibold whitespace-nowrap">All day</span>
			</label>
		</div>

		<!-- End date row (standard variant only) -->
		{#if variant === 'standard'}
			<div class="flex items-end gap-3">
				<div class="flex-1">
					<Input label="End Date" type="date" bind:value={endDateStr} />
				</div>
				{#if !allDay && endDateStr}
					<div class="w-32 shrink-0">
						<Input label="End Time" type="time" bind:value={endTimeStr} />
					</div>
				{/if}
			</div>
		{/if}

		<!-- Description -->
		<div class="flex flex-col gap-1">
			<label for="date-create-description" class="font-label-s text-ink-70 font-semibold"> Description </label>
			<textarea
				id="date-create-description"
				bind:value={description}
				placeholder="Add a description..."
				rows="3"
				class="ring-border bg-level-2 text-ink-90 placeholder:text-ink-50 rounded-m px-m font-label-s focus:ring-ink-90 w-full resize-none py-2.5 font-semibold ring-1 transition-all outline-none ring-inset hover:ring-2 focus:ring-2"
			></textarea>
		</div>

		<!-- Inline error -->
		{#if formError}
			<p class="font-label-s text-error font-medium">{formError}</p>
		{/if}
	</div>

	{#snippet footer()}
		<Button variant="secondary" onclick={closeOverlay} disabled={loading}>Cancel</Button>
		<Button variant="primary" size="sm" onclick={handleSubmit} {loading}>Create</Button>
	{/snippet}
</OverlayTemplateStandard>
