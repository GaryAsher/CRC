<script lang="ts">
	let { data } = $props();
	let search = $state('');

	const filtered = $derived(
		data.runners.filter((r) => {
			if (!search) return true;
			return r.runner_name.toLowerCase().includes(search.toLowerCase());
		})
	);
</script>

<svelte:head>
	<title>Runners | Challenge Run Community</title>
</svelte:head>

<div class="page-width">
	<h1>Runners</h1>
	<p class="muted">Browse challenge runners and their achievements.</p>

	<div class="filter-wrap" style="margin: 1.25rem 0;">
		<input
			class="filter"
			type="text"
			placeholder="Search runners..."
			bind:value={search}
			autocomplete="off"
		/>
	</div>

	<p class="muted">{filtered.length} of {data.runners.length} runners</p>

	<div class="runners-grid">
		{#each filtered as runner (runner.runner_id)}
			<a href="/runners/{runner.runner_id}" class="runner-card card card-lift">
				<img
					class="runner-card__avatar"
					src={runner.avatar || '/img/site/default-runner.png'}
					alt=""
				/>
				<div class="runner-card__info">
					<strong class="runner-card__name">{runner.runner_name}</strong>
					{#if runner.pronouns}
						<span class="runner-card__pronouns muted">{runner.pronouns}</span>
					{/if}
					<span class="runner-card__meta muted">{runner.runCount} runs</span>
				</div>
			</a>
		{/each}
	</div>
</div>

<style>
	.runners-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
		gap: 0.75rem;
		margin-top: 1rem;
	}
	.runner-card {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem 1rem;
		text-decoration: none;
		color: var(--fg);
	}
	.runner-card__avatar {
		width: 48px;
		height: 48px;
		border-radius: 50%;
		object-fit: cover;
	}
	.runner-card__info {
		display: flex;
		flex-direction: column;
	}
	.runner-card__name {
		font-size: 1rem;
	}
	.runner-card__pronouns,
	.runner-card__meta {
		font-size: 0.8rem;
	}
</style>
