<script lang="ts">
	import { page } from '$app/stores';

	let { data, children } = $props();
	const game = $derived(data.game);

	const tabs = $derived([
		{ id: 'overview', label: 'Overview', href: `/games/${game.game_id}`, enabled: game.tabs.overview },
		{ id: 'runs', label: 'Runs', href: `/games/${game.game_id}/runs`, enabled: game.tabs.runs },
		{ id: 'rules', label: 'Rules', href: `/games/${game.game_id}/rules`, enabled: game.tabs.rules },
		{ id: 'history', label: 'History', href: `/games/${game.game_id}/history`, enabled: game.tabs.history },
		{ id: 'resources', label: 'Resources', href: `/games/${game.game_id}/resources`, enabled: game.tabs.resources },
		{ id: 'submit', label: 'Submit Run', href: `/games/${game.game_id}/submit`, enabled: true },
	].filter(t => t.enabled));

	function isActiveTab(href: string): boolean {
		const path = $page.url.pathname;
		if (href === `/games/${game.game_id}`) {
			return path === href || path === href + '/';
		}
		return path.startsWith(href);
	}
</script>

<svelte:head>
	<title>{game.game_name} | Challenge Run Community</title>
</svelte:head>

<div class="page-width">
	<p class="muted page-back"><a href="/games">← Games</a></p>
</div>

<!-- Game Hero -->
{#if game.cover}
	<div class="page-width">
		<div class="game-shell">
			<section
				class="game-hero"
				style="background-image: url('{game.cover}'); background-position: {game.cover_position || 'center'};"
			>
				{#if game.is_modded}
					<div class="game-hero__modded-badge">
						<span class="modded-badge">🔧 MODDED</span>
					</div>
				{/if}
				<div class="game-hero__overlay">
					<div class="game-hero__content">
						<h1>{game.game_name}</h1>
						{#if game.genres?.length}
							<div class="game-genres">
								{#each game.genres as genre}
									<span class="tag tag--genre">{genre}</span>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</section>
		</div>
	</div>
{:else}
	<div class="page-width">
		<h1>{game.game_name}</h1>
	</div>
{/if}

<!-- Tab navigation -->
<div class="page-width">
	<div class="game-shell">
		<nav class="game-tabs" aria-label="Game sections">
			{#each tabs as tab}
				<a
					href={tab.href}
					class="game-tab"
					class:game-tab--active={isActiveTab(tab.href)}
				>
					{tab.label}
				</a>
			{/each}
		</nav>
	</div>
</div>

<!-- Tab content -->
<div class="page-width">
	<div class="game-shell">
		{@render children()}
	</div>
</div>

<style>
	.page-back {
		margin: 1rem 0 0.5rem;
	}
	.page-back a {
		color: var(--text-muted);
		text-decoration: none;
	}
	.page-back a:hover {
		color: var(--fg);
	}
	.game-tabs {
		display: flex;
		gap: 0;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1.5rem;
		overflow-x: auto;
	}
	.game-tab {
		padding: 0.75rem 1.25rem;
		color: var(--text-muted);
		text-decoration: none;
		border-bottom: 2px solid transparent;
		white-space: nowrap;
		font-size: 0.9rem;
		transition: color 0.15s, border-color 0.15s;
	}
	.game-tab:hover {
		color: var(--fg);
	}
	.game-tab--active {
		color: var(--accent);
		border-bottom-color: var(--accent);
		font-weight: 600;
	}
</style>
