<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { renderMarkdown } from '$lib/utils/markdown';

	let { data } = $props();
	const post = $derived(data.post);
</script>

<svelte:head>
	<title>{post.title} | Challenge Run Community</title>
	{#if post.description}
		<meta name="description" content={post.description} />
	{/if}
</svelte:head>

<div class="page-width">
	<p class="back"><a href="/news">← All News</a></p>

	<article class="post">
		<header class="post__header">
			<h1>{post.title}</h1>
			<div class="post__meta muted">
				<time>{formatDate(post.date)}</time>
				{#if post.author}
					<span>· {post.author}</span>
				{/if}
			</div>
			{#if post.tags && post.tags.length > 0}
				<div class="post__tags">
					{#each post.tags as tag}
						<span class="tag">{tag}</span>
					{/each}
				</div>
			{/if}
		</header>

		<div class="post__body markdown-body">
			{@html renderMarkdown(post.content)}
		</div>
	</article>
</div>

<style>
	.back { margin: 1rem 0 0.5rem; }
	.back a { color: var(--muted); text-decoration: none; }
	.back a:hover { color: var(--fg); }

	.post { max-width: 720px; margin: 0 auto; }
	.post__header { margin-bottom: 2rem; }
	.post__header h1 { margin: 0 0 0.5rem; font-size: 2rem; }
	.post__meta { font-size: 0.9rem; }
	.post__tags { display: flex; gap: 0.5rem; margin-top: 0.75rem; flex-wrap: wrap; }

	.tag {
		display: inline-block;
		padding: 0.15rem 0.5rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.8rem;
		color: var(--muted);
	}

	.post__body :global(h2) { margin: 1.5rem 0 0.75rem; font-size: 1.35rem; }
	.post__body :global(h3) { margin: 1.25rem 0 0.5rem; font-size: 1.1rem; }
	.post__body :global(p) { margin: 0 0 1rem; line-height: 1.7; }
	.post__body :global(ul), .post__body :global(ol) { padding-left: 1.5rem; margin: 0 0 1rem; }
	.post__body :global(li) { margin-bottom: 0.35rem; line-height: 1.6; }
	.post__body :global(a) { color: var(--accent); text-decoration: none; }
	.post__body :global(a:hover) { text-decoration: underline; }
	.post__body :global(blockquote) {
		border-left: 3px solid var(--accent);
		margin: 1rem 0;
		padding: 0.5rem 1rem;
		color: var(--muted);
	}
	.post__body :global(code) {
		background: var(--surface);
		padding: 0.15rem 0.35rem;
		border-radius: 3px;
		font-size: 0.9em;
	}
	.post__body :global(img) { max-width: 100%; border-radius: 8px; }
</style>
