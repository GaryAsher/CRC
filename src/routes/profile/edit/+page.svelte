<script lang="ts">
	import { onMount } from 'svelte';
	import { user } from '$stores/auth';
	import { supabase } from '$lib/supabase';
	import AuthGuard from '$components/auth/AuthGuard.svelte';

	let { data } = $props();
	const games = data.games;

	// ── Tab State ──────────────────────────────────────────────────────────────
	let activeTab = $state<'basic' | 'customization' | 'socials' | 'goals' | 'highlights'>('basic');
	const tabs = [
		{ id: 'basic' as const, label: '👤 Basic Info' },
		{ id: 'customization' as const, label: '🎨 Customize' },
		{ id: 'socials' as const, label: '🔗 Socials' },
		{ id: 'goals' as const, label: '🎯 Goals' },
		{ id: 'highlights' as const, label: '📌 Highlights' }
	];

	// ── Loading & Save State ──────────────────────────────────────────────────
	let profileLoading = $state(true);
	let profileNotFound = $state(false);
	let saving = $state(false);
	let message = $state<{ type: 'success' | 'error'; text: string } | null>(null);

	// ── Basic Info ─────────────────────────────────────────────────────────────
	let runnerId = $state('');
	let displayName = $state('');
	let pronouns = $state('');
	let location = $state('');
	let bio = $state('');
	let statusMessage = $state('');

	let bioCount = $derived(bio.length);

	// ── Customization ─────────────────────────────────────────────────────────
	let avatarUrl = $state('');
	let accentColor = $state('#3BC36E');
	let uploadingAvatar = $state(false);
	let avatarMessage = $state('');

	// ── Socials ───────────────────────────────────────────────────────────────
	let socials = $state({
		twitch: '',
		youtube: '',
		discord: '',
		twitter: '',
		bluesky: '',
		instagram: '',
		speedruncom: '',
		steam: ''
	});
	let otherLinks = $state<string[]>([]);

	// ── Goals ─────────────────────────────────────────────────────────────────
	interface Goal {
		icon: string;
		title: string;
		description: string;
		game: string;
		completed: boolean;
		current: number | null;
		total: number | null;
		date_completed: string;
	}
	let personalGoals = $state<Goal[]>([]);
	const MAX_GOALS = 10;

	// ── Highlights ────────────────────────────────────────────────────────────
	interface Highlight {
		game: string;
		game_id: string;
		achievement: string;
		category: string;
		video_url: string;
	}
	let highlights = $state<Highlight[]>([]);
	const MAX_HIGHLIGHTS = 3;

	// ── Game Search (for goals) ───────────────────────────────────────────────
	let goalSearchIndex = $state<number | null>(null);
	let goalSearchQuery = $state('');
	let goalSearchResults = $derived.by(() => {
		if (!goalSearchQuery || goalSearchQuery.length < 2) return [];
		const q = goalSearchQuery.toLowerCase();
		return games.filter((g: any) =>
			g.name.toLowerCase().includes(q) || g.id.toLowerCase().includes(q)
		).slice(0, 8);
	});

	// ── Preview ───────────────────────────────────────────────────────────────
	let previewName = $derived(displayName || 'Display Name');
	let previewPronouns = $derived(pronouns ? `(${pronouns})` : '');
	let previewAvatar = $derived(avatarUrl || '/assets/img/site/default-runner.png');

	// ── Load Profile from Supabase ────────────────────────────────────────────
	onMount(async () => {
		if (!$user) return;

		try {
			const { data: profile, error } = await supabase
				.from('runner_profiles')
				.select('*')
				.eq('user_id', $user.id)
				.single();

			if (error || !profile) {
				profileNotFound = true;
				profileLoading = false;
				return;
			}

			// Populate fields
			runnerId = profile.runner_id || '';
			displayName = profile.display_name || '';
			pronouns = profile.pronouns || '';
			location = profile.location || '';
			bio = profile.bio || '';
			statusMessage = profile.status_message || '';
			avatarUrl = profile.avatar_url || '';

			// Theme / accent
			const theme = profile.theme_settings || {};
			accentColor = theme.accent || '#3BC36E';

			// Socials
			const s = profile.socials || {};
			socials = {
				twitch: s.twitch || '',
				youtube: s.youtube || '',
				discord: s.discord || '',
				twitter: s.twitter || '',
				bluesky: s.bluesky || '',
				instagram: s.instagram || '',
				speedruncom: s.speedruncom || '',
				steam: s.steam || ''
			};
			otherLinks = s.other || [];

			// Goals
			personalGoals = (profile.personal_goals || []).map((g: any) => ({
				icon: g.icon || '',
				title: g.title || '',
				description: g.description || '',
				game: g.game || '',
				completed: g.completed || false,
				current: g.current ?? null,
				total: g.total ?? null,
				date_completed: g.date_completed || ''
			}));

			// Highlights
			highlights = (profile.featured_runs || []).map((h: any) => ({
				game: h.game || '',
				game_id: h.game_id || '',
				achievement: h.achievement || '',
				category: h.category || '',
				video_url: h.video_url || ''
			}));
		} catch (err) {
			console.error('Failed to load profile:', err);
			profileNotFound = true;
		} finally {
			profileLoading = false;
		}
	});

	// ── Avatar Upload ─────────────────────────────────────────────────────────
	async function handleAvatarUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !$user) return;

		if (file.size > 2 * 1024 * 1024) {
			avatarMessage = 'File too large. Max 2MB.';
			return;
		}
		if (!['image/png', 'image/jpeg'].includes(file.type)) {
			avatarMessage = 'Only PNG and JPG files are allowed.';
			return;
		}

		uploadingAvatar = true;
		avatarMessage = '';

		try {
			const ext = file.type === 'image/png' ? 'png' : 'jpg';
			const filePath = `${$user.id}/${Date.now()}.${ext}`;

			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(filePath, file, { upsert: true });

			if (uploadError) throw uploadError;

			const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(filePath);
			avatarUrl = publicUrl.publicUrl;
			avatarMessage = 'Avatar uploaded!';
		} catch (err: any) {
			avatarMessage = err?.message || 'Upload failed.';
		} finally {
			uploadingAvatar = false;
			input.value = '';
		}
	}

	function removeAvatar() {
		avatarUrl = '';
		avatarMessage = '';
	}

	// ── Goals Management ──────────────────────────────────────────────────────
	function addGoal() {
		if (personalGoals.length >= MAX_GOALS) return;
		personalGoals = [...personalGoals, {
			icon: '🎯', title: '', description: '', game: '',
			completed: false, current: null, total: null, date_completed: ''
		}];
	}

	function removeGoal(index: number) {
		personalGoals = personalGoals.filter((_, i) => i !== index);
	}

	function openGoalSearch(index: number) {
		goalSearchIndex = index;
		goalSearchQuery = personalGoals[index]?.game || '';
	}

	function selectGoalGame(gameName: string) {
		if (goalSearchIndex !== null && personalGoals[goalSearchIndex]) {
			personalGoals[goalSearchIndex].game = gameName;
		}
		goalSearchIndex = null;
		goalSearchQuery = '';
	}

	// ── Highlights Management ─────────────────────────────────────────────────
	function addHighlight() {
		if (highlights.length >= MAX_HIGHLIGHTS) return;
		highlights = [...highlights, {
			game: '', game_id: '', achievement: '', category: '', video_url: ''
		}];
	}

	function removeHighlight(index: number) {
		highlights = highlights.filter((_, i) => i !== index);
	}

	// ── Save ──────────────────────────────────────────────────────────────────
	async function handleSave() {
		if (!$user) return;
		if (!displayName.trim()) {
			message = { type: 'error', text: 'Display name is required.' };
			return;
		}

		saving = true;
		message = null;

		try {
			// Build theme_settings
			const themeSettings: Record<string, string> = {};
			if (accentColor && /^#[0-9A-Fa-f]{6}$/.test(accentColor)) {
				themeSettings.accent = accentColor;
				const r = parseInt(accentColor.slice(1, 3), 16);
				const g = parseInt(accentColor.slice(3, 5), 16);
				const b = parseInt(accentColor.slice(5, 7), 16);
				themeSettings.accentRgb = `${r}, ${g}, ${b}`;
			}

			const formData = {
				display_name: displayName.trim(),
				pronouns: pronouns.trim() || null,
				location: location.trim() || null,
				bio: bio.trim() || null,
				status_message: statusMessage.trim() || null,
				avatar_url: avatarUrl.trim() || null,
				theme_settings: themeSettings,
				socials: {
					twitch: socials.twitch.trim() || null,
					youtube: socials.youtube.trim() || null,
					discord: socials.discord.trim() || null,
					twitter: socials.twitter.trim() || null,
					bluesky: socials.bluesky.trim() || null,
					instagram: socials.instagram.trim() || null,
					speedruncom: socials.speedruncom.trim() || null,
					steam: socials.steam.trim() || null,
					other: otherLinks.filter(l => l.trim())
				},
				personal_goals: personalGoals.filter(g => g.title.trim()),
				featured_runs: highlights.filter(h => h.game.trim() || h.game_id.trim()),
				updated_at: new Date().toISOString()
			};

			const { error } = await supabase
				.from('runner_profiles')
				.update(formData)
				.eq('user_id', $user.id);

			if (error) throw error;
			message = { type: 'success', text: 'Profile saved successfully!' };
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err: any) {
			message = { type: 'error', text: err?.message || 'Failed to save profile.' };
		} finally {
			saving = false;
		}
	}
</script>

<svelte:head><title>Edit Profile | Challenge Run Community</title></svelte:head>

<AuthGuard>
	<div class="page-width">
		<p class="muted mb-3"><a href="/profile">← Back</a></p>

		<div class="profile-edit">
			<!-- Loading -->
			{#if profileLoading}
				<div class="card">
					<div class="sign-in-loading">
						<div class="spinner"></div>
						<p class="muted">Loading profile...</p>
					</div>
				</div>

			<!-- No profile -->
			{:else if profileNotFound}
				<div class="card">
					<h1>No Profile Found</h1>
					<p class="muted">You haven't created a runner profile yet.</p>
					<a href="/profile/create" class="btn btn--primary">Create Profile</a>
				</div>

			<!-- Edit form -->
			{:else}
				<h1>Edit Profile</h1>
				<p class="muted mb-4">Update your runner profile information. Changes are saved to the database and will sync to the site.</p>

				{#if message}
					<div class="form-message form-message--{message.type}">{message.text}</div>
				{/if}

				<!-- Profile Preview -->
				<div class="card mb-4">
					<h2>Profile Preview</h2>
					<div class="profile-preview">
						<div class="profile-preview__content">
							<div class="profile-preview__avatar-wrap">
								<img src={previewAvatar} alt="" class="profile-preview__avatar" />
							</div>
							<div class="profile-preview__info">
								<span class="profile-preview__name">{previewName}</span>
								{#if previewPronouns}
									<span class="profile-preview__pronouns muted">{previewPronouns}</span>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Tab Navigation -->
				<nav class="runner-tabs game-tabs profile-edit-tabs">
					{#each tabs as tab}
						<button
							class="tab"
							class:active={activeTab === tab.id}
							type="button"
							onclick={() => activeTab = tab.id}
						>{tab.label}</button>
					{/each}
				</nav>

				<!-- ═══ Basic Info ═══ -->
				{#if activeTab === 'basic'}
					<div class="card mb-4">
						<h2>👤 Basic Info</h2>

						<div class="form-group">
							<label class="form-label">Runner ID</label>
							<input type="text" class="form-input" value={runnerId} disabled />
							<p class="form-help">Your unique identifier (cannot be changed)</p>
						</div>

						<div class="form-row">
							<div class="form-group form-group--flex">
								<label class="form-label" for="display-name">Display Name *</label>
								<input type="text" id="display-name" class="form-input" bind:value={displayName} required maxlength="50" />
								<p class="form-help">The name shown on your profile</p>
							</div>
							<div class="form-group">
								<label class="form-label" for="pronouns">Pronouns</label>
								<input type="text" id="pronouns" class="form-input" bind:value={pronouns} maxlength="30" placeholder="e.g., they/them" />
								<p class="form-help">Optional, displayed next to your name</p>
							</div>
						</div>

						<div class="form-group">
							<label class="form-label" for="location">Location</label>
							<input type="text" id="location" class="form-input" bind:value={location} maxlength="50" placeholder="e.g., United States" />
							<p class="form-help">Country or region (optional)</p>
						</div>

						<div class="form-group">
							<label class="form-label" for="bio">Bio</label>
							<textarea id="bio" class="form-textarea" bind:value={bio} rows="4" maxlength="1000" placeholder="Tell others about yourself and your challenge run journey..."></textarea>
							<p class="form-help">{bioCount}/1000 characters</p>
						</div>

						<div class="form-group">
							<label class="form-label" for="status-message">Status Message</label>
							<input type="text" id="status-message" class="form-input" bind:value={statusMessage} maxlength="100" placeholder="Finishing my profile, then back to runs!" />
							<p class="form-help">A short status shown on your profile</p>
						</div>
					</div>
				{/if}

				<!-- ═══ Customization ═══ -->
				{#if activeTab === 'customization'}
					<div class="card mb-4">
						<h2>🎨 Customization</h2>
						<p class="muted mb-3">Customize your profile appearance.</p>

						<div class="form-group">
							<label class="form-label">Avatar</label>
							<div class="avatar-upload">
								<div class="avatar-upload__preview">
									<img src={previewAvatar} alt="Avatar preview" />
								</div>
								<div class="avatar-upload__controls">
									<input type="file" id="avatar-file" accept="image/png,image/jpeg" onchange={handleAvatarUpload} hidden />
									<button type="button" class="btn btn--small" onclick={() => document.getElementById('avatar-file')?.click()} disabled={uploadingAvatar}>
										{uploadingAvatar ? '⏳ Uploading...' : '📤 Upload Image'}
									</button>
									{#if avatarUrl}
										<button type="button" class="btn btn--small btn--outline" onclick={removeAvatar}>🗑️ Remove</button>
									{/if}
									<p class="form-help mt-2">PNG or JPG, max 2MB. Recommended: 200×200px (square)</p>
								</div>
							</div>
							{#if avatarMessage}
								<p class="form-help" class:text-success={avatarMessage.includes('uploaded')} class:text-danger={!avatarMessage.includes('uploaded')}>{avatarMessage}</p>
							{/if}
						</div>

						<div class="form-group">
							<label class="form-label" for="accent-color">Accent Color</label>
							<div class="accent-color-input">
								<input type="color" bind:value={accentColor} />
								<input type="text" id="accent-color" class="form-input" bind:value={accentColor} placeholder="#3BC36E" maxlength="7" />
							</div>
							<p class="form-help">Hex color code for your profile accent</p>
						</div>
					</div>
				{/if}

				<!-- ═══ Socials ═══ -->
				{#if activeTab === 'socials'}
					<div class="card mb-4">
						<h2>🔗 Social Links</h2>
						<p class="muted mb-3">Add links to your streaming and social accounts.</p>

						<div class="form-row">
							<div class="form-group form-group--flex">
								<label class="form-label">Twitch</label>
								<input type="url" class="form-input" bind:value={socials.twitch} placeholder="https://twitch.tv/username" />
							</div>
							<div class="form-group form-group--flex">
								<label class="form-label">YouTube</label>
								<input type="url" class="form-input" bind:value={socials.youtube} placeholder="https://youtube.com/@channel" />
							</div>
						</div>

						<div class="form-row">
							<div class="form-group form-group--flex">
								<label class="form-label">Discord</label>
								<input type="url" class="form-input" bind:value={socials.discord} placeholder="https://discord.gg/invite" />
							</div>
							<div class="form-group form-group--flex">
								<label class="form-label">Twitter/X</label>
								<input type="url" class="form-input" bind:value={socials.twitter} placeholder="https://twitter.com/username" />
							</div>
						</div>

						<div class="form-row">
							<div class="form-group form-group--flex">
								<label class="form-label">Bluesky</label>
								<input type="url" class="form-input" bind:value={socials.bluesky} placeholder="https://bsky.app/profile/username" />
							</div>
							<div class="form-group form-group--flex">
								<label class="form-label">Instagram</label>
								<input type="url" class="form-input" bind:value={socials.instagram} placeholder="https://instagram.com/username" />
							</div>
						</div>

						<div class="form-row">
							<div class="form-group form-group--flex">
								<label class="form-label">Speedrun.com</label>
								<input type="url" class="form-input" bind:value={socials.speedruncom} placeholder="https://speedrun.com/users/username" />
							</div>
							<div class="form-group form-group--flex">
								<label class="form-label">Steam</label>
								<input type="url" class="form-input" bind:value={socials.steam} placeholder="https://steamcommunity.com/id/username" />
							</div>
						</div>

						<!-- Other Links -->
						<div class="other-links-section">
							<label class="form-label">Other Links</label>
							<div class="approval-notice">
								<span>⚠️</span>
								<span>Other links require moderator approval before appearing on your profile.</span>
							</div>
							{#each otherLinks as link, i}
								<div class="other-link-row">
									<input type="url" class="form-input" bind:value={otherLinks[i]} placeholder="https://..." />
									<button type="button" class="btn btn--small btn--danger" onclick={() => otherLinks = otherLinks.filter((_, idx) => idx !== i)}>✕</button>
								</div>
							{/each}
							{#if otherLinks.length < 3}
								<button type="button" class="btn btn--small mt-2" onclick={() => otherLinks = [...otherLinks, '']}>+ Add Link</button>
							{/if}
							<p class="form-help">Up to 3 additional links (must be valid URLs)</p>
						</div>
					</div>
				{/if}

				<!-- ═══ Goals ═══ -->
				{#if activeTab === 'goals'}
					<div class="card mb-4">
						<h2>🎯 Personal Goals</h2>
						<p class="muted mb-3">Set personal challenges and milestones to track your progress. These are visible on your profile.</p>

						<div class="goals-editor-list">
							{#each personalGoals as goal, i}
								<div class="goal-editor-item">
									<div class="goal-editor-item__header">
										<span class="goal-editor-item__number">#{i + 1}</span>
										<button type="button" class="goal-editor-item__remove" onclick={() => removeGoal(i)}>×</button>
									</div>
									<div class="goal-editor-item__content">
										<div class="form-row">
											<div class="form-group form-group--small">
												<label class="form-label">Icon</label>
												<input type="text" class="form-input goal-icon" bind:value={personalGoals[i].icon} maxlength="2" placeholder="🎯" />
											</div>
											<div class="form-group form-group--flex">
												<label class="form-label">Title *</label>
												<input type="text" class="form-input" bind:value={personalGoals[i].title} maxlength="100" placeholder="e.g., 100 Hitless Runs" />
											</div>
										</div>

										<div class="form-group">
											<label class="form-label">Description</label>
											<textarea class="form-input" bind:value={personalGoals[i].description} maxlength="300" rows="2" placeholder="Describe your goal..."></textarea>
										</div>

										<div class="form-row">
											<div class="form-group form-group--flex">
												<label class="form-label">Game (optional)</label>
												<div class="goal-game-wrap">
													<input
														type="text"
														class="form-input"
														bind:value={personalGoals[i].game}
														maxlength="100"
														placeholder="Start typing a game name..."
														autocomplete="off"
														onfocus={() => openGoalSearch(i)}
														oninput={(e) => { goalSearchQuery = (e.target as HTMLInputElement).value; goalSearchIndex = i; }}
														onblur={() => setTimeout(() => { goalSearchIndex = null; }, 200)}
													/>
													{#if goalSearchIndex === i && goalSearchResults.length > 0}
														<div class="goal-game-results">
															{#each goalSearchResults as g}
																<button type="button" class="goal-game-result" onmousedown={() => selectGoalGame(g.name)}>
																	{g.name}<span class="goal-game-result__id">{g.id}</span>
																</button>
															{/each}
														</div>
													{/if}
												</div>
											</div>
											<div class="form-group">
												<label class="form-label">Status</label>
												<select class="form-input" bind:value={personalGoals[i].completed}>
													<option value={false}>In Progress</option>
													<option value={true}>Completed</option>
												</select>
											</div>
										</div>

										<div class="form-row goal-progress-row">
											<div class="form-group">
												<label class="form-label">Progress (current)</label>
												<input type="number" class="form-input" bind:value={personalGoals[i].current} min="0" placeholder="0" />
											</div>
											<div class="form-group">
												<label class="form-label">Progress (total)</label>
												<input type="number" class="form-input" bind:value={personalGoals[i].total} min="0" placeholder="100" />
											</div>
											<div class="form-group form-group--flex" class:is-disabled={!personalGoals[i].completed}>
												<label class="form-label">Date Completed</label>
												<input type="date" class="form-input" bind:value={personalGoals[i].date_completed} />
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>

						{#if personalGoals.length < MAX_GOALS}
							<button type="button" class="btn btn--small mt-3" onclick={addGoal}>+ Add Personal Goal</button>
						{/if}
						<p class="form-help">You can add up to {MAX_GOALS} personal goals.</p>
					</div>
				{/if}

				<!-- ═══ Highlights ═══ -->
				{#if activeTab === 'highlights'}
					<div class="card mb-4">
						<h2>📌 Highlights</h2>
						<p class="muted mb-3">Pin up to 3 of your best runs to the top of your profile. You can optionally link a video — videos not already on the site require moderator approval.</p>

						<div class="highlights-editor-list">
							{#each highlights as hl, i}
								<div class="goal-editor-item">
									<div class="goal-editor-item__header">
										<span class="goal-editor-item__number">#{i + 1}</span>
										<button type="button" class="goal-editor-item__remove" onclick={() => removeHighlight(i)}>×</button>
									</div>
									<div class="goal-editor-item__content">
										<div class="form-row">
											<div class="form-group form-group--flex">
												<label class="form-label">Game *</label>
												<select class="form-input" bind:value={highlights[i].game_id} onchange={(e) => {
													const sel = games.find((g: any) => g.id === (e.target as HTMLSelectElement).value);
													if (sel) highlights[i].game = sel.name;
												}}>
													<option value="">Select a game...</option>
													{#each games as g}
														<option value={g.id}>{g.name}</option>
													{/each}
												</select>
											</div>
										</div>

										<div class="form-row">
											<div class="form-group form-group--flex">
												<label class="form-label">Achievement / Category</label>
												<input type="text" class="form-input" bind:value={highlights[i].achievement} placeholder="e.g., Hitless Any%" maxlength="100" />
											</div>
										</div>

										<div class="form-group">
											<label class="form-label">Video URL</label>
											<input type="url" class="form-input" bind:value={highlights[i].video_url} placeholder="https://youtube.com/watch?v=..." />
											<p class="form-help">YouTube, Twitch, Bilibili, or Nicovideo</p>
										</div>
									</div>
								</div>
							{/each}
						</div>

						{#if highlights.length < MAX_HIGHLIGHTS}
							<button type="button" class="btn btn--small mt-3" onclick={addHighlight}>+ Add Highlight</button>
						{/if}
						<p class="form-help">You can pin up to {MAX_HIGHLIGHTS} highlights.</p>
					</div>
				{/if}

				<!-- Save Actions -->
				<div class="form-actions">
					<button type="button" class="btn btn--primary" onclick={handleSave} disabled={saving}>
						{saving ? '⏳ Saving...' : 'Save Changes'}
					</button>
					<a href="/profile/settings" class="btn">Cancel</a>
				</div>
			{/if}
		</div>
	</div>
</AuthGuard>

<style>
	.profile-edit { max-width: 700px; margin: 0 auto; }
	.mb-3 { margin-bottom: 1rem; }
	.mb-4 { margin-bottom: 1.5rem; }
	.mt-2 { margin-top: 0.75rem; }
	.mt-3 { margin-top: 1rem; }

	/* Profile Preview */
	.profile-preview {
		border: 1px solid var(--border);
		border-radius: 8px;
		overflow: hidden;
	}
	.profile-preview__content {
		display: flex; align-items: center; gap: 1rem; padding: 1rem;
	}
	.profile-preview__avatar-wrap { flex-shrink: 0; }
	.profile-preview__avatar {
		width: 64px; height: 64px; border-radius: 50%; object-fit: cover;
		border: 2px solid var(--border);
	}
	.profile-preview__name { font-weight: 700; font-size: 1.1rem; }
	.profile-preview__pronouns { margin-left: 0.5rem; font-size: 0.9rem; }

	/* Tabs */
	.profile-edit-tabs {
		display: flex; gap: 0; margin-bottom: 1.5rem;
		border-bottom: 2px solid var(--border); overflow-x: auto;
	}
	.tab {
		padding: 0.6rem 1rem; background: none; border: none; border-bottom: 2px solid transparent;
		margin-bottom: -2px; cursor: pointer; font-size: 0.85rem; font-weight: 500;
		color: var(--muted); white-space: nowrap; transition: color 0.15s, border-color 0.15s;
	}
	.tab:hover { color: var(--fg); }
	.tab.active { color: var(--accent); border-bottom-color: var(--accent); }

	/* Form Elements */
	.form-group { margin-bottom: 1.25rem; }
	.form-group--flex { flex: 1; }
	.form-group--small { flex: 0 0 70px; }
	.form-row { display: flex; gap: 1rem; }
	.form-label { display: block; font-weight: 600; font-size: 0.85rem; margin-bottom: 0.35rem; }
	.form-input, .form-textarea, select.form-input {
		width: 100%; padding: 0.6rem 0.75rem; background: var(--bg); border: 1px solid var(--border);
		border-radius: 8px; color: var(--fg); font-size: 0.9rem; font-family: inherit;
	}
	.form-input:focus, .form-textarea:focus, select.form-input:focus {
		outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
	}
	.form-input:disabled { opacity: 0.5; cursor: not-allowed; }
	.form-textarea { resize: vertical; }
	.form-help { font-size: 0.8rem; color: var(--muted); margin: 0.25rem 0 0; }
	.form-actions {
		display: flex; gap: 0.75rem; padding-top: 1.5rem; border-top: 1px solid var(--border); margin-top: 0.5rem;
	}

	/* Message */
	.form-message {
		padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: 0.9rem;
	}
	.form-message--success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; }
	.form-message--error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }

	/* Avatar Upload */
	.avatar-upload { display: flex; gap: 1rem; align-items: flex-start; }
	.avatar-upload__preview img {
		width: 80px; height: 80px; border-radius: 50%; object-fit: cover;
		border: 2px solid var(--border);
	}
	.avatar-upload__controls { display: flex; flex-direction: column; gap: 0.5rem; }

	/* Accent Color */
	.accent-color-input { display: flex; gap: 0.5rem; align-items: center; }
	.accent-color-input input[type="color"] {
		width: 40px; height: 40px; border: 1px solid var(--border); border-radius: 6px;
		cursor: pointer; padding: 2px;
	}
	.accent-color-input .form-input { flex: 1; font-family: monospace; }

	/* Other Links */
	.other-links-section { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
	.other-link-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
	.other-link-row .form-input { flex: 1; }
	.approval-notice {
		display: flex; gap: 0.5rem; align-items: center; font-size: 0.85rem;
		color: var(--muted); margin-bottom: 0.75rem; padding: 0.5rem 0.75rem;
		background: rgba(255, 193, 7, 0.08); border-radius: 6px;
	}

	/* Goals Editor */
	.goals-editor-list, .highlights-editor-list { display: flex; flex-direction: column; gap: 1rem; }
	.goal-editor-item {
		background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
	}
	.goal-editor-item__header {
		display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem;
		background: var(--bg); border-bottom: 1px solid var(--border);
	}
	.goal-editor-item__number { font-size: 0.8rem; font-weight: 600; color: var(--muted); }
	.goal-editor-item__remove {
		margin-left: auto; background: none; border: none; color: var(--muted);
		font-size: 1.25rem; padding: 0.25rem 0.5rem; cursor: pointer; border-radius: 4px;
	}
	.goal-editor-item__remove:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
	.goal-editor-item__content { padding: 1rem; }
	.goal-editor-item__content .form-row { display: flex; gap: 1rem; }
	.goal-editor-item__content .form-group { margin-bottom: 0.75rem; }
	.goal-editor-item__content .form-label { font-size: 0.8rem; margin-bottom: 0.25rem; }
	.goal-editor-item__content .form-input { font-size: 0.9rem; padding: 0.5rem 0.75rem; }
	.goal-icon { text-align: center; font-size: 1.25rem; }
	.goal-progress-row {
		padding-top: 0.5rem; border-top: 1px dashed var(--border); margin-top: 0.5rem;
	}
	.is-disabled { opacity: 0.4; pointer-events: none; }

	/* Game Search Dropdown */
	.goal-game-wrap { position: relative; }
	.goal-game-results {
		position: absolute; top: 100%; left: 0; right: 0; z-index: 50;
		background: var(--surface); border: 1px solid var(--border); border-top: none;
		border-radius: 0 0 8px 8px; max-height: 180px; overflow-y: auto;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
	}
	.goal-game-result {
		display: block; width: 100%; text-align: left; padding: 0.5rem 0.75rem;
		cursor: pointer; font-size: 0.9rem; border: none; background: none;
		color: var(--fg); border-bottom: 1px solid var(--border);
	}
	.goal-game-result:last-child { border-bottom: none; }
	.goal-game-result:hover { background: var(--accent); color: white; }
	.goal-game-result__id { font-size: 0.75rem; opacity: 0.7; margin-left: 0.5rem; }

	/* Buttons */
	.btn { display: inline-flex; align-items: center; padding: 0.5rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 500; cursor: pointer; text-decoration: none; border: 1px solid var(--border); background: none; color: var(--fg); }
	.btn:hover { border-color: var(--accent); color: var(--accent); }
	.btn--primary { background: var(--accent); color: white; border-color: var(--accent); }
	.btn--primary:hover { opacity: 0.9; color: white; }
	.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn--small { padding: 0.35rem 0.75rem; font-size: 0.8rem; }
	.btn--outline { background: none; }
	.btn--danger { border-color: #ef4444; color: #ef4444; }
	.btn--danger:hover { background: rgba(239, 68, 68, 0.1); }

	/* Utility */
	.text-success { color: #22c55e !important; }
	.text-danger { color: #ef4444 !important; }
	.sign-in-loading { text-align: center; padding: 2rem; }

	/* Responsive */
	@media (max-width: 600px) {
		.form-row { flex-direction: column; gap: 0; }
		.form-group--small { flex: none; width: 100%; }
		.profile-edit-tabs { gap: 0; }
		.tab { padding: 0.5rem 0.6rem; font-size: 0.78rem; }
		.avatar-upload { flex-direction: column; align-items: center; }
	}
</style>
