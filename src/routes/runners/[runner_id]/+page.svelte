<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils';
	import { renderMarkdown } from '$lib/utils/markdown';

	let { data } = $props();
	const runner = $derived(data.runner);
	const socials = $derived(runner.socials || {});
</script>

<svelte:head>
	<title>{runner.runner_name} | Challenge Run Community</title>
</svelte:head>

<div class="page-width">
	<p class="muted page-back"><a href="/runners">← Runners</a></p>

	<!-- Profile Header -->
	<div class="profile-header" style={runner.accent_color ? `--runner-accent: ${runner.accent_color}` : ''}>
		<img
			class="profile-header__avatar"
			src={runner.avatar || '/img/site/default-runner.png'}
			alt={runner.runner_name}
		/>
		<div class="profile-header__info">
			<h1>{runner.runner_name}</h1>
			{#if runner.pronouns}
				<span class="profile-header__pronouns muted">{runner.pronouns}</span>
			{/if}
			{#if runner.location}
				<span class="muted">📍 {runner.location}</span>
			{/if}
			<span class="muted">Joined {formatDate(runner.joined_date)}</span>
		</div>
	</div>

	<!-- Social Links -->
	{#if Object.values(socials).some(Boolean)}
		<div class="profile-socials">
			{#if socials.twitch}<a href="https://twitch.tv/{socials.twitch}" target="_blank" rel="noopener" class="btn btn--small btn--outline">Twitch</a>{/if}
			{#if socials.youtube}<a href="https://youtube.com/@{socials.youtube}" target="_blank" rel="noopener" class="btn btn--small btn--outline">YouTube</a>{/if}
			{#if socials.twitter}<a href="https://twitter.com/{socials.twitter}" target="_blank" rel="noopener" class="btn btn--small btn--outline">Twitter</a>{/if}
			{#if socials.discord}<span class="btn btn--small btn--outline">Discord: {socials.discord}</span>{/if}
			{#if socials.speedruncom}<a href="https://speedrun.com/user/{socials.speedruncom}" target="_blank" rel="noopener" class="btn btn--small btn--outline">Speedrun.com</a>{/if}
		</div>
	{/if}

	<!-- Bio -->
	{#if runner.bio || runner.content}
		<section class="profile-bio">
			{@html renderMarkdown(runner.content || runner.bio || '')}
		</section>
	{/if}

	<!-- Stats Summary -->
	<div class="profile-stats">
		<div class="stat-card">
			<span class="stat-card__number">{data.runs.length}</span>
			<span class="stat-card__label">Runs</span>
		</div>
		<div class="stat-card">
			<span class="stat-card__number">{data.gameGroups.length}</span>
			<span class="stat-card__label">Games</span>
		</div>
		<div class="stat-card">
			<span class="stat-card__number">{data.achievements.length}</span>
			<span class="stat-card__label">Achievements</span>
		</div>
	</div>

	<!-- Runs by Game -->
	{#each data.gameGroups as { game, runs }}
		<section class="profile-game-section">
			<h2>
				<a href="/games/{game.game_id}">{game.game_name}</a>
				<span class="muted">({runs.length} runs)</span>
			</h2>
			<table class="runs-table">
				<thead>
					<tr>
						<th>Category</th>
						<th>Challenges</th>
						<th>Time</th>
						<th>Date</th>
						<th>Video</th>
					</tr>
				</thead>
				<tbody>
					{#each runs as run}
						<tr>
							<td>{run.category}</td>
							<td>
								{#each run.standard_challenges || [] as ch}
									<span class="tag tag--small">{ch}</span>
								{/each}
							</td>
							<td>{formatTime(run.time_primary)}</td>
							<td>{formatDate(run.date_completed)}</td>
							<td>
								{#if run.video_url}
									<a href={run.video_url} target="_blank" rel="noopener">Watch</a>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/each}

	{#if data.runs.length === 0}
		<div class="card" style="margin-top: 1rem;">
			<p class="muted">No approved runs yet.</p>
		</div>
	{/if}
</div>

<style>
	.page-back { margin: 1rem 0 0.5rem; }
	.page-back a { color: var(--text-muted); text-decoration: none; }
	.page-back a:hover { color: var(--fg); }
	.profile-header {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		margin-bottom: 1.5rem;
	}
	.profile-header__avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		object-fit: cover;
		border: 3px solid var(--runner-accent, var(--accent));
	}
	.profile-header__info {
		display: flex;
		flex-direction: column;
		gap: 0.2rem;
	}
	.profile-header__info h1 { margin: 0; }
	.profile-socials {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
	}
	.profile-bio { margin-bottom: 1.5rem; }
	.profile-stats {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
		gap: 0.75rem;
		margin-bottom: 2rem;
	}
	.stat-card {
		background: var(--panel);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1rem;
		text-align: center;
	}
	.stat-card__number {
		display: block;
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--accent);
	}
	.stat-card__label {
		display: block;
		font-size: 0.8rem;
		opacity: 0.6;
	}
	.profile-game-section { margin-bottom: 2rem; }
	.profile-game-section h2 { margin-bottom: 0.75rem; }
	.profile-game-section h2 a { color: var(--fg); text-decoration: none; }
	.profile-game-section h2 a:hover { color: var(--accent); }
	.profile-game-section h2 .muted { font-size: 0.85rem; font-weight: 400; }
	table { width: 100%; border-collapse: collapse; }
	th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
	th { font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; }
	td a { color: var(--accent); text-decoration: none; }
</style>
