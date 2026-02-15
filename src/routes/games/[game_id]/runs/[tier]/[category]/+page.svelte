<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils';

	let { data } = $props();
	const game = $derived(data.game);
	const cat = $derived(data.category);
	const tier = $derived(data.tier);
	const parentSlug = $derived(data.parentSlug || cat.slug);

	// ── Filter state ────────────────────────────────────────────
	let searchQuery = $state('');
	let showAdvanced = $state(false);
	let sortKey = $state<'date' | 'time'>('date');
	let sortAsc = $state(false);

	// Advanced filter selections
	let selectedChallenges = $state<Set<string>>(new Set());
	let selectedRestrictions = $state<Set<string>>(new Set());
	let selectedCharacter = $state<string | null>(null);
	let selectedGlitch = $state<string | null>(null);

	const hasActiveFilters = $derived(
		searchQuery || selectedChallenges.size > 0 || selectedRestrictions.size > 0 ||
		selectedCharacter !== null || selectedGlitch !== null
	);

	// ── Video source detection ──────────────────────────────────
	function videoSource(url: string): string {
		if (!url) return '';
		if (url.includes('youtube.com') || url.includes('youtu.be')) return 'YouTube';
		if (url.includes('twitch.tv')) return 'Twitch';
		if (url.includes('bilibili.com')) return 'Bilibili';
		return 'Video';
	}

	// ── Resolve label from slug ─────────────────────────────────
	function resolveLabel(slug: string, list: { id: string; label: string }[]): string {
		return list.find((x) => x.id === slug)?.label || slug;
	}

	// ── Time parsing for sorting ────────────────────────────────
	function parseTime(t: string | undefined): number {
		if (!t || t === '—') return Infinity;
		const parts = t.split(':').map(Number);
		if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
		if (parts.length === 2) return parts[0] * 60 + parts[1];
		return parseFloat(t) || Infinity;
	}

	// ── Filter + sort runs ──────────────────────────────────────
	let filteredRuns = $derived.by(() => {
		const q = searchQuery.toLowerCase().trim();
		let result = [...data.runs];

		// Text search
		if (q) {
			result = result.filter((r) => {
				const searchable = [
					r.runner,
					r.runner_id,
					...(r.standard_challenges || []),
					r.character || '',
					...(r.restrictions || [])
				].join(' ').toLowerCase();
				return searchable.includes(q);
			});
		}

		// Challenge filter (any match)
		if (selectedChallenges.size > 0) {
			result = result.filter((r) => {
				const ids = r.standard_challenges || [];
				return ids.some((id: string) => selectedChallenges.has(id));
			});
		}

		// Restriction filter (must have all)
		if (selectedRestrictions.size > 0) {
			result = result.filter((r) => {
				const ids = r.restriction_ids || r.restrictions || [];
				return [...selectedRestrictions].every((s) => ids.includes(s));
			});
		}

		// Character filter
		if (selectedCharacter) {
			result = result.filter((r) => r.character === selectedCharacter);
		}

		// Glitch filter
		if (selectedGlitch) {
			result = result.filter((r) => r.glitch_id === selectedGlitch);
		}

		// Sort
		result.sort((a, b) => {
			let va: number | string, vb: number | string;
			if (sortKey === 'time') {
				va = parseTime(a.time_primary);
				vb = parseTime(b.time_primary);
			} else {
				va = String(a.date_completed || '');
				vb = String(b.date_completed || '');
			}
			return sortAsc ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
		});

		return result;
	});

	// ── Sort handlers ───────────────────────────────────────────
	function toggleSort(key: 'date' | 'time') {
		if (sortKey === key) {
			sortAsc = !sortAsc;
		} else {
			sortKey = key;
			sortAsc = key === 'time'; // time defaults ascending (fastest first)
		}
	}

	// ── Toggle helpers for multi-select ─────────────────────────
	function toggleChallenge(id: string) {
		const next = new Set(selectedChallenges);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedChallenges = next;
	}

	function toggleRestriction(id: string) {
		const next = new Set(selectedRestrictions);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedRestrictions = next;
	}

	function resetFilters() {
		searchQuery = '';
		selectedChallenges = new Set();
		selectedRestrictions = new Set();
		selectedCharacter = null;
		selectedGlitch = null;
	}
</script>

<svelte:head>
	<title>{cat.label} - {game.game_name} | CRC</title>
</svelte:head>

<!-- Category Pills Navigation -->
{#if data.siblingCategories.length > 1}
	<nav class="category-pills" aria-label="Categories">
		{#each data.siblingCategories as sibling}
			{@const isActive = sibling.slug === (cat.parentGroup || data.category.slug)}
			<a
				href="/games/{game.game_id}/runs/{tier}/{sibling.slug}"
				class="pill"
				class:pill--active={isActive}
				aria-current={isActive ? 'page' : undefined}
			>{sibling.label}</a>
		{/each}
	</nav>
{/if}

<!-- Subcategory Pills (for mini-challenges with children) -->
{#if data.subcategories.length > 0}
	<div class="subcategory-pills">
		<span class="muted sub-label">Browse:</span>
		<a
			href="/games/{game.game_id}/runs/{tier}/{parentSlug}"
			class="pill pill--sub"
			class:pill--active={!cat.parentGroup}
		>All</a>
		{#each data.subcategories as sub}
			<a
				href="/games/{game.game_id}/runs/{tier}/{sub.slug}"
				class="pill pill--sub"
				class:pill--active={cat.slug === sub.slug}
			>{sub.label}</a>
		{/each}
	</div>
{/if}

<!-- Filters -->
<div class="filters-wrap">
	<div class="filters-bar">
		<input
			type="text"
			class="filter-input"
			placeholder="Filter by runner, challenge, etc."
			bind:value={searchQuery}
		/>
		{#if fm.challenges.length > 0 || fm.restrictions.length > 0 || fm.showCharacter || fm.showGlitches}
			<button
				class="btn btn--filter-toggle"
				class:is-active={showAdvanced}
				onclick={() => showAdvanced = !showAdvanced}
			>
				<span>{showAdvanced ? '▲' : '▼'}</span> Advanced
			</button>
		{/if}
	</div>

	{#if showAdvanced}
		<div class="advanced-filters">
			<div class="filter-groups">
				{#if fm.showCharacter && fm.characters.length > 0}
					<div class="filter-group">
						<label class="filter-group__label">{fm.characterLabel}</label>
						<select class="filter-select" onchange={(e) => selectedCharacter = (e.target as HTMLSelectElement).value || null}>
							<option value="">All</option>
							{#each fm.characters as c}
								<option value={c.id} selected={selectedCharacter === c.id}>{c.label}</option>
							{/each}
						</select>
					</div>
				{/if}

				{#if fm.challenges.length > 0}
					<div class="filter-group">
						<label class="filter-group__label">Challenge</label>
						<div class="filter-options">
							{#each fm.challenges as ch}
								<button
									class="filter-opt"
									class:filter-opt--active={selectedChallenges.has(ch.id)}
									onclick={() => toggleChallenge(ch.id)}
								>{ch.label}</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if fm.restrictions.length > 0}
					<div class="filter-group">
						<label class="filter-group__label">Restrictions</label>
						<div class="filter-options">
							{#each fm.restrictions as r}
								<button
									class="filter-opt"
									class:filter-opt--active={selectedRestrictions.has(r.id)}
									onclick={() => toggleRestriction(r.id)}
								>{r.label}</button>
							{/each}
						</div>
					</div>
				{/if}

				{#if fm.showGlitches && fm.glitches.length > 0}
					<div class="filter-group">
						<label class="filter-group__label">Glitch Category</label>
						<select class="filter-select" onchange={(e) => selectedGlitch = (e.target as HTMLSelectElement).value || null}>
							<option value="">All</option>
							{#each fm.glitches as g}
								<option value={g.id} selected={selectedGlitch === g.id}>{g.label}</option>
							{/each}
						</select>
					</div>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Active filter chips -->
	{#if hasActiveFilters}
		<div class="filter-chips">
			{#each [...selectedChallenges] as id}
				<button class="chip" onclick={() => toggleChallenge(id)}>
					{resolveLabel(id, fm.challenges)} <span class="chip__x">×</span>
				</button>
			{/each}
			{#each [...selectedRestrictions] as id}
				<button class="chip" onclick={() => toggleRestriction(id)}>
					{resolveLabel(id, fm.restrictions)} <span class="chip__x">×</span>
				</button>
			{/each}
			{#if selectedCharacter}
				<button class="chip" onclick={() => selectedCharacter = null}>
					{resolveLabel(selectedCharacter, fm.characters)} <span class="chip__x">×</span>
				</button>
			{/if}
			{#if selectedGlitch}
				<button class="chip" onclick={() => selectedGlitch = null}>
					{resolveLabel(selectedGlitch, fm.glitches)} <span class="chip__x">×</span>
				</button>
			{/if}
			<button class="chip chip--reset" onclick={resetFilters}>Clear all</button>
		</div>
	{/if}

	<div class="results-status muted">
		{#if filteredRuns.length === data.runs.length}
			Showing all {data.runs.length} run{data.runs.length === 1 ? '' : 's'}
		{:else}
			Found {filteredRuns.length} of {data.runs.length} run{data.runs.length === 1 ? '' : 's'}
		{/if}
	</div>
</div>

<!-- Runs Table -->
{#if data.runs.length === 0}
	<div class="card empty-state">
		<p class="muted">No approved runs yet. Be the first!</p>
		<a href="/games/{game.game_id}/submit" class="btn btn--small">Submit a Run</a>
	</div>
{:else}
	<div class="table-wrap">
		<table class="runs-table">
			<thead>
				<tr>
					<th>Runner</th>
					{#if fm.showCharacter}
						<th>{fm.characterLabel}</th>
					{/if}
					<th>Challenge</th>
					<th>Restrictions</th>
					{#if fm.showGlitches}
						<th>Glitches</th>
					{/if}
					<th class="th-sortable" onclick={() => toggleSort('time')}>
						Time{#if fm.timingMethod}&nbsp;({fm.timingMethod}){/if}
						{#if sortKey === 'time'}<span class="sort-arrow">{sortAsc ? '↑' : '↓'}</span>{/if}
					</th>
					<th class="th-sortable" onclick={() => toggleSort('date')}>
						Date
						{#if sortKey === 'date'}<span class="sort-arrow">{sortAsc ? '↑' : '↓'}</span>{/if}
					</th>
					<th>Video</th>
				</tr>
			</thead>
			<tbody>
				{#each filteredRuns as run}
					<tr>
						<td data-label="Runner">
							<a href="/runners/{run.runner_id}">{run.runner}</a>
						</td>
						{#if fm.showCharacter}
							<td data-label={fm.characterLabel}>
								{run.character ? resolveLabel(run.character, fm.characters) : '—'}
							</td>
						{/if}
						<td data-label="Challenge">
							{#if run.standard_challenges?.length}
								<div class="cell-tags">
									{#each run.standard_challenges as ch}
										<span class="tag">{resolveLabel(ch, fm.challenges)}</span>
									{/each}
								</div>
							{:else}
								—
							{/if}
						</td>
						<td data-label="Restrictions">
							{#if (run.restriction_ids || run.restrictions)?.length}
								<div class="cell-tags">
									{#each (run.restriction_ids || run.restrictions || []) as r}
										<span class="tag">{resolveLabel(r, fm.restrictions)}</span>
									{/each}
								</div>
							{:else}
								—
							{/if}
						</td>
						{#if fm.showGlitches}
							<td data-label="Glitches">
								{#if run.glitch_id}
									<span class="tag">{resolveLabel(run.glitch_id, fm.glitches)}</span>
								{:else}
									—
								{/if}
							</td>
						{/if}
						<td data-label="Time">{formatTime(run.time_primary)}</td>
						<td data-label="Date">{formatDate(run.date_completed)}</td>
						<td data-label="Video">
							{#if run.video_url}
								<a class="video-link" href={run.video_url} target="_blank" rel="noopener">{videoSource(run.video_url)}</a>
							{:else}
								—
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}

<style>
	/* ── Category Pills ──────────────────────────────────────── */
	.category-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 1rem;
	}
	.subcategory-pills {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 1rem;
	}
	.sub-label { font-size: 0.8rem; margin-right: 0.25rem; }
	.pill {
		padding: 0.3rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 20px;
		font-size: 0.8rem;
		color: var(--muted);
		text-decoration: none;
		transition: border-color 0.15s, color 0.15s, background 0.15s;
		white-space: nowrap;
	}
	.pill:hover { border-color: var(--accent); color: var(--accent); }
	.pill--active { border-color: var(--accent); color: var(--accent); background: rgba(99, 102, 241, 0.08); font-weight: 600; }
	.pill--sub { font-size: 0.75rem; padding: 0.2rem 0.6rem; }

	/* ── Filters ──────────────────────────────────────────────── */
	.filters-wrap { margin-bottom: 1rem; }
	.filters-bar {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	.filter-input {
		flex: 1;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--bg);
		color: var(--fg);
		font-size: 0.9rem;
		font-family: inherit;
		transition: border-color 0.15s;
	}
	.filter-input:focus { outline: none; border-color: var(--accent); }
	.btn--filter-toggle {
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: transparent;
		color: var(--muted);
		font-size: 0.85rem;
		cursor: pointer;
		white-space: nowrap;
		transition: border-color 0.15s, color 0.15s;
	}
	.btn--filter-toggle:hover,
	.btn--filter-toggle.is-active { border-color: var(--accent); color: var(--accent); }

	.advanced-filters {
		padding: 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		margin-bottom: 0.5rem;
	}
	.filter-groups { display: flex; flex-direction: column; gap: 0.75rem; }
	.filter-group__label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.35rem; }
	.filter-select {
		width: 100%;
		padding: 0.4rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--bg);
		color: var(--fg);
		font-size: 0.85rem;
		font-family: inherit;
	}
	.filter-select:focus { outline: none; border-color: var(--accent); }
	.filter-options { display: flex; flex-wrap: wrap; gap: 0.3rem; }
	.filter-opt {
		padding: 0.25rem 0.6rem;
		border: 1px solid var(--border);
		border-radius: 4px;
		background: transparent;
		color: var(--muted);
		font-size: 0.8rem;
		cursor: pointer;
		transition: all 0.12s;
	}
	.filter-opt:hover { border-color: var(--accent); color: var(--fg); }
	.filter-opt--active { border-color: var(--accent); color: var(--accent); background: rgba(99, 102, 241, 0.08); }

	/* ── Filter chips ────────────────────────────────────────── */
	.filter-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
		margin-bottom: 0.5rem;
	}
	.chip {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.2rem 0.6rem;
		border: 1px solid var(--accent);
		border-radius: 20px;
		background: rgba(99, 102, 241, 0.08);
		color: var(--accent);
		font-size: 0.75rem;
		cursor: pointer;
		transition: background 0.12s;
	}
	.chip:hover { background: rgba(99, 102, 241, 0.15); }
	.chip__x { font-size: 0.85rem; line-height: 1; }
	.chip--reset { border-color: var(--border); color: var(--muted); background: transparent; }
	.chip--reset:hover { border-color: var(--muted); color: var(--fg); }

	.results-status { font-size: 0.8rem; margin-bottom: 0.5rem; }

	/* ── Table ────────────────────────────────────────────────── */
	.table-wrap { overflow-x: auto; }
	.runs-table { width: 100%; border-collapse: collapse; font-size: 0.9rem; }
	.runs-table th,
	.runs-table td {
		padding: 0.6rem 0.75rem;
		text-align: left;
		border-bottom: 1px solid var(--border);
	}
	.runs-table th {
		font-weight: 600;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--muted);
		white-space: nowrap;
	}
	.th-sortable { cursor: pointer; user-select: none; }
	.th-sortable:hover { color: var(--accent); }
	.sort-arrow { font-size: 0.85rem; margin-left: 0.25rem; }
	.runs-table td a { color: var(--accent); text-decoration: none; }
	.runs-table td a:hover { text-decoration: underline; }

	.cell-tags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
	.tag {
		display: inline-block;
		padding: 0.1rem 0.4rem;
		border: 1px solid var(--border);
		border-radius: 3px;
		font-size: 0.75rem;
		color: var(--muted);
		white-space: nowrap;
	}

	.video-link { white-space: nowrap; }

	.empty-state { padding: 2rem; text-align: center; margin-top: 1rem; }
	.empty-state p { margin: 0 0 0.75rem; }

	/* ── Responsive ──────────────────────────────────────────── */
	@media (max-width: 768px) {
		.runs-table thead { display: none; }
		.runs-table tr {
			display: block;
			margin-bottom: 0.75rem;
			padding: 0.75rem;
			border: 1px solid var(--border);
			border-radius: 8px;
			background: var(--surface);
		}
		.runs-table td {
			display: flex;
			justify-content: space-between;
			padding: 0.3rem 0;
			border: none;
		}
		.runs-table td::before {
			content: attr(data-label);
			font-weight: 600;
			font-size: 0.75rem;
			text-transform: uppercase;
			letter-spacing: 0.04em;
			color: var(--muted);
			margin-right: 1rem;
		}
	}
</style>
