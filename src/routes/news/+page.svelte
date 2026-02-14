<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { renderMarkdown } from '$lib/utils/markdown';
	let { data } = $props();
</script>

<svelte:head><title>News | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<h1>News</h1>
	<p class="muted">Announcements and updates from the Challenge Run Community.</p>

	{#each data.posts as post}
		<article class="card news-post">
			<h2>{post.title}</h2>
			<time class="muted">{formatDate(post.date)}</time>
			<div class="news-post__body">
				{@html renderMarkdown(post.content)}
			</div>
		</article>
	{/each}

	{#if data.posts.length === 0}
		<p class="muted">No news yet.</p>
	{/if}
</div>

<style>
	.news-post { margin-bottom: 1.5rem; }
	.news-post h2 { margin: 0 0 0.25rem; }
	.news-post__body { margin-top: 0.75rem; }
</style>
