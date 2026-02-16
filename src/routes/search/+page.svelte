<script lang="ts">
	import { page } from '$app/stores';

	let { data } = $props();

	let query = $state('');
	let filter = $state<'all' | 'games' | 'runners'>('all');

	let results = $derived.by(() => {
		const q = query.toLowerCase().trim();
		if (!q) return [];

		let items: any[] = [];

		if (filter === 'all' || filter === 'games') {
			items.push(...data.games.filter((g: any) =>
				g.name.toLowerCase().includes(q) ||
				g.id.toLowerCase().includes(q) ||
				g.aliases?.some((a: string) => a.toLowerCase().includes(q)) ||
				g.genres?.some((g2: string) => g2.toLowerCase().includes(q))
			));
		}

		if (filter === 'all' || filter === 'runners') {
			items.push(...data.runners.filter((r: any) =>
				r.name.toLowerCase().includes(q) ||
				r.id.toLowerCase().includes(q)
			));
		}

		return items;
	});

	let hasQuery = $derived(query.trim().length > 0);
</script>

<svelte:head><title>{query ? `Search: ${query}` : 'Search'} | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<div class="search-page">
		<h1>Search</h1>

		<div class="search-input-wrap">
			<input
				type="search"
				bind:value={query}
				placeholder="Search games, runners..."
			/>
		</div>

		<div class="search-filters">
			<button class="search-filter-btn" class:is-active={filter === 'all'} onclick={() => filter = 'all'}>All</button>
			<button class="search-filter-btn" class:is-active={filter === 'games'} onclick={() => filter = 'games'}>Games</button>
			<button class="search-filter-btn" class:is-active={filter === 'runners'} onclick={() => filter = 'runners'}>Runners</button>
		</div>

		{#if hasQuery}
			<p class="muted search-result-count">{results.length} result{results.length !== 1 ? 's' : ''}</p>

			{#if results.length === 0}
				<p class="search-no-results">No results found for "{query}"</p>
			{:else}
				<div class="search-results">
					{#each results as item}
						<a href={item.url} class="search-result">
							<span class="search-result__icon">{item.type === 'game' ? '🎮' : '🏃'}</span>
							<div class="search-result__body">
								<span class="search-result__title">{item.name}</span>
								{#if item.type === 'game' && item.genres?.length}
									<span class="search-result__meta">{item.genres.slice(0, 3).join(', ')}</span>
								{/if}
							</div>
						</a>
					{/each}
				</div>
			{/if}
		{:else}
			<p class="muted" style="text-align: center; padding: 2rem 0;">Start typing to search across games and runners.</p>
		{/if}
	</div>
</div>

<style>
	.search-page { max-width: 640px; margin: 2rem auto; }
	.search-input-wrap { margin: 1.5rem 0 1rem; }
	.search-input {
		width: 100%; padding: 0.75rem 1rem; border: 2px solid var(--border);
		border-radius: 10px; background: var(--surface); color: var(--fg);
		font-size: 1.1rem; font-family: inherit;
	}
	.search-input:focus { outline: none; border-color: var(--accent); }
	.search-filters { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
	.search-filter-btn {
		padding: 0.35rem 0.9rem; border: 1px solid var(--border); border-radius: 20px;
		background: none; color: var(--muted); cursor: pointer; font-size: 0.85rem;
	}
	.search-filter-btn:hover { border-color: var(--accent); color: var(--accent); }
	.search-filter-btn.is-active { background: var(--accent); color: #fff; border-color: var(--accent); }
	.search-result-count { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.75rem; }
	.search-no-results { text-align: center; padding: 2rem 0; color: var(--muted); }
	.search-results { display: flex; flex-direction: column; gap: 0.5rem; }
	.search-result {
		display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
		border: 1px solid var(--border); border-radius: 8px; text-decoration: none; color: var(--fg);
		transition: border-color 0.15s;
	}
	.search-result:hover { border-color: var(--accent); }
	.search-result__icon { font-size: 1.25rem; }
	.search-result__title { font-weight: 600; }
	.search-result__meta { display: block; font-size: 0.8rem; color: var(--muted); }
</style>
