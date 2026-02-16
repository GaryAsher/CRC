<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { onMount } from 'svelte';

	let { data } = $props();

	// ── News carousel ───────────────────────────────────────
	let currentSlide = $state(0);
	let paused = $state(false);
	const slideCount = $derived(data.posts.length);

	function nextSlide() { currentSlide = (currentSlide + 1) % slideCount; }
	function goToSlide(i: number) { currentSlide = i; }

	onMount(() => {
		if (slideCount <= 1) return;
		const interval = setInterval(() => { if (!paused) nextSlide(); }, 5000);
		return () => clearInterval(interval);
	});

	const teams = $derived(data.teams || []);
</script>

<svelte:head>
	<title>Challenge Run Community</title>
</svelte:head>

<div class="page-width">

	<h1>Challenge Run Community</h1>
	<p class="muted" style="margin-bottom: 1.5rem;">
		A space built around creative challenge runs, clear rules, and respect for all challenge styles.
	</p>

	<!-- ═══ Top Grid: News + Community Board ════════════════ -->
	<div class="home-grid">
		<!-- News Carousel -->
		<div class="home-main">
			<div class="home-card home-card--square">
				<h2 class="home-card__title">📰 News</h2>
				<div class="home-card__content">
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
									{#if post.content}
										<p class="news-slide__excerpt muted">
											{post.content.replace(/<[^>]*>/g, '').replace(/[#*_`~>\-]/g, '').slice(0, 150)}…
										</p>
									{/if}
								</div>
							{/each}

							{#if slideCount > 1}
								<div class="news-carousel__controls">
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
								</div>
							{/if}

							<p class="news-carousel__link" style="margin-top: 0.75rem;">
								<a href="/news" class="muted">View all news →</a>
							</p>
						</div>
					{:else}
						<div class="news-slide is-active">
							<span class="news-slide__date muted">Coming Soon</span>
							<p class="news-slide__excerpt">News and updates will appear here.</p>
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Community Board -->
		<div class="home-sidebar">
			<div class="home-card home-card--full-height">
				<h2 class="home-card__title">📋 Community Board</h2>
				<div class="community-board">
					<div class="board-list">
						<div class="board-item board-item--placeholder">
							<span class="board-item__type muted">Bounty</span>
							<p class="board-item__text">No active bounties yet. Check back soon!</p>
						</div>
						<div class="board-item board-item--placeholder">
							<span class="board-item__type muted">Request</span>
							<p class="board-item__text">Want to post a bounty or request? Contact us!</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- ═══ Quick Links ═══════════════════════════════════ -->
	<div class="resource-cards" style="margin-top: 1.5rem;">
		<a href="/games" class="resource-card card-lift--sm">
			<div class="resource-card__icon">🎮</div>
			<div class="resource-card__content">
				<h2 class="resource-card__title">Games</h2>
				<p class="resource-card__desc">Browse all tracked games and their challenge runs.</p>
				<span class="resource-card__count">{data.stats.gameCount} games</span>
			</div>
		</a>

		<a href="/runners" class="resource-card card-lift--sm">
			<div class="resource-card__icon">🏆</div>
			<div class="resource-card__content">
				<h2 class="resource-card__title">Runners</h2>
				<p class="resource-card__desc">View runner profiles, stats, and achievements.</p>
				<span class="resource-card__count">{data.stats.runnerCount} runners</span>
			</div>
		</a>

		<a href="/rules" class="resource-card card-lift--sm">
			<div class="resource-card__icon">📜</div>
			<div class="resource-card__content">
				<h2 class="resource-card__title">Rules</h2>
				<p class="resource-card__desc">Site-wide guidelines and submission policies.</p>
				<span class="resource-card__count">Learn more</span>
			</div>
		</a>

		<a href="/glossary" class="resource-card card-lift--sm">
			<div class="resource-card__icon">📖</div>
			<div class="resource-card__content">
				<h2 class="resource-card__title">Glossary</h2>
				<p class="resource-card__desc">Challenge run terminology explained.</p>
				<span class="resource-card__count">Reference</span>
			</div>
		</a>
	</div>

	<!-- ═══ Featured Teams ════════════════════════════════ -->
	<div class="featured-teams">
		<h2 class="featured-teams__title">🤝 Affiliated Teams</h2>
		{#if teams.length > 0}
			<div class="teams-grid">
				{#each teams.slice(0, 6) as team}
					<a href="/teams/{team.team_id}" class="team-card card-lift--sm">
						{#if team.logo}
							<img src={team.logo} alt={team.name} class="team-card__logo" />
						{:else}
							<div class="team-card__logo team-card__logo--placeholder">{team.name.charAt(0)}</div>
						{/if}
						<div class="team-card__name">{team.name}</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="teams-grid">
				<div class="team-card team-card--placeholder">
					<div class="team-card__logo team-card__logo--placeholder">?</div>
					<div class="team-card__name muted">Teams coming soon</div>
				</div>
			</div>
		{/if}
		<p class="muted" style="margin-top: 0.75rem; font-size: 0.9rem;">
			Interested in partnering? <a href="/support">Contact us!</a>
		</p>
	</div>

</div>
