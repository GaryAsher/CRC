<script lang="ts">
	import { formatDate, formatTime } from '$lib/utils';
	let { data } = $props();
	const game = $derived(data.game);
	const cat = $derived(data.category);
</script>

<svelte:head>
	<title>{cat.label} - {game.game_name} | CRC</title>
</svelte:head>

<p class="muted page-back">
	<a href="/games/{game.game_id}/runs">← All Categories</a>
</p>

<h2>{cat.label}</h2>
{#if cat.description}
	<p class="muted">{cat.description}</p>
{/if}
{#if cat.parentGroupLabel}
	<p class="muted">Part of: {cat.parentGroupLabel}</p>
{/if}

{#if data.runs.length === 0}
	<div class="card" style="margin-top:1rem;">
		<p class="muted">No approved runs yet. Be the first!</p>
		<a href="/games/{game.game_id}/submit" class="btn btn--small">Submit a Run</a>
	</div>
{:else}
	<table class="runs-table" style="margin-top:1rem;">
		<thead>
			<tr>
				<th>Runner</th>
				{#if game.character_column?.enabled}
					<th>{game.character_column.label}</th>
				{/if}
				<th>Challenges</th>
				<th>Time</th>
				<th>Date</th>
				<th>Video</th>
			</tr>
		</thead>
		<tbody>
			{#each data.runs as run}
				<tr>
					<td><a href="/runners/{run.runner_id}">{run.runner}</a></td>
					{#if game.character_column?.enabled}
						<td>{run.character || '—'}</td>
					{/if}
					<td>
						{#each run.standard_challenges || [] as ch}
							<span class="tag tag--small">{ch}</span>
						{/each}
					</td>
					<td>{formatTime(run.time_primary)}</td>
					<td>{formatDate(run.date_completed)}</td>
					<td>
						{#if run.video_url}
							<a href={run.video_url} target="_blank" rel="noopener">Watch</a>
						{/if}
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
{/if}

<style>
	.page-back { margin-bottom: 1rem; }
	.page-back a { color: var(--text-muted); text-decoration: none; }
	.page-back a:hover { color: var(--fg); }
	h2 { margin-bottom: 0.5rem; }
	table { width: 100%; border-collapse: collapse; }
	th, td { padding: 0.5rem 0.75rem; text-align: left; border-bottom: 1px solid var(--border); }
	th { font-weight: 600; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; opacity: 0.6; }
	td a { color: var(--accent); text-decoration: none; }
</style>
