<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { session, user } from '$stores/auth';

	let status = $state<'loading' | 'success' | 'error'>('loading');
	let errorMessage = $state('');

	onMount(async () => {
		try {
			// PKCE flow: exchange the code from the URL for a session
			const code = $page.url.searchParams.get('code');

			if (code) {
				const { data, error } = await supabase.auth.exchangeCodeForSession(code);
				if (error) throw error;

				session.set(data.session);
				user.set(data.session?.user ?? null);
				status = 'success';

				// Redirect to homepage (or where they came from)
				const redirectTo = $page.url.searchParams.get('redirect') || '/';
				setTimeout(() => goto(redirectTo), 500);
				return;
			}

			// Implicit flow fallback: check hash fragment
			const hashParams = new URLSearchParams($page.url.hash.substring(1));
			const accessToken = hashParams.get('access_token');

			if (accessToken) {
				const { data, error } = await supabase.auth.getSession();
				if (error) throw error;

				session.set(data.session);
				user.set(data.session?.user ?? null);
				status = 'success';

				setTimeout(() => goto('/'), 500);
				return;
			}

			// No code or token found
			throw new Error('No authentication code received. Please try signing in again.');
		} catch (err: any) {
			status = 'error';
			errorMessage = err?.message || 'Authentication failed. Please try again.';
			console.error('Auth callback error:', err);
		}
	});
</script>

<svelte:head><title>Signing In... | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<div class="callback-page">
		{#if status === 'loading'}
			<div class="callback-spinner"></div>
			<h2>Signing you in...</h2>
			<p class="muted">Please wait while we complete authentication.</p>
		{:else if status === 'success'}
			<div class="callback-check">✓</div>
			<h2>Welcome!</h2>
			<p class="muted">Redirecting you now...</p>
		{:else}
			<div class="callback-error">✕</div>
			<h2>Sign In Failed</h2>
			<p class="error-message">{errorMessage}</p>
			<a href="/sign-in" class="btn btn--primary">Try Again</a>
		{/if}
	</div>
</div>

<style>
	.callback-page {
		max-width: 400px;
		margin: 4rem auto;
		text-align: center;
	}
	.callback-spinner {
		width: 48px;
		height: 48px;
		border: 4px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		margin: 0 auto 1.5rem;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
	.callback-check {
		width: 48px;
		height: 48px;
		margin: 0 auto 1.5rem;
		background: #22c55e;
		color: #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: bold;
	}
	.callback-error {
		width: 48px;
		height: 48px;
		margin: 0 auto 1.5rem;
		background: #ef4444;
		color: #fff;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.5rem;
		font-weight: bold;
	}
	.error-message {
		color: var(--danger, #ef4444);
		margin-bottom: 1.5rem;
	}
	.btn--primary {
		display: inline-block;
		background: var(--accent);
		color: #fff;
		padding: 0.6rem 1.5rem;
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
	}
	.btn--primary:hover {
		opacity: 0.9;
	}
</style>
