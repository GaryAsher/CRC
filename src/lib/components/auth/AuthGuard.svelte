<script lang="ts">
	import { session, isLoading } from '$stores/auth';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import type { Snippet } from 'svelte';

	let { children }: { children: Snippet } = $props();

	$effect(() => {
		if (!$isLoading && !$session) {
			goto(`/sign-in?redirect=${encodeURIComponent($page.url.pathname)}`);
		}
	});
</script>

{#if $isLoading}
	<div class="page-width">
		<div class="auth-loading">
			<div class="auth-spinner"></div>
			<p class="muted">Loading...</p>
		</div>
	</div>
{:else if $session}
	{@render children()}
{/if}

<style>
	.auth-loading {
		text-align: center;
		padding: 4rem 0;
	}
	.auth-spinner {
		width: 36px;
		height: 36px;
		border: 3px solid var(--border);
		border-top-color: var(--accent);
		border-radius: 50%;
		margin: 0 auto 1rem;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
