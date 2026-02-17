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
				setTimeout(() => goto(redirectTo), 1500);
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

				setTimeout(() => goto('/'), 1500);
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
	<div class="auth-callback">
		<div class="auth-callback__content">
			{#if status === 'loading'}
				<div class="auth-callback__spinner">
					<div class="spinner spinner--large"></div>
				</div>
				<h1 class="auth-callback__title">Signing you in...</h1>
				<p class="auth-callback__message muted">Please wait while we complete the sign-in process.</p>

			{:else if status === 'success'}
				<div class="auth-callback__spinner">
					<span style="font-size: 3rem;">✓</span>
				</div>
				<h1 class="auth-callback__title">Success!</h1>
				<p class="auth-callback__message muted">Redirecting you now...</p>

			{:else}
				<h1 class="auth-callback__title">Sign-in Failed</h1>
				<div class="auth-callback__error">
					<p>{errorMessage}</p>
				</div>
				<div class="auth-callback__actions">
					<a href="/sign-in" class="btn btn--primary">Try Again</a>
					<a href="/" class="btn">Go Home</a>
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.auth-callback {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
	}
	.auth-callback__content {
		max-width: 400px;
		padding: 2rem;
	}
	.auth-callback__spinner {
		margin-bottom: 1.5rem;
	}
	.spinner--large {
		width: 48px;
		height: 48px;
		border-width: 4px;
	}
	.auth-callback__title {
		margin-bottom: 0.5rem;
	}
	.auth-callback__message {
		margin-bottom: 1rem;
	}
	.auth-callback__error {
		color: var(--danger, #dc3545);
		background: var(--danger-bg, rgba(220, 53, 69, 0.1));
		padding: 1rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}
	.auth-callback__error p { margin: 0; }
	.auth-callback__actions {
		margin-top: 1.5rem;
		display: flex;
		gap: 1rem;
		justify-content: center;
		flex-wrap: wrap;
	}
</style>
