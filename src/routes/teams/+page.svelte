<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Teams | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<h1>Teams</h1>
	<p class="muted mb-2">Affiliated teams and communities.</p>

	{#if data.teams.length === 0}
		<div class="card"><p class="muted">No teams yet.</p></div>
	{:else}
		<div class="teams-grid">
			{#each data.teams as team}
				<a href="/teams/{team.team_id}" class="team-card card-lift">
					<div class="team-card__header">
						{#if team.logo}
							<img src={team.logo} alt="" class="team-card__logo" />
						{:else}
							<div class="team-card__logo team-card__logo--placeholder">
								{team.name.charAt(0)}
							</div>
						{/if}
						<div>
							<h2>{team.name}</h2>
							{#if team.tagline}<p class="muted">{team.tagline}</p>{/if}
						</div>
					</div>
					<div class="team-card__meta">
						{#if team.members?.length}
							<span class="team-card__stat">{team.members.length} member{team.members.length === 1 ? '' : 's'}</span>
						{/if}
						{#if team.games?.length}
							<span class="team-card__stat">{team.games.length} game{team.games.length === 1 ? '' : 's'}</span>
						{/if}
					</div>
				</a>
			{/each}
		</div>
	{/if}
</div>

<style>
	h1 { margin: 1.5rem 0 0.25rem; }
	.mb-2 { margin-bottom: 1rem; }

	.teams-grid {
		display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
		gap: 1rem; margin-top: 0.5rem;
	}
	.team-card {
		display: flex; flex-direction: column; gap: 0.75rem;
		padding: 1.25rem; text-decoration: none; color: var(--fg);
		background: var(--panel); border: 1px solid var(--border);
		border-radius: 10px; transition: border-color 0.15s, transform 0.15s;
	}
	.team-card:hover { border-color: var(--accent); transform: translateY(-2px); }

	.team-card__header { display: flex; align-items: center; gap: 0.75rem; }
	.team-card__logo {
		width: 48px; height: 48px; border-radius: 10px; object-fit: cover;
		flex-shrink: 0; border: 1px solid var(--border);
	}
	.team-card__logo--placeholder {
		display: flex; align-items: center; justify-content: center;
		background: var(--surface); color: var(--accent); font-size: 1.25rem; font-weight: 700;
	}
	.team-card__header h2 { margin: 0; font-size: 1.1rem; }
	.team-card__header p { margin: 0.15rem 0 0; font-size: 0.8rem; }

	.team-card__meta { display: flex; gap: 1rem; }
	.team-card__stat { font-size: 0.8rem; color: var(--muted); }
</style>
