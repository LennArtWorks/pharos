<script lang="ts">
	import { cn } from '$lib/utils';

	interface Props {
		value: string;
		maxWidth?: boolean;
		class?: string;
		onsave?: (newValue: string) => void;
		oncancel?: () => void;
	}

	let { value, maxWidth = false, class: className = '', onsave, oncancel }: Props = $props();

	let editValue = $state(value);

	function focusInput(node: HTMLInputElement) {
		setTimeout(() => {
			node.focus();
			node.select();
		}, 10);
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.stopPropagation();
			e.preventDefault();
			commitSave();
		}
		if (e.key === 'Escape') {
			e.stopPropagation();
			e.preventDefault();
			oncancel?.();
		}
	}

	function commitSave() {
		const trimmed = editValue.trim();
		if (trimmed) onsave?.(trimmed);
		else oncancel?.();
	}
</script>

<div class={cn('inline-grid items-center', maxWidth ? 'max-w-62.5' : 'w-full min-w-[2ch]')} onclick={(e) => e.stopPropagation()} ondblclick={(e) => e.stopPropagation()}>
	<span class={cn('pointer-events-none invisible col-start-1 row-start-1 overflow-hidden whitespace-pre', className)} aria-hidden="true">
		{editValue + ' '}
	</span>
	<input
		type="text"
		bind:value={editValue}
		use:focusInput
		onkeydown={handleKeydown}
		onblur={commitSave}
		class={cn('text-ink-90 col-start-1 row-start-1 m-0 w-full border-none bg-transparent p-0 outline-none focus:ring-0 focus:outline-none', className)} />
</div>
