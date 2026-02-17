<script lang="ts">
	let { data } = $props();
	const game = $derived(data.game);
	// Resources may be defined as an array on the game object in future
	const resources = $derived((game as any).resources_data || []);
</script>

<svelte:head><title>Resources - {game.game_name} | CRC</title></svelte:head>

<h2>Resources</h2>
<p class="muted mb-2">Useful tools, mods, and external resources for {game.game_name} challenge runs.</p>

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
				{#if resource.type}
					<span class="resource-type">{resource.type}</span>
				{/if}
			</div>
		{/each}
	</div>
{:else}
	<div class="card">
		<div class="empty-state">
			<span class="empty-state__icon">📚</span>
			<h3>No Resources Yet</h3>
			<p class="muted">No resources have been added yet.</p>
			<p class="muted">Want to contribute? Contact a moderator!</p>
		</div>
	</div>
{/if}

<style>
	h2 { margin: 0 0 0.25rem; }
	.mb-2 { margin-bottom: 1rem; }
	.resources-list { display: flex; flex-direction: column; gap: 0.75rem; }
	.resource-item a { color: var(--accent); text-decoration: none; }
	.resource-item a:hover { text-decoration: underline; }
	.resource-item p { margin: 0.25rem 0 0; font-size: 0.9rem; }
	.resource-type {
		display: inline-block; margin-top: 0.5rem; font-size: 0.7rem; font-weight: 600;
		padding: 0.15rem 0.5rem; border-radius: 4px; text-transform: uppercase;
		background: var(--surface); border: 1px solid var(--border);
	}
	.empty-state { text-align: center; padding: 2rem 1rem; }
	.empty-state__icon { display: block; font-size: 3rem; margin-bottom: 0.75rem; opacity: 0.5; }
	.empty-state h3 { margin: 0 0 0.5rem; }
	.empty-state p { margin: 0; }
</style>
