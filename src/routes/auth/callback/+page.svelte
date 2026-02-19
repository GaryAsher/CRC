<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { supabase } from '$lib/supabase';
	import { session } from '$stores/auth';

	let status = $state<'loading' | 'success' | 'error'>('loading');
	let errorMessage = $state('');

	/**
	 * After exchanging the OAuth code for tokens client-side, POST
	 * them to our server endpoint so they're set as httpOnly cookies.
	 * This is what hooks.server.ts reads on subsequent requests.
	 */
	async function setServerCookies(accessToken: string, refreshToken: string) {
		const res = await fetch('/auth/callback', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				access_token: accessToken,
				refresh_token: refreshToken
			})
		});
		if (!res.ok) {
			throw new Error('Failed to set session cookies');
		}
	}

	onMount(async () => {
		try {
			// PKCE flow: exchange the code from the URL for a session
			const code = $page.url.searchParams.get('code');

			if (code) {
				const { data, error } = await supabase.auth.exchangeCodeForSession(code);
				if (error) throw error;
				if (!data.session) throw new Error('No session returned');

				// Set httpOnly cookies for server-side auth
				await setServerCookies(
					data.session.access_token,
					data.session.refresh_token
				);

				// Update client-side stores
				session.set(data.session);
				status = 'success';

				const rawRedirect = $page.url.searchParams.get('redirect') || '/';
				// Security: only allow relative paths to prevent open redirect attacks
				const redirectTo = rawRedirect.startsWith('/') && !rawRedirect.startsWith('//') ? rawRedirect : '/';
				setTimeout(() => goto(redirectTo), 500);
				return;
			}

			// Implicit flow fallback: check hash fragment
			const hashParams = new URLSearchParams($page.url.hash.substring(1));
			const accessToken = hashParams.get('access_token');

			if (accessToken) {
				const { data, error } = await supabase.auth.getSession();
				if (error) throw error;

				if (data.session) {
					await setServerCookies(
						data.session.access_token,
						data.session.refresh_token
					);

					session.set(data.session);
				}

				status = 'success';
				setTimeout(() => goto('/'), 500);
				return;
			}

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
