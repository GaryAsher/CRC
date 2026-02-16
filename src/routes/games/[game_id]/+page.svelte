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
	<div class="game-link-banner game-link-banner--base">
		<span class="game-link-banner__icon">🎮</span>
		<span class="game-link-banner__text">This is a <strong>modded version</strong>. Looking for the vanilla game?</span>
		<a href="/games/{data.baseGame.game_id}" class="btn btn--small">View {data.baseGame.game_name}</a>
	</div>
{/if}

{#if data.moddedVersions.length > 0}
	<div class="game-link-banner game-link-banner--modded">
		<span class="game-link-banner__icon">🔧</span>
		<span class="game-link-banner__text"><strong>Modded versions available!</strong> Run with custom content.</span>
		<div class="game-link-banner__links">
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
<section style="text-align: center; margin-bottom: 1.5rem;">
	<a href="/submit?game={game.game_id}" class="btn btn--primary">Submit a Run for {game.game_name}</a>
</section>

<!-- ═══ General Rules (Accordion) ═══════════════════════ -->
<div class="card card--compact" style="margin-top: 1rem;">
	<details class="accordion-item" open>
		<summary class="accordion-header">
			<h2 class="accordion-title">📋 General Rules</h2>
			<span class="accordion-icon">▼</span>
		</summary>
		<div class="accordion-content">
			{#if game.general_rules}
				<p class="muted" style="margin-bottom: 0.75rem;">Core rules that apply to all {game.game_name} runs:</p>
				<div class="md">{@html renderMarkdown(game.general_rules)}</div>
			{:else}
				<ul>
					<li><strong>Timing Method:</strong> {game.timing_method || 'RTA (Real Time Attack)'}</li>
					<li><strong>Video Required:</strong> All submissions must include video proof</li>
					<li><strong>No Cheats/Mods:</strong> External tools or gameplay-altering mods are not allowed</li>
				</ul>
			{/if}
			<p class="muted" style="margin-top: 0.75rem; font-size: 0.85rem;">
				<em>For detailed category rules, challenges, restrictions, and glitch policies, see the <a href="/games/{game.game_id}/rules">Rules tab</a>.</em>
			</p>
		</div>
	</details>
</div>

<!-- ═══ Community Achievements ══════════════════════════ -->
{#if data.achievementStats?.length}
	<div class="card card--compact" style="margin-top: 1rem;">
		<h2 style="margin: 0 0 0.5rem;">🏆 Community Achievements</h2>
		<p class="muted" style="margin-bottom: 0.75rem;">Community-defined challenges tracked for this game.</p>

		<div class="community-achievements-game">
			{#each data.achievementStats as ach}
				<details class="achievement-game-item">
					<summary class="achievement-game-header">
						<div class="achievement-game-header__left">
							<span class="achievement-game-icon">{ach.icon || '🏆'}</span>
							<div class="achievement-game-info">
								<h3 class="achievement-game-title">{ach.title}</h3>
								<p class="achievement-game-desc">{ach.description}</p>
							</div>
						</div>
						<div class="achievement-game-header__right">
							{#if ach.difficulty}
								<span class="difficulty difficulty--{ach.difficulty}">{ach.difficulty}</span>
							{/if}
							<span class="achievement-game-stat">
								<span class="achievement-game-stat__completed">{ach.completedCount} completed</span>
								{#if ach.inProgressCount > 0}
									<span class="achievement-game-stat__progress">{ach.inProgressCount} in progress</span>
								{/if}
							</span>
							<span class="accordion-icon">▼</span>
						</div>
					</summary>
					<div class="achievement-game-content">
						{#if ach.requirements?.length}
							<div class="achievement-game-requirements">
								<h4>Requirements</h4>
								<ul>
									{#each ach.requirements as req}
										<li>{req}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if ach.runners.length > 0}
							<div class="achievement-game-runners">
								<h4>Completed By</h4>
								<div class="achievement-runners-list">
									{#each ach.runners as runner}
										<div class="achievement-runner-row achievement-runner-row--completed">
											<a href="/runners/{runner.runner_id}" class="achievement-runner-info">
												<div class="achievement-runner-avatar" style="background-image: url('{runner.avatar || '/assets/img/site/default-runner.png'}')"></div>
												<span class="achievement-runner-name">{runner.name}</span>
											</a>
											<span class="achievement-runner-date">{formatDate(runner.date)}</span>
											{#if runner.proof_url}
												<a href={runner.proof_url} target="_blank" rel="noopener" class="btn btn--small">▶ Proof</a>
											{/if}
										</div>
									{/each}
								</div>
							</div>
						{:else}
							<p class="muted">No runners have completed this achievement yet. Be the first!</p>
						{/if}
					</div>
				</details>
			{/each}
		</div>
	</div>
{/if}

<!-- ═══ Credits ═════════════════════════════════════════ -->
<div class="card card--compact" style="margin-top: 1rem;">
	<h2 style="margin: 0 0 0.5rem;">Credits</h2>
	{#if (game as any).credits?.length}
		<p class="muted" style="margin-bottom: 0.5rem;">Contributors who helped establish this game's challenge run definitions:</p>
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
</div>

<!-- ═══ Suggest an Update ══════════════════════════════ -->
<div class="card card--compact" style="margin-top: 1rem;">
	<h2 style="margin: 0 0 0.5rem;">📝 Suggest an Update</h2>
	<p class="muted">Notice something incorrect or missing on this page? Let us know and we'll get it fixed.</p>
	<p class="muted" style="margin-top: 0.5rem;"><em>Suggestion form coming soon. In the meantime, reach out on Discord.</em></p>
</div>
