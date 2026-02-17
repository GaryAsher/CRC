<script lang="ts">
	let { data } = $props();
	const game = $derived(data.game);
</script>

<svelte:head><title>Forum - {game.game_name} | CRC</title></svelte:head>

<h2>Forum</h2>
<p class="muted mb-2">Community discussions and announcements for {game.game_name}.</p>

<div class="card">
	<div class="empty-state">
		<span class="empty-state__icon">💬</span>
		<h3>Coming Soon</h3>
		<p class="muted">Forum functionality is being developed.</p>
		<p class="muted">In the meantime, join the community on Discord!</p>
	</div>
</div>

<style>
	h2 { margin: 0 0 0.25rem; }
	.mb-2 { margin-bottom: 1rem; }
	.empty-state { text-align: center; padding: 2rem 1rem; }
	.empty-state__icon { display: block; font-size: 3rem; margin-bottom: 0.75rem; opacity: 0.5; }
	.empty-state h3 { margin: 0 0 0.5rem; }
	.empty-state p { margin: 0; }
</style>
