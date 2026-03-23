<script lang="ts">
	import Form from '$lib/components/layout/Form.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { form } = $props();

	let email = $state(form?.email || '');
	let otp = $state('');

	// Local state to manage navigation backwards without losing the email
	let currentStep = $state('request');

	// Sync local state with server response when it arrives
	$effect(() => {
		if (form?.step) currentStep = form.step;
	});

	function goBack() {
		currentStep = 'request';
	}
</script>

<div class="login-page bg-level-0 flex h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat">
	<main class="bg-level-1 border-border flex w-full max-w-[420px] flex-col gap-6 rounded-xl border p-10 shadow-sm">
		<h1 class="text-ink-90 text-4xl font-bold">
			{currentStep === 'create' ? 'Create Account' : 'Login'}
		</h1>

		{#if currentStep === 'request'}
			<Form method="POST" action="?/requestOtp" enhance={true} error={form?.error} class="!max-w-full">
				<Input type="email" name="email" placeholder="E-Mail" required={true} bind:value={email}>
					{#snippet leading()}
						<Icon name="person" />
					{/snippet}
				</Input>

				<Button variant="primary" type="submit" class="w-full justify-center  text-center">request OTP</Button>

				<div class=" flex flex-col gap-4">
					<Button variant="tertiary" size="sm" class="w-fit justify-start">create account</Button>
				</div>
			</Form>
		{/if}

		{#if currentStep === 'verify'}
			<Form method="POST" action="?/verifyOtp" enhance={true} error={form?.error} class="!max-w-full">
				<Input type="email" name="email" readonly={true} onclick={goBack} bind:value={email}>
					{#snippet leading()}
						<Icon name="person" />
					{/snippet}
				</Input>

				<Input type="text" name="otp" placeholder="One Time Password" required={true} bind:value={otp}>
					{#snippet leading()}
						<Icon name="key" />
					{/snippet}
				</Input>

				<p class="text-ink-90 font-label-m mt-2">Enter the One Time Password from your authenticator app.</p>

				<label class="font-label-m text-ink-90 mt-2 flex cursor-pointer items-center gap-2">
					<input type="checkbox" name="remember" class="border-border text-ink-90 focus:ring-ink-90 h-5 w-5 rounded bg-transparent transition-colors" />
					Stay logged in for 30 days
				</label>

				<Button variant="primary" size="l" type="submit" class="mt-2 w-full justify-center">login</Button>

				<div class="mt-4 flex flex-col gap-4">
					<Button variant="tertiary" onclick={goBack} class="w-fit justify-start p-0">back</Button>
				</div>
			</Form>
		{/if}

		{#if currentStep === 'create'}
			<Form method="POST" action="?/verifyOtp" enhance={true} error={form?.error} class="!max-w-full">
				<p class="text-ink-90 font-label-m mb-2">Account not found. Please create an account.</p>

				<Input type="email" name="email" readonly={true} onclick={goBack} bind:value={email}>
					{#snippet leading()}
						<Icon name="person" />
					{/snippet}
				</Input>

				<p class="text-ink-90 font-label-m mt-4">Scan this QR code or enter the setup key manually in your authenticator app.</p>

				<div class="border-border bg-level-0 rounded-m flex h-48 w-full items-center justify-center border">
					<Icon name="qr-code" class="text-ink-50 h-32 w-32" />
				</div>

				<div class="font-label-m text-ink-90 mt-2 flex flex-col gap-1">
					<span class="font-bold">Setup key:</span>
					<div class="flex items-center gap-2">
						<span class="font-mono break-all">FKOLEMVZTZOXDSNEGN2U7ADHCAN6FVP</span>
						<button type="button" class="hover:text-ink-50 transition-colors">
							<Icon name="copy" class="h-5 w-5" />
						</button>
					</div>
				</div>

				<Input type="text" name="otp" placeholder="One Time Password" required={true} bind:value={otp} class="mt-2">
					{#snippet leading()}
						<Icon name="key" />
					{/snippet}
				</Input>

				<label class="font-label-m text-ink-90 mt-2 flex cursor-pointer items-center gap-2">
					<input type="checkbox" name="remember" class="border-border text-ink-90 focus:ring-ink-90 h-5 w-5 rounded bg-transparent transition-colors" />
					Stay logged in for 30 days
				</label>

				<Button variant="primary" type="submit" class="mt-2 w-full">login</Button>

				<div class="mt-4 flex flex-col gap-4">
					<Button variant="tertiary" onclick={goBack} class="w-fit justify-start">back</Button>
				</div>
			</Form>
		{/if}

		<div class="mt-6 flex flex-col gap-4 pt-4">
			<Button variant="tertiary" size="s" href="/" class="w-fit justify-start">move on as guest</Button>
			<Button variant="tertiary" size="s" href="/" class="w-fit justify-start">
				<Icon name="arrow-left" class="-ml-xs" />back to public page
			</Button>
		</div>
	</main>
</div>
