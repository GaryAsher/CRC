<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_WORKER_URL, PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { user, session } from '$stores/auth';

	let { data } = $props();

	// ── Auth State ─────────────────────────────────────────────────────────
	let authChecked = $state(false);

	onMount(() => {
		// Give auth store a moment to initialize
		const timer = setTimeout(() => { authChecked = true; }, 500);
		return () => clearTimeout(timer);
	});

	let isSignedIn = $derived(authChecked && !!$session);
	let showForm = $derived(authChecked && isSignedIn);

	// ── Form State ─────────────────────────────────────────────────────────
	let gameName = $state('');
	let gameId = $state('');
	let gameIdManual = $state(false);
	let aliases = $state('');
	let selectedGenres = $state<string[]>([]);
	let selectedPlatforms = $state<string[]>([]);
	let platformFilter = $state<'all' | 'console' | 'handheld' | 'pc' | 'mobile'>('all');
	let fullRunCategories = $state<string[]>(['']);
	let miniChallenges = $state<string[]>([]);
	let selectedChallenges = $state<string[]>([]);
	let customChallenges = $state('');
	let selectedGlitches = $state<string[]>(['unrestricted']);
	let timingMethod = $state('RTA');
	let charEnabled = $state(false);
	let charLabel = $state('Character');
	let charList = $state('');
	let isModded = $state(false);
	let baseGame = $state('');
	let generalRules = $state('');
	let gameDescription = $state('');
	let submitterHandle = $state('');
	let turnstileToken = $state('');

	let submitting = $state(false);
	let result = $state<{ ok: boolean; message: string } | null>(null);
	let turnstileReady = $state(false);
	let turnstileWidgetId = $state<string | null>(null);
	let errors = $state<Record<string, string>>({});

	// ── Auto-generate game ID ──────────────────────────────────────────────
	function slugify(s: string): string {
		return (s || '').toLowerCase()
			.replace(/['']/g, '')
			.replace(/%/g, '-percent')
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/-{2,}/g, '-')
			.replace(/^-|-$/g, '');
	}

	$effect(() => {
		if (!gameIdManual) {
			gameId = slugify(gameName);
		}
	});

	function onGameIdInput() {
		gameIdManual = gameId !== slugify(gameName);
	}

	// ── Pre-fill submitter ─────────────────────────────────────────────────
	onMount(() => {
		if ($user?.user_metadata?.full_name) {
			submitterHandle = $user.user_metadata.full_name;
		}
	});

	// ── Turnstile ──────────────────────────────────────────────────────────
	onMount(() => {
		if (!document.querySelector('script[src*="turnstile"]')) {
			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
			script.async = true;
			document.head.appendChild(script);
		}

		(window as any).onTurnstileLoad = () => {
			turnstileReady = true;
			renderTurnstile();
		};

		if ((window as any).turnstile) {
			turnstileReady = true;
			renderTurnstile();
		}
	});

	function renderTurnstile() {
		const container = document.getElementById('turnstile-container-game');
		if (!container || !(window as any).turnstile) return;
		if (turnstileWidgetId !== null) {
			(window as any).turnstile.reset(turnstileWidgetId);
			return;
		}
		turnstileWidgetId = (window as any).turnstile.render('#turnstile-container-game', {
			sitekey: PUBLIC_TURNSTILE_SITE_KEY,
			callback: (token: string) => { turnstileToken = token; },
			'expired-callback': () => { turnstileToken = ''; },
			theme: 'auto'
		});
	}

	// ── Chip Toggles ───────────────────────────────────────────────────────
	function toggleChip(arr: string[], value: string): string[] {
		return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
	}

	// ── Dynamic Lists ──────────────────────────────────────────────────────
	function addCategory(list: string[]): string[] { return [...list, '']; }
	function removeCategory(list: string[], idx: number): string[] { return list.filter((_, i) => i !== idx); }

	// ── Filtered Platforms ─────────────────────────────────────────────────
	let filteredPlatforms = $derived(
		platformFilter === 'all'
			? data.platforms
			: data.platforms.filter((p: any) => p.cat === platformFilter)
	);

	// ── Validation & Submit ────────────────────────────────────────────────
	let canSubmit = $derived(gameName.trim() && turnstileToken && !submitting);

	function validate(): boolean {
		errors = {};
		if (!gameName.trim()) errors.gameName = 'Game name is required.';
		if (!gameId.trim()) errors.gameId = 'Could not generate a valid game ID.';
		const runs = fullRunCategories.filter(c => c.trim());
		if (runs.length === 0) errors.fullRuns = 'At least one full run category is required.';
		if (isModded && !baseGame) errors.baseGame = 'Please select the base game for this mod.';
		return Object.keys(errors).length === 0;
	}

	async function handleSubmit() {
		if (!validate()) return;
		submitting = true;
		result = null;

		const parseCsv = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);
		const characters = charList.split('\n').map(s => s.trim()).filter(Boolean);

		const payload = {
			game_name: gameName.trim(),
			game_id: gameId.trim(),
			aliases: parseCsv(aliases),
			genres: selectedGenres,
			platforms: selectedPlatforms,
			timing_method: timingMethod,
			full_run_categories: fullRunCategories.filter(c => c.trim()),
			mini_challenges: miniChallenges.filter(c => c.trim()),
			challenges: [...selectedChallenges, ...parseCsv(customChallenges)],
			glitches: selectedGlitches,
			restrictions: [],
			character_enabled: charEnabled,
			character_label: charLabel.trim() || 'Character',
			characters,
			is_modded: isModded,
			base_game: isModded ? baseGame : null,
			general_rules: generalRules.trim() || null,
			description: gameDescription.trim() || null,
			submitter_handle: submitterHandle.trim() || null,
			submitter_user_id: $user?.id || null,
			turnstile_token: turnstileToken
		};

		try {
			const res = await fetch(`${PUBLIC_WORKER_URL}/submit-game`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const data = await res.json();
			if (res.ok && data.ok) {
				result = { ok: true, message: 'Game submitted for review! Our team will review your request.' };
			} else {
				result = { ok: false, message: data.error || 'Submission failed. Please try again.' };
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
</script>

<svelte:head><title>Submit a Game | Challenge Run Community</title></svelte:head>

<div class="page-width submit-game-page">
	<h1>Submit a Game</h1>
	<p class="muted mb-4">Request a new game to be tracked on CRC. Our team will review your submission.</p>

	<!-- Auth gate -->
	{#if !authChecked}
		<div class="card">
			<div class="auth-loading">
				<div class="spinner"></div>
				<p class="muted">Checking sign-in status...</p>
			</div>
		</div>
	{:else if !isSignedIn}
		<div class="card">
			<h2>Sign In Required</h2>
			<p class="muted mb-2">You need to be signed in to submit a game.</p>
			<a href="/sign-in/?redirect=/submit-game/" class="btn btn--primary">Sign In</a>
		</div>
	{:else}
		<!-- Result message -->
		{#if result}
			<div class="sg-msg sg-msg--{result.ok ? 'success' : 'error'}">{result.message}</div>
			{#if result.ok}
				<a href="/games" class="btn btn--outline">Browse Games</a>
			{/if}
		{/if}

		{#if !result?.ok}
			<div class="card">
				<!-- GAME INFO -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Game Info</legend>

					<div class="sg-field">
						<label for="gameName" class="sg-label">Game Name <span class="req">*</span></label>
						<input
							id="gameName"
							type="text"
							class="sg-input"
							class:has-error={errors.gameName}
							bind:value={gameName}
							placeholder="e.g. Hollow Knight"
						/>
						<p class="sg-hint">The official name of the game.</p>
						{#if errors.gameName}<p class="sg-error">{errors.gameName}</p>{/if}
					</div>

					<div class="sg-field">
						<label for="gameId" class="sg-label">Game ID</label>
						<input
							id="gameId"
							type="text"
							class="sg-input sg-input--mono"
							class:has-error={errors.gameId}
							bind:value={gameId}
							oninput={onGameIdInput}
							placeholder="auto-generated"
							pattern="[a-z0-9\-]+"
						/>
						<p class="sg-hint">URL-safe slug. Auto-generated from name — edit only if needed.</p>
						{#if errors.gameId}<p class="sg-error">{errors.gameId}</p>{/if}
					</div>

					<div class="sg-field">
						<label for="gameAliases" class="sg-label">Aliases</label>
						<input
							id="gameAliases"
							type="text"
							class="sg-input"
							bind:value={aliases}
							placeholder="HK, Hollow Knight: Voidheart Edition"
						/>
						<p class="sg-hint">Comma-separated alternate names.</p>
					</div>

					<div class="sg-field">
						<label class="sg-label">Genres</label>
						<div class="sg-chip-grid">
							{#each data.genres as genre}
								<label class="sg-chip-toggle">
									<input
										type="checkbox"
										checked={selectedGenres.includes(genre.id)}
										onchange={() => selectedGenres = toggleChip(selectedGenres, genre.id)}
									/>
									<span>{genre.label}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="sg-field">
						<label class="sg-label">Platforms</label>
						<div class="sg-filter-bar">
							{#each ['all', 'console', 'handheld', 'pc', 'mobile'] as cat}
								<button
									type="button"
									class="sg-filter-btn"
									class:active={platformFilter === cat}
									onclick={() => platformFilter = cat as any}
								>{cat.charAt(0).toUpperCase() + cat.slice(1)}</button>
							{/each}
						</div>
						<div class="sg-chip-grid">
							{#each filteredPlatforms as platform}
								<label class="sg-chip-toggle">
									<input
										type="checkbox"
										checked={selectedPlatforms.includes(platform.id)}
										onchange={() => selectedPlatforms = toggleChip(selectedPlatforms, platform.id)}
									/>
									<span>{platform.label}</span>
								</label>
							{/each}
						</div>
					</div>
				</fieldset>

				<!-- CATEGORIES -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Run Categories</legend>

					<div class="sg-field">
						<label class="sg-label">Full Run Categories <span class="req">*</span></label>
						<p class="sg-hint mb-1">Categories that require completing the game (e.g. Any%, All Bosses). Add at least one.</p>
						<div class="sg-dynamic-list">
							{#each fullRunCategories as cat, i}
								<div class="sg-dynamic-row">
									<input
										type="text"
										bind:value={fullRunCategories[i]}
										placeholder="Category name (e.g. Any%)"
									/>
									{#if fullRunCategories.length > 1}
										<button type="button" class="sg-remove-btn" onclick={() => fullRunCategories = removeCategory(fullRunCategories, i)}>✕</button>
									{/if}
								</div>
							{/each}
						</div>
						<button type="button" class="sg-add-btn" onclick={() => fullRunCategories = addCategory(fullRunCategories)}>+ Add Category</button>
						{#if errors.fullRuns}<p class="sg-error">{errors.fullRuns}</p>{/if}
					</div>

					<div class="sg-field">
						<label class="sg-label">Mini-Challenges</label>
						<p class="sg-hint mb-1">In-game challenges that don't require an ending (e.g. Boss Rush). Optional.</p>
						<div class="sg-dynamic-list">
							{#each miniChallenges as cat, i}
								<div class="sg-dynamic-row">
									<input
										type="text"
										bind:value={miniChallenges[i]}
										placeholder="Challenge name (e.g. Boss Rush)"
									/>
									<button type="button" class="sg-remove-btn" onclick={() => miniChallenges = removeCategory(miniChallenges, i)}>✕</button>
								</div>
							{/each}
						</div>
						<button type="button" class="sg-add-btn" onclick={() => miniChallenges = addCategory(miniChallenges)}>+ Add Mini-Challenge</button>
					</div>
				</fieldset>

				<!-- CHALLENGE TYPES -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Challenge Types</legend>
					<p class="sg-hint mb-2">Select which challenge modifiers apply to this game.</p>
					<div class="sg-chip-grid">
						{#each data.challenges as challenge}
							<label class="sg-chip-toggle">
								<input
									type="checkbox"
									checked={selectedChallenges.includes(challenge.id)}
									onchange={() => selectedChallenges = toggleChip(selectedChallenges, challenge.id)}
								/>
								<span>{challenge.label}</span>
							</label>
						{/each}
					</div>
					<div class="sg-field mt-2">
						<label for="customChallenges" class="sg-label">Custom Challenges</label>
						<input id="customChallenges" type="text" class="sg-input" bind:value={customChallenges} placeholder="e.g. Pacifist, No Shield" />
						<p class="sg-hint">Comma-separated game-specific challenge types not in the list above.</p>
					</div>
				</fieldset>

				<!-- GLITCH & TIMING -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Glitch Rules & Timing</legend>

					<div class="sg-field">
						<label class="sg-label">Glitch Categories</label>
						<p class="sg-hint mb-1">Which glitch rule sets apply to this game?</p>
						<div class="sg-chip-grid">
							{#each [{ id: 'unrestricted', label: 'Unrestricted' }, { id: 'nmg', label: 'No Major Glitches' }, { id: 'glitchless', label: 'Glitchless' }] as g}
								<label class="sg-chip-toggle">
									<input
										type="checkbox"
										checked={selectedGlitches.includes(g.id)}
										onchange={() => selectedGlitches = toggleChip(selectedGlitches, g.id)}
									/>
									<span>{g.label}</span>
								</label>
							{/each}
						</div>
					</div>

					<div class="sg-field">
						<label for="timingMethod" class="sg-label">Primary Timing Method</label>
						<select id="timingMethod" class="sg-select" bind:value={timingMethod}>
							<option value="RTA">RTA (Real Time Attack)</option>
							<option value="IGT">IGT (In-Game Time)</option>
							<option value="LRT">LRT (Load-Removed Time)</option>
						</select>
					</div>
				</fieldset>

				<!-- CHARACTER / WEAPON -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Character / Weapon Selection</legend>

					<div class="sg-field">
						<label class="sg-toggle-row">
							<input type="checkbox" bind:checked={charEnabled} />
							<span>This game has character/weapon selection relevant to runs</span>
						</label>
					</div>

					{#if charEnabled}
						<div class="sg-field">
							<label for="charLabel" class="sg-label">Column Label</label>
							<input id="charLabel" type="text" class="sg-input" bind:value={charLabel} placeholder="Character / Weapon / Aspect" />
							<p class="sg-hint">What to call the selection (e.g. "Character", "Weapon / Aspect").</p>
						</div>
						<div class="sg-field">
							<label for="charList" class="sg-label">Options</label>
							<textarea id="charList" class="sg-textarea" rows="4" bind:value={charList} placeholder={"One per line:\nWarrior\nMage\nRogue"}></textarea>
							<p class="sg-hint">One character/weapon per line.</p>
						</div>
					{/if}
				</fieldset>

				<!-- MODDED -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Modded Game</legend>

					<div class="sg-field">
						<label class="sg-toggle-row">
							<input type="checkbox" bind:checked={isModded} />
							<span>This is a modded version of an existing game</span>
						</label>
					</div>

					{#if isModded}
						<div class="sg-field">
							<label for="baseGame" class="sg-label">Base Game <span class="req">*</span></label>
							<select id="baseGame" class="sg-select" bind:value={baseGame}>
								<option value="">Select the base game...</option>
								{#each data.baseGames as g}
									<option value={g.id}>{g.name}</option>
								{/each}
							</select>
							<p class="sg-hint">Which game is this a mod of?</p>
							{#if errors.baseGame}<p class="sg-error">{errors.baseGame}</p>{/if}
						</div>
					{/if}
				</fieldset>

				<!-- RULES & DESCRIPTION -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Rules & Description</legend>

					<div class="sg-field">
						<label for="generalRules" class="sg-label">General Rules</label>
						<textarea id="generalRules" class="sg-textarea" rows="5" bind:value={generalRules} placeholder={"- Video Required: All submissions must include video proof.\n- No Cheats/Mods: ..."}></textarea>
						<p class="sg-hint">Game-specific rules. Leave blank to use site defaults.</p>
					</div>

					<div class="sg-field">
						<label for="gameDescription" class="sg-label">Description</label>
						<textarea id="gameDescription" class="sg-textarea" rows="3" bind:value={gameDescription} placeholder="Brief description of the game and its challenge run scene."></textarea>
					</div>
				</fieldset>

				<!-- SUBMITTER INFO -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Your Info</legend>
					<div class="sg-field">
						<label for="submitterHandle" class="sg-label">Your Name / Handle</label>
						<input id="submitterHandle" type="text" class="sg-input" bind:value={submitterHandle} placeholder="e.g. Gary Asher" />
						<p class="sg-hint">So we can credit you if this game gets added.</p>
					</div>
				</fieldset>

				<!-- CAPTCHA -->
				<div class="sg-field turnstile-field">
					<div id="turnstile-container-game"></div>
					{#if !turnstileReady}<p class="sg-hint">Loading verification...</p>{/if}
				</div>

				<!-- SUBMIT -->
				<div class="sg-submit-area">
					<button
						type="button"
						class="btn btn--primary btn--large"
						onclick={handleSubmit}
						disabled={!canSubmit}
					>
						{submitting ? 'Submitting...' : 'Submit Game for Review'}
					</button>
				</div>
			</div>

			<!-- What happens next -->
			<div class="card mt-4">
				<h3 style="margin-top:0">What Happens Next?</h3>
				<p class="muted">Our team will review your submission and may reach out for clarifications. Once approved, the game page goes live and runners can start submitting runs. You'll see updates on the status in your dashboard.</p>
			</div>
		{/if}
	{/if}
</div>

<style>
.submit-game-page h1 { margin-bottom: 0.5rem; }

/* Sections */
.sg-section {
	border: none;
	padding: 0;
	margin: 0 0 2rem 0;
}
.sg-section__title {
	font-size: 1.1rem;
	font-weight: 700;
	color: var(--accent, #6366f1);
	margin-bottom: 1rem;
	padding-bottom: 0.5rem;
	border-bottom: 1px solid var(--border);
}

/* Fields */
.sg-field { margin-bottom: 1.25rem; }
.sg-label {
	display: block;
	font-weight: 600;
	font-size: 0.9rem;
	margin-bottom: 0.35rem;
}
.sg-hint {
	font-size: 0.8rem;
	color: var(--text-muted, var(--muted));
	margin: 0.25rem 0 0 0;
}
.req { color: #dc3545; }

.sg-input, .sg-select, .sg-textarea {
	width: 100%;
	padding: 0.6rem 0.75rem;
	background: var(--bg);
	border: 1px solid var(--border);
	border-radius: 8px;
	color: var(--fg);
	font-size: 0.9rem;
	font-family: inherit;
}
.sg-input:focus, .sg-select:focus, .sg-textarea:focus {
	outline: none;
	border-color: var(--accent, #6366f1);
	box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.sg-input--mono { font-family: monospace; }
.sg-textarea { resize: vertical; }

.sg-error {
	font-size: 0.8rem;
	color: #dc3545;
	margin: 0.25rem 0 0 0;
}
.has-error { border-color: #dc3545 !important; }

/* Chip grid (genre/platform/challenge selection) */
.sg-chip-grid {
	display: flex;
	flex-wrap: wrap;
	gap: 0.35rem;
}
.sg-chip-toggle {
	display: inline-flex;
	cursor: pointer;
}
.sg-chip-toggle input { display: none; }
.sg-chip-toggle span {
	display: inline-block;
	padding: 0.3rem 0.7rem;
	border: 1px solid var(--border);
	border-radius: 6px;
	font-size: 0.8rem;
	color: var(--text-muted, var(--muted));
	background: var(--bg);
	transition: all 0.12s;
	user-select: none;
}
.sg-chip-toggle:hover span {
	border-color: var(--fg);
	color: var(--fg);
}
.sg-chip-toggle input:checked + span {
	background: var(--accent, #6366f1);
	color: white;
	border-color: var(--accent, #6366f1);
}

/* Platform filter bar */
.sg-filter-bar {
	display: flex;
	gap: 0.25rem;
	margin-bottom: 0.75rem;
}
.sg-filter-btn {
	padding: 0.3rem 0.65rem;
	border: 1px solid var(--border);
	border-radius: 6px;
	background: transparent;
	color: var(--text-muted, var(--muted));
	font-size: 0.8rem;
	cursor: pointer;
	transition: all 0.12s;
}
.sg-filter-btn:hover { border-color: var(--fg); color: var(--fg); }
.sg-filter-btn.active {
	background: var(--accent, #6366f1);
	color: white;
	border-color: var(--accent, #6366f1);
}

/* Dynamic list (categories) */
.sg-dynamic-list { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 0.5rem; }
.sg-dynamic-row {
	display: flex;
	gap: 0.5rem;
	align-items: center;
}
.sg-dynamic-row input {
	flex: 1;
	padding: 0.5rem 0.65rem;
	background: var(--bg);
	border: 1px solid var(--border);
	border-radius: 6px;
	color: var(--fg);
	font-size: 0.85rem;
	font-family: inherit;
}
.sg-dynamic-row input:focus {
	outline: none;
	border-color: var(--accent, #6366f1);
}
.sg-remove-btn {
	width: 28px;
	height: 28px;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px solid var(--border);
	border-radius: 6px;
	background: transparent;
	color: var(--text-muted, var(--muted));
	cursor: pointer;
	flex-shrink: 0;
	font-size: 0.9rem;
}
.sg-remove-btn:hover { border-color: #dc3545; color: #dc3545; }
.sg-add-btn {
	display: inline-block;
	padding: 0.4rem 0.75rem;
	border: 1px dashed var(--border);
	border-radius: 6px;
	background: transparent;
	color: var(--text-muted, var(--muted));
	font-size: 0.85rem;
	cursor: pointer;
	transition: all 0.12s;
}
.sg-add-btn:hover { border-color: var(--accent); color: var(--accent); }

/* Toggle row */
.sg-toggle-row {
	display: flex;
	align-items: center;
	gap: 0.6rem;
	cursor: pointer;
	font-size: 0.9rem;
}
.sg-toggle-row input[type="checkbox"] {
	width: 18px;
	height: 18px;
	accent-color: var(--accent, #6366f1);
}

/* Submit area */
.sg-submit-area {
	text-align: center;
	padding-top: 1rem;
	border-top: 1px solid var(--border);
	margin-top: 1rem;
}
.sg-msg {
	padding: 0.6rem 1rem;
	border-radius: 6px;
	font-size: 0.9rem;
	margin-bottom: 1rem;
}
.sg-msg--error { background: rgba(220, 53, 69, 0.1); color: #dc3545; border: 1px solid rgba(220, 53, 69, 0.2); }
.sg-msg--success { background: rgba(40, 167, 69, 0.1); color: #28a745; border: 1px solid rgba(40, 167, 69, 0.2); }

.btn--large { padding: 0.85rem 2rem; font-size: 1rem; }

/* Auth loading */
.auth-loading { text-align: center; padding: 2rem; }

/* Utilities */
.mb-1 { margin-bottom: 0.5rem; }
.mb-2 { margin-bottom: 1rem; }
.mb-4 { margin-bottom: 2rem; }
.mt-2 { margin-top: 1rem; }
.mt-4 { margin-top: 2rem; }
.turnstile-field { margin-top: 1.5rem; }

/* Responsive */
@media (max-width: 640px) {
	.sg-chip-grid { gap: 0.25rem; }
	.sg-chip-toggle span { font-size: 0.75rem; padding: 0.25rem 0.5rem; }
}
</style>
