<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils';
	import { renderMarkdown } from '$lib/utils/markdown';

	let { data } = $props();
	const runner = $derived(data.runner);
	const socials = $derived(runner.socials || {});
	const accent = $derived(runner.accent_color || 'var(--accent)');

	// ── Tabs ────────────────────────────────────────────────
	let activeTab = $state<'runs' | 'achievements' | 'contributions' | 'activity'>('runs');

	// ── Game detail drill-down ──────────────────────────────
	let selectedGameId = $state<string | null>(null);
	const selectedGroup = $derived(
		selectedGameId ? data.gameGroups.find((g) => g.game.game_id === selectedGameId) : null
	);

	function videoSource(url: string): string {
		if (!url) return 'Video';
		if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
		if (url.includes('twitch.tv')) return 'Twitch';
		if (url.includes('bilibili.com')) return 'Bilibili';
		return 'Video';
	}
</script>

<svelte:head>
	<title>{runner.runner_name} | Challenge Run Community</title>
</svelte:head>

<div class="page-width">
	<p class="muted page-back"><a href="/runners">← Runners</a></p>

	<!-- ═══ Banner ═══════════════════════════════════════════ -->
	<div class="runner-banner" style="--accent-c: {accent}">
		{#if runner.banner}
			<div class="runner-banner__img" style="background-image: url('{runner.banner}')"></div>
		{:else}
			<div class="runner-banner__img runner-banner__img--accent"></div>
		{/if}
		<div class="runner-banner__fade"></div>
	</div>

	<!-- ═══ Profile Header ══════════════════════════════════ -->
	<section class="runner-top">
		<div class="runner-left">
			<img
				class="runner-avatar"
				src={runner.avatar || '/assets/img/site/default-runner.png'}
				alt={runner.runner_name}
				style="border-color: {accent}"
			/>
			<div class="runner-name">
				<h1>
					{runner.runner_name}
					{#if runner.pronouns}<span class="runner-pronouns">({runner.pronouns})</span>{/if}
				</h1>
				{#if runner.location}
					<p class="runner-location muted">📍 {runner.location}</p>
				{/if}
				{#if runner.status}
					<p class="muted runner-status">{runner.status}</p>
				{/if}
				<div class="runner-meta-line">
					{#if runner.joined_date}
						<span class="runner-joined muted">🗓️ Member since {formatDate(runner.joined_date)}</span>
					{/if}
					{#if data.teams.length > 0}
						<span class="runner-team-badges">
							{#each data.teams as team}
								<a href="/teams/{team.team_id}" class="runner-team-badge" title={team.name}>
									{#if team.logo}<img src={team.logo} alt="" class="runner-team-badge__logo" />{/if}
									<span>{team.name}</span>
								</a>
							{/each}
						</span>
					{/if}
				</div>
			</div>
		</div>

		<!-- Social Links -->
		{#if Object.values(socials).some(Boolean)}
			<div class="runner-links">
				{#if socials.twitch}<a href={socials.twitch} target="_blank" rel="noopener" class="runner-link" title="Twitch">Twitch</a>{/if}
				{#if socials.youtube}<a href={socials.youtube} target="_blank" rel="noopener" class="runner-link" title="YouTube">YouTube</a>{/if}
				{#if socials.twitter}<a href={socials.twitter} target="_blank" rel="noopener" class="runner-link" title="X">X</a>{/if}
				{#if socials.bluesky}<a href={socials.bluesky} target="_blank" rel="noopener" class="runner-link" title="Bluesky">Bluesky</a>{/if}
				{#if socials.discord}<span class="runner-link" title="Discord">Discord: {socials.discord}</span>{/if}
				{#if socials.steam}<a href={socials.steam} target="_blank" rel="noopener" class="runner-link" title="Steam">Steam</a>{/if}
				{#if socials.speedruncom}<a href={socials.speedruncom} target="_blank" rel="noopener" class="runner-link" title="SRC">SRC</a>{/if}
			</div>
		{/if}
	</section>

	<!-- ═══ Bio ══════════════════════════════════════════════ -->
	{#if runner.bio || runner.content}
		<section class="runner-bio card">
			<h2>About</h2>
			<div class="bio-content">{@html renderMarkdown(runner.content || runner.bio || '')}</div>
		</section>
	{/if}

	<!-- ═══ Tabs Navigation ═════════════════════════════════ -->
	<nav class="runner-tabs">
		<button class="tab" class:active={activeTab === 'runs'} onclick={() => activeTab = 'runs'}>Run Statistics</button>
		<button class="tab" class:active={activeTab === 'achievements'} onclick={() => activeTab = 'achievements'}>Achievements</button>
		<button class="tab" class:active={activeTab === 'contributions'} onclick={() => activeTab = 'contributions'}>Contributions</button>
		<button class="tab" class:active={activeTab === 'activity'} onclick={() => activeTab = 'activity'}>Activity</button>
	</nav>

	<!-- ═══ RUNS TAB ════════════════════════════════════════ -->
	{#if activeTab === 'runs'}
		<!-- Stats Card -->
		<div class="runner-stats-card">
			<div class="runner-stat">
				<span class="runner-stat__value">{data.stats.gamesCount}</span>
				<span class="runner-stat__label">Game{data.stats.gamesCount === 1 ? '' : 's'}</span>
			</div>
			<div class="runner-stat">
				<span class="runner-stat__value">{data.stats.fullRunCount}</span>
				<span class="runner-stat__label">Full Run{data.stats.fullRunCount === 1 ? '' : 's'}</span>
			</div>
			<div class="runner-stat">
				<span class="runner-stat__value">{data.stats.miniRunCount}</span>
				<span class="runner-stat__label">Mini{data.stats.miniRunCount === 1 ? '' : 's'}</span>
			</div>
			<div class="runner-stat runner-stat--total">
				<span class="runner-stat__value">{data.stats.totalRuns}</span>
				<span class="runner-stat__label">Total</span>
			</div>
		</div>

		<!-- Fun Stats -->
		{#if data.stats.totalRuns > 0}
			<div class="runner-fun-stats">
				{#if data.stats.mostPlayedGame}
					<div class="fun-stat">
						<span class="fun-stat__icon">🎮</span>
						<div class="fun-stat__content">
							<span class="fun-stat__label">Most Played</span>
							<a href="/games/{data.stats.mostPlayedGame.game_id}" class="fun-stat__value">{data.stats.mostPlayedGame.game_name}</a>
							<span class="fun-stat__detail">{data.stats.mostPlayedGame.count} run{data.stats.mostPlayedGame.count === 1 ? '' : 's'}</span>
						</div>
					</div>
				{/if}
				{#if data.stats.topGenres.length > 0}
					<div class="fun-stat">
						<span class="fun-stat__icon">🏷️</span>
						<div class="fun-stat__content">
							<span class="fun-stat__label">Top Genres</span>
							<div class="fun-stat__genres">
								{#each data.stats.topGenres as genre}
									<span class="genre-pill">{genre}</span>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>
		{/if}

		<!-- Game Cards Grid / Detail View -->
		{#if data.runs.length === 0}
			<div class="card"><p class="muted">No runs have been added yet.</p></div>
		{:else if selectedGroup}
			<!-- Single game detail view -->
			<div class="card runs-detail-header">
				<button class="btn btn--small btn--outline" onclick={() => selectedGameId = null}>← All Games</button>
				<div class="runs-detail-game">
					{#if selectedGroup.game.cover}
						<div class="runs-detail-game__cover" style="background-image: url('{selectedGroup.game.cover}')"></div>
					{/if}
					<div>
						<h2><a href="/games/{selectedGroup.game.game_id}">{selectedGroup.game.game_name}</a></h2>
						<p class="muted">{selectedGroup.runs.length} run{selectedGroup.runs.length === 1 ? '' : 's'}</p>
					</div>
				</div>
			</div>

			<div class="table-wrap">
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
						{#each selectedGroup.runs as run}
							<tr>
								<td data-label="Category">{run.category || run.category_slug}</td>
								<td data-label="Challenges">
									{#if run.standard_challenges?.length}
										<div class="cell-tags">
											{#each run.standard_challenges as ch}
												<span class="tag">{ch}</span>
											{/each}
										</div>
									{:else}—{/if}
								</td>
								<td data-label="Time">{formatTime(run.time_primary)}</td>
								<td data-label="Date">{formatDate(run.date_completed)}</td>
								<td data-label="Video">
									{#if run.video_url}
										<a href={run.video_url} target="_blank" rel="noopener">{videoSource(run.video_url)}</a>
									{:else}—{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<!-- Games grid -->
			<div class="runner-games-grid">
				{#each data.gameGroups as { game, runs: gameRuns }}
					{@const bestRun = gameRuns.reduce((best, r) => {
						if (!best || (r.time_primary && r.time_primary < (best.time_primary || 'zzz'))) return r;
						return best;
					}, null as (typeof gameRuns)[0] | null)}
					<button class="runner-game-card card-lift" onclick={() => selectedGameId = game.game_id}>
						<div class="runner-game-card__bg" style="background-image: url('{game.cover || '/assets/img/site/default-game.jpg'}')"></div>
						<div class="runner-game-card__overlay">
							<div class="runner-game-card__title">{game.game_name}</div>
							<div class="runner-game-card__stats">
								<span class="runner-game-card__count">{gameRuns.length} run{gameRuns.length === 1 ? '' : 's'}</span>
								{#if bestRun?.time_primary}
									<span class="runner-game-card__best">Best: {bestRun.time_primary}</span>
								{/if}
							</div>
						</div>
					</button>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- ═══ ACHIEVEMENTS TAB ════════════════════════════════ -->
	{#if activeTab === 'achievements'}
		<div class="card">
			<h2>🏅 Community Achievements</h2>
			<p class="muted mb-1">Verified achievements from game communities.</p>

			{#if data.achievements.length > 0}
				<div class="community-achievements-list">
					{#each data.achievements as ach}
						<div class="community-achievement-item">
							<div class="community-achievement-item__icon">{ach.icon}</div>
							<div class="community-achievement-item__content">
								<div class="community-achievement-item__header">
									<h4>{ach.title}</h4>
									{#if ach.difficulty}
										<span class="difficulty difficulty--{ach.difficulty}">{ach.difficulty}</span>
									{/if}
								</div>
								{#if ach.description}<p class="muted">{ach.description}</p>{/if}
								<div class="community-achievement-item__meta">
									<a href="/games/{ach.gameId}">{ach.gameName}</a>
									<span class="muted">•</span>
									<span class="muted">{formatDate(ach.date_completed)}</span>
									<span class="muted">•</span>
									<span class="verified-badge">✓ Verified</span>
								</div>
							</div>
							{#if ach.proof_url}
								<a href={ach.proof_url} target="_blank" rel="noopener" class="btn btn--small">▶ Proof</a>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<p class="muted">No community achievements completed yet.</p>
			{/if}
		</div>
	{/if}

	<!-- ═══ CONTRIBUTIONS TAB ═══════════════════════════════ -->
	{#if activeTab === 'contributions'}
		<!-- Game Page Credits -->
		{#if data.credits.length > 0}
			<div class="card">
				<h2>📋 Game Page Credits</h2>
				<p class="muted mb-1">Games where this runner is credited.</p>
				<div class="credits-grid">
					{#each data.credits as credit}
						<a href="/games/{credit.gameId}" class="credit-game-card">
							<div class="credit-game-card__bg" style="background-image: url('{credit.cover || '/assets/img/site/default-game.jpg'}')"></div>
							<div class="credit-game-card__overlay">
								<span class="credit-game-card__name">{credit.gameName}</span>
								<span class="credit-game-card__role">{credit.role}</span>
							</div>
						</a>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Run Verifications -->
		<div class="card">
			<h2>✅ Run Verifications</h2>
			{#if data.verifiedCount > 0}
				<p>Verified <strong>{data.verifiedCount}</strong> run{data.verifiedCount === 1 ? '' : 's'}</p>
			{:else}
				<p class="muted">No verifications yet.</p>
			{/if}
		</div>

		<!-- Player-Made Challenges -->
		<div class="card">
			<h2>🎨 Player-Made Challenges</h2>
			<p class="muted mb-1">Custom challenge rulesets designed by this runner.</p>
			{#if data.playerMadeChallenges.length > 0}
				<div class="player-made-list">
					{#each data.playerMadeChallenges as pm}
						<div class="player-made-item">
							<span class="player-made-item__icon">🎨</span>
							<div>
								<h4>{pm.label}</h4>
								<a href="/games/{pm.gameId}" class="muted">{pm.gameName}</a>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="muted">No player-made challenges yet.</p>
			{/if}
		</div>
	{/if}

	<!-- ═══ ACTIVITY TAB ════════════════════════════════════ -->
	{#if activeTab === 'activity'}
		<div class="card">
			<h2>📅 Activity Timeline</h2>
			<p class="muted mb-1">Recent challenge run activity.</p>
		</div>

		{#if data.timeline.length > 0}
			<div class="activity-timeline">
				{#each data.activity-timeline as item}
					<div class="timeline-item">
						<div class="timeline-item__dot" class:timeline-item__dot--achievement={item.type === 'achievement'}></div>
						<div class="timeline-item__content">
							<div class="timeline-item__header">
								<span class="timeline-item__icon">{item.type === 'run' ? '🏃' : '🏅'}</span>
								{#if item.type === 'run'}
									<span>Completed <strong>{item.detail}</strong> in <a href="/games/{item.gameId}">{item.gameName}</a></span>
									{#if item.extra}<span class="timeline-item__time">{item.extra}</span>{/if}
								{:else}
									<span>Earned <strong>{item.detail}</strong> in <a href="/games/{item.gameId}">{item.gameName}</a></span>
								{/if}
							</div>
							<span class="timeline-item__date muted">{formatDate(item.date)}</span>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="card"><p class="muted">No activity recorded yet.</p></div>
		{/if}
	{/if}
</div>

<style>
	/* ── Back Link ────────────────────────────────────────── */
	.page-back { margin: 1rem 0 0.5rem; }
	.page-back a { color: var(--text-muted); text-decoration: none; }
	.page-back a:hover { color: var(--fg); }

	/* ── Banner ───────────────────────────────────────────── */
	.runner-banner { position: relative; height: 180px; border-radius: 12px 12px 0 0; overflow: hidden; }
	.runner-banner__img { position: absolute; inset: 0; background-size: cover; background-position: center; }
	.runner-banner__img--accent { background: linear-gradient(135deg, var(--accent-c), color-mix(in srgb, var(--accent-c) 60%, #000)); }
	.runner-banner__fade { position: absolute; inset: 0; background: linear-gradient(to bottom, transparent 30%, var(--bg) 100%); }

	/* ── Profile Header ──────────────────────────────────── */
	.runner-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-top: -40px; position: relative; z-index: 1; flex-wrap: wrap; }
	.runner-left { display: flex; align-items: flex-end; gap: 1rem; }
	.runner-avatar { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--bg); box-shadow: 0 2px 8px rgba(0,0,0,0.3); flex-shrink: 0; }
	.runner-name h1 { margin: 0; font-size: 1.5rem; }
	.runner-pronouns { font-size: 0.8em; font-weight: 400; color: var(--text-muted); }
	.runner-location { margin: 0.2rem 0 0; font-size: 0.9rem; }
	.runner-status { margin: 0; font-size: 0.85rem; }

	.runner-meta-line { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-top: 0.35rem; }
	.runner-joined { font-size: 0.8rem; }
	.runner-team-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
	.runner-team-badge {
		display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.2rem 0.6rem;
		background: var(--surface); border: 1px solid var(--border); border-radius: 20px;
		font-size: 0.75rem; color: var(--fg); text-decoration: none; transition: border-color 0.15s;
	}
	.runner-team-badge:hover { border-color: var(--accent); color: var(--accent); }
	.runner-team-badge__logo { width: 16px; height: 16px; border-radius: 50%; object-fit: cover; }

	/* ── Socials ──────────────────────────────────────────── */
	.runner-links { display: flex; flex-wrap: wrap; gap: 0.4rem; align-self: flex-end; margin-top: 0.5rem; }
	.runner-link {
		display: inline-flex; align-items: center; gap: 0.3rem;
		padding: 0.3rem 0.65rem; border: 1px solid var(--border); border-radius: 6px;
		font-size: 0.8rem; color: var(--muted); text-decoration: none; transition: all 0.12s;
	}
	.runner-link:hover { border-color: var(--accent); color: var(--accent); }

	/* ── Bio ──────────────────────────────────────────────── */
	.runner-bio { margin: 1.5rem 0; }
	.runner-bio h2 { margin: 0 0 0.5rem; font-size: 1.1rem; }
	.bio-content { line-height: 1.6; white-space: pre-wrap; }
	.bio-content :global(p) { margin: 0 0 0.5rem; }

	/* ── Tabs ─────────────────────────────────────────────── */
	.runner-tabs {
		display: flex; gap: 0; border-bottom: 1px solid var(--border);
		margin-bottom: 1.5rem; overflow-x: auto;
	}
	.tab {
		padding: 0.75rem 1.25rem; background: none; border: none; border-bottom: 2px solid transparent;
		color: var(--text-muted); font-size: 0.9rem; cursor: pointer; white-space: nowrap;
		font-family: inherit; transition: color 0.15s, border-color 0.15s;
	}
	.tab:hover { color: var(--fg); }
	.tab.active { color: var(--accent); border-bottom-color: var(--accent); font-weight: 600; }

	/* ── Stats Card ───────────────────────────────────────── */
	.runner-stats-card {
		display: flex; gap: 1rem; margin-bottom: 1rem; padding: 1rem 1.25rem;
		background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
	}
	.runner-stat { display: flex; flex-direction: column; align-items: center; padding: 0 1rem; border-right: 1px solid var(--border); }
	.runner-stat:last-child { border-right: none; }
	.runner-stat--total { margin-left: auto; padding-left: 1.5rem; border-left: 2px solid var(--accent); border-right: none; }
	.runner-stat__value { font-size: 1.75rem; font-weight: 700; color: var(--accent); line-height: 1; }
	.runner-stat__label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-top: 0.25rem; }

	/* ── Fun Stats ────────────────────────────────────────── */
	.runner-fun-stats { display: flex; gap: 1rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
	.fun-stat {
		display: flex; align-items: flex-start; gap: 0.75rem; flex: 1; min-width: 180px;
		padding: 0.85rem 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
	}
	.fun-stat__icon { font-size: 1.25rem; }
	.fun-stat__content { display: flex; flex-direction: column; gap: 0.1rem; }
	.fun-stat__label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); }
	.fun-stat__value { font-weight: 700; font-size: 0.95rem; color: var(--fg); text-decoration: none; }
	a.fun-stat__value:hover { color: var(--accent); }
	.fun-stat__detail { font-size: 0.75rem; color: var(--text-muted); }
	.fun-stat__genres { display: flex; gap: 0.35rem; flex-wrap: wrap; }
	.genre-pill { padding: 0.15rem 0.5rem; background: rgba(99,102,241,0.1); color: var(--accent); border-radius: 12px; font-size: 0.7rem; font-weight: 600; }

	/* ── Games Grid ───────────────────────────────────────── */
	.runner-games-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
	.runner-game-card {
		position: relative; display: block; aspect-ratio: 16/10; border-radius: 8px;
		overflow: hidden; border: none; padding: 0; cursor: pointer; color: #fff;
		background: var(--surface); font-family: inherit; text-align: left;
	}
	.runner-game-card__bg { position: absolute; inset: 0; background-size: cover; background-position: center; transition: transform 0.3s; }
	.runner-game-card:hover .runner-game-card__bg { transform: scale(1.05); }
	.runner-game-card__overlay {
		position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 1rem;
		background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.2) 100%);
	}
	.runner-game-card__title { font-weight: 700; font-size: 1rem; line-height: 1.2; }
	.runner-game-card__stats { display: flex; gap: 0.75rem; margin-top: 0.35rem; font-size: 0.8rem; color: rgba(255,255,255,0.8); }
	.runner-game-card__count { background: rgba(255,255,255,0.15); padding: 0.15rem 0.5rem; border-radius: 4px; }
	.runner-game-card__best { color: var(--accent); font-weight: 600; }

	/* ── Runs Detail ──────────────────────────────────────── */
	.runs-detail-header { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; margin-bottom: 1rem; }
	.runs-detail-game { display: flex; align-items: center; gap: 1rem; flex: 1; }
	.runs-detail-game__cover { width: 60px; height: 60px; border-radius: 8px; background-size: cover; background-position: center; flex-shrink: 0; }
	.runs-detail-game h2 { margin: 0; font-size: 1.25rem; }
	.runs-detail-game h2 a { color: var(--fg); text-decoration: none; }
	.runs-detail-game h2 a:hover { color: var(--accent); }
	.runs-detail-game p { margin: 0; }

	/* ── Table ────────────────────────────────────────────── */
	.table-wrap { overflow-x: auto; }
	.runs-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
	.runs-table th, .runs-table td { padding: 0.6rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
	.runs-table th { font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }
	.runs-table td a { color: var(--accent); text-decoration: none; }
	.runs-table td a:hover { text-decoration: underline; }
	.cell-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
	.tag { display: inline-block; padding: 0.1rem 0.4rem; border: 1px solid var(--border); border-radius: 3px; font-size: 0.75rem; color: var(--muted); white-space: nowrap; }

	/* ── Achievements ─────────────────────────────────────── */
	.community-achievements-list { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.75rem; }
	.community-achievement-item {
		display: flex; align-items: flex-start; gap: 1rem; padding: 1rem;
		background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
	}
	.community-achievement-item__icon { font-size: 1.75rem; line-height: 1; }
	.community-achievement-item__content { flex: 1; min-width: 0; }
	.community-achievement-item__header { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 0.25rem; }
	.community-achievement-item__header h4 { margin: 0; font-size: 1rem; }
	.community-achievement-item__meta { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; font-size: 0.8rem; }
	.community-achievement-item__meta a { color: var(--accent); text-decoration: none; }
	.community-achievement-item__meta a:hover { text-decoration: underline; }
	.verified-badge { color: #10b981; font-weight: 500; }
	.difficulty { font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.4rem; border-radius: 3px; text-transform: uppercase; letter-spacing: 0.3px; }
	.difficulty--easy { background: #22c55e; color: #fff; }
	.difficulty--medium { background: #eab308; color: #000; }
	.difficulty--hard { background: #f97316; color: #fff; }
	.difficulty--legendary { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; }

	/* ── Credits Grid ────────────────────────────────────── */
	.credits-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 0.75rem; margin-top: 0.75rem; }
	.credit-game-card { position: relative; display: block; aspect-ratio: 16/9; border-radius: 8px; overflow: hidden; text-decoration: none; color: #fff; }
	.credit-game-card__bg { position: absolute; inset: 0; background-size: cover; background-position: center; }
	.credit-game-card__overlay {
		position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: flex-end; padding: 0.5rem;
		background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%);
	}
	.credit-game-card__name { font-weight: 600; font-size: 0.85rem; line-height: 1.2; }
	.credit-game-card__role { font-size: 0.7rem; color: var(--accent); }

	/* ── Player-Made ─────────────────────────────────────── */
	.player-made-list { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem; }
	.player-made-item { display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px; }
	.player-made-item__icon { font-size: 1.25rem; }
	.player-made-item h4 { margin: 0 0 0.15rem; font-size: 0.95rem; }
	.player-made-item a { color: var(--accent); text-decoration: none; font-size: 0.8rem; }
	.player-made-item a:hover { text-decoration: underline; }

	/* ── Timeline ────────────────────────────────────────── */
	.activity-timeline { position: relative; padding-left: 2rem; margin-top: 1rem; }
	.activity-timeline::before { content: ''; position: absolute; left: 7px; top: 0; bottom: 0; width: 2px; background: var(--border); }
	.timeline-item { position: relative; padding-bottom: 1.25rem; }
	.timeline-item:last-child { padding-bottom: 0; }
	.timeline-item__dot { position: absolute; left: -2rem; top: 0.35rem; width: 16px; height: 16px; border-radius: 50%; background: var(--surface); border: 2px solid var(--border); z-index: 1; }
	.timeline-item__dot--achievement { border-color: var(--accent); background: var(--accent); }
	.timeline-item__content { padding: 0.5rem 0.75rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
	.timeline-item__header { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; font-size: 0.9rem; }
	.timeline-item__header a { color: var(--accent); text-decoration: none; }
	.timeline-item__header a:hover { text-decoration: underline; }
	.timeline-item__icon { flex-shrink: 0; }
	.timeline-item__time { font-family: monospace; font-size: 0.8rem; color: var(--accent); font-weight: 600; margin-left: auto; }
	.timeline-item__date { display: block; font-size: 0.75rem; margin-top: 0.25rem; }

	/* ── Utility ──────────────────────────────────────────── */
	.card { margin-bottom: 1rem; }
	.mb-1 { margin-bottom: 0.5rem; }

	/* ── Responsive ──────────────────────────────────────── */
	@media (max-width: 640px) {
		.runner-banner { height: 120px; }
		.runner-top { flex-direction: column; }
		.runner-links { width: 100%; }
		.runner-stats-card { flex-wrap: wrap; justify-content: center; }
		.runner-stat { padding: 0 0.75rem; min-width: 70px; }
		.runner-stat--total { margin-left: 0; border-left: none; border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.5rem; width: 100%; flex-direction: row; justify-content: center; gap: 0.5rem; }
		.runner-fun-stats { flex-direction: column; }
		.runner-games-grid { grid-template-columns: 1fr; }
		.credits-grid { grid-template-columns: repeat(2, 1fr); }
		.runs-detail-header { flex-direction: column; align-items: flex-start; }
		.runs-table thead { display: none; }
		.runs-table tr { display: block; margin-bottom: 0.75rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; background: var(--surface); }
		.runs-table td { display: flex; justify-content: space-between; padding: 0.3rem 0; border: none; }
		.runs-table td::before { content: attr(data-label); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); margin-right: 1rem; }
		.activity-timeline { padding-left: 1.5rem; }
		.timeline-item__dot { left: -1.5rem; }
		.timeline-item__header { font-size: 0.85rem; }
	}
</style>
