<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="page-width">
	<div class="error-page">
		<div class="error-code">{$page.status}</div>
		<h1>
			{#if $page.status === 404}
				Page Not Found
			{:else if $page.status === 403}
				Access Denied
			{:else if $page.status === 500}
				Server Error
			{:else}
				Something Went Wrong
			{/if}
		</h1>
		<p class="muted">
			{#if $page.status === 404}
				The page you're looking for doesn't exist or may have been moved.
			{:else}
				{$page.error?.message || 'An unexpected error occurred.'}
			{/if}
		</p>
		<div class="error-actions">
			<a href="/" class="btn btn--primary">Go Home</a>
			<a href="/games" class="btn btn--outline">Browse Games</a>
			<a href="/search" class="btn btn--outline">Search</a>
		</div>
	</div>
</div>

<style>
	.error-page {
		max-width: 500px;
		margin: 4rem auto;
		text-align: center;
	}
	.error-code {
		font-size: 6rem;
		font-weight: 800;
		line-height: 1;
		color: var(--accent);
		margin-bottom: 0.5rem;
		opacity: 0.3;
	}
	h1 {
		font-size: 1.75rem;
		margin-bottom: 0.5rem;
	}
	.error-actions {
		display: flex;
		gap: 0.75rem;
		justify-content: center;
		margin-top: 2rem;
		flex-wrap: wrap;
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
	.btn--primary:hover { opacity: 0.9; }
	.btn--outline {
		display: inline-block;
		padding: 0.6rem 1.5rem;
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--fg);
		text-decoration: none;
	}
	.btn--outline:hover { border-color: var(--accent); color: var(--accent); }
</style>
