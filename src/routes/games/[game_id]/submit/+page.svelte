<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_WORKER_URL, PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { user } from '$stores/auth';
	import { supabase } from '$lib/supabase';

	let { data } = $props();
	const game = $derived(data.game);
	const categories = $derived(data.categories || []);

	// ── Form State ────────────────────────────────────────────────────────────
	let categoryTier = $state('');
	let categorySlug = $state('');
	let selectedChallenges = $state<string[]>([]);
	let challengeSearch = $state('');
	let character = $state('');
	let glitchCategory = $state('');
	let selectedRestrictions = $state<string[]>([]);
	let restrictionSearch = $state('');
	let runnerId = $state('');
	let videoUrl = $state('');
	let dateCompleted = $state('');
	let runTime = $state('');

	let submitting = $state(false);
	let result = $state<{ ok: boolean; message: string; id?: string } | null>(null);

	// ── Auth-aware Runner ─────────────────────────────────────────────────────
	let runnerProfile = $state<{ runner_id: string; display_name: string; avatar_url: string } | null>(null);
	let isGuest = $state(true);

	onMount(async () => {
		if ($user) {
			try {
				const { data: profile } = await supabase
					.from('runner_profiles')
					.select('runner_id, display_name, avatar_url')
					.eq('user_id', $user.id)
					.single();
				if (profile) {
					runnerProfile = profile;
					runnerId = profile.runner_id;
					isGuest = false;
				}
			} catch { /* guest mode */ }
		}
		setupTurnstile();
	});

	// ── Turnstile ─────────────────────────────────────────────────────────────
	let turnstileToken = $state('');
	let turnstileReady = $state(false);
	let turnstileWidgetId = $state<string | null>(null);

	function setupTurnstile() {
		if (!document.querySelector('script[src*="turnstile"]')) {
			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
			script.async = true;
			document.head.appendChild(script);
		}
		(window as any).onTurnstileLoad = () => { turnstileReady = true; renderTurnstile(); };
		if ((window as any).turnstile) { turnstileReady = true; renderTurnstile(); }
	}

	function renderTurnstile() {
		const el = document.getElementById('turnstile-container');
		if (!el || !(window as any).turnstile) return;
		if (turnstileWidgetId !== null) { (window as any).turnstile.reset(turnstileWidgetId); return; }
		turnstileWidgetId = (window as any).turnstile.render('#turnstile-container', {
			sitekey: PUBLIC_TURNSTILE_SITE_KEY,
			callback: (token: string) => { turnstileToken = token; },
			'expired-callback': () => { turnstileToken = ''; },
			theme: 'auto'
		});
	}

	// ── Derived: categories grouped by tier ────────────────────────────────────
	let tierCategories = $derived.by(() => {
		if (!categoryTier) return [];
		return categories.filter((c: any) => c.tier === categoryTier);
	});

	let challenges = $derived(game.challenges_data || []);
	let restrictions = $derived(game.restrictions_data || []);
	let glitches = $derived(game.glitches_data || []);
	let characters = $derived(game.characters_data || []);
	let hasCharacters = $derived(characters.length > 0);
	let hasGlitches = $derived(glitches.length > 0);
	let hasRestrictions = $derived(restrictions.length > 0);

	// ── Challenge Chip Picker ─────────────────────────────────────────────────
	let filteredChallenges = $derived.by(() => {
		const q = challengeSearch.toLowerCase();
		return challenges
			.filter((c: any) => !selectedChallenges.includes(c.slug))
			.filter((c: any) => !q || c.label.toLowerCase().includes(q) || c.slug.includes(q));
	});
	let showChallengeSuggestions = $state(false);

	function addChallenge(slug: string) {
		if (!selectedChallenges.includes(slug)) {
			selectedChallenges = [...selectedChallenges, slug];
		}
		challengeSearch = '';
		showChallengeSuggestions = false;
	}
	function removeChallenge(slug: string) {
		selectedChallenges = selectedChallenges.filter(s => s !== slug);
	}
	function getChallengeLabel(slug: string) {
		return challenges.find((c: any) => c.slug === slug)?.label || slug;
	}

	// ── Restrictions Chip Picker ──────────────────────────────────────────────
	let filteredRestrictions = $derived.by(() => {
		const q = restrictionSearch.toLowerCase();
		return restrictions
			.filter((r: any) => !selectedRestrictions.includes(r.slug))
			.filter((r: any) => !q || r.label.toLowerCase().includes(q) || r.slug.includes(q));
	});
	let showRestrictionSuggestions = $state(false);

	function addRestriction(slug: string) {
		if (!selectedRestrictions.includes(slug)) {
			selectedRestrictions = [...selectedRestrictions, slug];
		}
		restrictionSearch = '';
		showRestrictionSuggestions = false;
	}
	function removeRestriction(slug: string) {
		selectedRestrictions = selectedRestrictions.filter(s => s !== slug);
	}
	function getRestrictionLabel(slug: string) {
		return restrictions.find((r: any) => r.slug === slug)?.label || slug;
	}

	// ── Reset on tier change ──────────────────────────────────────────────────
	$effect(() => {
		if (categoryTier) {
			categorySlug = '';
		}
	});

	// ── Submit ────────────────────────────────────────────────────────────────
	let canSubmit = $derived(
		categorySlug && runnerId && videoUrl && turnstileToken &&
		selectedChallenges.length > 0 && !submitting
	);

	async function handleSubmit() {
		if (!canSubmit) return;
		submitting = true;
		result = null;

		const tierMap: Record<string, string> = {
			'full-runs': 'full_runs', 'mini-challenges': 'mini_challenges', 'player-made': 'player_made'
		};

		const payload: Record<string, any> = {
			game_id: game.game_id,
			category_tier: tierMap[categoryTier] || categoryTier,
			category_slug: categorySlug,
			standard_challenges: selectedChallenges,
			runner_id: runnerId,
			video_url: videoUrl,
			date_completed: dateCompleted || null,
			run_time: runTime || null,
			character: character || null,
			glitch_category: glitchCategory || null,
			restrictions: selectedRestrictions.length > 0 ? selectedRestrictions : null,
			turnstile_token: turnstileToken,
			source: 'game_form'
		};

		try {
			const res = await fetch(PUBLIC_WORKER_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const json = await res.json();
			if (res.ok && json.ok) {
				result = { ok: true, message: `Run submitted! Submission ID: ${json.submission_id}`, id: json.submission_id };
			} else {
				result = { ok: false, message: json.error || 'Submission failed.' };
			}
		} catch {
			result = { ok: false, message: 'Network error. Please check your connection.' };
		} finally {
			submitting = false;
			if (turnstileWidgetId !== null && (window as any).turnstile) {
				(window as any).turnstile.reset(turnstileWidgetId);
				turnstileToken = '';
			}
		}
	}

	function resetForm() {
		result = null;
		categoryTier = ''; categorySlug = '';
		selectedChallenges = []; selectedRestrictions = [];
		character = ''; glitchCategory = '';
		videoUrl = ''; dateCompleted = ''; runTime = '';
	}
</script>

<svelte:head>
	<title>Submit Run - {game.game_name} | CRC</title>
</svelte:head>

<h2>Submit a {game.game_name} Run</h2>
<p class="muted mb-2">Fill in your run details below. All options are specific to {game.game_name}. <span class="required-hint"><span class="req">*</span> required</span></p>

{#if result}
	<div class="alert alert--{result.ok ? 'success' : 'error'}">
		{result.message}
		{#if result.ok}
			<p style="margin-top: 0.5rem;"><a href="/games/{game.game_id}/runs">View runs →</a></p>
		{/if}
	</div>
	{#if result.ok}
		<button class="btn btn--outline" onclick={resetForm}>Submit Another Run</button>
	{/if}
{/if}

{#if !result?.ok}
	<div class="submit-run-page">
		<div class="card">
			<div class="submit-grid">

				<!-- ═══ CATEGORY ═══ -->
				<div class="submit-section">
					<p class="submit-section__title">Run Category <span class="req">*</span></p>
					<p class="submit-section__sub">Select the type and category for your run.</p>

					<div class="submit-row-2">
						<div class="submit-field">
							<label for="tierSelect" class="submit-label muted">Run Type <span class="req">*</span></label>
							<select id="tierSelect" bind:value={categoryTier}>
								<option value="">Select type...</option>
								{#if game.full_runs?.length}<option value="full-runs">Full Runs</option>{/if}
								{#if game.mini_challenges?.length}<option value="mini-challenges">Mini-Challenges</option>{/if}
								{#if game.player_made?.length}<option value="player-made">Player-Made</option>{/if}
							</select>
						</div>
						<div class="submit-field">
							<label for="categorySelect" class="submit-label muted">Category <span class="req">*</span></label>
							<select id="categorySelect" bind:value={categorySlug}>
								<option value="">Select category...</option>
								{#each tierCategories as cat}
									<option value={cat.slug}>
										{cat.parentGroupLabel ? `${cat.parentGroupLabel} → ` : ''}{cat.label}
									</option>
								{/each}
							</select>
						</div>
					</div>
				</div>

				<!-- ═══ CHALLENGES (chip picker) ═══ -->
				<div class="submit-section">
					<p class="submit-section__title">Challenges <span class="req">*</span></p>
					<p class="submit-section__sub">Click a suggestion to add it, click a chip to remove it. At least one required.</p>

					<div class="multi-pick">
						<!-- Selected chips -->
						{#if selectedChallenges.length > 0}
							<div class="multi-pick__picked">
								{#each selectedChallenges as slug}
									<button type="button" class="chip chip--selected" onclick={() => removeChallenge(slug)}>
										{getChallengeLabel(slug)} ✕
									</button>
								{/each}
							</div>
						{/if}

						<!-- Search input -->
						<div class="filter-input">
							<div class="filter-input__wrap">
								<input
									type="text" class="filter-input__field"
									placeholder="Type to search challenges..."
									bind:value={challengeSearch}
									onfocus={() => showChallengeSuggestions = true}
									onblur={() => setTimeout(() => showChallengeSuggestions = false, 200)}
									autocomplete="off"
								/>
								{#if showChallengeSuggestions && filteredChallenges.length > 0}
									<div class="filter-input__suggestions">
										{#each filteredChallenges as ch}
											<button type="button" class="filter-input__suggestion" onmousedown={() => addChallenge(ch.slug)}>
												{ch.label}
											</button>
										{/each}
									</div>
								{/if}
							</div>
						</div>
						<div class="multi-pick__help">Examples: Blindfolded, Damageless, Hitless</div>
					</div>
				</div>

				<!-- ═══ CHARACTER ═══ -->
				{#if hasCharacters}
					<div class="submit-section">
						<p class="submit-section__title">{game.character_column?.label || 'Character'}</p>
						<p class="submit-section__sub">Select the {(game.character_column?.label || 'character').toLowerCase()} used for your run.</p>
						<div class="submit-field">
							<select bind:value={character}>
								<option value="">Any / Not applicable</option>
								{#each characters as ch}
									<option value={ch.slug}>{ch.label}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}

				<!-- ═══ GLITCH CATEGORY ═══ -->
				{#if hasGlitches}
					<div class="submit-section">
						<p class="submit-section__title">Glitch Category</p>
						<p class="submit-section__sub">Optional. Select the glitch ruleset used.</p>
						<div class="submit-field">
							<select bind:value={glitchCategory}>
								<option value="">N/A</option>
								{#each glitches as gl}
									<option value={gl.slug}>{gl.label}</option>
								{/each}
							</select>
						</div>
					</div>
				{/if}

				<!-- ═══ RESTRICTIONS (chip picker) ═══ -->
				{#if hasRestrictions}
					<div class="submit-section">
						<p class="submit-section__title">Restrictions</p>
						<p class="submit-section__sub">Multi-select. Additional restrictions applied to the run.</p>

						<div class="multi-pick">
							{#if selectedRestrictions.length > 0}
								<div class="multi-pick__picked">
									{#each selectedRestrictions as slug}
										<button type="button" class="chip chip--selected" onclick={() => removeRestriction(slug)}>
											{getRestrictionLabel(slug)} ✕
										</button>
									{/each}
								</div>
							{/if}

							<div class="filter-input">
								<div class="filter-input__wrap">
									<input
										type="text" class="filter-input__field"
										placeholder="Type to search restrictions..."
										bind:value={restrictionSearch}
										onfocus={() => showRestrictionSuggestions = true}
										onblur={() => setTimeout(() => showRestrictionSuggestions = false, 200)}
										autocomplete="off"
									/>
									{#if showRestrictionSuggestions && filteredRestrictions.length > 0}
										<div class="filter-input__suggestions">
											{#each filteredRestrictions as r}
												<button type="button" class="filter-input__suggestion" onmousedown={() => addRestriction(r.slug)}>
													{r.label}
												</button>
											{/each}
										</div>
									{/if}
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- ═══ RUN DETAILS ═══ -->
				<div class="submit-section">
					<p class="submit-section__title">Run Details <span class="req">*</span></p>
					<p class="submit-section__sub">Runner information, video proof, and timing.</p>

					<!-- Auth-aware Runner ID -->
					<div class="submit-field">
						<label class="submit-label">Runner ID <span class="req">*</span></label>

						{#if !isGuest && runnerProfile}
							<div class="runner-auth-badge">
								<img class="runner-auth-avatar" src={runnerProfile.avatar_url || '/assets/img/site/default-runner.png'} alt="" />
								<div class="runner-auth-details">
									<span class="runner-auth-name">{runnerProfile.display_name}</span>
									<span class="runner-auth-id muted">{runnerProfile.runner_id}</span>
								</div>
								<span class="runner-auth-verified" title="Verified account">✓</span>
							</div>
						{:else}
							<div class="submit-hint">
								<a href="/sign-in">Sign in</a> to link this run to your profile, or enter a Runner ID manually.
							</div>
							<input type="text" bind:value={runnerId} placeholder="your-runner-id" required pattern="[a-z0-9\-]+" />
						{/if}
					</div>

					<div class="submit-field">
						<label for="videoUrl" class="submit-label">Video URL <span class="req">*</span></label>
						<div class="submit-hint">YouTube, Twitch Highlight, Bilibili, or Nicovideo.</div>
						<input id="videoUrl" type="url" bind:value={videoUrl} placeholder="https://youtube.com/watch?v=..." required />
					</div>

					<div class="submit-row-2">
						<div class="submit-field">
							<label for="dateCompleted" class="submit-label">Date Completed</label>
							<div class="submit-hint">YYYY-MM-DD (optional)</div>
							<input id="dateCompleted" type="date" bind:value={dateCompleted} />
						</div>
						<div class="submit-field">
							<label for="runTime" class="submit-label">
								Run Time
								{#if game.timing_method}
									<span class="muted">({game.timing_method})</span>
								{/if}
							</label>
							<div class="submit-hint">HH:MM:SS or MM:SS (optional)</div>
							<input id="runTime" type="text" bind:value={runTime} placeholder="12:34:56" />
						</div>
					</div>
				</div>

				<!-- ═══ CAPTCHA ═══ -->
				<div class="submit-section">
					<div id="turnstile-container"></div>
					{#if !turnstileReady}<p class="submit-hint">Loading verification...</p>{/if}
				</div>

				<!-- ═══ SUBMIT ═══ -->
				<div class="submit-section">
					<p class="submit-section__title">Submit</p>
					<p class="submit-section__sub">Review your information and submit.</p>
					<div class="submit-actions">
						<button type="button" class="btn btn--primary btn--full" onclick={handleSubmit} disabled={!canSubmit}>
							{submitting ? '⏳ Submitting...' : 'Submit Run'}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	h2 { margin: 0 0 0.25rem; }
	.mb-2 { margin-bottom: 1rem; }
	.required-hint { font-size: 0.8rem; }
	.req { color: #ef4444; }

	/* Sections */
	.submit-run-page { margin-top: 1rem; }
	.submit-grid { display: flex; flex-direction: column; gap: 0; }
	.submit-section { padding: 1.25rem 0; border-bottom: 1px solid var(--border); }
	.submit-section:last-child { border-bottom: none; }
	.submit-section__title { font-weight: 700; font-size: 1rem; margin: 0 0 0.25rem; }
	.submit-section__sub { font-size: 0.85rem; color: var(--muted); margin: 0 0 1rem; }
	.submit-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

	/* Fields */
	.submit-field { margin-bottom: 0.75rem; }
	.submit-field:last-child { margin-bottom: 0; }
	.submit-label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.35rem; }
	.submit-hint { font-size: 0.8rem; color: var(--muted); margin-bottom: 0.35rem; }
	.submit-hint a { color: var(--accent); }
	select, input[type="text"], input[type="url"], input[type="date"] {
		width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--border);
		border-radius: 8px; background: var(--bg); color: var(--fg);
		font-size: 0.9rem; font-family: inherit;
	}
	select:focus, input:focus {
		outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
	}

	/* Multi-pick / Chip Picker */
	.multi-pick { margin-bottom: 0.5rem; }
	.multi-pick__picked { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
	.multi-pick__help { font-size: 0.8rem; color: var(--muted); margin-top: 0.5rem; }
	.chip {
		display: inline-flex; align-items: center; gap: 0.35rem; padding: 0.35rem 0.75rem;
		border-radius: 20px; font-size: 0.85rem; cursor: pointer; border: none;
	}
	.chip--selected {
		background: var(--accent); color: white;
	}
	.chip--selected:hover { opacity: 0.85; }

	/* Filter Input */
	.filter-input__wrap { position: relative; }
	.filter-input__field {
		width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border);
		border-radius: 8px; background: var(--bg); color: var(--fg);
		font-size: 0.9rem; font-family: inherit;
	}
	.filter-input__field:focus { outline: none; border-color: var(--accent); }
	.filter-input__suggestions {
		position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
		background: var(--surface); border: 1px solid var(--border); border-top: none;
		border-radius: 0 0 8px 8px; max-height: 200px; overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
	.filter-input__suggestion {
		display: block; width: 100%; text-align: left; padding: 0.5rem 0.75rem;
		font-size: 0.9rem; border: none; background: none; color: var(--fg);
		cursor: pointer; border-bottom: 1px solid var(--border);
	}
	.filter-input__suggestion:last-child { border-bottom: none; }
	.filter-input__suggestion:hover { background: var(--accent); color: white; }

	/* Runner Auth Badge */
	.runner-auth-badge {
		display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem;
		background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
	}
	.runner-auth-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid var(--border); }
	.runner-auth-details { display: flex; flex-direction: column; }
	.runner-auth-name { font-weight: 600; font-size: 0.9rem; }
	.runner-auth-id { font-size: 0.8rem; }
	.runner-auth-verified {
		margin-left: auto; width: 22px; height: 22px; background: var(--accent);
		color: white; border-radius: 50%; display: flex; align-items: center;
		justify-content: center; font-size: 0.75rem; font-weight: 700;
	}

	/* Actions */
	.submit-actions { margin-top: 0.5rem; }
	.btn { display: inline-flex; align-items: center; justify-content: center; padding: 0.6rem 1.5rem; border-radius: 8px; font-size: 0.95rem; font-weight: 600; cursor: pointer; text-decoration: none; border: 1px solid var(--border); background: none; color: var(--fg); }
	.btn--primary { background: var(--accent); color: white; border-color: var(--accent); }
	.btn--primary:hover:not(:disabled) { opacity: 0.9; }
	.btn--primary:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn--full { width: 100%; }
	.btn--outline { display: inline-block; margin-top: 1rem; padding: 0.5rem 1.25rem; border: 1px solid var(--border); border-radius: 8px; background: none; color: var(--fg); cursor: pointer; }
	.btn--outline:hover { border-color: var(--accent); color: var(--accent); }

	/* Alert */
	.alert { padding: 1rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; }
	.alert a { color: inherit; text-decoration: underline; }
	.alert--success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; }
	.alert--error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }

	@media (max-width: 600px) {
		.submit-row-2 { grid-template-columns: 1fr; }
	}
</style>
