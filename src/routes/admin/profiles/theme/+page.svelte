<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';

	// This is a duplicate route from the Jekyll site. Redirect to the main theme page.
	onMount(() => {
		goto('/profile/theme', { replaceState: true });
	});
</script>

<svelte:head><title>Theme | Admin | CRC</title></svelte:head>

<div class="page-width">
	<p class="muted" style="text-align:center;padding:4rem;">Redirecting to Theme Customization...</p>
</div>
