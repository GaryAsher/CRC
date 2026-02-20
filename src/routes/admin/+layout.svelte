<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { checkAdminRole, fetchPending } from '$lib/admin';

	let { children } = $props();

	let role = $state<{ admin: boolean; verifier: boolean; runnerId: string | null } | null>(null);
	let panelOpen = $state(false);
	let counts = $state<Record<string, number>>({});

	// Determine if user is super admin (is_admin on runner_profiles)
	let isSuperAdmin = $derived(role?.admin === true);
	let isAdmin = $derived(role?.admin === true);
	let isVerifier = $derived(role?.verifier === true);
	let hasAccess = $derived(isAdmin || isVerifier);

	function isActive(path: string): boolean {
		const current = $page.url.pathname;
		if (path === '/admin' || path === '/admin/') {
			return current === '/admin' || current === '/admin/';
		}
		return current.startsWith(path);
	}

	async function loadCounts() {
		try {
			const [profiles, games, runs] = await Promise.all([
				fetchPending('pending_profiles'),
				fetchPending('pending_games'),
				fetchPending('pending_runs')
			]);
			counts = {
				pendingProfiles: profiles.length,
				pendingGames: games.length,
				pendingRuns: runs.length
			};
		} catch { /* ignore count errors */ }
	}

	onMount(async () => {
		role = await checkAdminRole();
		if (role?.admin || role?.verifier) {
			await loadCounts();
		}
	});

	function closePanelOnNav() {
		panelOpen = false;
	}
</script>

<!-- Toggle button (fixed position) -->
{#if hasAccess}
	<button
		type="button"
		class="admin-panel-toggle"
		class:is-open={panelOpen}
		onclick={() => panelOpen = !panelOpen}
		title="Admin Panel"
		aria-label="Toggle admin panel"
	>
		<span class="admin-panel-toggle__icon">{panelOpen ? '✕' : '🛡️'}</span>
	</button>
{/if}

<!-- Slide-out panel -->
{#if hasAccess && panelOpen}
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div class="admin-panel__backdrop" onclick={() => panelOpen = false}></div>
	<aside class="admin-panel">
		<div class="admin-panel__header">
			<span class="admin-panel__title">
				<span class="admin-panel__role-badge">
					{isSuperAdmin ? 'Super Admin' : isAdmin ? 'Admin' : 'Verifier'}
				</span>
				Moderation
			</span>
			<button type="button" class="admin-panel__close" onclick={() => panelOpen = false}>&times;</button>
		</div>

		<nav class="admin-panel__nav">
			<!-- Dashboard (all roles) -->
			<a
				href="/admin"
				class="admin-panel__item"
				class:is-active={isActive('/admin')}
				onclick={closePanelOnNav}
			>
				<span class="admin-panel__icon">📊</span>
				<span class="admin-panel__text">Dashboard</span>
			</a>

			<!-- Super Admin Section -->
			{#if isSuperAdmin}
				<hr class="admin-panel__divider" />
				<div class="admin-panel__section-title">Super Admin</div>
				<a href="/admin/health" class="admin-panel__item" class:is-active={isActive('/admin/health')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">💚</span>
					<span class="admin-panel__text">Site Health</span>
				</a>
				<a href="/admin/financials" class="admin-panel__item" class:is-active={isActive('/admin/financials')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">💰</span>
					<span class="admin-panel__text">Financials</span>
				</a>
				<a href="/admin/users" class="admin-panel__item" class:is-active={isActive('/admin/users')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">👤</span>
					<span class="admin-panel__text">Users</span>
				</a>
				<a href="/admin/debug" class="admin-panel__item" class:is-active={isActive('/admin/debug')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">🔧</span>
					<span class="admin-panel__text">Debug Tools</span>
				</a>
			{/if}

			<!-- Admin Section -->
			{#if isAdmin}
				<hr class="admin-panel__divider" />
				<div class="admin-panel__section-title">Admin</div>
				<a href="/admin/profiles" class="admin-panel__item" class:is-active={isActive('/admin/profiles')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">👥</span>
					<span class="admin-panel__text">Pending Profiles</span>
					{#if counts.pendingProfiles > 0}
						<span class="admin-panel__badge">{counts.pendingProfiles}</span>
					{/if}
				</a>
				<a href="/admin/games" class="admin-panel__item" class:is-active={isActive('/admin/games')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">🎮</span>
					<span class="admin-panel__text">Pending Games</span>
					{#if counts.pendingGames > 0}
						<span class="admin-panel__badge">{counts.pendingGames}</span>
					{/if}
				</a>
				<a href="/admin/runs" class="admin-panel__item" class:is-active={isActive('/admin/runs')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">🏃</span>
					<span class="admin-panel__text">Pending Runs</span>
					{#if counts.pendingRuns > 0}
						<span class="admin-panel__badge">{counts.pendingRuns}</span>
					{/if}
				</a>
				<a href="/admin/staff-guides" class="admin-panel__item" class:is-active={isActive('/admin/staff-guides')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">📖</span>
					<span class="admin-panel__text">Staff Guides</span>
				</a>
			{/if}

			<!-- Verifier Section -->
			{#if isVerifier}
				<hr class="admin-panel__divider" />
				<div class="admin-panel__section-title">Verifier</div>
				<a href="/admin/game-updates" class="admin-panel__item" class:is-active={isActive('/admin/game-updates')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">📝</span>
					<span class="admin-panel__text">Game Updates</span>
				</a>
				<a href="/admin/runs-queue" class="admin-panel__item" class:is-active={isActive('/admin/runs-queue')} onclick={closePanelOnNav}>
					<span class="admin-panel__icon">✅</span>
					<span class="admin-panel__text">Runs in Queue</span>
				</a>
			{/if}
		</nav>

		<div class="admin-panel__footer">
			<a href="/legal/privacy">Privacy</a>
			<a href="/legal/terms">Terms</a>
		</div>
	</aside>
{/if}

<!-- Page content (always rendered) -->
{@render children()}

<style>
	/* Toggle button */
	.admin-panel-toggle {
		position: fixed;
		bottom: 1.5rem;
		right: 1.5rem;
		z-index: 999;
		width: 48px;
		height: 48px;
		border-radius: 50%;
		background: var(--accent);
		border: none;
		color: #fff;
		font-size: 1.25rem;
		cursor: pointer;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: transform 0.15s, background 0.15s;
	}
	.admin-panel-toggle:hover {
		transform: scale(1.05);
	}
	.admin-panel-toggle.is-open {
		background: var(--surface);
		color: var(--fg);
		border: 1px solid var(--border);
	}

	/* Backdrop */
	.admin-panel__backdrop {
		position: fixed;
		inset: 0;
		z-index: 1000;
		background: rgba(0, 0, 0, 0.5);
	}

	/* Panel */
	.admin-panel {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		z-index: 1001;
		width: 280px;
		max-width: 85vw;
		background: var(--bg);
		border-left: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		animation: slideIn 0.2s ease-out;
	}
	@keyframes slideIn {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}

	.admin-panel__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--border);
	}
	.admin-panel__title {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-weight: 600;
		font-size: 0.95rem;
	}
	.admin-panel__role-badge {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		border-radius: 10px;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		background: rgba(99, 102, 241, 0.15);
		color: var(--accent);
	}
	.admin-panel__close {
		background: none;
		border: none;
		font-size: 1.5rem;
		color: var(--muted);
		cursor: pointer;
		padding: 0.25rem;
		line-height: 1;
	}
	.admin-panel__close:hover {
		color: var(--fg);
	}

	/* Nav */
	.admin-panel__nav {
		flex: 1;
		overflow-y: auto;
		padding: 0.75rem 0;
	}
	.admin-panel__item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 1.25rem;
		color: var(--fg);
		text-decoration: none;
		font-size: 0.9rem;
		transition: background 0.1s;
	}
	.admin-panel__item:hover {
		background: var(--surface);
	}
	.admin-panel__item.is-active {
		background: var(--surface);
		color: var(--accent);
		font-weight: 600;
	}
	.admin-panel__icon {
		font-size: 1rem;
		width: 1.5rem;
		text-align: center;
		flex-shrink: 0;
	}
	.admin-panel__text {
		flex: 1;
	}
	.admin-panel__badge {
		background: rgba(239, 68, 68, 0.15);
		color: #ef4444;
		font-size: 0.75rem;
		font-weight: 700;
		padding: 0.1rem 0.5rem;
		border-radius: 10px;
		min-width: 1.25rem;
		text-align: center;
	}
	.admin-panel__divider {
		border: none;
		border-top: 1px solid var(--border);
		margin: 0.5rem 1.25rem;
	}
	.admin-panel__section-title {
		padding: 0.25rem 1.25rem 0.35rem;
		font-size: 0.7rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--muted);
	}

	/* Footer */
	.admin-panel__footer {
		padding: 0.75rem 1.25rem;
		border-top: 1px solid var(--border);
		display: flex;
		gap: 1rem;
		font-size: 0.8rem;
	}
	.admin-panel__footer a {
		color: var(--muted);
		text-decoration: none;
	}
	.admin-panel__footer a:hover {
		color: var(--accent);
	}
</style>
