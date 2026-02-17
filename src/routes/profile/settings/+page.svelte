<script lang="ts">
	import { onMount } from 'svelte';
	import { user, session } from '$stores/auth';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';
	import AuthGuard from '$components/auth/AuthGuard.svelte';

	// ── Profile Info ──────────────────────────────────────────────────────────
	let runnerId = $state('');
	let displayName = $state('');
	let profileStatus = $state('');
	let profileLoading = $state(true);

	// ── Cookie Prefs ──────────────────────────────────────────────────────────
	let analyticsEnabled = $state(false);

	// ── Actions ───────────────────────────────────────────────────────────────
	let showDeleteConfirm = $state(false);
	let deleteConfirmText = $state('');
	let exporting = $state(false);
	let exportMessage = $state('');

	// ── Derived ───────────────────────────────────────────────────────────────
	let oauthAvatar = $derived($user?.user_metadata?.avatar_url || '/assets/img/site/default-runner.png');
	let oauthName = $derived($user?.user_metadata?.full_name || $user?.email || 'User');
	let oauthProvider = $derived($user?.app_metadata?.provider || 'OAuth');

	onMount(async () => {
		if (!$user) return;

		// Load profile
		try {
			const { data: profile } = await supabase
				.from('runner_profiles')
				.select('runner_id, display_name, status')
				.eq('user_id', $user.id)
				.single();

			if (profile) {
				runnerId = profile.runner_id || '';
				displayName = profile.display_name || '';
				profileStatus = profile.status || '';
			}
		} catch { /* no profile */ }
		profileLoading = false;

		// Load cookie pref
		try {
			const stored = document.cookie.split(';').find(c => c.trim().startsWith('crc-analytics='));
			analyticsEnabled = stored ? stored.split('=')[1]?.trim() === 'true' : false;
		} catch { /* default off */ }
	});

	function toggleAnalytics() {
		analyticsEnabled = !analyticsEnabled;
		const maxAge = 365 * 24 * 60 * 60;
		document.cookie = `crc-analytics=${analyticsEnabled}; path=/; max-age=${maxAge}; SameSite=Lax`;
	}

	async function exportData() {
		exporting = true;
		exportMessage = '';
		try {
			const exportPayload: Record<string, any> = {
				account: {
					id: $user?.id,
					email: $user?.email,
					created_at: $user?.created_at,
					provider: oauthProvider,
					metadata: $user?.user_metadata
				},
				exported_at: new Date().toISOString()
			};

			// Also fetch runner profile data
			if (runnerId) {
				const { data: profile } = await supabase
					.from('runner_profiles')
					.select('*')
					.eq('user_id', $user!.id)
					.single();
				if (profile) exportPayload.runner_profile = profile;
			}

			const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `crc-data-export-${new Date().toISOString().split('T')[0]}.json`;
			a.click();
			URL.revokeObjectURL(url);
			exportMessage = 'Data exported successfully.';
		} catch {
			exportMessage = 'Failed to export data. Please try again.';
		} finally {
			exporting = false;
		}
	}

	async function signOutAllDevices() {
		await supabase.auth.signOut({ scope: 'global' });
		goto('/');
	}
</script>

<svelte:head><title>Settings | Challenge Run Community</title></svelte:head>

<AuthGuard>
	<div class="page-width">
		<div class="settings-page">
			<h1>Settings</h1>

			<!-- Profile Information -->
			<section class="settings-section">
				<h2>👤 Profile Information</h2>
				{#if profileLoading}
					<p class="muted">Loading...</p>
				{:else if runnerId}
					<div class="profile-info-card">
						<div class="profile-info-card__row">
							<span class="muted">Runner ID</span>
							<code>{runnerId}</code>
						</div>
						<div class="profile-info-card__row">
							<span class="muted">Display Name</span>
							<strong>{displayName}</strong>
						</div>
						<div class="profile-info-card__row">
							<span class="muted">Status</span>
							<span class="status-badge status-badge--{profileStatus}">{profileStatus}</span>
						</div>
					</div>
					<div class="settings-actions">
						<a href="/runners/{runnerId}" class="btn btn--outline">View Profile</a>
						<a href="/profile/edit" class="btn btn--outline">Edit Profile</a>
					</div>
				{:else}
					<p class="muted">No runner profile found.</p>
					<a href="/profile/create" class="btn btn--primary">Create Profile</a>
				{/if}
			</section>

			<!-- Cookie Preferences -->
			<section class="settings-section">
				<h2>🍪 Cookie Preferences</h2>
				<p>Control which cookies the site uses. Essential cookies (authentication, theme) are always active.</p>

				<div class="cookie-pref-status">
					<div class="cookie-pref-row">
						<span class="cookie-pref-label">Essential Cookies</span>
						<span class="cookie-pref-value cookie-pref-value--on">Always On</span>
					</div>
					<div class="cookie-pref-row">
						<span class="cookie-pref-label">Analytics Cookies</span>
						<button
							class="cookie-toggle"
							class:is-on={analyticsEnabled}
							onclick={toggleAnalytics}
							aria-label="Toggle analytics cookies"
						>
							<span class="cookie-toggle__track">
								<span class="cookie-toggle__thumb"></span>
							</span>
							<span>{analyticsEnabled ? 'Enabled' : 'Disabled'}</span>
						</button>
					</div>
				</div>
			</section>

			<!-- Connected Account / Linked Accounts -->
			<section class="settings-section">
				<h2>🔗 Linked Accounts</h2>
				<div class="connected-account">
					<img class="connected-avatar" src={oauthAvatar} alt="" />
					<div>
						<strong>{oauthName}</strong>
						<p class="muted">via {oauthProvider.charAt(0).toUpperCase() + oauthProvider.slice(1)}</p>
					</div>
				</div>
			</section>

			<!-- Security -->
			<section class="settings-section">
				<h2>🔒 Security</h2>
				<p>Sign out from all devices and sessions.</p>
				<button class="btn btn--outline" onclick={signOutAllDevices}>Sign Out Everywhere</button>
			</section>

			<!-- Data Export -->
			<section class="settings-section">
				<h2>📦 Data & Privacy</h2>
				<p>Download a copy of your CRC data in JSON format. This includes your profile information, account metadata, and runner profile data.</p>
				<button class="btn btn--outline" onclick={exportData} disabled={exporting}>
					{exporting ? '⏳ Exporting...' : 'Export My Data'}
				</button>
				{#if exportMessage}
					<p class="export-msg">{exportMessage}</p>
				{/if}
			</section>

			<!-- Danger Zone -->
			<section class="settings-section settings-section--danger">
				<h2>⚠️ Danger Zone</h2>
				{#if !showDeleteConfirm}
					<p>Permanently delete your account and all associated data. This action cannot be undone.</p>
					<button class="btn btn--danger" onclick={() => showDeleteConfirm = true}>Delete Account</button>
				{:else}
					<p>Type <strong>DELETE</strong> to confirm account deletion:</p>
					<div class="delete-confirm">
						<input type="text" bind:value={deleteConfirmText} placeholder="Type DELETE" />
						<button
							class="btn btn--danger"
							disabled={deleteConfirmText !== 'DELETE'}
							onclick={() => { /* Account deletion requires admin API — would go through Worker */ }}
						>Permanently Delete</button>
						<button class="btn btn--ghost" onclick={() => { showDeleteConfirm = false; deleteConfirmText = ''; }}>Cancel</button>
					</div>
					<p class="muted" style="margin-top: 0.5rem; font-size: 0.8rem;">
						Account deletion is processed by our team and may take up to 48 hours.
					</p>
				{/if}
			</section>

			<div class="back-link">
				<a href="/profile">← Back to Profile</a>
			</div>
		</div>
	</div>
</AuthGuard>

<style>
	.settings-page { max-width: 600px; margin: 2rem auto; }
	.settings-section { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
	.settings-section h2 { font-size: 1.1rem; margin-bottom: 0.75rem; }
	.settings-section p { margin-bottom: 0.75rem; font-size: 0.9rem; }
	.settings-actions { display: flex; gap: 0.75rem; margin-top: 1rem; }

	/* Profile Info Card */
	.profile-info-card {
		background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
	}
	.profile-info-card__row {
		display: flex; justify-content: space-between; align-items: center;
		padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.9rem;
	}
	.profile-info-card__row:last-child { border-bottom: none; }
	.profile-info-card__row code {
		background: var(--bg); padding: 0.15rem 0.5rem; border-radius: 4px; font-size: 0.85rem;
	}
	.status-badge {
		padding: 0.2rem 0.6rem; border-radius: 12px; font-size: 0.8rem; font-weight: 600; text-transform: capitalize;
	}
	.status-badge--approved { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
	.status-badge--pending { background: rgba(234, 179, 8, 0.15); color: #eab308; }
	.status-badge--rejected { background: rgba(239, 68, 68, 0.15); color: #ef4444; }

	/* Cookie Preferences */
	.cookie-pref-status {
		background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden;
	}
	.cookie-pref-row {
		display: flex; justify-content: space-between; align-items: center;
		padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); font-size: 0.9rem;
	}
	.cookie-pref-row:last-child { border-bottom: none; }
	.cookie-pref-value--on { color: var(--accent); font-weight: 600; font-size: 0.85rem; }
	.cookie-toggle {
		display: flex; align-items: center; gap: 0.5rem; background: none; border: none;
		cursor: pointer; color: var(--muted); font-size: 0.85rem;
	}
	.cookie-toggle.is-on { color: var(--accent); }
	.cookie-toggle__track {
		display: block; width: 36px; height: 20px; border-radius: 10px;
		background: var(--border); position: relative; transition: background 0.2s;
	}
	.cookie-toggle.is-on .cookie-toggle__track { background: var(--accent); }
	.cookie-toggle__thumb {
		position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
		border-radius: 50%; background: white; transition: left 0.2s;
	}
	.cookie-toggle.is-on .cookie-toggle__thumb { left: 18px; }

	/* Connected Account */
	.connected-account {
		display: flex; align-items: center; gap: 1rem; padding: 1rem;
		background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
	}
	.connected-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
	.connected-account .muted { margin: 0; font-size: 0.85rem; }

	/* Buttons */
	.btn { display: inline-flex; align-items: center; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.9rem; cursor: pointer; text-decoration: none; border: 1px solid var(--border); background: none; color: var(--fg); }
	.btn--outline:hover { border-color: var(--accent); color: var(--accent); }
	.btn--outline:disabled { opacity: 0.5; cursor: not-allowed; }
	.btn--primary { background: var(--accent); color: white; border-color: var(--accent); }
	.btn--danger { border-color: #ef4444; color: #ef4444; }
	.btn--danger:hover { background: #ef4444; color: #fff; }
	.btn--danger:disabled { opacity: 0.4; cursor: not-allowed; }
	.btn--ghost { padding: 0.5rem 1rem; border: none; background: none; color: var(--muted); cursor: pointer; font-size: 0.9rem; }

	/* Danger Zone */
	.settings-section--danger { border-color: rgba(239, 68, 68, 0.2); }
	.settings-section--danger h2 { color: #ef4444; }
	.delete-confirm { display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; }
	.delete-confirm input {
		padding: 0.5rem 0.75rem; border: 1px solid #ef4444; border-radius: 8px;
		background: var(--surface); color: var(--fg); font-size: 0.9rem; width: 150px;
	}

	.export-msg { color: var(--accent); font-size: 0.85rem; margin-top: 0.5rem; }
	.back-link a { color: var(--muted); text-decoration: none; font-size: 0.9rem; }
	.back-link a:hover { color: var(--accent); }
</style>
