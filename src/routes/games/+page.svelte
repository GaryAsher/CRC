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
			inputmode="search"
			aria-label="Search games"
		/>
	</div>

	<div class="results-bar">
		<div class="results-bar__center">
			<p class="muted">{filtered.length} of {data.games.length} games</p>
		</div>
	</div>

	<div class="grid">
		{#each filtered as game (game.game_id)}
			<a
				href="/games/{game.game_id}"
				class="game-card card-lift"
				class:game-card--modded={game.is_modded}
			>
				<div
					class="game-card__bg"
					style="background-image: url('{game.cover || '/img/site/default-game.jpg'}'); background-position: {game.cover_position || 'center'};"
				></div>
				{#if game.is_modded}
					<div class="game-card__modded-badge">
						<span class="modded-badge modded-badge--card">🔧 MODDED</span>
					</div>
				{/if}
				<div class="game-card__overlay">
					<div class="game-card__title">{game.game_name}</div>
				</div>
			</a>
		{/each}
	</div>
</div>
