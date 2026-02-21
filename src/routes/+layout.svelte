<script lang="ts">
	import '../styles/main.scss';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { hydrateSession, listenForAuthChanges, session } from '$stores/auth';
	import { loadCustomThemeFromStorage, applyCustomTheme } from '$stores/theme';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
	import Header from '$components/layout/Header.svelte';
	import Footer from '$components/layout/Footer.svelte';
	import BackToTop from '$components/BackToTop.svelte';
	import CookieConsent from '$components/CookieConsent.svelte';

	let { data, children } = $props();

	// Hydrate the client auth store from the server-side session
	// (which comes from httpOnly cookies via hooks.server.ts)
	hydrateSession(data.session);

	/** Try to load custom theme from Supabase and apply it (overwrites localStorage) */
	async function syncThemeFromSupabase() {
		try {
			const { data: { session: sess } } = await supabase.auth.getSession();
			if (!sess) return;

			const res = await fetch(
				`${PUBLIC_SUPABASE_URL}/rest/v1/runner_profiles?user_id=eq.${sess.user.id}&select=theme_settings`,
				{
					headers: {
						'apikey': PUBLIC_SUPABASE_ANON_KEY,
						'Authorization': `Bearer ${sess.access_token}`
					}
				}
			);
			if (!res.ok) return;
			const rows = await res.json();
			if (rows.length > 0 && rows[0].theme_settings) {
				const t = rows[0].theme_settings;
				applyCustomTheme(t);
				// Update localStorage so next refresh is instant
				localStorage.setItem('crc-custom-theme', JSON.stringify(t));
			}
		} catch {
			// Supabase sync failed — localStorage theme is already applied, that's fine
		}
	}

	onMount(() => {
		// 1. Apply custom theme from localStorage (inline script in app.html
		//    already did this before paint, but this ensures the store is in sync)
		loadCustomThemeFromStorage();

		// 2. If user is authenticated, sync from Supabase (overrides localStorage if newer)
		const unsub = session.subscribe((sess) => {
			if (sess) syncThemeFromSupabase();
		});

		// 3. Listen for client-side auth state changes
		const unsubAuth = listenForAuthChanges(supabase);

		return () => {
			unsub();
			if (typeof unsubAuth === 'function') unsubAuth();
		};
	});
</script>

<svelte:head>
	<meta name="description" content="Tracking challenge runs, deathless runs, and no-hit achievements across games" />
</svelte:head>

<div class="site-wrapper">
	<Header />
	<main>
		{@render children()}
	</main>
	<Footer />
	<BackToTop />
	<CookieConsent />
</div>

<style>
	.site-wrapper {
		display: flex;
		flex-direction: column;
		min-height: 100vh;
	}
	main {
		flex: 1;
	}
</style>
