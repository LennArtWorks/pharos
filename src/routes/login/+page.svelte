<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="card">
	<h2>Login</h2>

	{#if form?.error}
		<p class="text-red-500">{form.error}</p>
	{/if}

	{#if form?.step !== 'verify'}
		<form method="POST" action="?/requestOtp" use:enhance>
			<input type="email" name="email" placeholder="name@mail.com" required value={form?.email || ''} />
			<button type="submit">request OTP</button>
		</form>
	{:else}
		<p>{form.message}</p>
		<form method="POST" action="?/verifyOtp" use:enhance>
			<input type="hidden" name="email" value={form.email} />
			<input type="text" name="otp" placeholder="One Time Password" required />
			<button type="submit">login</button>
		</form>
	{/if}
</div>
