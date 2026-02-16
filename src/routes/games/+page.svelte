<script lang="ts">
	let { data } = $props();

	// ── State ─────────────────────────────────────────────────
	let search = $state('');
	let activeLetter = $state('all');
	let limit = $state(25);

	// Tag filter state
	let activePlatforms = $state<Set<string>>(new Set());
	let activeGenres = $state<Set<string>>(new Set());
	let activeChallenges = $state<Set<string>>(new Set());

	// Tag search inputs
	let platformSearch = $state('');
	let genreSearch = $state('');
	let challengeSearch = $state('');

	// Dropdown visibility
	let showPlatforms = $state(false);
	let showGenres = $state(false);
	let showChallenges = $state(false);

	// ── Letters ───────────────────────────────────────────────
	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	function getFirstLetter(name: string): string {
		const ch = (name || '').trim().charAt(0).toUpperCase();
		if (ch >= '0' && ch <= '9') return '0-9';
		if (ch >= 'A' && ch <= 'Z') return ch;
		return 'other';
	}

	// ── Filtering ─────────────────────────────────────────────
	const hasActiveFilters = $derived(
		search || activeLetter !== 'all' ||
		activePlatforms.size > 0 || activeGenres.size > 0 || activeChallenges.size > 0
	);

	const allFiltered = $derived.by(() => {
		const q = search.toLowerCase().trim();
		return data.games.filter((g) => {
			// Letter filter
			if (activeLetter !== 'all') {
				const letter = getFirstLetter(g.game_name);
				if (activeLetter === '0-9') { if (letter !== '0-9') return false; }
				else if (activeLetter === 'other') { if (letter !== 'other') return false; }
				else if (letter !== activeLetter) return false;
			}
			// Text search
			if (q) {
				const nameMatch = g.game_name.toLowerCase().includes(q);
				const aliasMatch = g.game_name_aliases?.some((a: string) => a.toLowerCase().includes(q));
				if (!nameMatch && !aliasMatch) return false;
			}
			// Platform filter (must have ALL selected)
			if (activePlatforms.size > 0) {
				const gp = (g.platforms || []).map((p: string) => p.toLowerCase());
				for (const p of activePlatforms) { if (!gp.includes(p)) return false; }
			}
			// Genre filter
			if (activeGenres.size > 0) {
				const gg = (g.genres || []).map((g: string) => g.toLowerCase());
				for (const gen of activeGenres) { if (!gg.includes(gen)) return false; }
			}
			// Challenge filter
			if (activeChallenges.size > 0) {
				const gc = (g.challenges_data || []).map((c: any) => c.slug?.toLowerCase?.() || '');
				for (const ch of activeChallenges) { if (!gc.includes(ch)) return false; }
			}
			return true;
		});
	});

	const displayed = $derived(limit === 0 ? allFiltered : allFiltered.slice(0, limit));

	// ── Tag picker helpers ────────────────────────────────────
	function filteredSuggestions(list: { id: string; label: string }[], query: string, active: Set<string>) {
		const q = query.toLowerCase().trim();
		return list.filter((item) => !active.has(item.id) && (!q || item.label.toLowerCase().includes(q)));
	}

	function addTag(set: Set<string>, id: string) {
		const next = new Set(set);
		next.add(id);
		return next;
	}

	function removeTag(set: Set<string>, id: string) {
		const next = new Set(set);
		next.delete(id);
		return next;
	}

	function labelFor(list: { id: string; label: string }[], id: string) {
		return list.find((x) => x.id === id)?.label || id;
	}

	function resetAll() {
		search = '';
		activeLetter = 'all';
		activePlatforms = new Set();
		activeGenres = new Set();
		activeChallenges = new Set();
		platformSearch = '';
		genreSearch = '';
		challengeSearch = '';
	}
</script>

<svelte:head>
	<title>Games | Challenge Run Community</title>
</svelte:head>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="page-width games-controls">

	<h1>Games</h1>
	<p class="muted">Jump by letter or filter by platform, genre, and challenges.</p>

	<!-- ── A-Z Navigation ──────────────────────────────────── -->
	<div class="az">
		<a
			href="#0-9"
			class="az-wide"
			class:is-active={activeLetter === '0-9'}
			onclick={(e) => { e.preventDefault(); activeLetter = activeLetter === '0-9' ? 'all' : '0-9'; }}
		>#</a>
		{#each letters as L}
			<a
				href="#{L}"
				class:is-active={activeLetter === L}
				onclick={(e) => { e.preventDefault(); activeLetter = activeLetter === L ? 'all' : L; }}
			>{L}</a>
		{/each}
		<a
			href="#other"
			class="az-wide"
			class:is-active={activeLetter === 'other'}
			onclick={(e) => { e.preventDefault(); activeLetter = activeLetter === 'other' ? 'all' : 'other'; }}
		>Other</a>
		<a
			href="#all"
			class="az-wide muted"
			class:is-active={activeLetter === 'all'}
			onclick={(e) => { e.preventDefault(); activeLetter = 'all'; }}
		>All</a>
	</div>

	<!-- ── Text Search ─────────────────────────────────────── -->
	<div class="filter-wrap" style="margin-bottom: 1.25rem;">
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

	<!-- ── Platform / Genre / Challenge Filters ────────────── -->
	<div class="filters-grid filters-grid--three">

		<!-- Platform -->
		<div class="tag-filter">
			<div class="muted filter-label">Filter by platform:</div>
			<div class="tag-picker">
				<div class="tag-picked">
					{#each [...activePlatforms] as id}
						<span class="tag tag--small tag--removable" onclick={() => activePlatforms = removeTag(activePlatforms, id)}>
							{labelFor(data.platforms, id)} <span class="tag__remove">×</span>
						</span>
					{/each}
				</div>
				<div class="filter-wrap">
					<input
						class="tag-search"
						type="text"
						placeholder="Type a platform..."
						bind:value={platformSearch}
						onfocus={() => showPlatforms = true}
						onblur={() => setTimeout(() => showPlatforms = false, 200)}
						autocomplete="off"
						aria-label="Filter games by platform"
					/>
				</div>
				{#if showPlatforms}
					{@const suggestions = filteredSuggestions(data.platforms, platformSearch, activePlatforms)}
					<div class="tag-suggestions">
						{#if suggestions.length === 0}
							<div class="tag-suggestion is-empty">No matches</div>
						{:else}
							{#each suggestions.slice(0, 12) as item}
								<button class="tag-suggestion" onmousedown={() => { activePlatforms = addTag(activePlatforms, item.id); platformSearch = ''; }}>
									{item.label}
								</button>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Genre -->
		<div class="tag-filter">
			<div class="muted filter-label">Filter by genre:</div>
			<div class="tag-picker">
				<div class="tag-picked">
					{#each [...activeGenres] as id}
						<span class="tag tag--small tag--removable" onclick={() => activeGenres = removeTag(activeGenres, id)}>
							{labelFor(data.genres, id)} <span class="tag__remove">×</span>
						</span>
					{/each}
				</div>
				<div class="filter-wrap">
					<input
						class="tag-search"
						type="text"
						placeholder="Type a genre..."
						bind:value={genreSearch}
						onfocus={() => showGenres = true}
						onblur={() => setTimeout(() => showGenres = false, 200)}
						autocomplete="off"
						aria-label="Filter games by genre"
					/>
				</div>
				{#if showGenres}
					{@const suggestions = filteredSuggestions(data.genres, genreSearch, activeGenres)}
					<div class="tag-suggestions">
						{#if suggestions.length === 0}
							<div class="tag-suggestion is-empty">No matches</div>
						{:else}
							{#each suggestions.slice(0, 12) as item}
								<button class="tag-suggestion" onmousedown={() => { activeGenres = addTag(activeGenres, item.id); genreSearch = ''; }}>
									{item.label}
								</button>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		</div>

		<!-- Challenge -->
		<div class="tag-filter">
			<div class="muted filter-label">Filter by challenges:</div>
			<div class="tag-picker">
				<div class="tag-picked">
					{#each [...activeChallenges] as id}
						<span class="tag tag--small tag--removable" onclick={() => activeChallenges = removeTag(activeChallenges, id)}>
							{labelFor(data.challenges, id)} <span class="tag__remove">×</span>
						</span>
					{/each}
				</div>
				<div class="filter-wrap">
					<input
						class="tag-search"
						type="text"
						placeholder="Type a challenge..."
						bind:value={challengeSearch}
						onfocus={() => showChallenges = true}
						onblur={() => setTimeout(() => showChallenges = false, 200)}
						autocomplete="off"
						aria-label="Filter games by challenge"
					/>
				</div>
				{#if showChallenges}
					{@const suggestions = filteredSuggestions(data.challenges, challengeSearch, activeChallenges)}
					<div class="tag-suggestions">
						{#if suggestions.length === 0}
							<div class="tag-suggestion is-empty">No matches</div>
						{:else}
							{#each suggestions.slice(0, 12) as item}
								<button class="tag-suggestion" onmousedown={() => { activeChallenges = addTag(activeChallenges, item.id); challengeSearch = ''; }}>
									{item.label}
								</button>
							{/each}
						{/if}
					</div>
				{/if}
			</div>
		</div>

	</div>

	<!-- ── Results Bar ─────────────────────────────────────── -->
	<div class="results-bar">
		<div class="results-bar__left">
			<label class="muted" for="limit">Show</label>
			<select id="limit" class="select" bind:value={limit}>
				<option value={10}>10</option>
				<option value={25}>25</option>
				<option value={50}>50</option>
				<option value={100}>100</option>
				<option value={250}>250</option>
				<option value={0}>All</option>
			</select>
		</div>
		<div class="results-bar__center">
			<p class="muted">
				Showing {displayed.length} of {data.games.length} games{#if allFiltered.length !== data.games.length}&ensp;({allFiltered.length} match filters){/if}
			</p>
		</div>
		<div class="results-bar__right">
			{#if hasActiveFilters}
				<button type="button" class="btn btn--reset" onclick={resetAll}>Reset Filters</button>
			{/if}
		</div>
	</div>
</div>

<!-- ── Game Grid ───────────────────────────────────────── -->
<div class="page-width">
	<div class="grid">
		{#each displayed as game (game.game_id)}
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
