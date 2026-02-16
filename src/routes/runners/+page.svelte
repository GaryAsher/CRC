<script lang="ts">
	let { data } = $props();

	let search = $state('');
	let activeLetter = $state('all');
	let limit = $state(25);

	const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

	function getFirstLetter(name: string): string {
		const ch = (name || '').trim().charAt(0).toUpperCase();
		if (ch >= '0' && ch <= '9') return '0-9';
		if (ch >= 'A' && ch <= 'Z') return ch;
		return 'other';
	}

	const hasActiveFilters = $derived(search || activeLetter !== 'all');

	const allFiltered = $derived.by(() => {
		const q = search.toLowerCase().trim();
		return data.runners.filter((r) => {
			// Letter filter
			if (activeLetter !== 'all') {
				const letter = getFirstLetter(r.runner_name);
				if (activeLetter === '0-9') { if (letter !== '0-9') return false; }
				else if (activeLetter === 'other') { if (letter !== 'other') return false; }
				else if (letter !== activeLetter) return false;
			}
			// Text search
			if (q && !r.runner_name.toLowerCase().includes(q)) return false;
			return true;
		});
	});

	const displayed = $derived(limit === 0 ? allFiltered : allFiltered.slice(0, limit));

	function resetAll() {
		search = '';
		activeLetter = 'all';
	}
</script>

<svelte:head>
	<title>Runners | Challenge Run Community</title>
</svelte:head>

<div class="page-width">
	<h1>Runners</h1>
	<p class="muted">Jump by letter or search.</p>

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
	<div class="filter-wrap" style="margin: 1.25rem 0;">
		<input
			class="filter"
			type="text"
			placeholder="Search runners..."
			bind:value={search}
			autocomplete="off"
			inputmode="search"
			aria-label="Search runners"
		/>
	</div>

	<!-- ── Results Bar ─────────────────────────────────────── -->
	<div class="results-bar">
		<div class="results-bar__left">
			<label class="muted" for="runner-limit">Show</label>
			<select id="runner-limit" class="select" bind:value={limit}>
				<option value={10}>10</option>
				<option value={25}>25</option>
				<option value={50}>50</option>
				<option value={100}>100</option>
				<option value={0}>All</option>
			</select>
		</div>
		<div class="results-bar__center">
			<p class="muted">
				Showing {displayed.length} of {data.runners.length} runners{#if allFiltered.length !== data.runners.length}&ensp;({allFiltered.length} match){/if}
			</p>
		</div>
		<div class="results-bar__right">
			{#if hasActiveFilters}
				<button type="button" class="btn btn--reset" onclick={resetAll}>Reset Filters</button>
			{/if}
		</div>
	</div>

	<!-- ── Runner Grid ─────────────────────────────────────── -->
	<div class="grid">
		{#each displayed as runner (runner.runner_id)}
			<a href="/runners/{runner.runner_id}" class="runner-card card-lift">
				<div
					class="runner-card__bg"
					style="background-image: url('{runner.avatar || '/img/site/default-runner.png'}');"
				></div>
				<div class="runner-card__overlay">
					<div class="runner-card__title">{runner.runner_name}</div>
				</div>
			</a>
		{/each}
	</div>
</div>
