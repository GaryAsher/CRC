<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { renderMarkdown } from '$lib/utils/markdown';

	let { data } = $props();
</script>

<svelte:head><title>News | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<header class="news-header">
		<h1>News & Updates</h1>
		<p class="muted">Latest announcements, new games, rule changes, and community updates.</p>
	</header>

	{#if data.posts.length === 0}
		<div class="card"><p class="muted">No news posts yet. Check back soon!</p></div>
	{:else}
		<div class="news-list">
			{#each data.posts as post}
				<article class="card news-item">
					<div class="news-item__header">
						<h2 class="news-item__title">{post.title}</h2>
						<div class="news-item__meta">
							<time class="muted" datetime={String(post.date)}>{formatDate(post.date)}</time>
							{#if (post as any).featured}
								<span class="badge badge--featured">Featured</span>
							{/if}
						</div>
					</div>

					{#if (post as any).categories?.length}
						<div class="news-item__tags">
							{#each (post as any).categories as cat}
								<span class="tag tag--small">{cat}</span>
							{/each}
						</div>
					{/if}

					<div class="news-item__body md">
						{@html renderMarkdown(post.content)}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</div>

<style>
	.news-header { margin: 1.5rem 0; }
	.news-header h1 { margin: 0 0 0.25rem; }

	.news-list { display: flex; flex-direction: column; gap: 1.25rem; }

	.news-item__header { margin-bottom: 0.5rem; }
	.news-item__title { margin: 0 0 0.35rem; font-size: 1.2rem; }
	.news-item__meta { display: flex; align-items: center; gap: 0.75rem; }

	.badge--featured {
		display: inline-block; padding: 0.15rem 0.5rem; border-radius: 10px;
		font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
		background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.3);
		color: #f59e0b;
	}

	.news-item__tags { display: flex; gap: 0.35rem; flex-wrap: wrap; margin-bottom: 0.75rem; }

	.news-item__body { font-size: 0.95rem; line-height: 1.65; }

	/* Markdown content */
	.md :global(h2) { margin: 1.25rem 0 0.5rem; font-size: 1.05rem; }
	.md :global(h3) { margin: 1rem 0 0.35rem; font-size: 0.95rem; }
	.md :global(p) { margin: 0.5rem 0; }
	.md :global(ul) { margin: 0.5rem 0; padding-left: 1.5rem; }
	.md :global(li) { margin-bottom: 0.25rem; }
	.md :global(code) { background: var(--surface); padding: 0.1rem 0.35rem; border-radius: 3px; font-size: 0.85em; }
	.md :global(strong) { color: var(--fg); }
</style>
