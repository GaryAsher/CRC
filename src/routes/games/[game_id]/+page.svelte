<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';
	import { formatDate } from '$lib/utils';

	let { data } = $props();
	const game = $derived(data.game);
</script>

<svelte:head>
	<title>{game.game_name} | Challenge Run Community</title>
</svelte:head>

<!-- ═══ Modded/Base Game Links ═══════════════════════════ -->
{#if game.is_modded && data.baseGame}
	<div class="link-banner link-banner--base">
		<span>🎮</span>
		<span>This is a <strong>modded version</strong>. Looking for the vanilla game?</span>
		<a href="/games/{data.baseGame.game_id}" class="btn btn--small">View {data.baseGame.game_name}</a>
	</div>
{/if}

{#if data.moddedVersions.length > 0}
	<div class="link-banner link-banner--modded">
		<span>🔧</span>
		<span><strong>Modded versions available!</strong> Run with custom content.</span>
		<div class="link-banner__links">
			{#each data.moddedVersions as mod}
				<a href="/games/{mod.game_id}" class="btn btn--small btn--outline">{mod.game_name}</a>
			{/each}
		</div>
	</div>
{/if}

<!-- ═══ Game Description ════════════════════════════════ -->
{#if game.content}
	<section class="card">
		<div class="md">{@html renderMarkdown(game.content)}</div>
	</section>
{:else}
	<section class="card">
		<p class="muted"><em>📝 Game description needed. Want to help? Visit the Resources tab to learn how to contribute.</em></p>
	</section>
{/if}

<!-- ═══ Submit Run CTA ══════════════════════════════════ -->
<section class="submit-cta">
	<a href="/submit?game={game.game_id}" class="btn btn--accent">Submit a Run for {game.game_name}</a>
</section>

<!-- ═══ General Rules (Accordion) ═══════════════════════ -->
<section class="card card--compact">
	<details open>
		<summary class="rules-summary">
			<h2>📋 General Rules</h2>
			<span class="accordion-icon">▼</span>
		</summary>
		<div class="rules-body">
			{#if game.general_rules}
				<p class="muted mb-1">Core rules that apply to all {game.game_name} runs:</p>
				<div class="md">{@html renderMarkdown(game.general_rules)}</div>
			{:else}
				<ul>
					<li><strong>Timing Method:</strong> {game.timing_method || 'RTA (Real Time Attack)'}</li>
					<li><strong>Video Required:</strong> All submissions must include video proof</li>
					<li><strong>No Cheats/Mods:</strong> External tools or gameplay-altering mods are not allowed</li>
				</ul>
			{/if}
			<p class="muted mt-1" style="font-size: 0.85rem;">
				<em>For detailed category rules, challenges, restrictions, and glitch policies, see the <a href="/games/{game.game_id}/rules">Rules tab</a>.</em>
			</p>
		</div>
	</details>
</section>

<!-- ═══ Community Achievements ══════════════════════════ -->
{#if data.achievementStats?.length}
	<section class="card card--compact">
		<h2>🏆 Community Achievements</h2>
		<p class="muted mb-1">Community-defined challenges tracked for this game.</p>

		<div class="achievements-game">
			{#each data.achievementStats as ach}
				<details class="ach-item">
					<summary class="ach-header">
						<div class="ach-header__left">
							<span class="ach-icon">{ach.icon || '🏆'}</span>
							<div class="ach-info">
								<h3>{ach.title}</h3>
								<p class="muted">{ach.description}</p>
							</div>
						</div>
						<div class="ach-header__right">
							{#if ach.difficulty}
								<span class="difficulty difficulty--{ach.difficulty}">{ach.difficulty}</span>
							{/if}
							<span class="ach-stat">
								<span class="ach-stat__completed">{ach.completedCount} completed</span>
								{#if ach.inProgressCount > 0}
									<span class="ach-stat__progress">{ach.inProgressCount} in progress</span>
								{/if}
							</span>
							<span class="accordion-icon">▼</span>
						</div>
					</summary>
					<div class="ach-content">
						{#if ach.requirements?.length}
							<div class="ach-requirements">
								<h4>Requirements</h4>
								<ul>
									{#each ach.requirements as req}
										<li>{req}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if ach.runners.length > 0}
							<div class="ach-runners">
								<h4>Completed By</h4>
								{#each ach.runners as runner}
									<div class="ach-runner">
										<a href="/runners/{runner.runner_id}" class="ach-runner__info">
											<div class="ach-runner__avatar" style="background-image: url('{runner.avatar || '/assets/img/site/default-runner.png'}')"></div>
											<span class="ach-runner__name">{runner.name}</span>
										</a>
										<span class="ach-runner__date muted">{formatDate(runner.date)}</span>
										{#if runner.proof_url}
											<a href={runner.proof_url} target="_blank" rel="noopener" class="btn btn--small">▶ Proof</a>
										{/if}
									</div>
								{/each}
							</div>
						{:else}
							<p class="muted">No runners have completed this achievement yet. Be the first!</p>
						{/if}
					</div>
				</details>
			{/each}
		</div>
	</section>
{/if}

<!-- ═══ Credits ═════════════════════════════════════════ -->
<section class="card card--compact">
	<h2>Credits</h2>
	{#if (game as any).credits?.length}
		<p class="muted mb-1">Contributors who helped establish this game's challenge run definitions:</p>
		<ul class="credits-list">
			{#each (game as any).credits as credit}
				<li>
					{#if credit.runner_id}
						<a href="/runners/{credit.runner_id}">{credit.name}</a>
					{:else if credit.url}
						<a href={credit.url} target="_blank" rel="noopener">{credit.name}</a>
					{:else}
						{credit.name}
					{/if}
					{#if credit.role}<span class="muted"> — {credit.role}</span>{/if}
				</li>
			{/each}
		</ul>
	{:else}
		<p class="muted">No credits listed yet.</p>
	{/if}
</section>

<!-- ═══ Suggest an Update ══════════════════════════════ -->
<section class="card card--compact">
	<h2>📝 Suggest an Update</h2>
	<p class="muted">Notice something incorrect or missing on this page? Let us know and we'll get it fixed.</p>
	<p class="muted mt-1"><em>Suggestion form coming soon. In the meantime, reach out on Discord.</em></p>
</section>

<style>
	section { margin-bottom: 1.5rem; }
	h2 { margin: 0 0 0.5rem; }
	.mb-1 { margin-bottom: 0.5rem; }
	.mt-1 { margin-top: 0.5rem; }

	/* ── Banners ──────────────────────────────────────────── */
	.link-banner {
		display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
		border-radius: 8px; margin-bottom: 1.5rem; flex-wrap: wrap;
		background: var(--panel); border: 1px solid var(--border);
	}
	.link-banner__links { display: flex; gap: 0.5rem; flex-wrap: wrap; }

	/* ── Submit CTA ───────────────────────────────────────── */
	.submit-cta { text-align: center; }
	.btn--accent {
		display: inline-block; background: var(--accent); color: #fff;
		padding: 0.6rem 1.5rem; border-radius: 8px; text-decoration: none;
		font-weight: 600; font-size: 0.95rem;
	}
	.btn--accent:hover { opacity: 0.9; }

	/* ── Rules Accordion ─────────────────────────────────── */
	.rules-summary {
		display: flex; justify-content: space-between; align-items: center;
		cursor: pointer; list-style: none; user-select: none;
	}
	.rules-summary::-webkit-details-marker { display: none; }
	.rules-summary h2 { margin: 0; }
	.accordion-icon { font-size: 0.75rem; color: var(--muted); transition: transform 0.2s; }
	details[open] > .rules-summary .accordion-icon,
	details[open] > .ach-header .accordion-icon { transform: rotate(180deg); }
	.rules-body { margin-top: 0.75rem; }

	/* ── Markdown ─────────────────────────────────────────── */
	.md :global(ul) { margin: 0.5rem 0; padding-left: 1.5rem; }
	.md :global(li) { margin-bottom: 0.35rem; line-height: 1.5; }
	.md :global(p) { margin: 0.5rem 0; }

	/* ── Community Achievements ───────────────────────────── */
	.achievements-game { display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.75rem; }
	.ach-item { border: 1px solid var(--border); border-radius: 8px; overflow: hidden; }
	.ach-header {
		display: flex; justify-content: space-between; align-items: center; gap: 0.75rem;
		padding: 0.75rem 1rem; cursor: pointer; list-style: none; user-select: none;
	}
	.ach-header::-webkit-details-marker { display: none; }
	.ach-header__left { display: flex; align-items: flex-start; gap: 0.75rem; flex: 1; min-width: 0; }
	.ach-header__right { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
	.ach-icon { font-size: 1.5rem; line-height: 1; }
	.ach-info h3 { margin: 0; font-size: 0.95rem; }
	.ach-info p { margin: 0.1rem 0 0; font-size: 0.8rem; }
	.ach-stat { display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem; font-size: 0.75rem; }
	.ach-stat__completed { color: #10b981; font-weight: 600; }
	.ach-stat__progress { color: var(--muted); }
	.ach-content { padding: 0.75rem 1rem; border-top: 1px solid var(--border); }

	.difficulty { font-size: 0.65rem; font-weight: 600; padding: 0.15rem 0.4rem; border-radius: 3px; text-transform: uppercase; }
	.difficulty--easy { background: #22c55e; color: #fff; }
	.difficulty--medium { background: #eab308; color: #000; }
	.difficulty--hard { background: #f97316; color: #fff; }
	.difficulty--legendary { background: linear-gradient(135deg, #8b5cf6, #ec4899); color: #fff; }

	.ach-requirements h4, .ach-runners h4 { margin: 0 0 0.5rem; font-size: 0.85rem; }
	.ach-requirements ul { padding-left: 1.5rem; margin: 0; }
	.ach-requirements li { margin-bottom: 0.25rem; font-size: 0.9rem; }
	.ach-runners { margin-top: 1rem; }
	.ach-runner {
		display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0;
		border-bottom: 1px solid var(--border);
	}
	.ach-runner:last-child { border-bottom: none; }
	.ach-runner__info { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: var(--fg); flex: 1; }
	.ach-runner__info:hover { color: var(--accent); }
	.ach-runner__avatar {
		width: 28px; height: 28px; border-radius: 50%; background-size: cover;
		background-position: center; flex-shrink: 0;
	}
	.ach-runner__name { font-weight: 500; font-size: 0.9rem; }
	.ach-runner__date { font-size: 0.8rem; }

	/* ── Credits ──────────────────────────────────────────── */
	.credits-list { padding-left: 1.5rem; margin: 0; }
	.credits-list li { margin-bottom: 0.35rem; }
	.credits-list a { color: var(--accent); text-decoration: none; }
	.credits-list a:hover { text-decoration: underline; }

	/* ── Responsive ──────────────────────────────────────── */
	@media (max-width: 640px) {
		.ach-header { flex-direction: column; align-items: flex-start; }
		.ach-header__right { width: 100%; justify-content: flex-end; }
		.ach-runner { flex-wrap: wrap; }
	}
</style>
