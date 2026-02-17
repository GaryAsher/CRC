<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { data } = $props();
	const game = $derived(data.game);
	const cat = $derived(data.category);

	// ── Config ──
	const PAGE_SIZE = 25;

	// ── Filter & Sort State ──
	let query = $state('');
	let sortDir = $state<'desc' | 'asc'>('desc'); // newest first by default

	// ── Filtered + Sorted Runs ──
	const processedRuns = $derived(() => {
		let runs = [...data.runs];

		// Text filter across runner name, character, challenges, restrictions
		if (query.trim()) {
			const q = query.toLowerCase().trim();
			runs = runs.filter((r) => {
				const fields = [
					r.runner,
					r.character,
					...(r.standard_challenges || []),
					...(r.restrictions || [])
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase();
				return fields.includes(q);
			});
		}

		// Sort by date
		runs.sort((a, b) => {
			const da = new Date(a.date_completed).getTime() || 0;
			const db = new Date(b.date_completed).getTime() || 0;
			return sortDir === 'desc' ? db - da : da - db;
		});

		return runs;
	});

	// ── Pagination ──
	let currentPage = $state(1);

	// Reset to page 1 when filter changes
	$effect(() => {
		// Access query to track it
		query;
		currentPage = 1;
	});

	const totalPages = $derived(Math.max(1, Math.ceil(processedRuns().length / PAGE_SIZE)));
	const safeCurrentPage = $derived(Math.min(currentPage, totalPages));
	const pagedRuns = $derived(() => {
		const all = processedRuns();
		const start = (safeCurrentPage - 1) * PAGE_SIZE;
		return all.slice(start, start + PAGE_SIZE);
	});
	const showingStart = $derived(processedRuns().length === 0 ? 0 : (safeCurrentPage - 1) * PAGE_SIZE + 1);
	const showingEnd = $derived(Math.min(safeCurrentPage * PAGE_SIZE, processedRuns().length));

	let tableEl: HTMLElement | undefined = $state();

	function goToPage(p: number) {
		currentPage = Math.max(1, Math.min(p, totalPages));
		tableEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function toggleSort() {
		sortDir = sortDir === 'desc' ? 'asc' : 'desc';
	}
</script>

<svelte:head>
	<title>{cat.label} - {game.game_name} | CRC</title>
</svelte:head>

<p class="muted page-back">
	<a href="/games/{game.game_id}/runs">← All Categories</a>
</p>

<h2>{cat.label}</h2>
{#if cat.description}
	<p class="muted">{cat.description}</p>
{/if}
{#if cat.parentGroupLabel}
	<p class="muted">Part of: {cat.parentGroupLabel}</p>
{/if}

{#if data.runs.length === 0}
	<div class="card" style="margin-top:1rem;">
		<p class="muted">No approved runs yet. Be the first!</p>
		<a href="/games/{game.game_id}/submit" class="btn btn--small">Submit a Run</a>
	</div>
{:else}
	<!-- Filter Bar -->
	<div class="filter-bar" bind:this={tableEl}>
		<div class="filter-input">
			<input
				type="text"
				placeholder="Filter by runner, challenge, etc."
				bind:value={query}
				class="filter-input__field"
			/>
			{#if query}
				<button class="filter-input__clear" onclick={() => query = ''} aria-label="Clear filter">✕</button>
			{/if}
		</div>
		<span class="filter-status muted">
			{processedRuns().length} run{processedRuns().length !== 1 ? 's' : ''}
			{#if query}(filtered){/if}
		</span>
	</div>

	<!-- Runs Table -->
	<div class="table-wrap">
		<table class="runs-table">
			<thead>
				<tr>
					<th>#</th>
					<th>Runner</th>
					{#if game.character_column?.enabled}
						<th>{game.character_column.label}</th>
					{/if}
					<th>Challenges</th>
					{#if data.runs.some(r => r.restrictions?.length)}
						<th>Restrictions</th>
					{/if}
					<th>Time</th>
					<th>
						<button class="th-sort" onclick={toggleSort} title="Sort by date">
							Date {sortDir === 'desc' ? '▼' : '▲'}
						</button>
					</th>
					<th>Video</th>
				</tr>
			</thead>
			<tbody>
				{#each pagedRuns() as run, i}
					<tr>
						<td class="col-rank">{showingStart + i}</td>
						<td>
							<a href="/runners/{run.runner_id}">{run.runner}</a>
							{#if run.verified}
								<span class="verified-badge" title="Verified">✓</span>
							{/if}
						</td>
						{#if game.character_column?.enabled}
							<td>{run.character || '—'}</td>
						{/if}
						<td>
							{#each run.standard_challenges || [] as ch}
								<span class="tag tag--small">{ch}</span>
							{/each}
						</td>
						{#if data.runs.some(r => r.restrictions?.length)}
							<td>
								{#each run.restrictions || [] as r}
									<span class="tag tag--small tag--restriction">{r}</span>
								{/each}
								{#if !run.restrictions?.length}—{/if}
							</td>
						{/if}
						<td class="col-time">{formatTime(run.time_primary)}</td>
						<td class="col-date">{formatDate(run.date_completed)}</td>
						<td>
							{#if run.video_url}
								<a href={run.video_url} target="_blank" rel="noopener" class="video-link">▶ Watch</a>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Pagination Controls -->
	{#if totalPages > 1}
		<div class="pagination">
			<button
				class="btn btn--small"
				disabled={safeCurrentPage <= 1}
				onclick={() => goToPage(safeCurrentPage - 1)}
			>
				← Prev
			</button>

			<span class="pagination__status">
				Page {safeCurrentPage} of {totalPages} · Showing {showingStart}–{showingEnd} of {processedRuns().length}
			</span>

			<button
				class="btn btn--small"
				disabled={safeCurrentPage >= totalPages}
				onclick={() => goToPage(safeCurrentPage + 1)}
			>
				Next →
			</button>
		</div>
	{:else}
		<p class="pagination__status muted" style="text-align: center; margin-top: 0.75rem;">
			Showing {showingStart}–{showingEnd} of {processedRuns().length}
		</p>
	{/if}
{/if}

<style>
	.page-back { margin-bottom: 1rem; }
	.page-back a { color: var(--text-muted); text-decoration: none; }
	.page-back a:hover { color: var(--fg); }
	h2 { margin-bottom: 0.5rem; }

	/* Filter Bar */
	.filter-bar {
		display: flex; align-items: center; gap: 0.75rem; margin-top: 1rem; margin-bottom: 0.75rem;
		flex-wrap: wrap;
	}
	.filter-input {
		position: relative; flex: 1; min-width: 200px;
	}
	.filter-input__field {
		width: 100%; padding: 0.5rem 0.75rem; padding-right: 2rem;
		background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
		color: var(--fg); font-size: 0.9rem; font-family: inherit;
	}
	.filter-input__field:focus { outline: none; border-color: var(--accent); }
	.filter-input__field::placeholder { color: var(--text-muted); }
	.filter-input__clear {
		position: absolute; right: 0.5rem; top: 50%; transform: translateY(-50%);
		background: none; border: none; color: var(--text-muted); cursor: pointer;
		font-size: 0.85rem; padding: 0.25rem;
	}
	.filter-input__clear:hover { color: var(--fg); }
	.filter-status { font-size: 0.8rem; white-space: nowrap; }

	/* Table */
	.table-wrap { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; }
	th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
	th {
		font-weight: 600; font-size: 0.75rem; text-transform: uppercase;
		letter-spacing: 0.05em; color: var(--text-muted);
		position: sticky; top: 0; background: var(--bg); z-index: 1;
	}
	td a { color: var(--accent); text-decoration: none; }
	td a:hover { text-decoration: underline; }
	.col-rank { color: var(--text-muted); font-size: 0.8rem; width: 2rem; }
	.col-time { font-family: monospace; font-size: 0.9rem; white-space: nowrap; }
	.col-date { white-space: nowrap; font-size: 0.85rem; }

	/* Sort button in header */
	.th-sort {
		background: none; border: none; color: var(--text-muted); cursor: pointer;
		font-weight: 600; font-size: 0.75rem; text-transform: uppercase;
		letter-spacing: 0.05em; padding: 0; font-family: inherit;
	}
	.th-sort:hover { color: var(--fg); }

	/* Tags */
	.tag--small {
		display: inline-block; padding: 0.1rem 0.4rem; border-radius: 4px;
		font-size: 0.7rem; font-weight: 500; margin-right: 0.25rem;
		background: rgba(99, 102, 241, 0.12); color: #818cf8;
	}
	.tag--restriction {
		background: rgba(245, 158, 11, 0.12); color: #f59e0b;
	}

	/* Verified badge */
	.verified-badge {
		display: inline-flex; align-items: center; justify-content: center;
		width: 16px; height: 16px; border-radius: 50%; font-size: 0.6rem;
		background: rgba(16, 185, 129, 0.2); color: #10b981;
		margin-left: 0.35rem; vertical-align: middle;
	}

	/* Video link */
	.video-link { white-space: nowrap; }

	/* Pagination */
	.pagination {
		display: flex; align-items: center; justify-content: center;
		gap: 1rem; margin-top: 1rem; padding: 0.5rem 0;
	}
	.pagination__status { font-size: 0.8rem; color: var(--text-muted); }

	/* Responsive */
	@media (max-width: 768px) {
		th, td { padding: 0.4rem 0.5rem; font-size: 0.85rem; }
		.col-rank { display: none; }
		th:first-child { display: none; }
	}
</style>
