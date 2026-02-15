<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { onMount } from 'svelte';

	let { data } = $props();

	// ── News carousel ───────────────────────────────────────
	let currentSlide = $state(0);
	let paused = $state(false);
	const slideCount = data.posts.length;

	function nextSlide() { currentSlide = (currentSlide + 1) % slideCount; }
	function goToSlide(i: number) { currentSlide = i; }

	onMount(() => {
		if (slideCount <= 1) return;
		const interval = setInterval(() => { if (!paused) nextSlide(); }, 5000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Challenge Run Community</title>
</svelte:head>

<div class="page-width">

	<!-- ═══ Hero ═══════════════════════════════════════════ -->
	<section class="hero">
		<h1>Challenge Run Community</h1>
		<p class="hero__tagline muted">
			A space built around creative challenge runs, clear rules, and respect for all challenge styles.
		</p>
	</section>

	<!-- ═══ Top Grid: News + Stats ═════════════════════════ -->
	<div class="top-grid">
		<!-- News Carousel -->
		<div class="card card--compact news-card">
			<h2 class="section-title">📰 News</h2>
			{#if slideCount > 0}
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div
					class="news-carousel"
					onmouseenter={() => paused = true}
					onmouseleave={() => paused = false}
				>
					{#each data.posts as post, i}
						<div class="news-slide" class:is-active={i === currentSlide}>
							<span class="news-slide__date muted">{formatDate(post.date)}</span>
							<h3 class="news-slide__title">
								<a href="/news">{post.title}</a>
							</h3>
							{#if post.excerpt || post.content}
								<p class="news-slide__excerpt muted">
									{(post.excerpt || post.content || '').replace(/<[^>]*>/g, '').slice(0, 120)}
								</p>
							{/if}
						</div>
					{/each}

					{#if slideCount > 1}
						<div class="news-carousel__dots">
							{#each data.posts as _, i}
								<button
									class="news-carousel__dot"
									class:is-active={i === currentSlide}
									onclick={() => goToSlide(i)}
									aria-label="Go to slide {i + 1}"
								></button>
							{/each}
						</div>
					{/if}
				</div>
				<p class="news-link"><a href="/news" class="muted">View all news →</a></p>
			{:else}
				<p class="muted">News and updates will appear here.</p>
			{/if}
		</div>

		<!-- Stats Sidebar -->
		<div class="stats-sidebar">
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
				<span class="stat-card__label">Runs</span>
			</div>
			<div class="stat-card">
				<span class="stat-card__number">{data.stats.achievementCount}</span>
				<span class="stat-card__label">Achievements</span>
			</div>
		</div>
	</div>

	<!-- ═══ Quick Links ═══════════════════════════════════ -->
	<div class="quick-links">
		<a href="/games" class="quick-link">
			<span class="quick-link__icon">🎮</span>
			<div>
				<h3>Games</h3>
				<p class="muted">Browse all tracked games</p>
			</div>
			<span class="quick-link__count">{data.stats.gameCount}</span>
		</a>
		<a href="/runners" class="quick-link">
			<span class="quick-link__icon">🏆</span>
			<div>
				<h3>Runners</h3>
				<p class="muted">View runner profiles and runs</p>
			</div>
			<span class="quick-link__count">{data.stats.runnerCount}</span>
		</a>
		<a href="/rules" class="quick-link">
			<span class="quick-link__icon">📜</span>
			<div>
				<h3>Rules</h3>
				<p class="muted">Site-wide guidelines and policies</p>
			</div>
			<span class="quick-link__count muted">Learn more</span>
		</a>
		<a href="/glossary" class="quick-link">
			<span class="quick-link__icon">📖</span>
			<div>
				<h3>Glossary</h3>
				<p class="muted">Challenge run terminology</p>
			</div>
			<span class="quick-link__count muted">Reference</span>
		</a>
	</div>

	<!-- ═══ Featured Games ════════════════════════════════ -->
	{#if data.featuredGames.length > 0}
		<section>
			<h2 class="section-title">🎮 Featured Games</h2>
			<div class="games-grid">
				{#each data.featuredGames as game}
					<a href="/games/{game.game_id}" class="game-card">
						<div
							class="game-card__cover"
							style="background-image: url('{game.cover}'); background-position: {game.cover_position};"
						></div>
						<div class="game-card__overlay">
							<span class="game-card__name">{game.game_name}</span>
						</div>
					</a>
				{/each}
			</div>
			{#if data.games.length > data.featuredGames.length}
				<p class="section-more"><a href="/games" class="muted">View all {data.games.length} games →</a></p>
			{/if}
		</section>
	{/if}

	<!-- ═══ Recent Runs ═══════════════════════════════════ -->
	{#if data.recentRuns.length > 0}
		<section>
			<h2 class="section-title">🏃 Recent Runs</h2>
			<div class="runs-list">
				{#each data.recentRuns as run}
					<div class="run-row">
						<a href="/runners/{run.runner_id}" class="run-row__runner">{run.runner_name}</a>
						<a href="/games/{run.game_id}" class="run-row__game">{run.game_name}</a>
						<span class="run-row__category">{run.category_label || run.category}</span>
						{#if run.time_primary}
							<span class="run-row__time">{run.time_primary}</span>
						{/if}
						<span class="run-row__date muted">{formatDate(run.date_completed || run.date_submitted)}</span>
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ═══ Teams ═════════════════════════════════════════ -->
	<section>
		<h2 class="section-title">🤝 Affiliated Teams</h2>
		{#if data.featuredTeams.length > 0}
			<div class="teams-grid">
				{#each data.featuredTeams as team}
					<a href="/teams/{team.team_id}" class="team-chip">
						{#if team.logo}
							<img src={team.logo} alt="" class="team-chip__logo" />
						{:else}
							<div class="team-chip__logo team-chip__logo--placeholder">{team.name.charAt(0)}</div>
						{/if}
						<span class="team-chip__name">{team.name}</span>
					</a>
				{/each}
			</div>
			{#if data.stats.teamCount > data.featuredTeams.length}
				<p class="section-more"><a href="/teams" class="muted">View all teams →</a></p>
			{/if}
		{:else}
			<div class="card"><p class="muted">Teams coming soon.</p></div>
		{/if}
		<p class="muted" style="font-size: 0.85rem; margin-top: 0.75rem;">
			Interested in partnering? <a href="/support">Contact us!</a>
		</p>
	</section>

</div>

<style>
	section { margin-bottom: 2.5rem; }
	.section-title { margin: 0 0 1rem; font-size: 1.15rem; }
	.section-more { margin-top: 0.75rem; font-size: 0.85rem; }
	.section-more a { text-decoration: none; }
	.section-more a:hover { color: var(--fg); }

	/* ── Hero ──────────────────────────────────────────────── */
	.hero { margin: 2rem 0 1.5rem; }
	.hero h1 { margin: 0 0 0.25rem; font-size: 1.75rem; }
	.hero__tagline { margin: 0; font-size: 1rem; max-width: 550px; }

	/* ── Top Grid ─────────────────────────────────────────── */
	.top-grid { display: grid; grid-template-columns: 1fr 200px; gap: 1.25rem; margin-bottom: 2rem; }
	.news-card { min-height: 200px; }
	.news-card h2 { margin: 0 0 0.75rem; }

	.stats-sidebar { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; align-content: start; }
	.stat-card {
		background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
		padding: 1rem; text-align: center;
	}
	.stat-card__number { display: block; font-size: 1.5rem; font-weight: 700; color: var(--accent); }
	.stat-card__label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--muted); }

	/* ── News Carousel ────────────────────────────────────── */
	.news-carousel { position: relative; min-height: 120px; }
	.news-slide { display: none; }
	.news-slide.is-active { display: block; }
	.news-slide__date { font-size: 0.8rem; }
	.news-slide__title { margin: 0.25rem 0 0.35rem; font-size: 1.05rem; }
	.news-slide__title a { color: var(--fg); text-decoration: none; }
	.news-slide__title a:hover { color: var(--accent); }
	.news-slide__excerpt { margin: 0; font-size: 0.85rem; line-height: 1.5; }
	.news-carousel__dots { display: flex; gap: 0.4rem; margin-top: 0.75rem; }
	.news-carousel__dot {
		width: 8px; height: 8px; border-radius: 50%; border: none; padding: 0;
		background: var(--border); cursor: pointer; transition: background 0.15s;
	}
	.news-carousel__dot.is-active { background: var(--accent); }
	.news-link { margin-top: 0.75rem; font-size: 0.85rem; }
	.news-link a { text-decoration: none; }
	.news-link a:hover { color: var(--fg); }

	/* ── Quick Links ──────────────────────────────────────── */
	.quick-links {
		display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem; margin-bottom: 2.5rem;
	}
	.quick-link {
		display: flex; align-items: center; gap: 0.75rem;
		padding: 1rem 1.15rem; background: var(--panel); border: 1px solid var(--border);
		border-radius: 10px; text-decoration: none; color: var(--fg);
		transition: border-color 0.15s, transform 0.1s;
	}
	.quick-link:hover { border-color: var(--accent); transform: translateY(-2px); }
	.quick-link__icon { font-size: 1.5rem; flex-shrink: 0; }
	.quick-link h3 { margin: 0; font-size: 0.95rem; }
	.quick-link p { margin: 0.1rem 0 0; font-size: 0.75rem; }
	.quick-link__count {
		margin-left: auto; font-size: 0.8rem; font-weight: 600;
		color: var(--accent); white-space: nowrap;
	}

	/* ── Games Grid ───────────────────────────────────────── */
	.games-grid {
		display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
		gap: 0.75rem;
	}
	.game-card {
		position: relative; border-radius: 10px; overflow: hidden;
		aspect-ratio: 16 / 10; display: block; text-decoration: none;
	}
	.game-card__cover {
		position: absolute; inset: 0; background-size: cover;
		transition: transform 0.25s;
	}
	.game-card:hover .game-card__cover { transform: scale(1.05); }
	.game-card__overlay {
		position: absolute; inset: 0; display: flex; align-items: flex-end;
		padding: 0.6rem 0.75rem;
		background: linear-gradient(transparent 30%, rgba(0,0,0,0.75) 100%);
	}
	.game-card__name { color: #fff; font-weight: 600; font-size: 0.85rem; text-shadow: 0 1px 3px rgba(0,0,0,0.5); }

	/* ── Recent Runs ──────────────────────────────────────── */
	.runs-list { display: flex; flex-direction: column; }
	.run-row {
		display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 0;
		border-bottom: 1px solid var(--border); font-size: 0.9rem; flex-wrap: wrap;
	}
	.run-row:last-child { border-bottom: none; }
	.run-row__runner { color: var(--accent); text-decoration: none; font-weight: 600; min-width: 100px; }
	.run-row__runner:hover { text-decoration: underline; }
	.run-row__game { color: var(--fg); text-decoration: none; min-width: 100px; }
	.run-row__game:hover { color: var(--accent); }
	.run-row__category { color: var(--muted); font-size: 0.8rem; flex: 1; }
	.run-row__time { font-family: 'JetBrains Mono', monospace; color: var(--accent); font-size: 0.85rem; }
	.run-row__date { font-size: 0.8rem; margin-left: auto; }

	/* ── Teams ────────────────────────────────────────────── */
	.teams-grid { display: flex; flex-wrap: wrap; gap: 0.6rem; }
	.team-chip {
		display: inline-flex; align-items: center; gap: 0.5rem;
		padding: 0.4rem 0.75rem; background: var(--panel); border: 1px solid var(--border);
		border-radius: 20px; text-decoration: none; color: var(--fg);
		transition: border-color 0.15s;
	}
	.team-chip:hover { border-color: var(--accent); }
	.team-chip__logo {
		width: 22px; height: 22px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
	}
	.team-chip__logo--placeholder {
		display: flex; align-items: center; justify-content: center;
		background: var(--surface); color: var(--accent); font-size: 0.65rem; font-weight: 700;
	}
	.team-chip__name { font-size: 0.85rem; font-weight: 500; }

	/* ── Responsive ───────────────────────────────────────── */
	@media (max-width: 700px) {
		.top-grid { grid-template-columns: 1fr; }
		.stats-sidebar { grid-template-columns: repeat(4, 1fr); }
		.quick-links { grid-template-columns: 1fr 1fr; }
		.games-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
		.run-row { font-size: 0.8rem; gap: 0.5rem; }
	}
	@media (max-width: 480px) {
		.stats-sidebar { grid-template-columns: repeat(2, 1fr); }
		.quick-links { grid-template-columns: 1fr; }
	}
</style>
