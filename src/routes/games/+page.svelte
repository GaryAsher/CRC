<script lang="ts">
	let { data } = $props();
	let search = $state('');

	const filtered = $derived(
		data.games.filter((g) => {
			if (!search) return true;
			const q = search.toLowerCase();
			return (
				g.game_name.toLowerCase().includes(q) ||
				g.game_name_aliases?.some((a: string) => a.toLowerCase().includes(q))
			);
		})
	);
</script>

<svelte:head>
	<title>Games | Challenge Run Community</title>
</svelte:head>

<div class="page-width">
	<h1>Games</h1>
	<p class="muted">Browse all tracked games and their challenge runs.</p>

	<div class="filter-wrap" style="margin: 1.25rem 0;">
		<input
			class="filter"
			type="text"
			placeholder="Search by game name..."
			bind:value={search}
			autocomplete="off"
		/>
	</div>

	<p class="muted">{filtered.length} of {data.games.length} games</p>

	<div class="games-grid">
		{#each filtered as game (game.game_id)}
			<a href="/games/{game.game_id}" class="game-card card card-lift">
				{#if game.cover}
					<div
						class="game-card__cover"
						style="background-image: url('{game.cover}'); background-position: {game.cover_position || 'center'};"
					>
						{#if game.is_modded}
							<span class="modded-badge">🔧 MODDED</span>
						{/if}
					</div>
				{/if}
				<div class="game-card__body">
					<h2 class="game-card__title">{game.game_name}</h2>
					<div class="game-card__meta">
						<span>{game.full_runs?.length ?? 0} categories</span>
						<span>·</span>
						<span>{game.runCount} runs</span>
					</div>
					{#if game.genres?.length}
						<div class="game-card__tags">
							{#each game.genres.slice(0, 3) as genre}
								<span class="tag tag--small">{genre}</span>
							{/each}
						</div>
					{/if}
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.games-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.25rem;
		margin-top: 1.25rem;
	}
	.game-card {
		text-decoration: none;
		color: var(--fg);
		overflow: hidden;
	}
	.game-card__cover {
		height: 140px;
		background-size: cover;
		position: relative;
	}
	.game-card__body {
		padding: 1rem;
	}
	.game-card__title {
		font-size: 1.1rem;
		margin: 0 0 0.5rem;
	}
	.game-card__meta {
		font-size: 0.85rem;
		opacity: 0.6;
		display: flex;
		gap: 0.4rem;
	}
	.game-card__tags {
		display: flex;
		gap: 0.4rem;
		margin-top: 0.5rem;
		flex-wrap: wrap;
	}
	.modded-badge {
		position: absolute;
		top: 0.5rem;
		right: 0.5rem;
		background: rgba(0,0,0,0.7);
		padding: 0.2rem 0.5rem;
		border-radius: 4px;
		font-size: 0.75rem;
	}
</style>
