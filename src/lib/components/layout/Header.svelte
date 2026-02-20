<script lang="ts">
	import { page } from '$app/stores';
	import { session, user } from '$stores/auth';
	import { toggleTheme, theme } from '$stores/theme';
	import { supabase, signOut as doSignOut } from '$lib/supabase';

	let moreOpen = $state(false);
	let userMenuOpen = $state(false);
	let mobileOpen = $state(false);

	// ─── Profile info (fetched client-side when signed in) ────
	// Schema reality:
	//   runner_profiles: runner_id, is_admin, role  (row exists = approved)
	//   pending_profiles: user_id, status           (row exists = pending)
	//   moderators: user_id, role, can_manage_moderators
	let profileInfo = $state<{
		runner_id: string | null;
		profileState: 'active' | 'pending' | 'none';
		is_admin: boolean;
		is_verifier: boolean;
	} | null>(null);
	let profileLoaded = $state(false);

	// Fetch runner profile when user changes
	$effect(() => {
		const currentUser = $user;
		if (!currentUser) {
			profileInfo = null;
			profileLoaded = false;
			return;
		}

		(async () => {
			try {
				// 1. Check runner_profiles — if a row exists, profile is approved
				const { data: profile } = await supabase
					.from('runner_profiles')
					.select('runner_id, is_admin, role')
					.eq('user_id', currentUser.id)
					.maybeSingle();

				if (profile?.runner_id) {
					// Profile is approved (row only exists after approval)
					// Check moderators table for verifier status
					const { data: mod } = await supabase
						.from('moderators')
						.select('role')
						.eq('user_id', currentUser.id)
						.maybeSingle();

					profileInfo = {
						runner_id: profile.runner_id,
						profileState: 'active',
						is_admin: profile.is_admin === true,
						is_verifier: !!mod
					};
				} else {
					// 2. No runner_profiles row — check pending_profiles
					const { data: pending } = await supabase
						.from('pending_profiles')
						.select('id')
						.eq('user_id', currentUser.id)
						.maybeSingle();

					profileInfo = {
						runner_id: null,
						profileState: pending ? 'pending' : 'none',
						is_admin: false,
						is_verifier: false
					};
				}
			} catch {
				profileInfo = null;
			}
			profileLoaded = true;
		})();
	});

	// ─── Derived: profile link config ─────────────────────────
	let profileLink = $derived.by(() => {
		if (!profileInfo || profileInfo.profileState === 'none') {
			return { href: '/profile/create', icon: '➕', label: 'Create Profile' };
		}
		if (profileInfo.profileState === 'active' && profileInfo.runner_id) {
			return { href: `/runners/${profileInfo.runner_id}`, icon: '👤', label: 'My Profile' };
		}
		if (profileInfo.profileState === 'pending') {
			return { href: '/profile/status', icon: '⏳', label: 'Profile Status' };
		}
		return { href: '/profile/create', icon: '➕', label: 'Create Profile' };
	});

	let roleLabel = $derived.by(() => {
		if (!profileInfo || profileInfo.profileState === 'none') return 'No Profile';
		if (profileInfo.is_admin) return 'Admin';
		if (profileInfo.is_verifier) return 'Verifier';
		if (profileInfo.profileState === 'pending') return '⏳ Pending';
		return 'Runner';
	});

	let showAdminLink = $derived(
		profileInfo?.is_admin || profileInfo?.is_verifier
	);

	function isActive(path: string): boolean {
		return $page.url.pathname.startsWith(path);
	}

	async function signOut() {
		userMenuOpen = false;
		await doSignOut();
	}

	function closeMenus() {
		moreOpen = false;
		userMenuOpen = false;
	}
</script>

<svelte:window onclick={closeMenus} />

<header class="site-header">
	<a class="brand" href="/" title="Go to Home">CRC</a>

	<button
		class="mobile-toggle"
		class:active={mobileOpen}
		onclick={() => mobileOpen = !mobileOpen}
		aria-label="Toggle navigation"
	>
		<span></span><span></span><span></span>
	</button>

	<nav class="nav" class:nav--open={mobileOpen} aria-label="Primary navigation">
		<div class="nav-group">
			<a href="/games" class:active={isActive('/games')}>Games</a>
			<a href="/runners" class:active={isActive('/runners')}>Runners</a>
			<a href="/teams" class:active={isActive('/teams')}>Teams</a>
			<a href="/submit" class:active={isActive('/submit')}>Submit</a>
			<a href="/search" class="nav-search" title="Search" aria-label="Search">🔍</a>
		</div>

		<div class="nav-group">
			<!-- svelte-ignore a11y_click_events_have_key_events -->
			<!-- svelte-ignore a11y_no_static_element_interactions -->
			<div class="nav-dropdown" onclick={(e) => { e.stopPropagation(); moreOpen = !moreOpen; }}>
				<button type="button" class="nav-dropdown__toggle" aria-expanded={moreOpen}>
					More <span class="nav-dropdown__caret">▾</span>
				</button>
				{#if moreOpen}
					<div class="nav-dropdown__menu">
						<a href="/news" class="nav-dropdown__item">📰 News</a>
						<a href="/rules" class="nav-dropdown__item">📜 Rules</a>
						<a href="/glossary" class="nav-dropdown__item">📖 Glossary</a>
						<a href="/guidelines" class="nav-dropdown__item">📋 Guidelines</a>
						<a href="/support" class="nav-dropdown__item">💬 Support</a>
						<hr class="nav-dropdown__divider" />
						<a href="/feed.xml" class="nav-dropdown__item">📡 RSS Feed</a>
					</div>
				{/if}
			</div>
		</div>

		<div class="nav-group nav-user">
			{#if $session}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<!-- svelte-ignore a11y_no_static_element_interactions -->
				<div class="nav-user__wrap" onclick={(e) => { e.stopPropagation(); userMenuOpen = !userMenuOpen; }}>
					<button type="button" class="nav-user__avatar-btn" aria-label="Account menu">
						<img
							class="nav-user__avatar"
							src={$user?.user_metadata?.avatar_url || '/img/site/default-runner.png'}
							alt=""
						/>
						{#if showAdminLink}
							<span class="nav-user__admin-indicator"></span>
						{/if}
					</button>
					{#if userMenuOpen}
						<div class="nav-user__menu">
							<div class="nav-user__menu-header">
								<img
									class="nav-user__menu-avatar"
									src={$user?.user_metadata?.avatar_url || '/img/site/default-runner.png'}
									alt=""
								/>
								<div class="nav-user__menu-info">
									<span class="nav-user__menu-name">
										{$user?.user_metadata?.full_name || $user?.email || 'User'}
									</span>
									{#if profileLoaded}
										<span class="nav-user__menu-status">{roleLabel}</span>
									{/if}
								</div>
							</div>
							<div class="nav-user__menu-items">
								<a href={profileLink.href} class="nav-user__menu-item">
									{profileLink.icon} {profileLink.label}
								</a>
								{#if profileInfo?.profileState === 'active'}
									<a href="/profile/edit" class="nav-user__menu-item">✏️ Edit Profile</a>
								{/if}
								<a href="/profile/theme" class="nav-user__menu-item">🎨 Theme</a>
								<a href="/profile/settings" class="nav-user__menu-item">⚙️ Settings</a>
								{#if showAdminLink}
									<a href="/admin" class="nav-user__menu-item">
										🛡️ Admin
										{#if profileInfo?.is_admin}
											<span class="nav-user__menu-badge">Admin</span>
										{:else}
											<span class="nav-user__menu-badge">Verifier</span>
										{/if}
									</a>
								{/if}
								<hr class="nav-user__menu-divider" />
								<button type="button" class="nav-user__menu-item nav-user__menu-item--signout" onclick={signOut}>
									🚪 Sign Out
								</button>
							</div>
						</div>
					{/if}
				</div>
			{:else}
				<a href="/sign-in" class="nav-user__signin">Sign In</a>
			{/if}
		</div>

		<button type="button" class="theme-toggle" onclick={toggleTheme} title="Toggle theme" aria-label="Toggle theme">
			{$theme === 'dark' ? '☀️' : '🌙'}
		</button>
	</nav>
</header>

<style>
	.mobile-toggle {
		display: none;
		flex-direction: column;
		gap: 4px;
		background: none;
		border: none;
		cursor: pointer;
		padding: 0.5rem;
	}
	.mobile-toggle span {
		display: block;
		width: 20px;
		height: 2px;
		background: var(--fg);
		transition: 0.2s;
	}
	.theme-toggle {
		background: none;
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 0.35rem 0.5rem;
		cursor: pointer;
		font-size: 0.9rem;
		line-height: 1;
	}
	.theme-toggle:hover {
		border-color: var(--border-hover);
	}
	.nav-user__wrap {
		position: relative;
	}
	.nav-user__signin {
		color: var(--accent);
		text-decoration: none;
		font-weight: 600;
	}
	@media (max-width: 768px) {
		.mobile-toggle { display: flex; }
		.nav { display: none; flex-direction: column; position: absolute; top: 100%; left: 0; right: 0; background: var(--surface); border-bottom: 1px solid var(--border); padding: 1rem; z-index: 100; }
		.nav--open { display: flex; }
		.nav-group { flex-direction: column; }
	}
</style>
