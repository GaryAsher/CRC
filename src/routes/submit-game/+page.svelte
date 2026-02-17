<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_WORKER_URL, PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';
	import { user } from '$stores/auth';

	let { data } = $props();

	// ── Form State ────────────────────────────────────────────────────────────
	let gameName = $state('');
	let gameId = $state('');
	let gameIdManual = $state(false);
	let aliases = $state('');
	let description = $state('');
	let selectedGenres = $state<string[]>([]);
	let selectedPlatforms = $state<string[]>([]);
	let timingMethod = $state('');
	let categories = $state('');
	let generalRules = $state('');
	let submitterHandle = $state('');
	let turnstileToken = $state('');

	let submitting = $state(false);
	let result = $state<{ ok: boolean; message: string } | null>(null);
	let turnstileReady = $state(false);
	let turnstileWidgetId = $state<string | null>(null);

	// ── Auto-generate game ID from name ───────────────────────────────────────
	$effect(() => {
		if (!gameIdManual && gameName) {
			gameId = gameName.toLowerCase()
				.replace(/[\s_]+/g, '-')
				.replace(/[^a-z0-9-]/g, '')
				.replace(/-{2,}/g, '-')
				.replace(/^-|-$/g, '');
		}
	});

	// ── Genre filter ──────────────────────────────────────────────────────────
	let genreSearch = $state('');
	let filteredGenres = $derived.by(() => {
		const q = genreSearch.toLowerCase();
		return data.genres.filter((g: any) =>
			!selectedGenres.includes(g.slug) &&
			(!q || g.label.toLowerCase().includes(q))
		);
	});

	function toggleGenre(slug: string) {
		if (selectedGenres.includes(slug)) {
			selectedGenres = selectedGenres.filter(s => s !== slug);
		} else {
			selectedGenres = [...selectedGenres, slug];
		}
	}

	// ── Platform filter ───────────────────────────────────────────────────────
	let platformSearch = $state('');
	let filteredPlatforms = $derived.by(() => {
		const q = platformSearch.toLowerCase();
		return data.platforms.filter((p: any) =>
			(!q || p.label.toLowerCase().includes(q))
		);
	});

	function togglePlatform(slug: string) {
		if (selectedPlatforms.includes(slug)) {
			selectedPlatforms = selectedPlatforms.filter(s => s !== slug);
		} else {
			selectedPlatforms = [...selectedPlatforms, slug];
		}
	}

	// ── Turnstile ─────────────────────────────────────────────────────────────
	onMount(() => {
		if ($user?.user_metadata?.full_name) {
			submitterHandle = $user.user_metadata.full_name;
		}
		if (!document.querySelector('script[src*="turnstile"]')) {
			const script = document.createElement('script');
			script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit';
			script.async = true;
			document.head.appendChild(script);
		}
		(window as any).onTurnstileLoad = () => { turnstileReady = true; renderTurnstile(); };
		if ((window as any).turnstile) { turnstileReady = true; renderTurnstile(); }
	});

	function renderTurnstile() {
		const container = document.getElementById('turnstile-container-game');
		if (!container || !(window as any).turnstile) return;
		if (turnstileWidgetId !== null) { (window as any).turnstile.reset(turnstileWidgetId); return; }
		turnstileWidgetId = (window as any).turnstile.render('#turnstile-container-game', {
			sitekey: PUBLIC_TURNSTILE_SITE_KEY,
			callback: (token: string) => { turnstileToken = token; },
			'expired-callback': () => { turnstileToken = ''; },
			theme: 'auto'
		});
	}

	let canSubmit = $derived(gameName.trim() && turnstileToken && !submitting);

	async function handleSubmit() {
		if (!canSubmit) return;
		submitting = true;
		result = null;

		const parseCsv = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean);

		const payload = {
			game_name: gameName.trim(),
			game_id: gameId.trim() || null,
			aliases: parseCsv(aliases),
			description: description.trim() || null,
			genres: selectedGenres,
			platforms: selectedPlatforms,
			timing_method: timingMethod.trim() || null,
			full_run_categories: parseCsv(categories),
			general_rules: generalRules.trim() || null,
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
			const json = await res.json();
			if (res.ok && json.ok) {
				result = { ok: true, message: 'Game submitted for review! Our team will review your request.' };
			} else {
				result = { ok: false, message: json.error || 'Submission failed. Please try again.' };
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

	function getGenreLabel(slug: string) {
		return data.genres.find((g: any) => g.slug === slug)?.label || slug;
	}
	function getPlatformLabel(slug: string) {
		return data.platforms.find((p: any) => p.slug === slug)?.label || slug;
	}
</script>

<svelte:head><title>Request a Game | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<div class="submit-page">
		<h1>Request a Game</h1>
		<p class="muted">Suggest a new game for the Challenge Run Community. Fill in as much detail as you can — our team will review and set it up if approved.</p>

		{#if result}
			<div class="alert alert--{result.ok ? 'success' : 'error'}">{result.message}</div>
			{#if result.ok}
				<a href="/games" class="btn btn--outline">Browse Games</a>
			{/if}
		{/if}

		{#if !result?.ok}
			<div class="form">
				<!-- Game Info -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Game Info</legend>

					<div class="form-group">
						<label for="gameName">Game Name <span class="req">*</span></label>
						<input id="gameName" type="text" bind:value={gameName} placeholder="e.g. Hollow Knight" maxlength="200" />
						<span class="hint">The official name of the game.</span>
					</div>

					<div class="form-group">
						<label for="gameId">Game ID</label>
						<div class="id-field">
							<input
								id="gameId" type="text" class="mono"
								bind:value={gameId}
								oninput={() => gameIdManual = true}
								placeholder="auto-generated"
								pattern="[a-z0-9\-]+"
							/>
						</div>
						<span class="hint">URL-safe slug (auto-generated from name). Edit only if needed.</span>
					</div>

					<div class="form-group">
						<label for="aliases">Aliases</label>
						<input id="aliases" type="text" bind:value={aliases} placeholder="HK, Hollow Knight: Voidheart Edition" />
						<span class="hint">Comma-separated alternate names for search.</span>
					</div>

					<div class="form-group">
						<label for="description">Description</label>
						<textarea id="description" bind:value={description} placeholder="Brief description of the game and why it fits CRC..." rows="3" maxlength="1000"></textarea>
					</div>
				</fieldset>

				<!-- Genres -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Genres</legend>
					<p class="muted mb-1">Select all genres that apply.</p>

					{#if selectedGenres.length > 0}
						<div class="chip-row mb-1">
							{#each selectedGenres as slug}
								<button type="button" class="chip chip--selected" onclick={() => toggleGenre(slug)}>
									{getGenreLabel(slug)} ✕
								</button>
							{/each}
						</div>
					{/if}

					<input type="text" class="filter-search" bind:value={genreSearch} placeholder="Filter genres..." />
					<div class="chip-grid">
						{#each filteredGenres as genre}
							<button
								type="button"
								class="chip-toggle"
								class:is-selected={selectedGenres.includes(genre.slug)}
								onclick={() => toggleGenre(genre.slug)}
							>{genre.label}</button>
						{/each}
					</div>
				</fieldset>

				<!-- Platforms -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Platforms</legend>
					<p class="muted mb-1">Select platforms this game is available on.</p>

					{#if selectedPlatforms.length > 0}
						<div class="chip-row mb-1">
							{#each selectedPlatforms as slug}
								<button type="button" class="chip chip--selected" onclick={() => togglePlatform(slug)}>
									{getPlatformLabel(slug)} ✕
								</button>
							{/each}
						</div>
					{/if}

					<input type="text" class="filter-search" bind:value={platformSearch} placeholder="Filter platforms..." />
					<div class="chip-grid">
						{#each filteredPlatforms as platform}
							<button
								type="button"
								class="chip-toggle"
								class:is-selected={selectedPlatforms.includes(platform.slug)}
								onclick={() => togglePlatform(platform.slug)}
							>{platform.label}</button>
						{/each}
					</div>
				</fieldset>

				<!-- Challenge Categories & Rules -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Challenges & Rules</legend>

					<div class="form-group">
						<label for="timingMethod">Timing Method</label>
						<select id="timingMethod" bind:value={timingMethod}>
							<option value="">Select...</option>
							<option value="RTA">RTA (Real-Time Attack)</option>
							<option value="IGT">IGT (In-Game Time)</option>
							<option value="RTA + IGT">RTA + IGT</option>
							<option value="N/A">N/A (No timer)</option>
						</select>
					</div>

					<div class="form-group">
						<label for="categories">Suggested Categories</label>
						<input id="categories" type="text" bind:value={categories} placeholder="e.g. Any%, No Hit, All Bosses" />
						<span class="hint">Comma-separated list of challenge categories.</span>
					</div>

					<div class="form-group">
						<label for="rules">Suggested General Rules</label>
						<textarea id="rules" bind:value={generalRules} placeholder="Any rules or requirements for challenge runs in this game..." rows="4" maxlength="2000"></textarea>
					</div>
				</fieldset>

				<!-- Submitter -->
				<fieldset class="sg-section">
					<legend class="sg-section__title">Your Info</legend>

					<div class="form-group">
						<label for="handle">Your Name</label>
						<input id="handle" type="text" bind:value={submitterHandle} placeholder="Your display name (optional)" maxlength="100" />
					</div>
				</fieldset>

				<!-- Turnstile + Submit -->
				<div class="form-group turnstile-group">
					<div id="turnstile-container-game"></div>
					{#if !turnstileReady}<p class="hint">Loading verification...</p>{/if}
				</div>

				<div class="form-actions">
					<button class="btn btn--submit" onclick={handleSubmit} disabled={!canSubmit}>
						{submitting ? '⏳ Submitting...' : 'Submit Game Request'}
					</button>
				</div>
			</div>
		{/if}

		<div class="submit-links">
			<p>Want to submit a run instead? <a href="/submit">Submit a Run</a></p>
		</div>
	</div>
</div>

<style>
	.submit-page { max-width: 700px; margin: 2rem auto; }
	.form { margin-top: 1.5rem; }
	.mb-1 { margin-bottom: 0.5rem; }

	/* Sections */
	.sg-section {
		border: 1px solid var(--border); border-radius: 8px; padding: 1.25rem;
		margin-bottom: 1.5rem; background: none;
	}
	.sg-section__title {
		font-weight: 700; font-size: 1rem; padding: 0 0.5rem; color: var(--fg);
	}

	/* Form groups */
	.form-group { margin-bottom: 1.25rem; }
	.form-group:last-child { margin-bottom: 0; }
	.form-group label { display: block; margin-bottom: 0.35rem; font-size: 0.85rem; font-weight: 600; color: var(--muted); }
	.req { color: #ef4444; }
	input[type="text"], input[type="url"], textarea, select {
		width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--border);
		border-radius: 8px; background: var(--surface); color: var(--fg);
		font-size: 0.9rem; font-family: inherit;
	}
	input:focus, textarea:focus, select:focus {
		outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
	}
	.mono { font-family: 'SF Mono', Monaco, Consolas, monospace; }
	.hint { display: block; margin-top: 0.3rem; font-size: 0.8rem; color: var(--muted); }

	/* Chip Grid */
	.chip-grid { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.5rem; max-height: 160px; overflow-y: auto; padding: 0.25rem; }
	.chip-toggle {
		padding: 0.3rem 0.65rem; border-radius: 16px; font-size: 0.8rem;
		border: 1px solid var(--border); background: none; color: var(--muted);
		cursor: pointer; transition: all 0.15s;
	}
	.chip-toggle:hover { border-color: var(--accent); color: var(--accent); }
	.chip-toggle.is-selected { background: var(--accent); color: white; border-color: var(--accent); }
	.chip-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
	.chip { display: inline-flex; align-items: center; gap: 0.25rem; padding: 0.3rem 0.65rem; border-radius: 16px; font-size: 0.8rem; border: none; cursor: pointer; }
	.chip--selected { background: var(--accent); color: white; }
	.chip--selected:hover { opacity: 0.85; }
	.filter-search {
		width: 100%; padding: 0.45rem 0.75rem; border: 1px solid var(--border);
		border-radius: 8px; background: var(--bg); color: var(--fg);
		font-size: 0.85rem; margin-bottom: 0.5rem;
	}

	/* Turnstile */
	.turnstile-group { margin-top: 1.5rem; }
	.form-actions { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
	.btn--submit {
		background: var(--accent); color: #fff; border: none; padding: 0.75rem 2rem;
		border-radius: 8px; font-size: 1rem; font-weight: 600; cursor: pointer; width: 100%;
	}
	.btn--submit:hover:not(:disabled) { opacity: 0.9; }
	.btn--submit:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn--outline {
		display: inline-block; margin-top: 1rem; padding: 0.5rem 1.25rem;
		border: 1px solid var(--border); border-radius: 8px; background: none;
		color: var(--fg); cursor: pointer; font-size: 0.9rem; text-decoration: none;
	}
	.btn--outline:hover { border-color: var(--accent); color: var(--accent); }

	/* Alerts */
	.alert { padding: 1rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; }
	.alert--success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; }
	.alert--error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }
	.submit-links { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); font-size: 0.9rem; }
	.submit-links a { color: var(--accent); }
</style>
