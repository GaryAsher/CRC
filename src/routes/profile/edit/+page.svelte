<script lang="ts">
	import { user } from '$stores/auth';
	import { supabase } from '$lib/supabase';
	import { sanitizeText } from '$lib/utils/markdown';
	import AuthGuard from '$components/auth/AuthGuard.svelte';

	type Tab = 'basic' | 'customize' | 'socials' | 'goals' | 'highlights';

	interface Goal {
		icon: string;
		title: string;
		description: string;
		game: string;
		completed: boolean;
		current: number;
		total: number;
		date: string;
	}

	interface Highlight {
		game_id: string;
		game_name: string;
		category: string;
		achievement: string;
		video_url: string;
		video_approved: boolean;
	}

	let { data } = $props();
	const gamesList = data.games; // [{ id, name }]

	// ── State ───────────────────────────────────────────────────
	let activeTab = $state<Tab>('basic');
	let loading = $state(true);
	let saving = $state(false);
	let msg = $state<{ type: 'success' | 'error'; text: string } | null>(null);
	let runnerId = $state('');

	// Basic Info
	let displayName = $state('');
	let pronouns = $state('');
	let location = $state('');
	let bio = $state('');
	let statusMessage = $state('');

	// Customize
	let avatarUrl = $state('');
	let bannerUrl = $state('');
	let uploading = $state(false);
	let uploadMsg = $state('');

	// Socials
	let socialTwitch = $state('');
	let socialYoutube = $state('');
	let socialDiscord = $state('');
	let socialTwitter = $state('');
	let socialBluesky = $state('');
	let socialInstagram = $state('');
	let socialSpeedruncom = $state('');
	let socialSteam = $state('');
	let otherLinks = $state<string[]>(['']);
	let existingApprovedOther = $state<string[]>([]);
	let existingPendingOther = $state<string[]>([]);

	// Goals
	let goals = $state<Goal[]>([]);

	// Highlights
	let highlights = $state<Highlight[]>([]);

	// ── Bio character count ─────────────────────────────────────
	let bioCount = $derived(bio.length);

	// ── Load existing profile ───────────────────────────────────
	$effect(() => {
		if ($user) loadProfile();
	});

	async function loadProfile() {
		loading = true;
		try {
			const { data: profile, error } = await supabase
				.from('runner_profiles')
				.select('runner_id, display_name, pronouns, location, bio, status_message, avatar_url, banner_url, socials, personal_goals, featured_runs, other_links_pending')
				.eq('user_id', $user!.id)
				.maybeSingle();

			if (error || !profile) {
				msg = { type: 'error', text: 'No profile found. Please create a profile first.' };
				loading = false;
				return;
			}

			runnerId = profile.runner_id || '';
			displayName = profile.display_name || '';
			pronouns = profile.pronouns || '';
			location = profile.location || '';
			bio = profile.bio || '';
			statusMessage = profile.status_message || '';
			avatarUrl = profile.avatar_url || '';
			bannerUrl = profile.banner_url || '';

			// Socials
			const s = profile.socials || {};
			socialTwitch = s.twitch || '';
			socialYoutube = s.youtube || '';
			socialDiscord = s.discord || '';
			socialTwitter = s.twitter || '';
			socialBluesky = s.bluesky || '';
			socialInstagram = s.instagram || '';
			socialSpeedruncom = s.speedruncom || '';
			socialSteam = s.steam || '';
			existingApprovedOther = Array.isArray(s.other) ? s.other : [];
			existingPendingOther = Array.isArray(profile.other_links_pending) ? profile.other_links_pending : [];
			otherLinks = [''];

			// Goals
			goals = Array.isArray(profile.personal_goals) ? profile.personal_goals : [];

			// Highlights
			highlights = Array.isArray(profile.featured_runs) ? profile.featured_runs : [];
		} catch (err: any) {
			msg = { type: 'error', text: err?.message || 'Failed to load profile.' };
		}
		loading = false;
	}

	// ── Save ────────────────────────────────────────────────────
	async function handleSave() {
		if (!$user) return;
		saving = true;
		msg = null;

		try {
			// Build socials jsonb — only include non-empty values
			const socials: Record<string, any> = {};
			if (socialTwitch.trim()) socials.twitch = socialTwitch.trim();
			if (socialYoutube.trim()) socials.youtube = socialYoutube.trim();
			if (socialDiscord.trim()) socials.discord = socialDiscord.trim();
			if (socialTwitter.trim()) socials.twitter = socialTwitter.trim();
			if (socialBluesky.trim()) socials.bluesky = socialBluesky.trim();
			if (socialInstagram.trim()) socials.instagram = socialInstagram.trim();
			if (socialSpeedruncom.trim()) socials.speedruncom = socialSpeedruncom.trim();
			if (socialSteam.trim()) socials.steam = socialSteam.trim();
			// Preserve approved other links
			if (existingApprovedOther.length > 0) socials.other = existingApprovedOther;

			// New "other" links → go to other_links_pending for admin review
			const newOtherLinks = otherLinks
				.map(l => l.trim())
				.filter(l => l && isValidUrl(l) && !existingApprovedOther.includes(l) && !existingPendingOther.includes(l));
			const pendingOther = [...existingPendingOther, ...newOtherLinks];

			// Sanitize bio — strip any HTML tags before saving
			const cleanBio = sanitizeText(bio, 1000);

			const update: Record<string, any> = {
				display_name: displayName.trim(),
				pronouns: pronouns.trim() || null,
				location: location.trim() || null,
				bio: cleanBio || null,
				status_message: statusMessage.trim() || null,
				avatar_url: avatarUrl || null,
				banner_url: bannerUrl.trim() || null,
				socials,
				other_links_pending: pendingOther.length > 0 ? pendingOther : null,
				personal_goals: goals.length > 0 ? goals : null,
				featured_runs: highlights.length > 0 ? highlights : null,
				updated_at: new Date().toISOString()
			};

			const { error } = await supabase
				.from('runner_profiles')
				.update(update)
				.eq('user_id', $user.id);

			if (error) throw error;

			// Update local pending state
			existingPendingOther = pendingOther;
			otherLinks = [''];

			msg = { type: 'success', text: 'Profile updated!' };
			// Scroll to top to show message
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} catch (err: any) {
			msg = { type: 'error', text: err?.message || 'Failed to save.' };
		}
		saving = false;
	}

	// ── Avatar Upload ───────────────────────────────────────────
	async function handleAvatarUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file || !$user) return;

		// Validate
		if (!['image/png', 'image/jpeg'].includes(file.type)) {
			uploadMsg = 'Only PNG or JPG files are allowed.';
			return;
		}
		if (file.size > 2 * 1024 * 1024) {
			uploadMsg = 'File must be under 2MB.';
			return;
		}

		uploading = true;
		uploadMsg = '';

		try {
			const ext = file.type === 'image/png' ? 'png' : 'jpg';
			const path = `${$user.id}/avatar.${ext}`;

			// Upload (upsert to overwrite existing)
			const { error: uploadError } = await supabase.storage
				.from('avatars')
				.upload(path, file, { upsert: true, contentType: file.type });

			if (uploadError) throw uploadError;

			// Get public URL
			const { data: urlData } = supabase.storage
				.from('avatars')
				.getPublicUrl(path);

			// Append cache-busting param
			avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
			uploadMsg = 'Avatar uploaded!';
		} catch (err: any) {
			uploadMsg = err?.message || 'Upload failed.';
		}
		uploading = false;
		input.value = '';
	}

	async function removeAvatar() {
		if (!$user) return;
		uploading = true;
		try {
			// Try to remove both extensions
			await supabase.storage.from('avatars').remove([
				`${$user.id}/avatar.png`,
				`${$user.id}/avatar.jpg`
			]);
			avatarUrl = '';
			uploadMsg = 'Avatar removed.';
		} catch {
			uploadMsg = 'Failed to remove avatar.';
		}
		uploading = false;
	}

	// ── URL Validation ──────────────────────────────────────────
	function isValidUrl(s: string): boolean {
		try {
			const u = new URL(s);
			return u.protocol === 'https:' || u.protocol === 'http:';
		} catch { return false; }
	}

	// ── Goals helpers ───────────────────────────────────────────
	function addGoal() {
		if (goals.length >= 10) return;
		goals = [...goals, { icon: '🎯', title: '', description: '', game: '', completed: false, current: 0, total: 100, date: '' }];
	}

	function removeGoal(i: number) {
		goals = goals.filter((_, idx) => idx !== i);
	}

	// ── Highlights helpers ──────────────────────────────────────
	function addHighlight() {
		if (highlights.length >= 3) return;
		highlights = [...highlights, { game_id: '', game_name: '', category: '', achievement: '', video_url: '', video_approved: false }];
	}

	function removeHighlight(i: number) {
		highlights = highlights.filter((_, idx) => idx !== i);
	}

	function setHighlightGame(i: number, gameId: string) {
		const game = gamesList.find((g: any) => g.id === gameId);
		if (!game) return;
		highlights[i] = { ...highlights[i], game_id: game.id, game_name: game.name };
	}

	// ── Other links helpers ─────────────────────────────────────
	function addOtherLink() {
		if (otherLinks.length >= 3) return;
		otherLinks = [...otherLinks, ''];
	}

	function removeOtherLink(i: number) {
		otherLinks = otherLinks.filter((_, idx) => idx !== i);
	}

	// ── Tabs ────────────────────────────────────────────────────
	const TABS: { id: Tab; icon: string; label: string }[] = [
		{ id: 'basic', icon: '👤', label: 'Basic Info' },
		{ id: 'customize', icon: '🎨', label: 'Customize' },
		{ id: 'socials', icon: '🔗', label: 'Socials' },
		{ id: 'goals', icon: '🎯', label: 'Goals' },
		{ id: 'highlights', icon: '📌', label: 'Highlights' }
	];
</script>

<svelte:head><title>Edit Profile | Challenge Run Community</title></svelte:head>

<AuthGuard>
	<div class="page-width">
		<div class="edit-page">
			<p class="muted mb-3">
				<a href={runnerId ? `/runners/${runnerId}` : '/profile'}>← Back to profile</a>
			</p>

			<h1>Edit Profile</h1>
			<p class="muted mb-4">Update your runner profile. Changes save instantly (except "Other Links" which require approval).</p>

			{#if msg}
				<div class="alert alert--{msg.type}">{msg.text}</div>
			{/if}

			{#if loading}
				<div class="edit-loading">
					<div class="spinner"></div>
					<p class="muted">Loading profile...</p>
				</div>
			{:else}
				<!-- Profile Preview -->
				<div class="card preview-card mb-4">
					<div class="preview-banner" style:background-image={bannerUrl ? `url(${bannerUrl})` : 'none'}>
						{#if !bannerUrl}
							<div class="preview-banner__gradient"></div>
						{/if}
					</div>
					<div class="preview-content">
						<div class="preview-avatar-wrap">
							{#if avatarUrl}
								<img class="preview-avatar" src={avatarUrl} alt="" />
							{:else}
								<div class="preview-avatar preview-avatar--placeholder">👤</div>
							{/if}
						</div>
						<div class="preview-info">
							<span class="preview-name">{displayName || 'Display Name'}</span>
							{#if pronouns}
								<span class="preview-pronouns muted">{pronouns}</span>
							{/if}
						</div>
					</div>
				</div>

				<!-- Tab Navigation -->
				<nav class="edit-tabs">
					{#each TABS as tab}
						<button
							class="edit-tab"
							class:edit-tab--active={activeTab === tab.id}
							type="button"
							onclick={() => activeTab = tab.id}
						>
							{tab.icon} {tab.label}
						</button>
					{/each}
				</nav>

				<!-- ═══ BASIC INFO ═══ -->
				{#if activeTab === 'basic'}
					<div class="card tab-card">
						<h2>👤 Basic Info</h2>

						<div class="fg">
							<label class="fl" for="runner-id">Runner ID</label>
							<input id="runner-id" type="text" class="fi" value={runnerId} disabled />
							<p class="fh">Your unique identifier (cannot be changed)</p>
						</div>

						<div class="form-row">
							<div class="fg fg--flex">
								<label class="fl" for="display-name">Display Name *</label>
								<input id="display-name" type="text" class="fi" bind:value={displayName} maxlength="50" required />
								<p class="fh">The name shown on your profile</p>
							</div>
							<div class="fg">
								<label class="fl" for="pronouns">Pronouns</label>
								<input id="pronouns" type="text" class="fi" bind:value={pronouns} maxlength="30" placeholder="e.g., they/them" />
							</div>
						</div>

						<div class="fg">
							<label class="fl" for="location">Location</label>
							<input id="location" type="text" class="fi" bind:value={location} maxlength="50" placeholder="e.g., United States" />
						</div>

						<div class="fg">
							<label class="fl" for="bio">Bio</label>
							<textarea id="bio" class="fi" bind:value={bio} rows="4" maxlength="1000" placeholder="Tell others about yourself..."></textarea>
							<p class="fh">{bioCount}/1000 characters</p>
						</div>

						<div class="fg">
							<label class="fl" for="status-msg">Status Message</label>
							<input id="status-msg" type="text" class="fi" bind:value={statusMessage} maxlength="100" placeholder="What are you working on?" />
							<p class="fh">Short status shown on your profile</p>
						</div>
					</div>
				{/if}

				<!-- ═══ CUSTOMIZE ═══ -->
				{#if activeTab === 'customize'}
					<div class="card tab-card">
						<h2>🎨 Customize</h2>
						<p class="muted mb-3">Update your avatar, banner, and appearance.</p>

						<!-- Avatar -->
						<div class="fg">
							<label class="fl">Avatar</label>
							<div class="avatar-upload">
								<div class="avatar-upload__preview">
									{#if avatarUrl}
										<img src={avatarUrl} alt="Avatar preview" />
									{:else}
										<div class="avatar-upload__placeholder">👤</div>
									{/if}
								</div>
								<div class="avatar-upload__controls">
									<label class="btn btn--small btn--upload">
										📤 Upload Image
										<input type="file" accept="image/png,image/jpeg" onchange={handleAvatarUpload} hidden />
									</label>
									{#if avatarUrl}
										<button type="button" class="btn btn--small btn--outline" onclick={removeAvatar} disabled={uploading}>
											🗑️ Remove
										</button>
									{/if}
									{#if uploading}
										<span class="muted">Uploading...</span>
									{/if}
									{#if uploadMsg}
										<span class="muted">{uploadMsg}</span>
									{/if}
									<p class="fh mt-2">PNG or JPG, max 2MB. Square images work best.</p>
								</div>
							</div>
						</div>

						<!-- Banner URL -->
						<div class="fg">
							<label class="fl" for="banner-url">Banner Image URL</label>
							<input id="banner-url" type="url" class="fi" bind:value={bannerUrl} placeholder="https://example.com/banner.jpg" />
							<p class="fh">Wide image displayed behind your avatar</p>
						</div>

						<!-- Theme link -->
						<div class="fg">
							<label class="fl">Colors & Theme</label>
							<p class="fh">Customize your accent color, background, and font in the <a href="/profile/theme">Theme Editor</a>.</p>
						</div>
					</div>
				{/if}

				<!-- ═══ SOCIALS ═══ -->
				{#if activeTab === 'socials'}
					<div class="card tab-card">
						<h2>🔗 Social Links</h2>
						<p class="muted mb-3">Add links to your streaming and social accounts.</p>

						<div class="form-row">
							<div class="fg fg--flex">
								<label class="fl" for="s-twitch">Twitch</label>
								<input id="s-twitch" type="url" class="fi" bind:value={socialTwitch} placeholder="https://twitch.tv/username" />
							</div>
							<div class="fg fg--flex">
								<label class="fl" for="s-youtube">YouTube</label>
								<input id="s-youtube" type="url" class="fi" bind:value={socialYoutube} placeholder="https://youtube.com/@channel" />
							</div>
						</div>

						<div class="form-row">
							<div class="fg fg--flex">
								<label class="fl" for="s-discord">Discord</label>
								<input id="s-discord" type="url" class="fi" bind:value={socialDiscord} placeholder="https://discord.gg/invite" />
							</div>
							<div class="fg fg--flex">
								<label class="fl" for="s-twitter">Twitter/X</label>
								<input id="s-twitter" type="url" class="fi" bind:value={socialTwitter} placeholder="https://twitter.com/username" />
							</div>
						</div>

						<div class="form-row">
							<div class="fg fg--flex">
								<label class="fl" for="s-bluesky">Bluesky</label>
								<input id="s-bluesky" type="url" class="fi" bind:value={socialBluesky} placeholder="https://bsky.app/profile/handle" />
							</div>
							<div class="fg fg--flex">
								<label class="fl" for="s-instagram">Instagram</label>
								<input id="s-instagram" type="url" class="fi" bind:value={socialInstagram} placeholder="https://instagram.com/username" />
							</div>
						</div>

						<div class="form-row">
							<div class="fg fg--flex">
								<label class="fl" for="s-speedrun">Speedrun.com</label>
								<input id="s-speedrun" type="url" class="fi" bind:value={socialSpeedruncom} placeholder="https://speedrun.com/users/username" />
							</div>
							<div class="fg fg--flex">
								<label class="fl" for="s-steam">Steam</label>
								<input id="s-steam" type="url" class="fi" bind:value={socialSteam} placeholder="https://steamcommunity.com/id/username" />
							</div>
						</div>

						<!-- Approved other links (read-only) -->
						{#if existingApprovedOther.length > 0}
							<div class="other-section">
								<label class="fl">Approved Other Links</label>
								{#each existingApprovedOther as link}
									<div class="other-approved">✅ <a href={link} target="_blank" rel="noopener">{link}</a></div>
								{/each}
							</div>
						{/if}

						<!-- Pending other links (read-only) -->
						{#if existingPendingOther.length > 0}
							<div class="other-section">
								<label class="fl">Pending Approval</label>
								{#each existingPendingOther as link}
									<div class="other-pending">⏳ {link}</div>
								{/each}
							</div>
						{/if}

						<!-- Add new other links -->
						<div class="other-section">
							<label class="fl">Other Links</label>
							<div class="approval-notice">
								<span>⚠️</span>
								<span>Other links require moderator approval before appearing on your profile.</span>
							</div>
							{#each otherLinks as link, i}
								<div class="other-link-row">
									<input type="url" class="fi" bind:value={otherLinks[i]} placeholder="https://example.com" />
									{#if otherLinks.length > 1}
										<button type="button" class="btn btn--small btn--outline" onclick={() => removeOtherLink(i)}>✕</button>
									{/if}
								</div>
							{/each}
							{#if otherLinks.length < 3}
								<button type="button" class="btn btn--small mt-2" onclick={addOtherLink}>+ Add Link</button>
							{/if}
							<p class="fh">Up to 3 additional links (must be valid URLs)</p>
						</div>
					</div>
				{/if}

				<!-- ═══ GOALS ═══ -->
				{#if activeTab === 'goals'}
					<div class="card tab-card">
						<h2>🎯 Personal Goals</h2>
						<p class="muted mb-3">Set personal challenges and milestones. These are visible on your profile.</p>

						{#if goals.length === 0}
							<p class="muted">No goals yet. Add one below!</p>
						{/if}

						{#each goals as goal, i}
							<div class="goal-item">
								<div class="goal-item__header">
									<span class="goal-item__number">#{i + 1}</span>
									<button type="button" class="goal-item__remove" onclick={() => removeGoal(i)}>✕</button>
								</div>
								<div class="goal-item__body">
									<div class="form-row">
										<div class="fg" style="flex:0 0 70px">
											<label class="fl" for="goal-icon-{i}">Icon</label>
											<input id="goal-icon-{i}" type="text" class="fi goal-icon-input" bind:value={goals[i].icon} maxlength="2" placeholder="🎯" />
										</div>
										<div class="fg fg--flex">
											<label class="fl" for="goal-title-{i}">Title *</label>
											<input id="goal-title-{i}" type="text" class="fi" bind:value={goals[i].title} maxlength="100" placeholder="e.g., 100 Hitless Runs" />
										</div>
									</div>

									<div class="fg">
										<label class="fl" for="goal-desc-{i}">Description</label>
										<textarea id="goal-desc-{i}" class="fi" bind:value={goals[i].description} maxlength="300" rows="2" placeholder="Describe your goal..."></textarea>
									</div>

									<div class="form-row">
										<div class="fg fg--flex">
											<label class="fl" for="goal-game-{i}">Game</label>
											<select id="goal-game-{i}" class="fi" bind:value={goals[i].game}>
												<option value="">None</option>
												{#each gamesList as g}
													<option value={g.id}>{g.name}</option>
												{/each}
											</select>
										</div>
										<div class="fg">
											<label class="fl" for="goal-status-{i}">Status</label>
											<select id="goal-status-{i}" class="fi" bind:value={goals[i].completed}>
												<option value={false}>In Progress</option>
												<option value={true}>Completed</option>
											</select>
										</div>
									</div>

									<div class="form-row goal-progress">
										<div class="fg">
											<label class="fl" for="goal-current-{i}">Current</label>
											<input id="goal-current-{i}" type="number" class="fi" bind:value={goals[i].current} min="0" />
										</div>
										<div class="fg">
											<label class="fl" for="goal-total-{i}">Total</label>
											<input id="goal-total-{i}" type="number" class="fi" bind:value={goals[i].total} min="0" />
										</div>
										<div class="fg fg--flex">
											<label class="fl" for="goal-date-{i}">Date Completed</label>
											<input id="goal-date-{i}" type="date" class="fi" bind:value={goals[i].date} disabled={!goals[i].completed} />
										</div>
									</div>
								</div>
							</div>
						{/each}

						{#if goals.length < 10}
							<button type="button" class="btn btn--small mt-3" onclick={addGoal}>+ Add Personal Goal</button>
						{/if}
						<p class="fh">Up to 10 personal goals.</p>
					</div>
				{/if}

				<!-- ═══ HIGHLIGHTS ═══ -->
				{#if activeTab === 'highlights'}
					<div class="card tab-card">
						<h2>📌 Highlights</h2>
						<p class="muted mb-3">Pin up to 3 of your best runs to the top of your profile.</p>

						{#if highlights.length === 0}
							<p class="muted">No highlights yet. Add one below!</p>
						{/if}

						{#each highlights as hl, i}
							<div class="highlight-item">
								<div class="highlight-item__header">
									<span class="highlight-item__number">#{i + 1}</span>
									<button type="button" class="highlight-item__remove" onclick={() => removeHighlight(i)}>✕</button>
								</div>
								<div class="highlight-item__body">
									<div class="form-row">
										<div class="fg fg--flex">
											<label class="fl" for="hl-game-{i}">Game *</label>
											<select id="hl-game-{i}" class="fi" value={hl.game_id} onchange={(e) => setHighlightGame(i, (e.target as HTMLSelectElement).value)}>
												<option value="">Select a game...</option>
												{#each gamesList as g}
													<option value={g.id}>{g.name}</option>
												{/each}
											</select>
										</div>
									</div>

									<div class="form-row">
										<div class="fg fg--flex">
											<label class="fl" for="hl-cat-{i}">Category</label>
											<input id="hl-cat-{i}" type="text" class="fi" bind:value={highlights[i].category} maxlength="100" placeholder="e.g., All Bosses No Hit" />
										</div>
										<div class="fg fg--flex">
											<label class="fl" for="hl-ach-{i}">Achievement</label>
											<input id="hl-ach-{i}" type="text" class="fi" bind:value={highlights[i].achievement} maxlength="100" placeholder="e.g., World First" />
										</div>
									</div>

									<div class="fg">
										<label class="fl" for="hl-video-{i}">Video URL</label>
										<input id="hl-video-{i}" type="url" class="fi" bind:value={highlights[i].video_url} placeholder="https://youtube.com/watch?v=..." />
										<p class="fh">Videos not already on the site may require moderator approval.</p>
									</div>
								</div>
							</div>
						{/each}

						{#if highlights.length < 3}
							<button type="button" class="btn btn--small mt-3" onclick={addHighlight}>+ Add Highlight</button>
						{/if}
						<p class="fh">Up to 3 highlights.</p>
					</div>
				{/if}

				<!-- Save Button (visible on all tabs) -->
				<div class="form-actions">
					<button
						class="btn btn--primary"
						onclick={handleSave}
						disabled={saving || !displayName.trim()}
					>
						{saving ? 'Saving...' : 'Save Changes'}
					</button>
					<a href={runnerId ? `/runners/${runnerId}` : '/profile'} class="btn btn--ghost">Cancel</a>
				</div>
			{/if}
		</div>
	</div>
</AuthGuard>

<style>
	.edit-page { max-width: 700px; margin: 2rem auto; }

	/* Loading */
	.edit-loading { text-align: center; padding: 3rem 0; }
	.spinner {
		width: 36px; height: 36px;
		border: 3px solid var(--border); border-top-color: var(--accent);
		border-radius: 50%; margin: 0 auto 1rem;
		animation: spin 0.8s linear infinite;
	}
	@keyframes spin { to { transform: rotate(360deg); } }

	/* Alerts */
	.alert { padding: 0.75rem 1rem; border-radius: 6px; margin-bottom: 1.5rem; font-size: 0.9rem; }
	.alert--success { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: #22c55e; }
	.alert--error { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: #ef4444; }

	/* Preview card */
	.preview-card { overflow: hidden; padding: 0; }
	.preview-banner {
		height: 120px; background-size: cover; background-position: center;
		position: relative;
	}
	.preview-banner__gradient {
		position: absolute; inset: 0;
		background: linear-gradient(135deg, var(--accent), #1a1a2e);
	}
	.preview-content {
		display: flex; align-items: flex-end;
		padding: 0 1rem 1rem; margin-top: -40px; position: relative;
	}
	.preview-avatar {
		width: 80px; height: 80px; border-radius: 50%;
		border: 4px solid var(--surface); background: var(--surface);
		object-fit: cover;
	}
	.preview-avatar--placeholder {
		display: flex; align-items: center; justify-content: center;
		font-size: 2rem; color: var(--muted);
	}
	.preview-info { padding: 0.5rem 0 0 1rem; }
	.preview-name { font-size: 1.25rem; font-weight: 700; display: block; }
	.preview-pronouns { font-size: 0.85rem; }

	/* Tabs */
	.edit-tabs {
		display: flex; gap: 0; border-bottom: 2px solid var(--border);
		margin-bottom: 1.5rem; overflow-x: auto;
	}
	.edit-tab {
		padding: 0.6rem 1rem; background: none; border: none;
		border-bottom: 2px solid transparent; margin-bottom: -2px;
		cursor: pointer; font-size: 0.9rem; font-weight: 600;
		color: var(--muted); white-space: nowrap;
	}
	.edit-tab:hover { color: var(--fg); }
	.edit-tab--active { color: var(--accent); border-bottom-color: var(--accent); }

	/* Card for tab content */
	.tab-card { margin-bottom: 0; }
	.card {
		background: var(--surface); border: 1px solid var(--border);
		border-radius: 12px; padding: 1.5rem;
	}
	.card h2 { margin: 0 0 1rem; font-size: 1.15rem; }
	.mb-3 { margin-bottom: 0.75rem; }
	.mb-4 { margin-bottom: 1rem; }
	.mt-2 { margin-top: 0.5rem; }
	.mt-3 { margin-top: 0.75rem; }

	/* Form elements */
	.fg { margin-bottom: 1.25rem; }
	.fg--flex { flex: 1; }
	.fl { display: block; margin-bottom: 0.35rem; font-size: 0.85rem; font-weight: 600; color: var(--muted); }
	.fi {
		width: 100%; padding: 0.6rem 0.75rem;
		border: 1px solid var(--border); border-radius: 6px;
		background: var(--bg); color: var(--fg);
		font-size: 0.95rem; font-family: inherit;
	}
	.fi:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15); }
	.fi:disabled { opacity: 0.5; cursor: not-allowed; }
	.fh { font-size: 0.8rem; color: var(--muted); margin-top: 0.3rem; }
	.fh a { color: var(--accent); }
	select.fi { cursor: pointer; }
	textarea.fi { resize: vertical; }

	.form-row { display: flex; gap: 1rem; }
	@media (max-width: 600px) {
		.form-row { flex-direction: column; gap: 0; }
	}

	/* Avatar upload */
	.avatar-upload { display: flex; gap: 1rem; align-items: flex-start; }
	.avatar-upload__preview {
		width: 80px; height: 80px; border-radius: 50%; overflow: hidden;
		border: 2px solid var(--border); flex-shrink: 0;
		background: var(--bg);
	}
	.avatar-upload__preview img { width: 100%; height: 100%; object-fit: cover; }
	.avatar-upload__placeholder {
		width: 100%; height: 100%; display: flex;
		align-items: center; justify-content: center;
		font-size: 2rem; color: var(--muted);
	}
	.avatar-upload__controls { display: flex; flex-direction: column; gap: 0.5rem; }

	/* Buttons */
	.btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.9rem; font-weight: 600; cursor: pointer; border: 1px solid var(--border); background: var(--surface); color: var(--fg); text-decoration: none; }
	.btn:hover { border-color: var(--accent); }
	.btn--small { padding: 0.35rem 0.75rem; font-size: 0.85rem; }
	.btn--primary { background: var(--accent); color: #fff; border-color: var(--accent); }
	.btn--primary:hover { opacity: 0.9; }
	.btn--primary:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn--outline { background: none; }
	.btn--ghost { background: none; border: none; color: var(--muted); }
	.btn--ghost:hover { color: var(--fg); }
	.btn--upload { cursor: pointer; }

	/* Other links */
	.other-section { margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); }
	.other-link-row { display: flex; gap: 0.5rem; margin-bottom: 0.5rem; }
	.other-link-row .fi { flex: 1; }
	.other-approved { font-size: 0.85rem; margin-bottom: 0.35rem; }
	.other-approved a { color: var(--accent); }
	.other-pending { font-size: 0.85rem; color: var(--muted); margin-bottom: 0.35rem; }
	.approval-notice {
		display: flex; gap: 0.5rem; align-items: center;
		padding: 0.6rem 0.75rem; border-radius: 6px;
		background: rgba(234, 179, 8, 0.08); border: 1px solid rgba(234, 179, 8, 0.2);
		font-size: 0.85rem; color: var(--fg); margin-bottom: 1rem;
	}

	/* Goals */
	.goal-item, .highlight-item {
		background: var(--bg); border: 1px solid var(--border);
		border-radius: 8px; overflow: hidden; margin-bottom: 1rem;
	}
	.goal-item__header, .highlight-item__header {
		display: flex; align-items: center; justify-content: space-between;
		padding: 0.5rem 0.75rem; background: var(--surface);
		border-bottom: 1px solid var(--border);
	}
	.goal-item__number, .highlight-item__number {
		font-size: 0.8rem; font-weight: 600; color: var(--muted);
	}
	.goal-item__remove, .highlight-item__remove {
		background: none; border: none; color: var(--muted);
		font-size: 1.1rem; cursor: pointer; padding: 0.25rem 0.5rem; border-radius: 4px;
	}
	.goal-item__remove:hover, .highlight-item__remove:hover {
		background: rgba(239, 68, 68, 0.1); color: #ef4444;
	}
	.goal-item__body, .highlight-item__body { padding: 1rem; }
	.goal-item__body .fg, .highlight-item__body .fg { margin-bottom: 0.75rem; }
	.goal-item__body .fl, .highlight-item__body .fl { font-size: 0.8rem; margin-bottom: 0.25rem; }
	.goal-item__body .fi, .highlight-item__body .fi { font-size: 0.9rem; padding: 0.5rem 0.75rem; }
	.goal-icon-input { text-align: center; font-size: 1.25rem; }
	.goal-progress { padding-top: 0.5rem; border-top: 1px dashed var(--border); margin-top: 0.5rem; }

	/* Save actions */
	.form-actions {
		display: flex; gap: 0.75rem; margin-top: 2rem;
		padding-top: 1.5rem; border-top: 1px solid var(--border);
	}
</style>
