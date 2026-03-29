<script lang="ts">
	import { enhance as sveltekitEnhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { setContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLFormAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import { has, FORM_PERMISSION_KEY } from '$lib/utils/config/permissions';

	type BaseProps = {
		children: Snippet;
		class?: string;
		error?: string;
		permission?: string;
		onsubmit?: (e: SubmitEvent) => void | Promise<void>;
		enhance?: boolean | SubmitFunction;
	};

	type Props = BaseProps & Omit<HTMLFormAttributes, 'class' | 'onsubmit'>;

	let { children, class: className = '', error, permission, onsubmit, enhance: enhanceProp, ...rest }: Props = $props();

	// Reaktivität sicherstellen, indem wir eine Funktion in den Context packen
	setContext(FORM_PERMISSION_KEY, () => permission);

	let isPermitted = $derived(permission ? has(permission) : true);

	function handleSubmit(e: SubmitEvent) {
		if (!isPermitted) {
			e.preventDefault();
			return;
		}
		if (onsubmit) {
			if (!enhanceProp) e.preventDefault();
			onsubmit(e);
		}
	}

	function applyEnhance(node: HTMLFormElement) {
		if (!enhanceProp || !isPermitted) return;
		return typeof enhanceProp === 'function' ? sveltekitEnhance(node, enhanceProp) : sveltekitEnhance(node);
	}
</script>

<form method={rest.method || 'POST'} {...rest} onsubmit={handleSubmit} use:applyEnhance class={cn('flex w-full flex-col gap-4', className)}>
	{@render children()}

	{#if error}
		<div class="text-error font-label-s mt-2 text-center font-medium">
			{error}
		</div>
	{/if}
</form>
