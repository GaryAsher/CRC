<script lang="ts">
	import '../styles/main.scss';
	import { onMount } from 'svelte';
	import { supabase } from '$lib/supabase';
	import { initAuth } from '$stores/auth';
	import Header from '$components/layout/Header.svelte';
	import Footer from '$components/layout/Footer.svelte';

	let { data, children } = $props();

	onMount(() => {
		const unsubscribe = initAuth(supabase);
		return unsubscribe;
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
