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
			inputmode="search"
			aria-label="Search runners"
		/>
	</div>

	<div class="results-bar">
		<div class="results-bar__center">
			<p class="muted">{filtered.length} of {data.runners.length} runners</p>
		</div>
	</div>

	<div class="grid">
		{#each filtered as runner (runner.runner_id)}
			<a href="/runners/{runner.runner_id}" class="runner-card card-lift">
				<div
					class="runner-card__bg"
					style="background-image: url('{runner.avatar || '/img/site/default-runner.png'}');"
				></div>
				<div class="runner-card__overlay">
					<div class="runner-card__title">{runner.runner_name}</div>
				</div>
			</a>
		{/each}
	</div>
</div>
