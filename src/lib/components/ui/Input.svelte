<script lang="ts">
	import { getContext } from 'svelte';
	import type { Snippet } from 'svelte';
	import type { HTMLInputAttributes } from 'svelte/elements';
	import { cn } from '$lib/utils';
	import Icon from '$lib/components/ui/Icon.svelte';
	import { has, FORM_PERMISSION_KEY } from '$lib/utils/permissions';

	type BaseProps = {
		value?: string | number | null;
		type?: 'text' | 'email' | 'password' | 'date' | 'number' | string;
		label?: string;
		required?: boolean;
		error?: string;
		tooltip?: string;
		leading?: Snippet;
		trailing?: Snippet;
		class?: string;

		// States
		readonly?: boolean;
		onclick?: (e: MouseEvent) => void;
		permission?: string; // New: Input-specific permission override
	};

	type Props = BaseProps & Omit<HTMLInputAttributes, 'type' | 'value' | 'class' | 'onclick' | 'readonly'>;

	let {
		value = $bindable(null),
		type = 'text',
		label,
		required = false,
		error,
		tooltip,
		placeholder = '',
		disabled = false,
		readonly = false,
		permission,
		onclick,
		class: className = '',
		leading,
		trailing,
		...rest
	}: Props = $props();

	// 1. Grab form-level permission if it exists
	const getFormPerm = getContext<() => string | undefined>(FORM_PERMISSION_KEY);

	// 2. Determine effective permission (prop overrides form context)
	let effectivePermission = $derived(permission !== undefined ? permission : getFormPerm?.());

	// 3. Check if user is allowed
	let isPermitted = $derived(effectivePermission ? has(effectivePermission) : true);

	// 4. Force disabled if not permitted
	let isEffectivelyDisabled = $derived(disabled || !isPermitted);

	let showPassword = $state(false);
	let actualType = $derived(type === 'password' && showPassword ? 'text' : type);
	let hasError = $derived(!!error);

	function togglePassword() {
		showPassword = !showPassword;
	}
</script>

<div class={cn('flex w-full flex-col gap-1', className)}>
	{#if label || tooltip}
		<div class="flex items-center justify-between">
			{#if label}
				<label class="font-label-s text-ink-70 flex items-center gap-1 font-semibold">
					{label}
					{#if required}<span class="text-error ml-0.5">*</span>{/if}
					{#if !isPermitted}
						<Icon name="lock" class="text-ink-50 ml-1 h-3 w-3" />
					{/if}
				</label>
			{/if}
			{#if tooltip}
				<div class="text-ink-50 hover:text-ink-90 group relative flex cursor-help items-center transition-colors">
					<Icon name="circled-question-small" class="h-5 w-5" />

					<div
						class="bg-level-1 border-border text-ink-90 absolute right-0 bottom-full z-50 mb-1 hidden w-48 rounded-md border p-2 text-xs opacity-0 shadow-lg transition-opacity group-hover:block group-hover:opacity-100">
						{tooltip}
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<div
		{onclick}
		class={cn(
			'h-main-m rounded-m ring-border relative flex min-w-0 items-center overflow-visible ring-1 transition-all ring-inset', // base styling
			isEffectivelyDisabled ? 'cursor-not-allowed bg-transparent opacity-50' : '', // variant: no permission / disabled
			hasError && !isEffectivelyDisabled ? 'ring-error focus-within:ring-error focus-within:ring-2' : '', // variant: has error
			!hasError && !isEffectivelyDisabled ? 'focus-within:ring-ink-90 focus-within:ring-2 hover:ring-2' : '',
			readonly && !isEffectivelyDisabled ? 'cursor-pointer bg-transparent' : '', // variant: read only
			!readonly && !isEffectivelyDisabled ? 'bg-level-2' : '' // variant: normal
		)}>
		{#if leading}
			<div class="pl-m text-ink-50 flex shrink-0 items-center">{@render leading()}</div>
		{/if}

		<input
			{...rest}
			type={actualType}
			{placeholder}
			disabled={isEffectivelyDisabled}
			{readonly}
			bind:value
			class={cn(
				'text-ink-90 placeholder:text-ink-50 px-m h-full w-full min-w-0 flex-1 border-none bg-transparent font-semibold outline-none focus:ring-0',
				readonly ? 'pointer-events-none' : '',
				isEffectivelyDisabled ? 'cursor-not-allowed' : ''
			)} />

		<div class="pr-m text-ink-50 flex shrink-0 items-center gap-1">
			{#if type === 'password'}
				<button type="button" tabindex="-1" onclick={togglePassword} disabled={isEffectivelyDisabled} class="hover:text-ink-90 flex items-center transition-colors outline-none disabled:opacity-50">
					<Icon name={showPassword ? 'eye-closed' : 'eye'} class="h-4 w-4" />
				</button>
			{/if}
			{#if trailing}
				{@render trailing()}
			{/if}
		</div>
	</div>

	{#if hasError}
		<span class="font-label-xs text-error mt-0.5 font-medium">{error}</span>
	{/if}
</div>
