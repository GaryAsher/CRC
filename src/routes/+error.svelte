<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="page-width" style="text-align: center; margin: 4rem auto;">
	<h1 style="font-size: 4rem; margin-bottom: 0.5rem;">{$page.status}</h1>
	<p class="muted" style="font-size: 1.25rem;">{$page.error?.message || 'Page not found'}</p>
	<a href="/" class="btn btn--small" style="margin-top: 1.5rem;">Back to Home</a>
</div>
