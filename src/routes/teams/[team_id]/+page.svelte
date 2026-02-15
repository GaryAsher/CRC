<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';

	let { data } = $props();
	const team = $derived(data.team);
	const socials = $derived(team.socials || {});
</script>

<svelte:head>
	<title>{team.name} | Challenge Run Community</title>
</svelte:head>

<div class="page-width">
	<p class="muted page-back"><a href="/teams">← All Teams</a></p>

	<!-- ═══ Team Header ═════════════════════════════════════ -->
	<div class="team-header">
		{#if team.logo}
			<img src={team.logo} alt="{team.name} logo" class="team-header__logo" />
		{:else}
			<div class="team-header__logo team-header__logo--placeholder">
				{team.name.charAt(0)}
			</div>
		{/if}

		<div class="team-header__info">
			<h1>{team.name}</h1>
			{#if team.tagline}
				<p class="team-header__tagline muted">{team.tagline}</p>
			{/if}

			{#if Object.values(socials).some(Boolean)}
				<div class="team-header__socials">
					{#if socials.discord}<a href={socials.discord} target="_blank" rel="noopener" class="social-link">Discord</a>{/if}
					{#if socials.youtube}<a href={socials.youtube} target="_blank" rel="noopener" class="social-link">YouTube</a>{/if}
					{#if socials.twitch}<a href={socials.twitch} target="_blank" rel="noopener" class="social-link">Twitch</a>{/if}
					{#if socials.twitter}<a href={socials.twitter} target="_blank" rel="noopener" class="social-link">Twitter</a>{/if}
					{#if socials.website}<a href={socials.website} target="_blank" rel="noopener" class="social-link">Website</a>{/if}
				</div>
			{/if}
		</div>
	</div>

	<!-- ═══ Description ═════════════════════════════════════ -->
	{#if team.content}
		<section class="card">
			<div class="md">{@html renderMarkdown(team.content)}</div>
		</section>
	{/if}

	<!-- ═══ Games ═══════════════════════════════════════════ -->
	{#if data.games.length > 0}
		<section class="card">
			<h2>Games We Run</h2>
			<div class="game-tags">
				{#each data.games as game}
					<a href="/games/{game.game_id}" class="game-tag">{game.game_name}</a>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ═══ Members ═════════════════════════════════════════ -->
	{#if data.members.length > 0}
		<section class="card">
			<h2>Members</h2>
			<div class="members-list">
				{#each data.members as member}
					<div class="member">
						{#if member.hasProfile}
							<a href="/runners/{member.runner_id}" class="member__link">
								<div class="member__avatar" style="background-image: url('{member.avatar || '/assets/img/site/default-runner.png'}')"></div>
								<span class="member__name">{member.name}</span>
							</a>
						{:else}
							<div class="member__link">
								<div class="member__avatar" style="background-image: url('/assets/img/site/default-runner.png')"></div>
								<span class="member__name">{member.name}</span>
							</div>
						{/if}
						{#if member.role}
							<span class="member__role muted">{member.role}</span>
						{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}

	<!-- ═══ Achievements ═══════════════════════════════════ -->
	{#if data.achievements.length > 0}
		<section class="card">
			<h2>Achievements</h2>
			<div class="team-achievements">
				{#each data.achievements as ach}
					<div class="team-ach">
						<div class="team-ach__header">
							<span class="team-ach__title">{ach.title}</span>
							{#if ach.date}<span class="team-ach__date muted">{ach.date}</span>{/if}
						</div>
						{#if ach.description}<p class="team-ach__desc muted">{ach.description}</p>{/if}
					</div>
				{/each}
			</div>
		</section>
	{/if}
</div>

<style>
	.page-back { margin: 1rem 0 0.5rem; }
	.page-back a { color: var(--text-muted); text-decoration: none; }
	.page-back a:hover { color: var(--fg); }

	section { margin-bottom: 1.5rem; }
	h2 { margin: 0 0 0.75rem; }

	/* ── Header ───────────────────────────────────────────── */
	.team-header { display: flex; align-items: center; gap: 1.25rem; margin-bottom: 1.5rem; }
	.team-header__logo {
		width: 72px; height: 72px; border-radius: 12px; object-fit: cover;
		flex-shrink: 0; border: 1px solid var(--border);
	}
	.team-header__logo--placeholder {
		display: flex; align-items: center; justify-content: center;
		background: var(--surface); color: var(--accent);
		font-size: 1.75rem; font-weight: 700;
	}
	.team-header__info h1 { margin: 0; }
	.team-header__tagline { margin: 0.2rem 0 0; }
	.team-header__socials { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; }
	.social-link {
		display: inline-block; padding: 0.25rem 0.6rem; border: 1px solid var(--border);
		border-radius: 6px; font-size: 0.8rem; color: var(--muted); text-decoration: none;
		transition: border-color 0.12s, color 0.12s;
	}
	.social-link:hover { border-color: var(--accent); color: var(--accent); }

	/* ── Games ────────────────────────────────────────────── */
	.game-tags { display: flex; flex-wrap: wrap; gap: 0.4rem; }
	.game-tag {
		display: inline-block; padding: 0.3rem 0.65rem; border: 1px solid var(--accent);
		border-radius: 20px; font-size: 0.8rem; color: var(--accent);
		text-decoration: none; background: rgba(99,102,241,0.06);
		transition: background 0.12s;
	}
	.game-tag:hover { background: rgba(99,102,241,0.15); }

	/* ── Members ──────────────────────────────────────────── */
	.members-list { display: flex; flex-direction: column; gap: 0.5rem; }
	.member { display: flex; align-items: center; gap: 0.75rem; }
	.member__link {
		display: flex; align-items: center; gap: 0.5rem;
		text-decoration: none; color: var(--fg);
	}
	a.member__link:hover .member__name { color: var(--accent); }
	.member__avatar {
		width: 32px; height: 32px; border-radius: 50%;
		background-size: cover; background-position: center; flex-shrink: 0;
	}
	.member__name { font-weight: 500; font-size: 0.95rem; }
	.member__role { font-size: 0.8rem; }

	/* ── Achievements ────────────────────────────────────── */
	.team-achievements { display: flex; flex-direction: column; gap: 0.75rem; }
	.team-ach { padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px; }
	.team-ach__header { display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; }
	.team-ach__title { font-weight: 600; }
	.team-ach__date { font-size: 0.8rem; }
	.team-ach__desc { margin: 0.25rem 0 0; font-size: 0.85rem; }

	/* ── Markdown ─────────────────────────────────────────── */
	.md :global(p) { margin: 0.5rem 0; }

	@media (max-width: 640px) {
		.team-header { flex-direction: column; align-items: flex-start; }
	}
</style>
