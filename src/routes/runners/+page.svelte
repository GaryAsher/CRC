<script lang="ts">
	import AzNav from '$lib/components/AzNav.svelte';
	import { norm, matchesLetterFilter, getFirstLetter } from '$lib/utils/filters';

	let { data } = $props();
	let search = $state('');
	let activeLetter = $state('');
	let showLimit = $state(25);

	const filtered = $derived(
		data.runners.filter((r) => {
			const name = r.display_name || r.runner_name || '';

			// Letter filter
			const firstLetter = getFirstLetter(name);
			if (!matchesLetterFilter(firstLetter, activeLetter)) return false;

			// Text search
			if (search) {
				const q = norm(search);
				if (!norm(name).includes(q) && !norm(r.runner_name || '').includes(q)) {
					return false;
				}
			}

			return true;
		})
	);

	let visible = $derived(showLimit === 0 ? filtered : filtered.slice(0, showLimit));
</script>

<svelte:head>
	<title>Runners | Challenge Run Community</title>
</svelte:head>

<div class="page-width">
	<h1>Runners</h1>
	<p class="muted">Browse challenge runners and their achievements.</p>

	<!-- A-Z Navigation -->
	<AzNav bind:activeLetter />

	<!-- Search + results controls -->
	<div class="filter-wrap" style="margin-bottom: 0.75rem;">
		<input
			class="filter"
			type="text"
			placeholder="Search runners..."
			bind:value={search}
			autocomplete="off"
		/>
	</div>

	<div class="results-controls">
		<label class="muted" for="runners-limit">Show</label>
		<select id="runners-limit" class="select" bind:value={showLimit}>
			<option value={10}>10</option>
			<option value={25}>25</option>
			<option value={50}>50</option>
			<option value={100}>100</option>
			<option value={0}>All</option>
		</select>
		<span class="muted" style="margin-left: auto; font-size: 0.9rem;">
			{visible.length} of {data.runners.length} runners
		</span>
	</div>

	<div class="runners-grid">
		{#each visible as runner (runner.runner_id)}
			<a href="/runners/{runner.runner_id}" class="runner-card card card-lift">
				<img
					class="runner-card__avatar"
					src={runner.avatar || '/img/site/default-runner.png'}
					alt=""
				/>
				<div class="runner-card__info">
					<strong class="runner-card__name">{runner.display_name || runner.runner_name}</strong>
					{#if runner.pronouns}
						<span class="runner-card__pronouns muted">{runner.pronouns}</span>
					{/if}
					<span class="runner-card__meta muted">{runner.runCount} runs</span>
				</div>
			</a>
		{/each}

		{#if visible.length === 0}
			<p class="muted" style="grid-column: 1 / -1; text-align: center; padding: 2rem 0;">
				No runners match your search.
			</p>
		{/if}
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
