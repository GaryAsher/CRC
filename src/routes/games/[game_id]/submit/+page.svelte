<script lang="ts">
	import { session, user } from '$stores/auth';
	import { supabase } from '$lib/supabase';
	import { isValidVideoUrl } from '$lib/utils';

	let { data } = $props();
	const game = $derived(data.game);

	// ── Form State ──
	let categoryTier = $state('');
	let categorySlug = $state('');
	let selectedChallenges = $state<string[]>([]);
	let character = $state('');
	let glitchId = $state('');
	let selectedRestrictions = $state<string[]>([]);
	let videoUrl = $state('');
	let dateCompleted = $state('');
	let runTime = $state('');

	// ── UI State ──
	let submitting = $state(false);
	let errorMsg = $state('');
	let successMsg = $state('');

	// ── Derived category options ──
	const tierOptions = $derived(() => {
		const tiers: { value: string; label: string; categories: { slug: string; label: string }[] }[] = [];
		if (game.full_runs?.length) tiers.push({ value: 'full_runs', label: 'Full Runs', categories: game.full_runs.map(c => ({ slug: c.slug, label: c.label })) });
		if (game.mini_challenges?.length) {
			const cats: { slug: string; label: string }[] = [];
			for (const group of game.mini_challenges) {
				if (group.children?.length) {
					for (const child of group.children) cats.push({ slug: child.slug, label: `${group.label} › ${child.label}` });
				} else {
					cats.push({ slug: group.slug, label: group.label });
				}
			}
			tiers.push({ value: 'mini_challenges', label: 'Mini-Challenges', categories: cats });
		}
		if (game.player_made?.length) tiers.push({ value: 'player_made', label: 'Player-Made', categories: game.player_made.map(c => ({ slug: c.slug, label: c.label })) });
		return tiers;
	});

	const currentTier = $derived(tierOptions().find(t => t.value === categoryTier));
	const categoryOptions = $derived(currentTier?.categories || []);

	// ── Validation ──
	const videoValid = $derived(!videoUrl || isValidVideoUrl(videoUrl));
	const canSubmit = $derived(
		!!$session &&
		!!categoryTier &&
		!!categorySlug &&
		!!videoUrl &&
		videoValid &&
		!!dateCompleted &&
		!!runTime &&
		!submitting
	);

	// ── Helpers ──
	function toggleChallenge(slug: string) {
		if (selectedChallenges.includes(slug)) {
			selectedChallenges = selectedChallenges.filter(c => c !== slug);
		} else {
			selectedChallenges = [...selectedChallenges, slug];
		}
	}

	function toggleRestriction(slug: string) {
		if (selectedRestrictions.includes(slug)) {
			selectedRestrictions = selectedRestrictions.filter(r => r !== slug);
		} else {
			selectedRestrictions = [...selectedRestrictions, slug];
		}
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		submitting = true;
		errorMsg = '';
		successMsg = '';

		try {
			const { data: userData } = await supabase.auth.getUser();
			if (!userData?.user) throw new Error('You must be signed in to submit a run.');

			// Look up runner_id from profile
			const { data: profile } = await supabase
				.from('runner_profiles')
				.select('runner_id')
				.eq('user_id', userData.user.id)
				.single();

			if (!profile?.runner_id) {
				throw new Error('You need a runner profile to submit runs. Create one in your Profile settings.');
			}

			const payload = {
				kind: 'run_submission',
				schema_version: 7,
				game_id: game.game_id,
				category_tier: categoryTier,
				category_slug: categorySlug,
				standard_challenges: selectedChallenges,
				character: character || undefined,
				glitch_id: glitchId || undefined,
				restrictions: selectedRestrictions.length > 0 ? selectedRestrictions : undefined,
				runner_id: profile.runner_id,
				video_url: videoUrl,
				date_completed: dateCompleted,
				run_time: runTime,
				submitted_at: new Date().toISOString(),
				source: 'site_form'
			};

			const { error } = await supabase.from('pending_runs').insert(payload);
			if (error) throw error;

			successMsg = 'Run submitted successfully! A verifier will review it shortly.';
			// Reset form
			categoryTier = '';
			categorySlug = '';
			selectedChallenges = [];
			character = '';
			glitchId = '';
			selectedRestrictions = [];
			videoUrl = '';
			dateCompleted = '';
			runTime = '';
		} catch (err: any) {
			errorMsg = err.message || 'Submission failed. Please try again.';
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Submit Run - {game.game_name} | CRC</title>
</svelte:head>

<h2>Submit a {game.game_name} Run</h2>
<p class="muted mb-3">
	Fill in your run details below. All options are specific to {game.game_name}.
	<span class="required-hint"><span class="req">*</span> indicates required fields</span>
</p>

{#if !$session}
	<div class="card">
		<div class="empty-state">
			<span class="empty-state__icon">🔐</span>
			<h3>Sign In Required</h3>
			<p class="muted">You need to be signed in to submit a run.</p>
			<a href="/sign-in?redirect=/games/{game.game_id}/submit" class="btn btn--accent mt-2">Sign In</a>
		</div>
	</div>
{:else if successMsg}
	<div class="card">
		<div class="success-state">
			<span class="success-state__icon">✅</span>
			<h3>Submitted!</h3>
			<p class="muted">{successMsg}</p>
			<div class="success-actions">
				<button class="btn btn--accent" onclick={() => successMsg = ''}>Submit Another</button>
				<a href="/games/{game.game_id}/runs" class="btn">View Runs</a>
			</div>
		</div>
	</div>
{:else}
	<form class="submit-form" onsubmit={handleSubmit}>
		<!-- Category Selection -->
		<div class="submit-section">
			<p class="submit-section__title">Category <span class="req">*</span></p>
			<p class="submit-section__sub">Select the run tier and category.</p>

			<div class="field-row">
				<div class="field">
					<label for="tier" class="field-label">Tier <span class="req">*</span></label>
					<select id="tier" bind:value={categoryTier} required>
						<option value="">Select tier...</option>
						{#each tierOptions() as tier}
							<option value={tier.value}>{tier.label}</option>
						{/each}
					</select>
				</div>
				<div class="field">
					<label for="category" class="field-label">Category <span class="req">*</span></label>
					<select id="category" bind:value={categorySlug} required disabled={!categoryTier}>
						<option value="">Select category...</option>
						{#each categoryOptions as cat}
							<option value={cat.slug}>{cat.label}</option>
						{/each}
					</select>
				</div>
			</div>
		</div>

		<!-- Challenges -->
		{#if game.challenges_data?.length}
			<div class="submit-section">
				<p class="submit-section__title">Challenges</p>
				<p class="submit-section__sub">Select all challenges completed in this run.</p>
				<div class="chip-grid">
					{#each game.challenges_data as ch}
						<button
							type="button"
							class="chip"
							class:chip--active={selectedChallenges.includes(ch.slug)}
							onclick={() => toggleChallenge(ch.slug)}
						>
							{ch.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Character -->
		{#if game.character_column?.enabled && game.characters_data?.length}
			<div class="submit-section">
				<p class="submit-section__title">{game.character_column.label}</p>
				<div class="field">
					<select bind:value={character}>
						<option value="">Select {game.character_column.label.toLowerCase()}...</option>
						{#each game.characters_data as ch}
							<option value={ch.slug}>{ch.label}</option>
						{/each}
					</select>
				</div>
			</div>
		{/if}

		<!-- Glitch Category -->
		{#if game.glitches_data?.length}
			<div class="submit-section">
				<p class="submit-section__title">Glitch Category</p>
				<div class="field">
					<select bind:value={glitchId}>
						<option value="">Select glitch policy...</option>
						{#each game.glitches_data as g}
							<option value={g.slug}>{g.label}</option>
						{/each}
					</select>
				</div>
			</div>
		{/if}

		<!-- Restrictions -->
		{#if game.restrictions_data?.length}
			<div class="submit-section">
				<p class="submit-section__title">Restrictions</p>
				<p class="submit-section__sub">Select any optional restrictions applied to this run.</p>
				<div class="chip-grid">
					{#each game.restrictions_data as r}
						<button
							type="button"
							class="chip"
							class:chip--active={selectedRestrictions.includes(r.slug)}
							onclick={() => toggleRestriction(r.slug)}
						>
							{r.label}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Run Details -->
		<div class="submit-section">
			<p class="submit-section__title">Run Details <span class="req">*</span></p>

			<div class="field">
				<label for="video" class="field-label">Video URL <span class="req">*</span></label>
				<input
					id="video"
					type="url"
					bind:value={videoUrl}
					required
					placeholder="https://youtube.com/watch?v=..."
					class:field--error={videoUrl && !videoValid}
				/>
				{#if videoUrl && !videoValid}
					<span class="field-error">Must be a YouTube, Twitch, or supported video URL</span>
				{/if}
			</div>

			<div class="field-row">
				<div class="field">
					<label for="date" class="field-label">Date Completed <span class="req">*</span></label>
					<input id="date" type="date" bind:value={dateCompleted} required max={new Date().toISOString().split('T')[0]} />
				</div>
				<div class="field">
					<label for="time" class="field-label">Run Time <span class="req">*</span></label>
					<input id="time" type="text" bind:value={runTime} required placeholder="HH:MM:SS or MM:SS" />
				</div>
			</div>
		</div>

		<!-- Error Message -->
		{#if errorMsg}
			<div class="submit-error">{errorMsg}</div>
		{/if}

		<!-- Submit -->
		<div class="submit-actions">
			<button type="submit" class="btn btn--accent" disabled={!canSubmit}>
				{#if submitting}
					<span class="spinner spinner--small"></span> Submitting...
				{:else}
					Submit Run
				{/if}
			</button>
			<a href="/games/{game.game_id}/rules" class="btn">View Rules</a>
		</div>
	</form>

	<!-- Requirements Reminder -->
	<section class="card mt-section">
		<h3>Submission Requirements</h3>
		<ul class="req-list">
			<li><strong>Video proof</strong> — Full unedited recording of the run</li>
			<li><strong>Category</strong> — Select the correct category for your run</li>
			<li><strong>Timer visible</strong> — In-game timer should be shown if applicable</li>
			<li><strong>No cheats or mods</strong> — Unless specifically allowed by category rules</li>
		</ul>
		<p class="muted mt-1">
			Review the full rules on the <a href="/games/{game.game_id}/rules">Rules tab</a> before submitting.
		</p>
	</section>
{/if}

<style>
	h2 { margin: 0 0 0.25rem; }
	.mb-3 { margin-bottom: 1rem; }
	.mt-1 { margin-top: 0.5rem; }
	.mt-2 { margin-top: 0.75rem; }
	.mt-section { margin-top: 1.5rem; }
	.required-hint { font-size: 0.8rem; }
	.req { color: #ef4444; font-weight: 600; }

	/* Empty / Success states */
	.empty-state, .success-state { text-align: center; padding: 2rem 1rem; }
	.empty-state__icon, .success-state__icon { display: block; font-size: 3rem; margin-bottom: 0.75rem; opacity: 0.5; }
	.empty-state h3, .success-state h3 { margin: 0 0 0.5rem; }
	.empty-state p, .success-state p { margin: 0; max-width: 400px; margin-inline: auto; }
	.success-actions { display: flex; gap: 0.75rem; justify-content: center; margin-top: 1rem; }

	/* Form Layout */
	.submit-form { display: flex; flex-direction: column; gap: 1.5rem; }
	.submit-section { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 1.25rem; }
	.submit-section__title { margin: 0 0 0.25rem; font-weight: 600; font-size: 0.95rem; }
	.submit-section__sub { margin: 0 0 0.75rem; font-size: 0.8rem; color: var(--text-muted); }

	/* Fields */
	.field { display: flex; flex-direction: column; gap: 0.25rem; margin-top: 0.5rem; }
	.field-label { font-size: 0.8rem; font-weight: 600; color: var(--text-muted); }
	.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }

	input, select {
		width: 100%; padding: 0.5rem 0.75rem; background: var(--bg); border: 1px solid var(--border);
		border-radius: 6px; color: var(--fg); font-size: 0.9rem; font-family: inherit;
	}
	input:focus, select:focus { outline: none; border-color: var(--accent); }
	input::placeholder { color: var(--text-muted); }
	select:disabled { opacity: 0.5; }
	.field--error { border-color: #ef4444 !important; }
	.field-error { color: #ef4444; font-size: 0.75rem; }

	/* Chip Grid (for challenges/restrictions) */
	.chip-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
	.chip {
		padding: 0.4rem 0.75rem; border-radius: 20px; font-size: 0.8rem; font-family: inherit;
		background: var(--surface); border: 1px solid var(--border); color: var(--fg);
		cursor: pointer; transition: all 0.15s;
	}
	.chip:hover { border-color: var(--accent); }
	.chip--active { background: var(--accent); color: #fff; border-color: var(--accent); }

	/* Actions */
	.submit-actions { display: flex; gap: 0.75rem; align-items: center; }
	.btn--accent {
		background: var(--accent); color: #fff; padding: 0.6rem 1.5rem; border-radius: 8px;
		border: none; font-weight: 600; font-size: 0.95rem; cursor: pointer; text-decoration: none;
		display: inline-flex; align-items: center; gap: 0.5rem;
	}
	.btn--accent:hover { opacity: 0.9; }
	.btn--accent:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border: 1px solid var(--border); border-radius: 8px; background: none; color: var(--fg); text-decoration: none; font-size: 0.9rem; cursor: pointer; }

	/* Error */
	.submit-error {
		padding: 0.6rem 0.75rem; border-radius: 6px; font-size: 0.85rem;
		background: rgba(231,76,60,0.15); color: #e74c3c; border: 1px solid rgba(231,76,60,0.3);
	}

	/* Requirements */
	.req-list { padding-left: 1.5rem; margin: 0.5rem 0 0; }
	.req-list li { margin-bottom: 0.5rem; line-height: 1.5; }
	section a { color: var(--accent); text-decoration: none; }
	section a:hover { text-decoration: underline; }
	h3 { margin: 0 0 0.5rem; }

	.spinner--small { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; display: inline-block; animation: spin 0.6s linear infinite; }
	@keyframes spin { to { transform: rotate(360deg); } }

	@media (max-width: 640px) {
		.field-row { grid-template-columns: 1fr; }
		.submit-actions { flex-direction: column; }
		.btn--accent, .btn { width: 100%; justify-content: center; text-align: center; }
	}
</style>
