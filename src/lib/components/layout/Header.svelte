<script lang="ts">
	import { page } from '$app/stores';
	import { session, user } from '$stores/auth';
	import { toggleTheme, theme } from '$stores/theme';
	import { supabase } from '$lib/supabase';
	import { goto } from '$app/navigation';

	let moreOpen = $state(false);
	let userMenuOpen = $state(false);
	let mobileOpen = $state(false);

	function isActive(path: string): boolean {
		return $page.url.pathname.startsWith(path);
	}

	async function signOut() {
		await supabase.auth.signOut();
		userMenuOpen = false;
		goto('/');
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
						<a href="/news" class="nav-dropdown__item">📡 RSS Feed</a>
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
								</div>
							</div>
							<div class="nav-user__menu-items">
								<a href="/profile" class="nav-user__menu-item">👤 My Profile</a>
								<a href="/profile/edit" class="nav-user__menu-item">✏️ Edit Profile</a>
								<a href="/profile/settings" class="nav-user__menu-item">⚙️ Settings</a>
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
