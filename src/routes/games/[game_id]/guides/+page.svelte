<script lang="ts">
	let { data } = $props();
	const game = $derived(data.game);
</script>

<svelte:head>
	<title>{game.game_name} - Guides | CRC</title>
</svelte:head>

<h2>Guides</h2>
<p class="muted mb-2">Strategy guides and tutorials for {game.game_name}.</p>

<div class="card">
	<div class="empty-state">
		<span class="empty-state__icon">📖</span>
		<h3>Coming Soon</h3>
		<p class="muted">Community guides and strategy resources will be available here.</p>
		<p class="muted mt-1">In the meantime, check the <a href="/games/{game.game_id}/rules">Rules</a> and <a href="/games/{game.game_id}/resources">Resources</a> tabs.</p>
	</div>
</div>

<style>
	h2 { margin: 0 0 0.25rem; }
	.mb-2 { margin-bottom: 1rem; }
	.mt-1 { margin-top: 0.5rem; }
	.empty-state { text-align: center; padding: 3rem 1rem; }
	.empty-state__icon { display: block; font-size: 3rem; margin-bottom: 0.75rem; opacity: 0.5; }
	.empty-state h3 { margin: 0 0 0.5rem; }
	.empty-state p { margin: 0; max-width: 400px; margin-inline: auto; line-height: 1.5; }
	.empty-state a { color: var(--accent); text-decoration: none; }
	.empty-state a:hover { text-decoration: underline; }
</style>
