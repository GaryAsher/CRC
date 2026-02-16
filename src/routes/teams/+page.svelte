<script lang="ts">
	let { data } = $props();
</script>

<svelte:head><title>Teams | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<div class="game-shell">
		<header class="page-header">
			<h1>Affiliated Teams</h1>
			<p class="muted">Challenge run teams and communities.</p>
		</header>

		{#if data.teams.length > 0}
			<div class="teams-grid">
				{#each data.teams as team}
					<a href="/teams/{team.team_id}" class="team-card card-lift--sm">
						{#if team.logo}
							<img src={team.logo} alt={team.name} class="team-card__logo" />
						{:else}
							<div class="team-card__logo team-card__logo--placeholder">{team.name.charAt(0)}</div>
						{/if}
						<div class="team-card__info">
							<div class="team-card__name">{team.name}</div>
							{#if team.tagline}
								<div class="team-card__tagline muted">{team.tagline}</div>
							{/if}
							<div class="team-card__games muted">
								{team.members?.length || 0} member{(team.members?.length || 0) === 1 ? '' : 's'}
							</div>
						</div>
					</a>
				{/each}
			</div>
		{:else}
			<div class="card">
				<p class="muted">No affiliated teams yet.</p>
				<p class="mt-3">Interested in partnering? <a href="/support">Contact us!</a></p>
			</div>
		{/if}

		<div class="card card--compact mt-6">
			<h2>Want to join?</h2>
			<p class="muted mb-3">We welcome challenge run teams of all sizes. Benefits include:</p>
			<ul class="muted">
				<li>Team page on CRC</li>
				<li>Featured placement on homepage</li>
				<li>Cross-promotion opportunities</li>
			</ul>
			<p class="mt-3">
				<a href="/support" class="btn btn--outline">Get in Touch</a>
			</p>
		</div>
	</div>
</div>
