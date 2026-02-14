<script lang="ts">
	import { renderMarkdown } from '$lib/utils/markdown';
	let { data } = $props();
	const game = $derived(data.game);
</script>

<svelte:head>
	<title>Rules - {game.game_name} | CRC</title>
</svelte:head>

{#if game.general_rules}
	<section>
		<h2>General Rules</h2>
		<div class="card">{@html renderMarkdown(game.general_rules)}</div>
	</section>
{/if}

{#if game.challenges_data?.length}
	<section>
		<h2>Challenge Types</h2>
		{#each game.challenges_data as challenge}
			<div class="card rule-card">
				<h3>{challenge.label}</h3>
				{#if challenge.description}
					{@html renderMarkdown(challenge.description)}
				{/if}
			</div>
		{/each}
	</section>
{/if}

{#if game.restrictions_data?.length}
	<section>
		<h2>Optional Restrictions</h2>
		{#each game.restrictions_data as restriction}
			<div class="card rule-card">
				<h3>{restriction.label}</h3>
				{#if restriction.description}
					{@html renderMarkdown(restriction.description)}
				{/if}
			</div>
		{/each}
	</section>
{/if}

{#if game.glitches_data?.length}
	<section>
		<h2>Glitch Categories</h2>
		{#each game.glitches_data as glitch}
			<div class="card rule-card">
				<h3>{glitch.label}</h3>
				{#if glitch.description}
					{@html renderMarkdown(glitch.description)}
				{/if}
			</div>
		{/each}
	</section>
{/if}

<style>
	section { margin-bottom: 2rem; }
	h2 { margin-bottom: 0.75rem; }
	.rule-card { margin-bottom: 0.75rem; }
	.rule-card h3 { margin: 0 0 0.5rem; color: var(--accent); }
</style>
