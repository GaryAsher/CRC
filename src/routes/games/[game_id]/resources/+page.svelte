<script lang="ts">
	let { data } = $props();
	const game = $derived(data.game);
	const resources = $derived((game as any).resources || []);
</script>

<svelte:head>
	<title>Resources - {game.game_name} | CRC</title>
</svelte:head>

<h2>Resources</h2>
<p class="muted mb-2">Useful tools, mods, and external resources for {game.game_name}.</p>

{#if resources.length > 0}
	<div class="resources-list">
		{#each resources as resource}
			<div class="resource-item card">
				<a href={resource.url} target="_blank" rel="noopener">
					<strong>{resource.name}</strong>
				</a>
				{#if resource.description}
					<p class="muted">{resource.description}</p>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<div class="card">
		<p class="muted"><em>No resources have been added yet. Want to contribute? Contact a moderator!</em></p>
	</div>
{/if}

<style>
	h2 { margin: 0 0 0.25rem; }
	.mb-2 { margin-bottom: 1rem; }
	.resources-list { display: flex; flex-direction: column; gap: 0.75rem; }
	.resource-item a { color: var(--accent); text-decoration: none; font-size: 1rem; }
	.resource-item a:hover { text-decoration: underline; }
	.resource-item p { margin: 0.25rem 0 0; font-size: 0.85rem; }
</style>
