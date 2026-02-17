<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';

	let { data } = $props();
	const game = $derived(data.game);
</script>

<!-- Modded/Base Game Links -->
{#if game.is_modded && data.baseGame}
	<div class="game-link-banner game-link-banner--base">
		<span>🎮</span>
		<span>This is a <strong>modded version</strong>. Looking for the vanilla game?</span>
		<a href="/games/{data.baseGame.game_id}" class="btn btn--small">View {data.baseGame.game_name}</a>
	</div>
{/if}

{#if data.moddedVersions.length > 0}
	<div class="game-link-banner game-link-banner--modded">
		<span>🔧</span>
		<span><strong>Modded versions available!</strong></span>
		{#each data.moddedVersions as mod}
			<a href="/games/{mod.game_id}" class="btn btn--small btn--outline">{mod.game_name}</a>
		{/each}
	</div>
{/if}

<!-- Game Description -->
{#if game.content}
	<section class="game-description">
		{@html renderMarkdown(game.content)}
	</section>
{:else}
	<section class="game-description">
		<p class="muted">No description yet. Check the Rules tab for challenge information.</p>
	</section>
{/if}

<!-- Submit Run CTA -->
<section class="submit-cta">
	<a href="/submit?game={game.game_id}" class="btn btn--accent">Submit a Run for {game.game_name}</a>
</section>

<!-- General Rules Preview -->
{#if game.general_rules}
	<section>
		<h2>General Rules</h2>
		<div class="card">
			{@html renderMarkdown(game.general_rules)}
		</div>
	</section>
{/if}

<!-- Community Achievements -->
{#if game.community_achievements?.length}
	<section>
		<h2>Community Achievements</h2>
		<div class="achievements-grid">
			{#each game.community_achievements as ach}
				<div class="card achievement-card">
					<div class="achievement-card__icon">{ach.icon}</div>
					<div class="achievement-card__info">
						<h3>{ach.title}</h3>
						<p class="muted">{ach.description}</p>
						<span class="tag tag--{ach.difficulty}">{ach.difficulty}</span>
					</div>
				</div>
			{/each}
		</div>
	</section>
{/if}

<style>
	section { margin-bottom: 2rem; }
	h2 { margin-bottom: 0.75rem; }
	.submit-cta { text-align: center; }
	.btn--accent {
		display: inline-block; background: var(--accent); color: #fff; padding: 0.6rem 1.5rem;
		border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.95rem;
	}
	.btn--accent:hover { opacity: 0.9; }
	.game-link-banner {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		background: var(--panel);
		border: 1px solid var(--border);
	}
	.achievements-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1rem;
	}
	.achievement-card {
		display: flex;
		gap: 1rem;
		align-items: flex-start;
	}
	.achievement-card__icon {
		font-size: 2rem;
	}
	.achievement-card__info h3 { margin: 0 0 0.25rem; }
	.achievement-card__info p { margin: 0 0 0.5rem; font-size: 0.85rem; }
</style>
