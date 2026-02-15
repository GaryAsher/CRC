<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';

	let { data } = $props();
	const game = $derived(data.game);

	// ── Feature flags ───────────────────────────────────────
	const hasCategories = $derived(
		(game.full_runs?.length || 0) + (game.mini_challenges?.length || 0) + (game.player_made?.length || 0) > 0
	);
	const hasChallenges = $derived((game.challenges_data?.length || 0) > 0);
	const hasRestrictions = $derived((game.restrictions_data?.length || 0) > 0);
	const hasGlitches = $derived((game.glitches_data?.length || 0) > 0);
	const hasCharacter = $derived(!!game.character_column?.enabled);
	const characterLabel = $derived(game.character_column?.label || 'Character');
	const showRuleBuilder = $derived(hasCategories && hasChallenges);

	// ── Rule Builder State ──────────────────────────────────
	let rbOpen = $state(false);

	// Available run types
	const runTypes = $derived(() => {
		const types: { id: string; label: string }[] = [];
		if (game.full_runs?.length) types.push({ id: 'full_runs', label: 'Full Runs' });
		if (game.mini_challenges?.length) types.push({ id: 'mini_challenges', label: 'Mini-Challenges' });
		if (game.player_made?.length) types.push({ id: 'player_made', label: 'Player-Made' });
		return types;
	});

	let selectedRunType = $state<string>('full_runs');
	let selectedCategory = $state<string | null>(null);
	let selectedCharacter = $state<string | null>(null);
	let selectedGlitch = $state<string | null>(null);
	let selectedChallenges = $state<Set<string>>(new Set());
	let selectedRestrictions = $state<Set<string>>(new Set());

	// Build flat category list from tiered structure
	interface FlatCategory { slug: string; label: string; description?: string; tier: string }
	const flatCategories = $derived(() => {
		const cats: FlatCategory[] = [];
		function addFromList(list: any[], tier: string) {
			for (const cat of list || []) {
				if (cat.children?.length) {
					for (const child of cat.children) {
						cats.push({ slug: `${cat.slug}/${child.slug}`, label: child.label, description: child.description, tier });
					}
				} else {
					cats.push({ slug: cat.slug, label: cat.label, description: cat.description, tier });
				}
			}
		}
		addFromList(game.full_runs, 'full_runs');
		addFromList(game.mini_challenges, 'mini_challenges');
		addFromList(game.player_made, 'player_made');
		return cats;
	});

	const filteredCategories = $derived(flatCategories().filter((c) => c.tier === selectedRunType));

	const hasRuleContent = $derived(
		selectedCategory || selectedChallenges.size > 0 || selectedRestrictions.size > 0 ||
		selectedCharacter || selectedGlitch
	);

	// Lookup helpers
	function findCategory(slug: string): FlatCategory | undefined {
		return flatCategories().find((c) => c.slug === slug);
	}
	function findChallenge(slug: string) {
		return game.challenges_data?.find((c: any) => c.slug === slug);
	}
	function findRestriction(slug: string) {
		return game.restrictions_data?.find((r: any) => r.slug === slug);
	}
	function findGlitch(slug: string) {
		return game.glitches_data?.find((g: any) => g.slug === slug);
	}
	function findCharacter(slug: string) {
		return game.characters_data?.find((c: any) => c.slug === slug);
	}

	// Toggle helpers
	function toggleChallenge(id: string) {
		const next = new Set(selectedChallenges);
		if (next.has(id)) next.delete(id); else next.add(id);
		selectedChallenges = next;
	}
	function toggleRestriction(id: string) {
		const next = new Set(selectedRestrictions);
		if (next.has(id)) next.delete(id); else next.add(id);
		selectedRestrictions = next;
	}
	function resetBuilder() {
		selectedCategory = null;
		selectedCharacter = null;
		selectedGlitch = null;
		selectedChallenges = new Set();
		selectedRestrictions = new Set();
	}

	// Build "See Runners" URL
	const runnersUrl = $derived(() => {
		if (!selectedCategory) return null;
		const cat = findCategory(selectedCategory);
		if (!cat) return null;
		const tierSlug = cat.tier.replace(/_/g, '-');
		let url = `/games/${game.game_id}/runs/${tierSlug}/${cat.slug}/`;
		const filters: Record<string, any> = {};
		if (selectedChallenges.size > 0) filters.challenges = [...selectedChallenges];
		if (selectedRestrictions.size > 0) filters.restrictions = [...selectedRestrictions];
		if (selectedGlitch) filters.glitch = selectedGlitch;
		if (selectedCharacter) filters.character = selectedCharacter;
		if (Object.keys(filters).length > 0) {
			url += '#filters=' + encodeURIComponent(JSON.stringify(filters));
		}
		return url;
	});
</script>

<svelte:head>
	<title>Rules - {game.game_name} | CRC</title>
</svelte:head>

<h1>Rules & Definitions</h1>
<p class="muted mb-2">Official rules, category definitions, and challenge guidelines for {game.game_name}.</p>

<!-- ═══ Rule Builder ═══════════════════════════════════════ -->
{#if showRuleBuilder}
	<div class="card card--compact rule-builder" class:rule-builder--expanded={rbOpen}>
		<div class="rule-builder__header">
			<span class="muted">📌 Rule Builder — Build your ruleset and find runners</span>
			<button class="btn btn--filter-toggle" class:is-active={rbOpen} onclick={() => rbOpen = !rbOpen}>
				{rbOpen ? '▲ Close' : '▼ Open'}
			</button>
		</div>

		{#if rbOpen}
			<div class="rule-builder__body">
				<div class="rb-groups">
					<!-- Run Type -->
					{#if runTypes().length > 1}
						<div class="rb-group">
							<label class="rb-label" for="rb-run-type">Run Type</label>
							<select class="rb-select" id="rb-run-type" bind:value={selectedRunType} onchange={() => { selectedCategory = null; }}>
								{#each runTypes() as rt}
									<option value={rt.id}>{rt.label}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Category -->
					<div class="rb-group">
						<label class="rb-label" for="rb-category">Category</label>
						<select class="rb-select" id="rb-category" bind:value={selectedCategory}>
							<option value={null}>— Select category —</option>
							{#each filteredCategories as cat}
								<option value={cat.slug}>{cat.label}</option>
							{/each}
						</select>
					</div>

					<!-- Character -->
					{#if hasCharacter && game.characters_data?.length}
						<div class="rb-group">
							<label class="rb-label" for="rb-character">{characterLabel}</label>
							<select class="rb-select" id="rb-character" bind:value={selectedCharacter}>
								<option value={null}>— Any —</option>
								{#each game.characters_data as c}
									<option value={c.slug}>{c.label}</option>
								{/each}
							</select>
						</div>
					{/if}

					<!-- Challenges (multi-select toggles) -->
					{#if hasChallenges}
						<div class="rb-group">
							<span class="rb-label">Challenges</span>
							<div class="rb-toggles">
								{#each game.challenges_data as ch}
									<button
										class="rb-toggle"
										class:rb-toggle--active={selectedChallenges.has(ch.slug)}
										onclick={() => toggleChallenge(ch.slug)}
									>{ch.label}</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Restrictions (multi-select toggles) -->
					{#if hasRestrictions}
						<div class="rb-group">
							<span class="rb-label">Restrictions</span>
							<div class="rb-toggles">
								{#each game.restrictions_data as r}
									<button
										class="rb-toggle"
										class:rb-toggle--active={selectedRestrictions.has(r.slug)}
										onclick={() => toggleRestriction(r.slug)}
									>{r.label}</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Glitches -->
					{#if hasGlitches}
						<div class="rb-group">
							<label class="rb-label" for="rb-glitch">Glitch Category</label>
							<select class="rb-select" id="rb-glitch" bind:value={selectedGlitch}>
								<option value={null}>— Any —</option>
								{#each game.glitches_data as g}
									<option value={g.slug}>{g.label}</option>
								{/each}
							</select>
						</div>
					{/if}
				</div>

				<!-- Active Chips -->
				{#if hasRuleContent}
					<div class="rb-chips">
						{#if selectedCategory}
							{@const cat = findCategory(selectedCategory)}
							<button class="chip" onclick={() => selectedCategory = null}>{cat?.label || selectedCategory} <span class="chip__x">×</span></button>
						{/if}
						{#if selectedCharacter}
							{@const ch = findCharacter(selectedCharacter)}
							<button class="chip" onclick={() => selectedCharacter = null}>{ch?.label || selectedCharacter} <span class="chip__x">×</span></button>
						{/if}
						{#each [...selectedChallenges] as id}
							{@const ch = findChallenge(id)}
							<button class="chip" onclick={() => toggleChallenge(id)}>{ch?.label || id} <span class="chip__x">×</span></button>
						{/each}
						{#each [...selectedRestrictions] as id}
							{@const r = findRestriction(id)}
							<button class="chip" onclick={() => toggleRestriction(id)}>{r?.label || id} <span class="chip__x">×</span></button>
						{/each}
						{#if selectedGlitch}
							{@const g = findGlitch(selectedGlitch)}
							<button class="chip" onclick={() => selectedGlitch = null}>{g?.label || selectedGlitch} <span class="chip__x">×</span></button>
						{/if}
						<button class="chip chip--reset" onclick={resetBuilder}>Clear all</button>
					</div>
				{/if}

				<!-- Rules Summary Panel -->
				{#if hasRuleContent}
					<div class="rb-summary">
						<h3>📋 Your Ruleset</h3>
						<div class="rb-summary__content">
							{#if selectedCategory}
								{@const cat = findCategory(selectedCategory)}
								<div class="rb-rule">
									<strong>Category:</strong> {cat?.label}
									{#if cat?.description}
										<div class="rb-rule__desc">{@html renderMarkdown(cat.description)}</div>
									{/if}
								</div>
							{/if}
							{#if selectedCharacter}
								{@const ch = findCharacter(selectedCharacter)}
								<div class="rb-rule">
									<strong>{characterLabel}:</strong> {ch?.label || selectedCharacter}
								</div>
							{/if}
							{#each [...selectedChallenges] as id}
								{@const ch = findChallenge(id)}
								{#if ch}
									<div class="rb-rule">
										<strong>Challenge:</strong> {ch.label}
										{#if ch.description}
											<div class="rb-rule__desc">{@html renderMarkdown(ch.description)}</div>
										{/if}
									</div>
								{/if}
							{/each}
							{#each [...selectedRestrictions] as id}
								{@const r = findRestriction(id)}
								{#if r}
									<div class="rb-rule">
										<strong>Restriction:</strong> {r.label}
										{#if r.description}
											<div class="rb-rule__desc">{@html renderMarkdown(r.description)}</div>
										{/if}
									</div>
								{/if}
							{/each}
							{#if selectedGlitch}
								{@const g = findGlitch(selectedGlitch)}
								{#if g}
									<div class="rb-rule">
										<strong>Glitch Rules:</strong> {g.label}
										{#if g.description}
											<div class="rb-rule__desc">{@html renderMarkdown(g.description)}</div>
										{/if}
									</div>
								{/if}
							{/if}
						</div>

						{#if runnersUrl()}
							<div class="rb-actions">
								<a href={runnersUrl()} class="btn btn--accent">🔍 See runners who completed this</a>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		{/if}
	</div>
{/if}

<!-- ═══ Accordions ═════════════════════════════════════════ -->

<!-- General Rules -->
<details class="accordion accordion--section" open>
	<summary class="accordion__header accordion__header--section">
		<span>General Rules</span>
		<span class="accordion__icon">▼</span>
	</summary>
	<div class="accordion__content">
		{#if game.general_rules}
			<div class="md">{@html renderMarkdown(game.general_rules)}</div>
		{:else}
			<ul>
				<li><strong>Timing Method:</strong> {game.timing_method || 'RTA (Real Time Attack)'}</li>
				<li><strong>Video Required:</strong> All submissions must include video proof</li>
				<li><strong>No Cheats/Mods:</strong> External tools or gameplay-altering mods are not allowed</li>
			</ul>
		{/if}
	</div>
</details>

<!-- Run Categories -->
{#if hasCategories}
	<details class="accordion accordion--section">
		<summary class="accordion__header accordion__header--section">
			<span>Run Categories</span>
			<span class="accordion__icon">▼</span>
		</summary>
		<div class="accordion__content">
			<!-- Full Runs -->
			{#if game.full_runs?.length}
				<details class="accordion accordion--tier">
					<summary class="accordion__header accordion__header--tier">
						<span>Full Runs</span>
						<span class="accordion__icon">▼</span>
					</summary>
					<div class="accordion__content">
						{#each game.full_runs as cat}
							<details class="accordion">
								<summary class="accordion__header">
									<span>{cat.label}</span>
									<span class="accordion__icon">▼</span>
								</summary>
								<div class="accordion__content">
									{#if cat.description}
										<div class="md">{@html renderMarkdown(cat.description)}</div>
									{:else}
										<p class="muted">See resources for rules.</p>
									{/if}
									{#if cat.children?.length}
										<div class="subcats">
											<strong>Subcategories:</strong>
											<ul>
												{#each cat.children as child}
													<li>
														<strong>{child.label}</strong>
														{#if child.description}
															<div class="md">{@html renderMarkdown(child.description)}</div>
														{/if}
													</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							</details>
						{/each}
					</div>
				</details>
			{/if}

			<!-- Mini-Challenges -->
			{#if game.mini_challenges?.length}
				<details class="accordion accordion--tier">
					<summary class="accordion__header accordion__header--tier">
						<span>Mini-Challenges</span>
						<span class="accordion__icon">▼</span>
					</summary>
					<div class="accordion__content">
						{#each game.mini_challenges as group}
							<details class="accordion">
								<summary class="accordion__header">
									<span>{group.label}</span>
									<span class="accordion__icon">▼</span>
								</summary>
								<div class="accordion__content">
									{#if group.description}
										<div class="md">{@html renderMarkdown(group.description)}</div>
									{:else}
										<p class="muted">See resources for rules.</p>
									{/if}
									{#if group.children?.length}
										<div class="subcats">
											<strong>Subcategories:</strong>
											<ul>
												{#each group.children as child}
													<li>
														<strong>{child.label}</strong>
														{#if child.description}
															<div class="md">{@html renderMarkdown(child.description)}</div>
														{/if}
													</li>
												{/each}
											</ul>
										</div>
									{/if}
								</div>
							</details>
						{/each}
					</div>
				</details>
			{/if}

			<!-- Player-Made -->
			{#if game.player_made?.length}
				<details class="accordion accordion--tier">
					<summary class="accordion__header accordion__header--tier">
						<span>Player-Made Challenges</span>
						<span class="accordion__icon">▼</span>
					</summary>
					<div class="accordion__content">
						{#each game.player_made as cat}
							<details class="accordion">
								<summary class="accordion__header">
									<span>{cat.label}</span>
									<span class="accordion__icon">▼</span>
								</summary>
								<div class="accordion__content">
									{#if cat.description}
										<div class="md">{@html renderMarkdown(cat.description)}</div>
									{:else}
										<p class="muted">See resources for rules.</p>
									{/if}
								</div>
							</details>
						{/each}
					</div>
				</details>
			{:else}
				<details class="accordion accordion--tier">
					<summary class="accordion__header accordion__header--tier">
						<span>Player-Made Challenges</span>
						<span class="accordion__icon">▼</span>
					</summary>
					<div class="accordion__content">
						<p class="muted">None exist yet. Have an idea? Suggest one!</p>
					</div>
				</details>
			{/if}
		</div>
	</details>
{/if}

<!-- Challenges -->
{#if hasChallenges}
	<details class="accordion accordion--section">
		<summary class="accordion__header accordion__header--section">
			<span>Challenges</span>
			<span class="accordion__icon">▼</span>
		</summary>
		<div class="accordion__content">
			{#each game.challenges_data as ch}
				<details class="accordion">
					<summary class="accordion__header">
						<span>{ch.label}</span>
						<span class="accordion__icon">▼</span>
					</summary>
					<div class="accordion__content">
						{#if ch.description}
							<div class="md">{@html renderMarkdown(ch.description)}</div>
						{:else}
							<p class="muted">No specific rules defined for this challenge type.</p>
						{/if}
					</div>
				</details>
			{/each}
		</div>
	</details>
{/if}

<!-- Restrictions -->
{#if hasRestrictions}
	<details class="accordion accordion--section">
		<summary class="accordion__header accordion__header--section">
			<span>Optional Restrictions</span>
			<span class="accordion__icon">▼</span>
		</summary>
		<div class="accordion__content">
			{#each game.restrictions_data as res}
				<details class="accordion">
					<summary class="accordion__header">
						<span>{res.label}</span>
						<span class="accordion__icon">▼</span>
					</summary>
					<div class="accordion__content">
						{#if res.description}
							<div class="md">{@html renderMarkdown(res.description)}</div>
						{:else}
							<p class="muted">Can be combined with any category.</p>
						{/if}
					</div>
				</details>
			{/each}
		</div>
	</details>
{/if}

<!-- Glitches -->
{#if hasGlitches}
	<details class="accordion accordion--section">
		<summary class="accordion__header accordion__header--section">
			<span>Glitch Categories</span>
			<span class="accordion__icon">▼</span>
		</summary>
		<div class="accordion__content">
			{#each game.glitches_data as g}
				<details class="accordion">
					<summary class="accordion__header">
						<span>{g.label}</span>
						<span class="accordion__icon">▼</span>
					</summary>
					<div class="accordion__content">
						{#if g.description}
							<div class="md">{@html renderMarkdown(g.description)}</div>
						{:else}
							<p class="muted">See resources for detailed rules.</p>
						{/if}
					</div>
				</details>
			{/each}
		</div>
	</details>
{/if}

<style>
	h1 { margin: 0 0 0.25rem; }
	.mb-2 { margin-bottom: 1rem; }

	/* ── Rule Builder ────────────────────────────────────── */
	.rule-builder { margin-bottom: 1.5rem; }
	.rule-builder__header {
		display: flex; justify-content: space-between; align-items: center; gap: 1rem;
	}
	.rule-builder__body { margin-top: 1rem; }
	.btn--filter-toggle {
		padding: 0.4rem 0.7rem; border: 1px solid var(--border); border-radius: 6px;
		background: transparent; color: var(--muted); font-size: 0.85rem; cursor: pointer;
		font-family: inherit; white-space: nowrap; transition: border-color 0.15s, color 0.15s;
	}
	.btn--filter-toggle:hover, .btn--filter-toggle.is-active { border-color: var(--accent); color: var(--accent); }
	.btn--accent {
		display: inline-block; padding: 0.5rem 1rem; border: none; border-radius: 6px;
		background: var(--accent); color: #fff; font-size: 0.9rem; font-family: inherit;
		text-decoration: none; cursor: pointer; transition: opacity 0.15s;
	}
	.btn--accent:hover { opacity: 0.9; }

	.rb-groups { display: flex; flex-direction: column; gap: 0.75rem; }
	.rb-group { }
	.rb-label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.3rem; }
	.rb-select {
		width: 100%; padding: 0.45rem 0.6rem; border: 1px solid var(--border); border-radius: 6px;
		background: var(--bg); color: var(--fg); font-size: 0.85rem; font-family: inherit;
	}
	.rb-select:focus { outline: none; border-color: var(--accent); }
	.rb-toggles { display: flex; flex-wrap: wrap; gap: 0.3rem; }
	.rb-toggle {
		padding: 0.25rem 0.6rem; border: 1px solid var(--border); border-radius: 4px;
		background: transparent; color: var(--muted); font-size: 0.8rem; cursor: pointer;
		font-family: inherit; transition: all 0.12s;
	}
	.rb-toggle:hover { border-color: var(--accent); color: var(--fg); }
	.rb-toggle--active { border-color: var(--accent); color: var(--accent); background: rgba(99,102,241,0.08); }

	/* ── Chips ────────────────────────────────────────────── */
	.rb-chips { display: flex; flex-wrap: wrap; gap: 0.35rem; margin-top: 0.75rem; }
	.chip {
		display: inline-flex; align-items: center; gap: 0.3rem;
		padding: 0.2rem 0.6rem; border: 1px solid var(--accent); border-radius: 20px;
		background: rgba(99,102,241,0.08); color: var(--accent); font-size: 0.75rem;
		cursor: pointer; font-family: inherit; transition: background 0.12s;
	}
	.chip:hover { background: rgba(99,102,241,0.15); }
	.chip__x { font-size: 0.85rem; line-height: 1; }
	.chip--reset { border-color: var(--border); color: var(--muted); background: transparent; }
	.chip--reset:hover { border-color: var(--muted); color: var(--fg); }

	/* ── Summary Panel ───────────────────────────────────── */
	.rb-summary {
		margin-top: 1rem; padding: 1rem; background: var(--bg);
		border: 1px solid var(--border); border-radius: 8px;
	}
	.rb-summary h3 { margin: 0 0 0.75rem; font-size: 1rem; }
	.rb-summary__content { display: flex; flex-direction: column; gap: 0.75rem; }
	.rb-rule strong { font-size: 0.9rem; }
	.rb-rule__desc {
		margin-top: 0.35rem; padding-left: 0.75rem; border-left: 2px solid var(--border);
		font-size: 0.85rem; color: var(--muted);
	}
	.rb-rule__desc :global(ul) { margin: 0.25rem 0; padding-left: 1.25rem; }
	.rb-rule__desc :global(li) { margin-bottom: 0.15rem; }
	.rb-rule__desc :global(p) { margin: 0.25rem 0; }
	.rb-actions { margin-top: 1rem; text-align: right; }

	/* ── Accordions ──────────────────────────────────────── */
	.accordion { margin-bottom: 0.5rem; border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
	.accordion--section { margin-bottom: 1rem; border-width: 2px; }
	.accordion--tier { margin: 0.5rem 0; border-style: dashed; }

	.accordion__header {
		display: flex; justify-content: space-between; align-items: center;
		padding: 0.75rem 1rem; cursor: pointer; user-select: none;
		font-weight: 600; font-size: 0.95rem; list-style: none;
		background: var(--surface); transition: background 0.15s;
	}
	.accordion__header:hover { background: var(--bg); }
	.accordion__header::-webkit-details-marker { display: none; }
	.accordion__header--section { font-size: 1.1rem; padding: 0.85rem 1.15rem; }
	.accordion__header--tier { font-size: 1rem; font-style: italic; }
	.accordion__icon { font-size: 0.75rem; transition: transform 0.2s; color: var(--muted); }
	details[open] > .accordion__header .accordion__icon { transform: rotate(180deg); }

	.accordion__content { padding: 0.75rem 1rem; }
	.accordion__content .accordion { margin-left: 0; }

	/* Markdown content inside accordions */
	.md :global(ul) { margin: 0.5rem 0; padding-left: 1.5rem; }
	.md :global(li) { margin-bottom: 0.35rem; line-height: 1.5; }
	.md :global(p) { margin: 0.5rem 0; line-height: 1.5; }
	.md :global(strong) { color: var(--fg); }
	.md :global(code) { font-size: 0.85em; padding: 0.15rem 0.35rem; background: var(--surface); border-radius: 3px; }

	.subcats { margin-top: 0.75rem; }
	.subcats ul { margin-top: 0.5rem; padding-left: 1.5rem; }
	.subcats li { margin-bottom: 0.5rem; }
	.subcats li strong { color: var(--accent); }

	/* ── Responsive ──────────────────────────────────────── */
	@media (max-width: 640px) {
		.accordion__header { padding: 0.6rem 0.75rem; font-size: 0.9rem; }
		.accordion__header--section { font-size: 1rem; }
		.accordion__content { padding: 0.6rem 0.75rem; }
		.rb-groups { gap: 0.5rem; }
	}
</style>
