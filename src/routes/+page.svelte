<script lang="ts">
	import { formatDate } from '$lib/utils';

	let { data } = $props();
</script>

<svelte:head>
	<title>Challenge Run Community</title>
</svelte:head>

<div class="page-width">

	<!-- Data Pipeline Verification -->
	<section class="scaffold-test">
		<h1>CRC SvelteKit Scaffold</h1>
		<p class="muted">If you see real numbers below, the data pipeline is working.</p>

		<div class="stats-grid">
			<div class="stat-card">
				<span class="stat-card__number">{data.stats.gameCount}</span>
				<span class="stat-card__label">Games</span>
			</div>
			<div class="stat-card">
				<span class="stat-card__number">{data.stats.runnerCount}</span>
				<span class="stat-card__label">Runners</span>
			</div>
			<div class="stat-card">
				<span class="stat-card__number">{data.stats.runCount}</span>
				<span class="stat-card__label">Approved Runs</span>
			</div>
			<div class="stat-card">
				<span class="stat-card__number">{data.stats.achievementCount}</span>
				<span class="stat-card__label">Achievements</span>
			</div>
			<div class="stat-card">
				<span class="stat-card__number">{data.stats.teamCount}</span>
				<span class="stat-card__label">Teams</span>
			</div>
			<div class="stat-card">
				<span class="stat-card__number">{data.stats.postCount}</span>
				<span class="stat-card__label">Posts</span>
			</div>
		</div>
	</section>

	<!-- Games List -->
	<section>
		<h2>Active Games</h2>
		<div class="games-list">
			{#each data.games as game}
				<a href="/games/{game.game_id}" class="game-item">
					<strong>{game.game_name}</strong>
					<span class="muted">
						{game.full_runs?.length ?? 0} categories ·
						{game.platforms?.length ?? 0} platforms
					</span>
				</a>
			{/each}
		</div>
	</section>

	<!-- Recent Runs -->
	{#if data.recentRuns.length > 0}
		<section>
			<h2>Recent Runs</h2>
			<table class="runs-table">
				<thead>
					<tr>
						<th>Runner</th>
						<th>Game</th>
						<th>Category</th>
						<th>Time</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					{#each data.recentRuns as run}
						<tr>
							<td><a href="/runners/{run.runner_id}">{run.runner}</a></td>
							<td>{run.game_id}</td>
							<td>{run.category}</td>
							<td>{run.time_primary}</td>
							<td>{formatDate(run.date_completed)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}

	<!-- Recent Posts -->
	{#if data.posts.length > 0}
		<section>
			<h2>News</h2>
			{#each data.posts as post}
				<article class="post-preview">
					<h3>{post.title}</h3>
					<time class="muted">{formatDate(post.date)}</time>
				</article>
			{/each}
		</section>
	{/if}

	<!-- Environment Info -->
	<section class="scaffold-test">
		<h2>Scaffold Status</h2>
		<ul class="checklist">
			<li class="checklist__item checklist__item--pass">SvelteKit running</li>
			<li class="checklist__item checklist__item--pass">SCSS loading</li>
			<li class="checklist__item {data.stats.gameCount > 0 ? 'checklist__item--pass' : 'checklist__item--fail'}">
				Game data loading ({data.stats.gameCount} games)
			</li>
			<li class="checklist__item {data.stats.runnerCount > 0 ? 'checklist__item--pass' : 'checklist__item--fail'}">
				Runner data loading ({data.stats.runnerCount} runners)
			</li>
			<li class="checklist__item {data.stats.runCount > 0 ? 'checklist__item--pass' : 'checklist__item--fail'}">
				Run data loading ({data.stats.runCount} runs)
			</li>
			<li class="checklist__item {data.stats.postCount > 0 ? 'checklist__item--pass' : 'checklist__item--fail'}">
				Post data loading ({data.stats.postCount} posts)
			</li>
			<li class="checklist__item checklist__item--pending">Header component (Phase 3)</li>
			<li class="checklist__item checklist__item--pending">Footer component (Phase 3)</li>
			<li class="checklist__item checklist__item--pending">Auth flow (Phase 7)</li>
		</ul>
	</section>

</div>

<style>
	section {
		margin: 2rem 0;
	}

	h2 {
		margin-bottom: 1rem;
	}

	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
		gap: 1rem;
		margin: 1.5rem 0;
	}

	.stat-card {
		background: var(--panel, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
		border-radius: 8px;
		padding: 1.25rem;
		text-align: center;
	}

	.stat-card__number {
		display: block;
		font-size: 2rem;
		font-weight: 700;
		color: var(--accent, #3BC36E);
	}

	.stat-card__label {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.85rem;
		opacity: 0.7;
	}

	.games-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.game-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1rem;
		background: var(--panel, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
		border-radius: 6px;
		text-decoration: none;
		color: var(--fg, #fff);
	}

	.game-item:hover {
		border-color: var(--accent, #3BC36E);
	}

	.muted {
		opacity: 0.6;
		font-size: 0.9rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th, td {
		padding: 0.5rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--border, rgba(255, 255, 255, 0.12));
	}

	th {
		font-weight: 600;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		opacity: 0.6;
	}

	td a {
		color: var(--accent, #3BC36E);
		text-decoration: none;
	}

	.post-preview {
		margin-bottom: 1rem;
	}

	.post-preview h3 {
		margin-bottom: 0.25rem;
	}

	/* Scaffold checklist */
	.scaffold-test {
		background: var(--panel, rgba(255, 255, 255, 0.04));
		border: 1px solid var(--border, rgba(255, 255, 255, 0.12));
		border-radius: 8px;
		padding: 1.5rem;
	}

	.checklist {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.checklist__item {
		padding: 0.4rem 0;
		padding-left: 1.75rem;
		position: relative;
	}

	.checklist__item::before {
		position: absolute;
		left: 0;
		font-size: 1.1rem;
	}

	.checklist__item--pass::before {
		content: '✅';
	}

	.checklist__item--fail::before {
		content: '❌';
	}

	.checklist__item--pending::before {
		content: '⏳';
	}
</style>
