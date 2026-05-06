<script lang="ts">
	import { untrack } from 'svelte';
	import { datePanel, closeDatePanel } from '$lib/state/layout/datePanel.svelte';
	import { session } from '$lib/state/session.svelte';
	import { datesState } from '$lib/state/navigation/dates.svelte';
	import { membersState } from '$lib/state/navigation/members.svelte';
	import { fsState } from '$lib/state/navigation/filesystem.svelte';
	import FloatingPopover from '$lib/components/ui/FloatingPopover.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Divider from '$lib/components/ui/Divider.svelte';
	import Tag from '$lib/components/ui/Tag.svelte';
	import AssignedIndicator from '$lib/components/ui/AssignedIndicator.svelte';
	import ToggleGroup from '$lib/components/ui/ToggleGroup.svelte';
	import NodeItem from '$lib/components/blocks/NodeItem/NodeItem.svelte';
	import type { DateVariant, AppDate } from '$lib/config/filesystem';

	const entry = $derived(datePanel.entryId != null ? (datesState.dates.find((d) => d.id === datePanel.entryId) ?? null) : null);

	const attachedNode = $derived(entry?.targetNodeId ? (fsState.nodeMap.get(entry.targetNodeId) ?? null) : null);

	const isAssignedToMe = $derived(!!session.user && !!entry && (entry.assignees ?? []).includes(session.user.id));

	// ── Local mode (allows view↔edit toggle without closing) ─────────────────
	let mode = $state<'view' | 'create' | 'edit'>('create');

	// ── Edit snapshot: saved when entering edit so Cancel can revert ──────────
	let editSnapshot: AppDate | null = null;

	// ── Create preview: temp entry ID inserted on create mode open ───────────
	let previewId = $state<string | null>(null);

	// ── Title input ref for auto-focus ────────────────────────────────────────
	let titleInputEl = $state<HTMLInputElement | null>(null);

	// ── Form state ────────────────────────────────────────────────────────────
	let formTitle = $state('');
	let formVariant = $state<DateVariant>('standard');
	let formDateStr = $state('');
	let formTimeStr = $state('09:00');
	let formEndDateStr = $state('');
	let formEndTimeStr = $state('10:00');
	let formAllDay = $state(true);
	let formDescription = $state('');
	let formLocation = $state('');
	let formLink = $state('');
	let formAssignees = $state<string[]>([]);
	let formError = $state('');
	let formLoading = $state(false);
	let editingDate = $state(false);

	// Track the last session key to distinguish "new session" from "date-only update"
	let _prevSessionKey = '';

	// Sync mode + form when panel mode or entryId changes (not when entry content changes).
	// When only initialTimestamp changes (same mode+entryId, create mode), only update the date field.
	$effect(() => {
		const panelMode = datePanel.mode;
		const entryId = datePanel.entryId;
		const ts = datePanel.initialTimestamp;
		const sessionKey = `${panelMode}:${entryId ?? ''}`;
		untrack(() => {
			const isNewSession = sessionKey !== _prevSessionKey;
			_prevSessionKey = sessionKey;

			if (!isNewSession && (panelMode === 'create' || panelMode === 'edit') && ts != null) {
				// Only the date changed — update formDateStr without resetting anything
				formDateStr = new Date(ts).toLocaleDateString('sv-SE');
				return;
			}

			// Full reset for new session
			if (previewId) {
				datesState.removePreview(previewId);
				previewId = null;
			}
			const currentEntry = entry;
			mode = panelMode;
			editingDate = false;
			formError = '';
			formLoading = false;
			if (panelMode === 'create') {
				const tempId = `preview-${Date.now()}`;
				resetCreateForm(ts, datePanel.initialTimestampEnd);
				editSnapshot = null;
				previewId = tempId;
				datesState.insertPreview({
					id: tempId,
					title: '',
					variant: 'standard',
					timestamp: ts ?? Date.now(),
					allDay: true,
					createdAt: Date.now(),
					targetNodeId: datePanel.targetNodeId ?? undefined
				} as AppDate);
			} else if (panelMode === 'edit' && currentEntry) {
				editSnapshot = { ...currentEntry };
				populateForm(currentEntry);
			}
		});
	});

	// Remove the create-preview when the panel is closed without saving.
	// Also reset the session key so the next open is always treated as a fresh session.
	$effect(() => {
		if (!datePanel.isOpen) {
			if (previewId) {
				datesState.removePreview(previewId);
				previewId = null;
			}
			_prevSessionKey = '';
		}
	});

	// Auto-focus the title input when entering create mode
	$effect(() => {
		if (mode === 'create' && titleInputEl) {
			untrack(() => titleInputEl?.focus());
		}
	});

	// Parse a leading time prefix from a title string (e.g. "9:00 Meeting" → { time: "09:00", title: "Meeting" })
	function parseTimePrefix(raw: string): { time: string | null; title: string } {
		const m = raw.trim().match(/^(\d{1,2})[:\.](\d{2})\s+(.+)/);
		if (!m) return { time: null, title: raw.trim() };
		const h = m[1].padStart(2, '0');
		const min = m[2];
		return { time: `${h}:${min}`, title: m[3].trim() };
	}

	// Live preview: mirror form state to local datesState so the calendar
	// updates as the user types. Edit mode reverts via snapshot on cancel;
	// create mode removes the preview entry on cancel/close.
	$effect(() => {
		const activeId = mode === 'edit' ? datePanel.entryId : previewId;
		if (!activeId || (mode !== 'edit' && mode !== 'create')) return;

		// Access all tracked form fields outside untrack
		const title = formTitle;
		const variant = formVariant;
		const dateStr = formDateStr;
		const timeStr = formTimeStr;
		const endDateStr = formEndDateStr;
		const endTimeStr = formEndTimeStr;
		const allDay = formAllDay;
		const description = formDescription;
		const location = formLocation;
		const link = formLink;
		const assignees = formAssignees;

		if (!dateStr) return;
		const startTs = new Date(`${dateStr}T${allDay ? '00:00' : timeStr}`).getTime();
		if (!isFinite(startTs)) return;

		let endTs: number | null | undefined;
		if (variant === 'standard' && endDateStr) {
			const e = new Date(`${endDateStr}T${allDay ? '00:00' : endTimeStr}`).getTime();
			if (isFinite(e) && e > startTs) endTs = e;
		} else if (variant === 'standard' && !endDateStr) {
			endTs = null;
		}

		untrack(() => {
			datesState.previewUpdate(activeId, {
				title: title.trim() || (mode === 'edit' ? (editSnapshot?.title ?? '') : 'new date'),
				variant,
				timestamp: startTs,
				...(endTs !== undefined ? { timestampEnd: endTs } : {}),
				allDay,
				description: description.trim() || undefined,
				location: location.trim() || undefined,
				link: link.trim() || undefined,
				assignees
			});
		});
	});

	function resetCreateForm(ts: number | null, tsEnd: number | null = null) {
		const stamp = ts ?? Date.now();
		formTitle = '';
		formVariant = 'standard';
		formDateStr = new Date(stamp).toLocaleDateString('sv-SE');
		if (tsEnd) {
			const end = new Date(tsEnd);
			formEndDateStr = end.toLocaleDateString('sv-SE');
			formEndTimeStr = end.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
			formTimeStr = new Date(stamp).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
			formAllDay = false;
		} else {
			formTimeStr = '09:00';
			formEndDateStr = '';
			formEndTimeStr = '10:00';
			formAllDay = true;
		}
		formDescription = '';
		formLocation = '';
		formLink = '';
		formAssignees = [];
	}

	function populateForm(e: AppDate) {
		formTitle = e.title;
		formVariant = e.variant;
		const start = new Date(e.timestamp);
		formDateStr = start.toLocaleDateString('sv-SE');
		formTimeStr = start.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
		if (e.timestampEnd) {
			const end = new Date(e.timestampEnd);
			formEndDateStr = end.toLocaleDateString('sv-SE');
			formEndTimeStr = end.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
		} else {
			formEndDateStr = '';
			formEndTimeStr = '10:00';
		}
		formAllDay = e.allDay ?? true;
		formDescription = e.description ?? '';
		formLocation = e.location ?? '';
		formLink = e.link ?? '';
		formAssignees = [...(e.assignees ?? [])];
	}

	const VARIANT_ITEMS = [
		{ id: 'standard', label: 'Standard' },
		{ id: 'start', label: 'Start' },
		{ id: 'deadline', label: 'Deadline' }
	];

	// ── Date formatting ───────────────────────────────────────────────────────
	function formatEntryDate(e: AppDate): string {
		const start = new Date(e.timestamp);
		const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'long', day: '2-digit', month: 'long' };
		let s = start.toLocaleDateString(undefined, dateOpts);
		if (!e.allDay) {
			s += '  ' + start.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
			if (e.timestampEnd) {
				s += ' – ' + new Date(e.timestampEnd).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
			}
		} else if (e.timestampEnd) {
			const endDate = new Date(e.timestampEnd);
			if (endDate.toLocaleDateString('sv-SE') !== start.toLocaleDateString('sv-SE')) {
				s += ' – ' + endDate.toLocaleDateString(undefined, { day: '2-digit', month: 'long' });
			}
		}
		return s;
	}

	const formDatePreview = $derived.by(() => {
		if (!formDateStr) return 'Set date';
		const start = new Date(formDateStr + 'T00:00');
		const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'long', day: '2-digit', month: 'long' };
		let s = start.toLocaleDateString(undefined, dateOpts);
		if (!formAllDay) s += '  ' + formTimeStr;
		if (formEndDateStr) {
			const end = new Date(formEndDateStr + 'T00:00');
			s += ' – ' + end.toLocaleDateString(undefined, { day: '2-digit', month: 'long' });
			if (!formAllDay) s += '  ' + formEndTimeStr;
		}
		return s;
	});

	// ── Actions ───────────────────────────────────────────────────────────────
	async function handleCreate() {
		if (!formDateStr) {
			formError = 'Date is required';
			return;
		}
		formError = '';
		formLoading = true;
		try {
			// Parse leading time prefix (e.g. "9:00 Meeting" → timed entry with title "Meeting")
			const { time: parsedTime, title: parsedTitle } = parseTimePrefix(formTitle);
			const resolvedTitle = parsedTitle || 'new date';
			const resolvedAllDay = parsedTime ? false : formAllDay;
			const resolvedTime = parsedTime ?? formTimeStr;

			const startTs = new Date(`${formDateStr}T${resolvedAllDay ? '00:00' : resolvedTime}`).getTime();
			let endTs: number | undefined;
			if (formVariant === 'standard' && formEndDateStr) {
				endTs = new Date(`${formEndDateStr}T${resolvedAllDay ? '00:00' : formEndTimeStr}`).getTime();
				if (endTs <= startTs) {
					formError = 'End must be after start';
					formLoading = false;
					return;
				}
			}
			const pid = previewId;
			await datesState.createDate(
				{
					title: resolvedTitle,
					variant: formVariant,
					timestamp: startTs,
					...(endTs !== undefined && { timestampEnd: endTs }),
					allDay: resolvedAllDay,
					description: formDescription.trim() || undefined,
					location: formLocation.trim() || undefined,
					link: formLink.trim() || undefined,
					assignees: formAssignees.length > 0 ? formAssignees : undefined,
					targetNodeId: datePanel.targetNodeId ?? undefined
				},
				pid ?? undefined
			);
			previewId = null; // preview replaced by real entry — cleanup effect is now a no-op
			closeDatePanel();
		} catch (err: any) {
			formError = err.message ?? 'Failed to create';
		} finally {
			formLoading = false;
		}
	}

	async function handleUpdate() {
		if (!formTitle.trim() || !datePanel.entryId) {
			formError = 'Title is required';
			return;
		}
		if (!formDateStr) {
			formError = 'Date is required';
			return;
		}
		formError = '';
		formLoading = true;
		try {
			const startTs = new Date(`${formDateStr}T${formAllDay ? '00:00' : formTimeStr}`).getTime();
			let endTs: number | null | undefined;
			if (formVariant === 'standard' && formEndDateStr) {
				endTs = new Date(`${formEndDateStr}T${formAllDay ? '00:00' : formEndTimeStr}`).getTime();
				if (endTs <= startTs) {
					formError = 'End must be after start';
					formLoading = false;
					return;
				}
			} else if (formVariant === 'standard' && !formEndDateStr && entry?.timestampEnd) {
				endTs = null; // explicitly clear
			}
			await datesState.updateDate(datePanel.entryId, {
				title: formTitle.trim(),
				variant: formVariant,
				timestamp: startTs,
				...(endTs !== undefined ? { timestampEnd: endTs } : {}),
				allDay: formAllDay,
				description: formDescription.trim() || undefined,
				location: formLocation.trim() || undefined,
				link: formLink.trim() || undefined,
				assignees: formAssignees
			});
			mode = 'view';
		} catch (err: any) {
			formError = err.message ?? 'Failed to update';
		} finally {
			formLoading = false;
		}
	}

	async function handleDelete() {
		if (!datePanel.entryId) return;
		await datesState.deleteDate(datePanel.entryId);
		closeDatePanel();
	}

	function toggleSelfAssign() {
		if (!session.user) return;
		const id = session.user.id;
		if (formAssignees.includes(id)) {
			formAssignees = formAssignees.filter((a) => a !== id);
		} else {
			formAssignees = [...formAssignees, id];
		}
	}

	async function toggleSelfAssignView() {
		if (!session.user || !datePanel.entryId || !entry) return;
		const id = session.user.id;
		const current = entry.assignees ?? [];
		const next = current.includes(id) ? current.filter((a) => a !== id) : [...current, id];
		await datesState.updateDate(datePanel.entryId, { assignees: next });
	}
</script>

{#if datePanel.isOpen}
	<FloatingPopover x={datePanel.x} y={datePanel.y} onclose={closeDatePanel} style="width:320px; max-height:560px;" class="overflow-hidden" dismissExclude="[data-calendar-cell]">
		<!-- ── VIEW MODE ─────────────────────────────────────────────────── -->
		{#if mode === 'view' && entry}
			<!-- Header (drag handle) -->
			<div data-drag-handle class="px-s py-xs flex shrink-0 cursor-grab items-center gap-1 active:cursor-grabbing">
				<Tag active class={isAssignedToMe ? 'theme-accent' : ''} onclick={toggleSelfAssignView}>
					{#if isAssignedToMe}
						<AssignedIndicator class="mr-0.5" />assigned
					{:else}
						assign
					{/if}
				</Tag>
				<span class="flex-1"></span>
				<Button
					variant="tertiary"
					size="s"
					iconOnly
					onclick={() => {
						editSnapshot = { ...entry };
						populateForm(entry);
						mode = 'edit';
					}}
					title="Edit">
					{#snippet leading()}<Icon name="pencil" />{/snippet}
				</Button>
				<Button variant="tertiary" size="s" iconOnly onclick={handleDelete} title="Delete">
					{#snippet leading()}<Icon name="trash" class="text-error" />{/snippet}
				</Button>
				<Button variant="tertiary" size="s" iconOnly onclick={closeDatePanel} title="Close">
					{#snippet leading()}<Icon name="x" />{/snippet}
				</Button>
			</div>
			<!-- <Divider /> -->

			<!-- Body -->
			<div class="gap-s p-s flex min-h-0 flex-1 flex-col overflow-y-auto">
				<h3 class="font-label-l text-ink-90 font-bold">{entry.title}</h3>
				<p class="font-label-s text-ink-60">{formatEntryDate(entry)}</p>

				{#if attachedNode}
					<NodeItem node={attachedNode} variant="secondary" size="s" tagName="div" active />
				{/if}

				{#if entry.description}
					<div class="flex items-start gap-1.5">
						<Icon name="list" class="mt-0.5 shrink-0 opacity-50" />
						<p class="font-label-s text-ink-70 whitespace-pre-line">{entry.description}</p>
					</div>
				{/if}

				{#if entry.location}
					<div class="flex items-center gap-1.5">
						<Icon name="pin" class="shrink-0 opacity-50" />
						<span class="font-label-s text-ink-70">{entry.location}</span>
					</div>
				{/if}

				{#if entry.link}
					<div class="flex items-center gap-1.5">
						<Icon name="link" class="shrink-0 opacity-50" />
						<a href={entry.link} target="_blank" rel="noopener noreferrer" class="font-label-s text-accent-600 truncate hover:underline">{entry.link}</a>
					</div>
				{/if}

				{#if (entry.assignees ?? []).length > 0}
					{@const maxAmount = 3}
					<div class="flex flex-wrap items-center gap-1">
						{#each (entry.assignees ?? []).slice(0, maxAmount) as userId (userId)}
							{@const name = membersState.getName(userId)}
							<div class="bg-button-active text-ink-60 font-label-xs h-main-2xs w-main-2xs flex shrink-0 items-center justify-center rounded-full font-bold" title={name}>
								{name.charAt(0).toUpperCase()}
							</div>
						{/each}
						{#if (entry.assignees ?? []).length > maxAmount}
							<span class="font-label-xs text-ink-50">+{(entry.assignees ?? []).length - maxAmount}</span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- ── CREATE / EDIT MODE ─────────────────────────────────────────── -->
		{:else if mode === 'create' || mode === 'edit'}
			{@const isSelfAssigned = !!session.user && formAssignees.includes(session.user.id)}

			<!-- Header (drag handle) -->
			<div data-drag-handle class="px-s py-xs flex shrink-0 cursor-grab items-center gap-1 active:cursor-grabbing">
				<Tag active class={isSelfAssigned ? 'theme-accent' : ''} onclick={toggleSelfAssign}>
					{#if isSelfAssigned}
						<AssignedIndicator class="mr-0.5" />assigned
					{:else}
						assign
					{/if}
				</Tag>
				<span class="flex-1"></span>
				{#if mode === 'edit'}
					<Button variant="tertiary" size="s" iconOnly onclick={handleDelete} title="Delete">
						{#snippet leading()}<Icon name="trash" class="text-error" />{/snippet}
					</Button>
				{/if}
				<Button variant="tertiary" size="s" iconOnly onclick={closeDatePanel} title="Close">
					{#snippet leading()}<Icon name="x" />{/snippet}
				</Button>
			</div>
			<!-- <Divider /> -->

			<!-- Body -->
			<div class="gap-s p-s flex min-h-0 flex-1 flex-col overflow-y-auto">
				<!-- Title -->
				<input
					type="text"
					bind:this={titleInputEl}
					bind:value={formTitle}
					placeholder="enter title"
					onkeydown={(e: KeyboardEvent) => {
						if (e.key === 'Enter') {
							e.preventDefault();
							mode === 'edit' ? handleUpdate() : handleCreate();
						}
					}}
					class="font-label-l text-ink-90 placeholder:text-ink-40 w-full border-none bg-transparent p-0 font-bold outline-none focus:ring-0" />

				<!-- Variant toggle -->
				<ToggleGroup items={VARIANT_ITEMS} value={formVariant} size="s" onchange={(v) => (formVariant = v as DateVariant)} />

				<!-- Date row -->
				{#if !editingDate}
					<button type="button" class="font-label-s text-ink-60 hover:text-ink-90 flex w-full items-center gap-1.5 text-left transition-colors" onclick={() => (editingDate = true)}>
						<Icon name="calendar" class="shrink-0 opacity-50" />
						<span class="flex-1">{formDatePreview}</span>
						<Icon name="pencil" class="shrink-0 opacity-40" />
					</button>
				{:else}
					<div class="gap-xs flex flex-col">
						<label class="gap-xs flex items-center">
							<input type="checkbox" bind:checked={formAllDay} class="accent-accent-500" />
							<span class="font-label-s text-ink-70 font-semibold">All day</span>
						</label>
						<div class="gap-xs flex">
							<input type="date" bind:value={formDateStr} class="font-label-s bg-level-1 border-border px-s py-xs text-ink-90 flex-1 rounded-s border outline-none" />
							{#if !formAllDay}
								<input type="time" bind:value={formTimeStr} class="font-label-s bg-level-1 border-border px-s py-xs text-ink-90 w-24 rounded-s border outline-none" />
							{/if}
						</div>
						{#if formVariant === 'standard'}
							<div class="gap-xs flex">
								<input type="date" bind:value={formEndDateStr} class="font-label-s bg-level-1 border-border px-s py-xs text-ink-90 flex-1 rounded-s border outline-none" />
								{#if !formAllDay && formEndDateStr}
									<input type="time" bind:value={formEndTimeStr} class="font-label-s bg-level-1 border-border px-s py-xs text-ink-90 w-24 rounded-s border outline-none" />
								{/if}
							</div>
						{/if}
						<Button variant="tertiary" size="s" onclick={() => (editingDate = false)}>Done</Button>
					</div>
				{/if}

				<!-- Description -->
				<div class="flex items-start gap-1.5">
					<Icon name="list" class="mt-0.5 shrink-0 opacity-50" />
					<textarea
						bind:value={formDescription}
						placeholder="add description"
						rows="2"
						class="font-label-s text-ink-90 placeholder:text-ink-40 min-h-[2lh] w-full resize-none border-none bg-transparent p-0 outline-none focus:ring-0"></textarea>
				</div>

				<!-- Link -->
				<div class="flex items-center gap-1.5">
					<Icon name="link" class="shrink-0 opacity-50" />
					<input type="url" bind:value={formLink} placeholder="add link" class="font-label-s text-ink-90 placeholder:text-ink-40 w-full border-none bg-transparent p-0 outline-none focus:ring-0" />
				</div>

				<!-- Location -->
				<div class="flex items-center gap-1.5">
					<Icon name="pin" class="shrink-0 opacity-50" />
					<input
						type="text"
						bind:value={formLocation}
						placeholder="add location"
						class="font-label-s text-ink-90 placeholder:text-ink-40 w-full border-none bg-transparent p-0 outline-none focus:ring-0" />
				</div>

				{#if formError}
					<p class="font-label-s text-error">{formError}</p>
				{/if}
			</div>

			<Divider />

			<!-- Footer -->
			<div class="gap-xs px-s py-xs flex shrink-0 items-center justify-end">
				<Button
					variant="tertiary"
					size="sm"
					onclick={() => {
						if (mode === 'edit') {
							if (editSnapshot && datePanel.entryId) datesState.revertToSnapshot(datePanel.entryId, editSnapshot);
							mode = 'view';
						} else {
							closeDatePanel();
						}
					}}>Cancel</Button>
				<Button variant="primary" size="sm" loading={formLoading} onclick={mode === 'edit' ? handleUpdate : handleCreate}>
					{mode === 'edit' ? 'Save' : 'Create'}
				</Button>
			</div>
		{/if}
	</FloatingPopover>
{/if}
