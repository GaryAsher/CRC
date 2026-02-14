<script lang="ts">
	let { data } = $props();
</script>
<svelte:head><title>Submit Run - {data.game.game_name} | CRC</title></svelte:head>
<h2>Submit a Run</h2>
<p class="muted">Submit your {data.game.game_name} challenge run for review.</p>
<div class="card">
	<p>The full submission form is coming in Phase 8 of the migration.</p>
	<p class="muted">In the meantime, you can submit runs on the <a href="https://www.challengerun.net/games/{data.game.game_id}/submit/">current live site</a>.</p>
</div>
