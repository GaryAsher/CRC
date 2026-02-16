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
				class:game-hero--active={$page.url.pathname === `/games/${game.game_id}` || $page.url.pathname === `/games/${game.game_id}/`}
				class:game-hero--modded={game.is_modded}
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
									<span class="tag">{genre}</span>
								{/each}
							</div>
						{/if}
					</div>

					{#if game.platforms?.length}
						<div class="game-hero__platforms">
							{#each game.platforms as plat}
								<span class="tag tag--platform">{plat}</span>
							{/each}
						</div>
					{/if}
				</div>
			</section>
		</div>
	</div>
{:else}
	<div class="page-width">
		<div class="game-shell">
			<h1>{game.game_name}{#if game.is_modded} <span class="modded-badge modded-badge--inline">🔧 MODDED</span>{/if}</h1>
			{#if game.genres?.length}
				<div class="game-genres">
					{#each game.genres as genre}
						<span class="tag">{genre}</span>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}

<!-- Tab navigation -->
<div class="page-width">
	<div class="game-shell">
		<nav class="runner-tabs game-tabs" aria-label="Game sections">
			{#each tabs as tab}
				<a
					href={tab.href}
					class="tab"
					class:active={isActiveTab(tab.href)}
					class:tab--submit={tab.id === 'submit'}
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
