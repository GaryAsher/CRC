<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Teams | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<h1>Teams</h1>
	<p class="muted">Affiliated teams and community organizations.</p>

	{#if data.teams.length > 0}
		<div class="teams-grid" style="margin-top: 1rem;">
			{#each data.teams as team}
				<a href="/teams/{team.team_id}" class="team-card card-lift--sm">
					{#if team.logo}
						<img src={team.logo} alt={team.name} class="team-card__logo" />
					{:else}
						<div class="team-card__logo team-card__logo--placeholder">{team.name.charAt(0)}</div>
					{/if}
					<div>
						<div class="team-card__name">{team.name}</div>
						{#if team.tagline}
							<div class="team-card__tagline muted">{team.tagline}</div>
						{/if}
						<div class="team-card__games muted">
							{team.members?.length || 0} members
						</div>
					</div>
				</a>
			{/each}
		</div>
	{:else}
		<div class="card">
			<p class="muted">No teams yet. Interested in partnering? <a href="/support">Contact us!</a></p>
		</div>
	{/if}
</div>
