<script lang="ts">
	let { data } = $props();

	let query = $state('');
	let activeFilter = $state<'all' | 'games' | 'runners' | 'runs' | 'news'>('all');

	function norm(s: string): string {
		return (s || '').trim().toLowerCase();
	}

	let results = $derived.by(() => {
		const q = norm(query);
		if (!q) return { games: [], runners: [], runs: [], news: [] };

		const out = {
			games: [] as any[],
			runners: [] as any[],
			runs: [] as any[],
			news: [] as any[]
		};

		if (activeFilter === 'all' || activeFilter === 'games') {
			out.games = data.games.filter((g: any) =>
				norm(g.name).includes(q) ||
				norm(g.id).includes(q) ||
				g.aliases?.some((a: string) => norm(a).includes(q)) ||
				g.genres?.some((g2: string) => norm(g2).includes(q))
			);
		}

		if (activeFilter === 'all' || activeFilter === 'runners') {
			out.runners = data.runners.filter((r: any) =>
				norm(r.name).includes(q) || norm(r.id).includes(q)
			);
		}

		if (activeFilter === 'all' || activeFilter === 'runs') {
			out.runs = (data.runs || []).filter((r: any) =>
				norm(r.runner).includes(q) || norm(r.game).includes(q) ||
				norm(r.challenge).includes(q) || norm(r.category).includes(q)
			);
		}

		if (activeFilter === 'all' || activeFilter === 'news') {
			out.news = (data.news || []).filter((n: any) =>
				norm(n.title).includes(q) || norm(n.excerpt).includes(q)
			);
		}

		return out;
	});

	let totalCount = $derived(
		results.games.length + results.runners.length + results.runs.length + results.news.length
	);
	let hasQuery = $derived(query.trim().length > 0);

	// Check for query param on mount
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	onMount(() => {
		const initialQuery = $page.url.searchParams.get('q');
		if (initialQuery) {
			query = initialQuery;
		}
	});
</script>

<svelte:head><title>{query ? `Search: ${query}` : 'Search'} | Challenge Run Community</title></svelte:head>

<div class="page-width search-page">

	<div class="search-hero">
		<h1>Search</h1>
		<p class="muted">Search across games, runners, runs, and news.</p>
	</div>

	<div class="search-input-wrap">
		<input
			type="text"
			class="search-input"
			bind:value={query}
			placeholder="Search for anything..."
			autocomplete="off"
		/>
	</div>

	<div class="search-filters">
		<button type="button" class="search-filter-btn" class:is-active={activeFilter === 'all'} onclick={() => activeFilter = 'all'}>All</button>
		<button type="button" class="search-filter-btn" class:is-active={activeFilter === 'games'} onclick={() => activeFilter = 'games'}>Games</button>
		<button type="button" class="search-filter-btn" class:is-active={activeFilter === 'runners'} onclick={() => activeFilter = 'runners'}>Runners</button>
		<button type="button" class="search-filter-btn" class:is-active={activeFilter === 'runs'} onclick={() => activeFilter = 'runs'}>Runs</button>
		<button type="button" class="search-filter-btn" class:is-active={activeFilter === 'news'} onclick={() => activeFilter = 'news'}>News</button>
	</div>

	<div class="search-results">
		{#if !hasQuery}
			<div class="search-no-results">
				<p>Start typing to search...</p>
			</div>
		{:else if totalCount === 0}
			<div class="search-no-results">
				<p>No results found for "<strong>{query}</strong>"</p>
			</div>
		{:else}
			<!-- Games -->
			{#if results.games.length > 0}
				<div class="search-result-group">
					<h2>Games ({results.games.length})</h2>
					{#each results.games as g}
						<a href={g.url} class="search-result">
							<div class="search-result__title">{g.name}</div>
							{#if g.genres?.length}
								<div class="search-result__meta">{g.genres.slice(0, 3).join(', ')}</div>
							{/if}
						</a>
					{/each}
				</div>
			{/if}

			<!-- Runners -->
			{#if results.runners.length > 0}
				<div class="search-result-group">
					<h2>Runners ({results.runners.length})</h2>
					{#each results.runners as r}
						<a href={r.url} class="search-result">
							<div class="search-result__title">{r.name}</div>
						</a>
					{/each}
				</div>
			{/if}

			<!-- Runs -->
			{#if results.runs.length > 0}
				<div class="search-result-group">
					<h2>Runs ({results.runs.length})</h2>
					{#each results.runs.slice(0, 20) as r}
						<a href={r.url} class="search-result">
							<div class="search-result__title">{r.runner} - {r.game}</div>
							<div class="search-result__meta">{r.challenge} &bull; {r.category}</div>
						</a>
					{/each}
					{#if results.runs.length > 20}
						<p class="muted" style="padding: 0.5rem;">...and {results.runs.length - 20} more</p>
					{/if}
				</div>
			{/if}

			<!-- News -->
			{#if results.news.length > 0}
				<div class="search-result-group">
					<h2>News ({results.news.length})</h2>
					{#each results.news as n}
						<a href={n.url} class="search-result">
							<div class="search-result__title">{n.title}</div>
							<div class="search-result__meta">{n.date}</div>
						</a>
					{/each}
				</div>
			{/if}
		{/if}
	</div>

</div>
