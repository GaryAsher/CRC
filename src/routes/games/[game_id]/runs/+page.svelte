<script lang="ts">
	let { data } = $props();
	const game = $derived(data.game);
	const runs = $derived(data.runs);

	const hasFull = $derived(game.full_runs?.length > 0);
	const hasMini = $derived(game.mini_challenges?.length > 0);
	const hasPlayer = $derived(game.player_made?.length > 0);

	/** Count all runs in a given tier's categories */
	function countRuns(slugs: string[]): number {
		return runs.filter((r) => slugs.includes(r.category_slug)).length;
	}

	const fullSlugs = $derived(game.full_runs?.map((c: any) => c.slug) || []);
	const miniSlugs = $derived(
		(game.mini_challenges || []).flatMap((g: any) => [
			g.slug,
			...(g.children || []).map((c: any) => c.slug)
		])
	);
	const playerSlugs = $derived(game.player_made?.map((c: any) => c.slug) || []);

	const fullCount = $derived(countRuns(fullSlugs));
	const miniCount = $derived(countRuns(miniSlugs));
	const playerCount = $derived(countRuns(playerSlugs));

	// Auto-redirect: if only one tier exists, go straight to its first category
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	onMount(() => {
		const tiers = [
			hasFull && game.full_runs?.[0]?.slug ? `full-runs/${game.full_runs[0].slug}` : null,
			hasMini && game.mini_challenges?.[0]?.slug ? `mini-challenges/${game.mini_challenges[0].slug}` : null,
			hasPlayer && game.player_made?.[0]?.slug ? `player-made/${game.player_made[0].slug}` : null
		].filter(Boolean);

		if (tiers.length === 1 && tiers[0]) {
			goto(`/games/${game.game_id}/runs/${tiers[0]}`, { replaceState: true });
		}
	});
</script>

<svelte:head>
	<title>Runs - {game.game_name} | CRC</title>
</svelte:head>

<div class="runs-header">
	<p class="muted">Select a category type to browse runs for {game.game_name}.</p>
</div>

<div class="tier-cards">
	{#if hasFull}
		<a href="/games/{game.game_id}/runs/full-runs/{game.full_runs[0].slug}" class="tier-card tier-card--full-runs">
			<h3 class="tier-card__title">🏁 Full Runs</h3>
			<p class="tier-card__desc muted">Categories that require reaching an ending</p>
			<div class="tier-card__meta">
				<span class="tier-card__count">{game.full_runs.length} categor{game.full_runs.length === 1 ? 'y' : 'ies'}</span>
				{#if fullCount > 0}
					<span class="tier-card__runs">{fullCount} run{fullCount === 1 ? '' : 's'}</span>
				{/if}
			</div>
		</a>
	{/if}

	{#if hasMini}
		<a href="/games/{game.game_id}/runs/mini-challenges/{game.mini_challenges[0].slug}" class="tier-card tier-card--mini-challenges">
			<h3 class="tier-card__title">⚡ Mini-Challenges</h3>
			<p class="tier-card__desc muted">In-game challenges without requiring an ending</p>
			<div class="tier-card__meta">
				<span class="tier-card__count">{game.mini_challenges.length} group{game.mini_challenges.length === 1 ? '' : 's'}</span>
				{#if miniCount > 0}
					<span class="tier-card__runs">{miniCount} run{miniCount === 1 ? '' : 's'}</span>
				{/if}
			</div>
		</a>
	{/if}

	{#if hasPlayer}
		<a href="/games/{game.game_id}/runs/player-made/{game.player_made[0].slug}" class="tier-card tier-card--player-made">
			<h3 class="tier-card__title">🎨 Player-Made</h3>
			<p class="tier-card__desc muted">Community-created challenges with arbitrary goals</p>
			<div class="tier-card__meta">
				<span class="tier-card__count">{game.player_made.length} categor{game.player_made.length === 1 ? 'y' : 'ies'}</span>
				{#if playerCount > 0}
					<span class="tier-card__runs">{playerCount} run{playerCount === 1 ? '' : 's'}</span>
				{/if}
			</div>
		</a>
	{/if}

	{#if !hasFull && !hasMini && !hasPlayer}
		<div class="empty-state">
			<p class="muted">No categories have been set up for this game yet.</p>
		</div>
	{/if}
</div>

<style>
	.runs-header { margin-bottom: 1.25rem; }
	.runs-header p { margin: 0; }

	.tier-cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 1rem;
	}
	.tier-card {
		display: block;
		padding: 1.25rem;
		border: 1px solid var(--border);
		border-radius: 10px;
		background: var(--surface);
		text-decoration: none;
		color: var(--fg);
		transition: border-color 0.15s, transform 0.15s;
	}
	.tier-card:hover {
		border-color: var(--accent);
		transform: translateY(-2px);
	}
	.tier-card__title { margin: 0 0 0.35rem; font-size: 1.1rem; }
	.tier-card__desc { margin: 0 0 0.75rem; font-size: 0.85rem; }
	.tier-card__meta {
		display: flex;
		gap: 0.75rem;
		font-size: 0.8rem;
	}
	.tier-card__count { color: var(--muted); }
	.tier-card__runs { color: var(--accent); font-weight: 600; }
</style>
