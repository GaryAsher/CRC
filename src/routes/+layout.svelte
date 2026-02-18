<script lang="ts">
	import '../styles/main.scss';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { hydrateSession, listenForAuthChanges } from '$stores/auth';
	import Header from '$components/layout/Header.svelte';
	import Footer from '$components/layout/Footer.svelte';
	import BackToTop from '$components/BackToTop.svelte';

	let { data, children } = $props();

	// Hydrate the client auth store from the server-side session
	// (which comes from httpOnly cookies via hooks.server.ts)
	hydrateSession(data.session);

	onMount(() => {
		// Listen for client-side auth state changes (sign-in, sign-out, token refresh)
		return listenForAuthChanges(supabase);
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
