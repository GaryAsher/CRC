<script lang="ts">
	let { data } = $props();
	const game = $derived(data.game);
</script>

<svelte:head>
	<title>Submit Run - {game.game_name} | CRC</title>
</svelte:head>

<h2>Submit a Run</h2>
<p class="muted mb-2">Submit your {game.game_name} challenge run for review.</p>

<div class="card">
	<div class="empty-state">
		<span class="empty-state__icon">📤</span>
		<h3>Submission Form Coming Soon</h3>
		<p class="muted">The run submission form requires account authentication and is being built as part of the dynamic features phase.</p>
		<p class="muted mt-1">In the meantime, you can submit runs on the <a href="https://www.challengerun.net/games/{game.game_id}/submit/">current live site</a>.</p>
	</div>
</div>

<section class="card">
	<h3>Submission Requirements</h3>
	<ul class="req-list">
		<li><strong>Video proof</strong> — Full unedited recording of the run</li>
		<li><strong>Category</strong> — Select the correct category for your run</li>
		<li><strong>Timer visible</strong> — In-game timer should be shown if applicable</li>
		<li><strong>No cheats or mods</strong> — Unless specifically allowed by category rules</li>
	</ul>
	<p class="muted mt-1">
		Review the full rules on the <a href="/games/{game.game_id}/rules">Rules tab</a> before submitting.
	</p>
</section>

<style>
	h2 { margin: 0 0 0.25rem; }
	h3 { margin: 0 0 0.75rem; }
	.mb-2 { margin-bottom: 1rem; }
	.mt-1 { margin-top: 0.5rem; }
	section { margin-bottom: 1.5rem; }
	.empty-state { text-align: center; padding: 2rem 1rem; }
	.empty-state__icon { display: block; font-size: 3rem; margin-bottom: 0.75rem; opacity: 0.5; }
	.empty-state h3 { margin: 0 0 0.5rem; }
	.empty-state p { margin: 0; max-width: 450px; margin-inline: auto; line-height: 1.5; }
	.empty-state a { color: var(--accent); }
	.req-list { padding-left: 1.5rem; margin: 0; }
	.req-list li { margin-bottom: 0.5rem; line-height: 1.5; }
	section a { color: var(--accent); text-decoration: none; }
	section a:hover { text-decoration: underline; }
</style>
