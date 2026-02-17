<script lang="ts">
	let { data } = $props();
	const game = $derived(data.game);
</script>

<svelte:head>
	<title>Runs - {game.game_name} | CRC</title>
</svelte:head>

{#if game.full_runs?.length}
	<section>
		<h2>Full Runs</h2>
		<div class="category-grid">
			{#each game.full_runs as cat}
				<a href="/games/{game.game_id}/runs/full-runs/{cat.slug}" class="card card-lift category-card">
					<h3>{cat.label}</h3>
					<p class="muted">{cat.description || ''}</p>
				</a>
			{/each}
		</div>
	</section>
{/if}

{#if game.mini_challenges?.length}
	<section>
		<h2>Mini-Challenges</h2>
		{#each game.mini_challenges as group}
			<h3>{group.label}</h3>
			{#if group.description}
				<p class="muted">{group.description}</p>
			{/if}
			<div class="category-grid">
				{#each group.children || [] as child}
					<a href="/games/{game.game_id}/runs/mini-challenges/{child.slug}" class="card card-lift category-card">
						<h3>{child.label}</h3>
					</a>
				{/each}
			</div>
		{/each}
	</section>
{/if}

{#if game.player_made?.length}
	<section>
		<h2>Player-Made Challenges</h2>
		<div class="category-grid">
			{#each game.player_made as cat}
				<a href="/games/{game.game_id}/runs/player-made/{cat.slug}" class="card card-lift category-card">
					<h3>{cat.label}</h3>
					<p class="muted">{cat.description || ''}</p>
				</a>
			{/each}
		</div>
	</section>
{/if}

<style>
	section { margin-bottom: 2rem; }
	h2 { margin-bottom: 0.75rem; }
	.category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
	.category-card { text-decoration: none; color: var(--fg); }
	.category-card h3 { margin: 0 0 0.25rem; font-size: 1rem; }
	.category-card p { margin: 0; font-size: 0.85rem; }
</style>
