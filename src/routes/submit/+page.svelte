<script lang="ts">
	import { onMount } from 'svelte';
	import { PUBLIC_WORKER_URL, PUBLIC_TURNSTILE_SITE_KEY } from '$env/static/public';

	let { data } = $props();
	const { games, runners } = data;

	// ── Form State ────────────────────────────────────────────────────────────
	let gameId = $state('');
	let categoryTier = $state('');
	let categorySlug = $state('');
	let runnerId = $state('');
	let newRunnerName = $state('');
	let videoUrl = $state('');
	let character = $state('');
	let dateCompleted = $state('');
	let runTime = $state('');
	let turnstileToken = $state('');

	let submitting = $state(false);
	let result = $state<{ ok: boolean; message: string; id?: string } | null>(null);
	let turnstileReady = $state(false);
	let turnstileWidgetId = $state<string | null>(null);

	// ── Derived Data ──────────────────────────────────────────────────────────
	let selectedGame = $derived(games.find((g: any) => g.game_id === gameId));

	let filteredCategories = $derived.by(() => {
		if (!selectedGame) return { full_runs: [], mini_challenges: [], player_made: [] };
		const cats = selectedGame.categories || [];
		return {
			full_runs: cats.filter((c: any) => c.tier === 'full-runs'),
			mini_challenges: cats.filter((c: any) => c.tier === 'mini-challenges'),
			player_made: cats.filter((c: any) => c.tier === 'player-made')
		};
	});

	let characters = $derived(selectedGame?.characters_data || []);
	let isNewRunner = $derived(runnerId === '__new__');

	// ── Turnstile Setup ───────────────────────────────────────────────────────
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
		const container = document.getElementById('turnstile-container');
		if (!container || !(window as any).turnstile) return;
		if (turnstileWidgetId !== null) {
			(window as any).turnstile.reset(turnstileWidgetId);
			return;
		}
		turnstileWidgetId = (window as any).turnstile.render('#turnstile-container', {
			sitekey: PUBLIC_TURNSTILE_SITE_KEY,
			callback: (token: string) => { turnstileToken = token; },
			'expired-callback': () => { turnstileToken = ''; },
			theme: 'auto'
		});
	}

	// Reset dependent fields when game changes
	$effect(() => {
		if (gameId) {
			categoryTier = '';
			categorySlug = '';
			character = '';
		}
	});

	// ── Video URL parsing ─────────────────────────────────────────────────────
	function parseVideoUrl(url: string) {
		try {
			const u = new URL(url);
			const host = u.hostname.replace(/^www\./, '').toLowerCase();
			if (host === 'youtube.com' || host === 'm.youtube.com') return { host: 'youtube', id: u.searchParams.get('v') || '' };
			if (host === 'youtu.be') return { host: 'youtube', id: u.pathname.slice(1) };
			if (host.includes('twitch.tv')) return { host: 'twitch', id: u.pathname.split('/').pop() || '' };
			return { host, id: '' };
		} catch { return { host: '', id: '' }; }
	}

	let canSubmit = $derived(
		gameId && categorySlug &&
		(runnerId && runnerId !== '__new__' || newRunnerName) &&
		videoUrl && turnstileToken && !submitting
	);

	async function handleSubmit() {
		if (!canSubmit) return;
		submitting = true;
		result = null;

		const video = parseVideoUrl(videoUrl);
		const finalRunnerId = isNewRunner
			? newRunnerName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
			: runnerId;

		const tierMap: Record<string, string> = {
			'full-runs': 'full_runs', 'mini-challenges': 'mini_challenges', 'player-made': 'player_made'
		};

		const payload = {
			game_id: gameId,
			category_tier: tierMap[categoryTier] || categoryTier,
			category_slug: categorySlug,
			runner_id: finalRunnerId,
			video_url: videoUrl,
			video_host: video.host,
			video_id: video.id,
			character: character || null,
			date_completed: dateCompleted || null,
			run_time: runTime || null,
			turnstile_token: turnstileToken,
			source: 'site_form'
		};

		try {
			const res = await fetch(PUBLIC_WORKER_URL, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			const data = await res.json();
			if (res.ok && data.ok) {
				result = { ok: true, message: `Run submitted! Submission ID: ${data.submission_id}`, id: data.submission_id };
			} else {
				result = { ok: false, message: data.error || 'Submission failed. Please try again.' };
			}
		} catch {
			result = { ok: false, message: 'Network error. Please check your connection and try again.' };
		} finally {
			submitting = false;
			if (turnstileWidgetId !== null && (window as any).turnstile) {
				(window as any).turnstile.reset(turnstileWidgetId);
				turnstileToken = '';
			}
		}
	}
</script>

<svelte:head><title>Submit a Run | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<div class="submit-page">
		<h1>Submit a Run</h1>
		<p class="muted">Submit your challenge run for review. All submissions require video proof.</p>

		{#if result}
			<div class="alert alert--{result.ok ? 'success' : 'error'}">
				{result.message}
				{#if result.ok}
					<p style="margin-top: 0.5rem;"><a href="/games/{gameId}/runs">View runs for this game →</a></p>
				{/if}
			</div>
			{#if result.ok}
				<button class="btn btn--outline" onclick={() => { result = null; gameId = ''; categorySlug = ''; runnerId = ''; videoUrl = ''; }}>
					Submit Another Run
				</button>
			{/if}
		{/if}

		{#if !result?.ok}
			<div class="form">
				<div class="form-group">
					<label for="game">Game <span class="req">*</span></label>
					<select id="game" bind:value={gameId}>
						<option value="">Select a game...</option>
						{#each games as game}
							<option value={game.game_id}>{game.game_name}</option>
						{/each}
					</select>
				</div>

				{#if gameId && selectedGame}
					<div class="form-group">
						<label for="category">Category <span class="req">*</span></label>
						<select id="category" bind:value={categorySlug} onchange={(e) => {
							const opt = (e.target as HTMLSelectElement).selectedOptions[0];
							categoryTier = opt?.dataset.tier || '';
						}}>
							<option value="">Select a category...</option>
							{#if filteredCategories.full_runs.length}
								<optgroup label="Full Runs">
									{#each filteredCategories.full_runs as cat}
										<option value={cat.slug} data-tier="full-runs">{cat.label}</option>
									{/each}
								</optgroup>
							{/if}
							{#if filteredCategories.mini_challenges.length}
								<optgroup label="Mini-Challenges">
									{#each filteredCategories.mini_challenges as cat}
										<option value={cat.slug} data-tier="mini-challenges">
											{cat.parentGroupLabel ? `${cat.parentGroupLabel} → ` : ''}{cat.label}
										</option>
									{/each}
								</optgroup>
							{/if}
							{#if filteredCategories.player_made.length}
								<optgroup label="Player-Made">
									{#each filteredCategories.player_made as cat}
										<option value={cat.slug} data-tier="player-made">{cat.label}</option>
									{/each}
								</optgroup>
							{/if}
						</select>
					</div>

					{#if characters.length}
						<div class="form-group">
							<label for="character">Character / Weapon</label>
							<select id="character" bind:value={character}>
								<option value="">Any / Not Applicable</option>
								{#each characters as char}
									<option value={char.slug}>{char.label}</option>
								{/each}
							</select>
						</div>
					{/if}
				{/if}

				<div class="form-group">
					<label for="runner">Runner <span class="req">*</span></label>
					<select id="runner" bind:value={runnerId}>
						<option value="">Select your runner profile...</option>
						{#each runners as runner}
							<option value={runner.runner_id}>{runner.name}</option>
						{/each}
						<option value="__new__">+ New Runner (not listed)</option>
					</select>
				</div>

				{#if isNewRunner}
					<div class="form-group">
						<label for="newRunner">Runner Name <span class="req">*</span></label>
						<input id="newRunner" type="text" bind:value={newRunnerName} placeholder="Your runner name" maxlength="50" />
						<span class="hint">A runner profile will be created during review.</span>
					</div>
				{/if}

				<div class="form-group">
					<label for="video">Video URL <span class="req">*</span></label>
					<input id="video" type="url" bind:value={videoUrl} placeholder="https://youtube.com/watch?v=... or https://twitch.tv/videos/..." />
					<span class="hint">YouTube, Twitch, Bilibili, or Nicovideo links accepted.</span>
				</div>

				<details class="optional-section">
					<summary>Optional Details</summary>
					<div class="optional-fields">
						<div class="form-group">
							<label for="dateCompleted">Date Completed</label>
							<input id="dateCompleted" type="date" bind:value={dateCompleted} />
						</div>
						<div class="form-group">
							<label for="runTime">Run Time</label>
							<input id="runTime" type="text" bind:value={runTime} placeholder="e.g. 1:23:45" />
						</div>
					</div>
				</details>

				<div class="form-group turnstile-group">
					<div id="turnstile-container"></div>
					{#if !turnstileReady}<p class="hint">Loading verification...</p>{/if}
				</div>

				<div class="form-actions">
					<button class="btn btn--submit" onclick={handleSubmit} disabled={!canSubmit}>
						{submitting ? 'Submitting...' : 'Submit Run'}
					</button>
				</div>
			</div>
		{/if}

		<div class="submit-links">
			<p>Looking to submit a new game instead? <a href="/submit-game">Request a Game</a></p>
		</div>
	</div>
</div>

<style>
	.submit-page { max-width: 640px; margin: 2rem auto; }
	.form { margin-top: 1.5rem; }
	.form-group { margin-bottom: 1.25rem; }
	.form-group label { display: block; margin-bottom: 0.35rem; font-size: 0.85rem; font-weight: 600; color: var(--muted); }
	.req { color: #ef4444; }
	.form-group select,
	.form-group input[type="text"],
	.form-group input[type="url"],
	.form-group input[type="date"] {
		width: 100%; padding: 0.6rem 0.75rem; border: 1px solid var(--border);
		border-radius: 6px; background: var(--surface); color: var(--fg);
		font-size: 0.95rem; font-family: inherit;
	}
	.form-group select:focus, .form-group input:focus {
		outline: none; border-color: var(--accent);
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
	}
	.hint { display: block; margin-top: 0.3rem; font-size: 0.8rem; color: var(--muted); }
	.optional-section { margin: 1.5rem 0; border: 1px solid var(--border); border-radius: 8px; }
	.optional-section summary { padding: 0.75rem 1rem; cursor: pointer; font-weight: 600; font-size: 0.9rem; color: var(--muted); }
	.optional-section summary:hover { color: var(--fg); }
	.optional-fields { padding: 0 1rem 1rem; display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
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
		border: 1px solid var(--border); border-radius: 6px; background: none;
		color: var(--fg); cursor: pointer; font-size: 0.9rem;
	}
	.btn--outline:hover { border-color: var(--accent); color: var(--accent); }
	.alert { padding: 1rem 1.25rem; border-radius: 8px; margin-bottom: 1.5rem; }
	.alert a { color: inherit; text-decoration: underline; }
	.alert--success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; }
	.alert--error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }
	.submit-links { margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid var(--border); font-size: 0.9rem; }
	.submit-links a { color: var(--accent); }
	@media (max-width: 500px) { .optional-fields { grid-template-columns: 1fr; } }
</style>
