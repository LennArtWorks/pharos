<script lang="ts">
	import { page } from '$app/state';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import FloatingPopover from '$lib/components/ui/FloatingPopover.svelte';
	import { membersState } from '$lib/state/navigation/members.svelte';
	import { fsState } from '$lib/state/navigation/filesystem.svelte';
	import { datesState } from '$lib/state/navigation/dates.svelte';
	import { closeAssign, type AssignTarget } from '$lib/state/layout/assign.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		target: AssignTarget;
		x: number;
		y: number;
	}

	let { target, x, y }: Props = $props();

	const currentUserId = $derived(page.data.user?.id as string | undefined);

	let assignees = $state([...(target.currentAssignees ?? [])]);

	function toggle(memberId: string) {
		if (assignees.includes(memberId)) {
			assignees = assignees.filter((id) => id !== memberId);
		} else {
			assignees = [...assignees, memberId];
		}
		save();
	}

	function save() {
		if (target.type === 'node') {
			fsState.updateNodeAssignees(target.nodeId, assignees);
		} else {
			datesState.updateDate(target.entryId, { assignees });
		}
	}
</script>

<FloatingPopover {x} {y} onclose={closeAssign} style="width:220px; max-height:320px;" class="overflow-hidden" aria-label="Assign members">
	<!-- Header -->
	<div class="border-border flex shrink-0 items-center justify-between border-b px-s py-xs">
		<span class="font-label-s text-ink-90 font-semibold">Assign</span>
		<Button variant="tertiary" size="s" iconOnly onclick={closeAssign} aria-label="Close">
			{#snippet leading()}<Icon name="x" />{/snippet}
		</Button>
	</div>

	<!-- Member list -->
	<div class="min-h-0 flex-1 overflow-y-auto">
		{#if membersState.members.length === 0}
			<p class="font-label-s text-ink-50 px-s py-m text-center">No members found</p>
		{:else}
			{#each membersState.members as member (member.id)}
				{@const isAssigned = assignees.includes(member.id)}
				{@const isYou = member.id === currentUserId}
				<button
					type="button"
					class={cn(
						'font-label-s flex w-full cursor-pointer items-center gap-s px-s py-xs text-left transition-colors',
						isAssigned ? 'bg-accent-50 text-accent-700 hover:bg-accent-100' : 'text-ink-90 hover:bg-button-hover-low'
					)}
					onclick={() => toggle(member.id)}>
					<div class={cn(
						'flex h-main-2xs w-main-2xs shrink-0 items-center justify-center rounded-full font-bold',
						isAssigned ? 'bg-accent-200 text-accent-700' : 'bg-button-active text-ink-60'
					)}>
						{member.name.charAt(0).toUpperCase()}
					</div>
					<span class="min-w-0 flex-1 truncate">{member.name}{isYou ? ' (you)' : ''}</span>
					{#if isAssigned}
						<Icon name="circled-check" class="shrink-0 text-accent-600" />
					{/if}
				</button>
			{/each}
		{/if}
	</div>
</FloatingPopover>
