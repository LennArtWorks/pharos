<script lang="ts">
	import Form from '$lib/components/layout/Form.svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Input from '$lib/components/ui/Input.svelte';
	import { dev } from '$app/environment';
	import FloatingNav, { type NavSection } from '$lib/components/layout/FloatingNav.svelte';

	let { form } = $props();

	let email = $state(form?.email || '');
	let otp = $state('');

	// Steps: 'request' | 'verify_email' | 'challenge_totp' | 'setup_2fa'
	let currentStep = $state('request');
	let isLoading = $state(false);

	// Safely sync state with server response
	$effect(() => {
		if (form?.step) currentStep = form.step;
		if (form?.email) email = form.email;
	});

	function goBack() {
		currentStep = 'request';
		otp = '';
		isLoading = false;
	}

	// Custom enhance function to handle loading states
	function withLoading() {
		isLoading = true;
		return async ({ update }: any) => {
			await update();
			isLoading = false;
		};
	}

	// ##############################
	//	 Floating Nav for Dev Views
	// ##############################

	let devSections: NavSection[] = $derived([
		{
			title: 'Dev Controls',
			items: [
				{ label: '1. Request', active: currentStep === 'request', onclick: () => (currentStep = 'request') },
				{ label: '2. Verify Email', active: currentStep === 'verify_email', onclick: () => (currentStep = 'verify_email') },
				{ label: '3. Challenge TOTP', active: currentStep === 'challenge_totp', onclick: () => (currentStep = 'challenge_totp') },
				{
					label: '4. Setup 2FA',
					active: currentStep === 'setup_2fa',
					onclick: () => {
						currentStep = 'setup_2fa';
						form = {
							success: true,
							step: 'setup_2fa',
							email: 'dev@test.com',
							qrCodeUrl: 'https://google.com',
							setupKey: 'MOCKSETUPKEY123'
						};
						email = 'dev@test.com';
					}
				}
			]
		}
	]);
</script>

<div class="login-page bg-level-0 flex h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat">
	{#if dev}
		<div class="fixed top-1/2 left-4 z-50 -translate-y-1/2">
			<FloatingNav sections={devSections} />
		</div>
	{/if}

	<main class="bg-level-1 border-border flex w-full max-w-105 flex-col gap-6 rounded-xl border p-10 shadow-sm">
		<h1 class="text-ink-90 text-2xl font-bold">
			{#if currentStep === 'setup_2fa'}
				Create Account
			{:else if currentStep === 'verify_email'}
				Verify Email
			{:else}
				Login
			{/if}
		</h1>

		{#if currentStep === 'request'}
			<Form method="POST" action="?/discover" enhance={withLoading} error={form?.error} class="max-w-full!">
				<Input type="email" name="email" placeholder="E-Mail" required={true} bind:value={email} disabled={isLoading}>
					{#snippet leading()}
						<Icon name="person" />
					{/snippet}
				</Input>

				<Button variant="primary" type="submit" disabled={isLoading} class="w-full justify-center text-center">
					{isLoading ? 'processing...' : 'request OTP'}
				</Button>

				<div class="flex flex-col gap-4">
					<Button variant="tertiary" size="sm" class="w-fit justify-start" disabled={isLoading}>create account</Button>
				</div>
			</Form>
		{/if}

		{#if currentStep === 'verify_email'}
			<Form method="POST" action="?/verifyEmail" enhance={withLoading} error={form?.error} class="!max-w-full">
				<input type="hidden" name="email" value={email} />

				<Input type="email" readonly={true} onclick={goBack} bind:value={email} disabled={isLoading}>
					{#snippet leading()}
						<Icon name="person" />
					{/snippet}
				</Input>

				<p class="text-ink-90 font-label-m mt-2">We sent a 6-digit code to your email.</p>

				<Input type="text" name="otp" placeholder="Email Code" required={true} bind:value={otp} disabled={isLoading}>
					{#snippet leading()}
						<Icon name="mail" />
					{/snippet}
				</Input>

				<Button variant="primary" size="l" type="submit" disabled={isLoading} class="mt-2 w-full justify-center">
					{isLoading ? 'verifying...' : 'verify email'}
				</Button>

				<div class="mt-4 flex flex-col gap-4">
					<Button variant="tertiary" onclick={goBack} disabled={isLoading} class="w-fit justify-start p-0">back</Button>
				</div>
			</Form>
		{/if}

		{#if currentStep === 'challenge_totp'}
			<Form method="POST" action="?/challengeTotp" enhance={withLoading} error={form?.error} class="!max-w-full">
				<input type="hidden" name="email" value={email} />

				<Input type="email" readonly={true} onclick={goBack} bind:value={email} disabled={isLoading}>
					{#snippet leading()}
						<Icon name="person" />
					{/snippet}
				</Input>

				<p class="text-ink-90 font-label-m mt-2">Enter the One Time Password from your authenticator app.</p>

				<Input type="text" name="otp" placeholder="One Time Password" required={true} bind:value={otp} disabled={isLoading}>
					{#snippet leading()}
						<Icon name="key" />
					{/snippet}
				</Input>

				<label class="font-label-m text-ink-90 mt-2 flex cursor-pointer items-center gap-2">
					<input type="checkbox" name="remember" class="border-border text-ink-90 focus:ring-ink-90 h-5 w-5 rounded bg-transparent transition-colors" />
					Stay logged in for 30 days
				</label>

				<Button variant="primary" size="l" type="submit" disabled={isLoading} class="mt-2 w-full justify-center">
					{isLoading ? 'logging in...' : 'login'}
				</Button>

				<div class="mt-4 flex flex-col gap-4">
					<Button variant="tertiary" onclick={goBack} disabled={isLoading} class="w-fit justify-start p-0">back</Button>
				</div>
			</Form>
		{/if}

		{#if currentStep === 'setup_2fa'}
			<Form method="POST" action="?/finalizeSignup" enhance={withLoading} error={form?.error} class="!max-w-full">
				<p class="text-ink-90 font-label-m mb-2">Account not found. Please create an account.</p>

				<input type="hidden" name="email" value={email} />
				<Input type="email" readonly={true} onclick={goBack} bind:value={email} disabled={isLoading}>
					{#snippet leading()}
						<Icon name="person" />
					{/snippet}
				</Input>

				<p class="text-ink-90 font-label-m mt-4">Scan this QR code or enter the setup key manually in your authenticator app.</p>

				<div class="border-border bg-level-0 rounded-m flex h-48 w-full items-center justify-center overflow-hidden border">
					{#if form?.qrCodeUrl}
						<img src={form.qrCodeUrl} alt="QR Code" class="h-full w-full object-contain p-4 mix-blend-multiply" />
					{:else}
						<Icon name="qr-code" class="text-ink-50 h-32 w-32" />
					{/if}
				</div>

				<div class="font-label-m text-ink-90 mt-2 flex flex-col gap-1">
					<span class="font-bold">Setup key:</span>
					<div class="flex items-center gap-2">
						<span class="font-mono break-all">{form?.setupKey || 'Generating...'}</span>
						<button type="button" class="hover:text-ink-50 transition-colors">
							<Icon name="copy" class="h-5 w-5" />
						</button>
					</div>
				</div>

				<Input type="text" name="totpCode" placeholder="One Time Password" bind:value={otp} disabled={isLoading} class="mt-2">
					{#snippet leading()}
						<Icon name="key" />
					{/snippet}
				</Input>

				<label class="font-label-m text-ink-90 mt-2 flex cursor-pointer items-center gap-2">
					<input type="checkbox" name="remember" class="border-border text-ink-90 focus:ring-ink-90 h-5 w-5 rounded bg-transparent transition-colors" />
					Stay logged in for 30 days
				</label>

				<div class="mt-2 flex flex-col gap-2">
					<Button variant="primary" type="submit" name="actionType" value="setup" disabled={isLoading} class="w-full justify-center">
						{isLoading ? 'processing...' : 'login'}
					</Button>
					<Button variant="template" type="submit" name="actionType" value="skip" disabled={isLoading} class="w-full justify-center">Skip for now</Button>
				</div>

				<div class="mt-4 flex flex-col gap-4">
					<Button variant="tertiary" onclick={goBack} disabled={isLoading} class="w-fit justify-start p-0">back</Button>
				</div>
			</Form>
		{/if}

		<div class="border-border mt-6 flex flex-col gap-4 border-t pt-4">
			<Button variant="tertiary" size="sm" href="/files" class="w-fit justify-start">move on as guest</Button>
			<Button variant="tertiary" size="sm" href="/" class="w-fit justify-start">
				<Icon name="arrow-left" class="-ml-xs" />back to public page
			</Button>
		</div>
	</main>
</div>
