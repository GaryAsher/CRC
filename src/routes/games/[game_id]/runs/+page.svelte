<script lang="ts">
	let { data } = $props();
	const game = $derived(data.game);

	// Build tab list from available categories
	const tabs = $derived(() => {
		const t: { id: string; label: string; icon: string }[] = [];
		if (game.full_runs?.length) t.push({ id: 'full', label: 'Full Runs', icon: '🏁' });
		if (game.mini_challenges?.length) t.push({ id: 'mini', label: 'Mini-Challenges', icon: '⚡' });
		if (game.player_made?.length) t.push({ id: 'player', label: 'Player-Made', icon: '🎨' });
		return t;
	});

	let activeTab = $state('full');

	// Default to first available tab
	$effect(() => {
		const available = tabs();
		if (available.length && !available.find(t => t.id === activeTab)) {
			activeTab = available[0].id;
		}
	});
</script>

<svelte:head>
	<title>Runs - {game.game_name} | CRC</title>
</svelte:head>

{#if tabs().length > 1}
	<nav class="runner-tabs" aria-label="Run categories">
		{#each tabs() as tab}
			<button
				class="tab"
				class:active={activeTab === tab.id}
				onclick={() => activeTab = tab.id}
			>
				{tab.icon} {tab.label}
			</button>
		{/each}
	</nav>
{/if}

{#if activeTab === 'full' && game.full_runs?.length}
	<section>
		{#if tabs().length <= 1}<h2>🏁 Full Runs</h2>{/if}
		<p class="muted section-desc">Complete game challenge runs from start to finish.</p>
		<div class="category-grid">
			{#each game.full_runs as cat}
				<a href="/games/{game.game_id}/runs/full-runs/{cat.slug}" class="card card-lift category-card">
					<h3>{cat.label}</h3>
					{#if cat.description}<p class="muted">{cat.description}</p>{/if}
				</a>
			{/each}
		</div>
	</section>
{/if}

{#if activeTab === 'mini' && game.mini_challenges?.length}
	<section>
		{#if tabs().length <= 1}<h2>⚡ Mini-Challenges</h2>{/if}
		<p class="muted section-desc">Focused challenges for specific sections or objectives.</p>
		{#each game.mini_challenges as group}
			<div class="mini-group">
				<h3 class="mini-group__title">{group.label}</h3>
				{#if group.description}
					<p class="muted mini-group__desc">{group.description}</p>
				{/if}
				<div class="category-grid">
					{#each group.children || [] as child}
						<a href="/games/{game.game_id}/runs/mini-challenges/{child.slug}" class="card card-lift category-card">
							<h3>{child.label}</h3>
							{#if child.description}<p class="muted">{child.description}</p>{/if}
						</a>
					{/each}
				</div>
			</div>
		{/each}
	</section>
{/if}

{#if activeTab === 'player' && game.player_made?.length}
	<section>
		{#if tabs().length <= 1}<h2>🎨 Player-Made Challenges</h2>{/if}
		<p class="muted section-desc">Community-created challenges and custom rulesets.</p>
		<div class="category-grid">
			{#each game.player_made as cat}
				<a href="/games/{game.game_id}/runs/player-made/{cat.slug}" class="card card-lift category-card">
					<h3>{cat.label}</h3>
					{#if cat.description}<p class="muted">{cat.description}</p>{/if}
				</a>
			{/each}
		</div>
	</section>
{/if}

<style>
	section { margin-bottom: 2rem; }
	h2 { margin-bottom: 0.25rem; }
	.section-desc { margin-bottom: 1rem; font-size: 0.85rem; }
	.category-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
	.category-card { text-decoration: none; color: var(--fg); }
	.category-card h3 { margin: 0 0 0.25rem; font-size: 1rem; }
	.category-card p { margin: 0; font-size: 0.85rem; }
	.mini-group { margin-bottom: 1.25rem; padding: 1rem; background: var(--surface); border: 1px solid var(--border); border-radius: 10px; }
	.mini-group__title { margin: 0 0 0.25rem; font-size: 1.05rem; color: var(--accent); }
	.mini-group__desc { margin: 0 0 0.75rem; font-size: 0.85rem; }
</style>
