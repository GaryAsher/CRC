<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { localizeHref } from '$lib/paraglide/runtime';
	import { renderMarkdown } from '$lib/utils/markdown';
	import * as m from '$lib/paraglide/messages';
	let { data } = $props();

	let selectedTag = $state<string | null>(null);
	let sortOrder = $state<'newest' | 'oldest'>('newest');

	// Collect all unique tags
	const allTags = $derived.by(() => {
		const tagSet = new Set<string>();
		for (const post of data.posts) {
			for (const tag of post.tags || []) tagSet.add(tag);
		}
		return [...tagSet].sort();
	});

	// Filter and sort
	const filteredPosts = $derived.by(() => {
		let posts = data.posts;
		if (selectedTag) {
			posts = posts.filter((p: any) => p.tags?.includes(selectedTag));
		}
		if (sortOrder === 'oldest') {
			posts = [...posts].reverse();
		}
		return posts;
	});

	function toggleTag(tag: string) {
		selectedTag = selectedTag === tag ? null : tag;
	}
</script>

<svelte:head><title>{m.news_page_title()}</title></svelte:head>

<div class="page-width">
	<h1>{m.news_heading()}</h1>
	<p class="muted">{m.news_description()}</p>

	<!-- Filters -->
	{#if allTags.length > 0}
		<div class="news-filters">
			<div class="news-filters__tags">
				<button
					class="filter-tag"
					class:filter-tag--active={!selectedTag}
					onclick={() => selectedTag = null}
				>{m.news_filter_all()}</button>
				{#each allTags as tag}
					<button
						class="filter-tag"
						class:filter-tag--active={selectedTag === tag}
						onclick={() => toggleTag(tag)}
					>{tag}</button>
				{/each}
			</div>
			<div class="news-filters__sort">
				<select class="sort-select" bind:value={sortOrder}>
					<option value="newest">{m.news_sort_newest()}</option>
					<option value="oldest">{m.news_sort_oldest()}</option>
				</select>
			</div>
		</div>
	{/if}

	{#each filteredPosts as post (post.slug)}
		<article class="card news-post">
			<a href={localizeHref(`/news/${post.slug}`)} class="news-post__link">
				<h2>{post.title}</h2>
			</a>
			<div class="news-post__meta">
				<time class="muted">{formatDate(post.date)}</time>
				{#if post.author}<span class="muted"> · {post.author}</span>{/if}
				{#if post.tags?.length > 0}
					<span class="news-post__tags">
						{#each post.tags as tag}
							<button class="tag tag--clickable" onclick={() => toggleTag(tag)}>{tag}</button>
						{/each}
					</span>
				{/if}
			</div>
			{#if post.excerpt}
				<p class="news-post__excerpt">{post.excerpt}</p>
			{/if}
			<div class="news-post__body">
				{@html renderMarkdown(post.content)}
			</div>
		</article>
	{/each}

	{#if filteredPosts.length === 0}
		<p class="muted empty">{selectedTag ? m.news_no_posts_tag() : m.news_empty()}</p>
	{/if}
</div>

<style>
	.news-post { margin-bottom: 1.5rem; }
	.news-post h2 { margin: 0 0 0.25rem; }
	.news-post__link { text-decoration: none; color: var(--fg); }
	.news-post__link:hover h2 { color: var(--accent); }
	.news-post__meta { font-size: 0.85rem; margin-bottom: 0.5rem; }
	.news-post__excerpt { font-size: 0.9rem; color: var(--muted); margin: 0.25rem 0 0.75rem; font-style: italic; }
	.news-post__tags { margin-left: 0.5rem; }
	.tag {
		display: inline-block; padding: 0.1rem 0.4rem; background: var(--surface);
		border: 1px solid var(--border); border-radius: 4px; font-size: 0.75rem;
		color: var(--muted); margin-left: 0.25rem;
	}
	.tag--clickable {
		cursor: pointer; font-family: inherit; transition: border-color 0.15s, color 0.15s;
	}
	.tag--clickable:hover { border-color: var(--accent); color: var(--accent); }
	.news-post__body { margin-top: 0.75rem; }
	.empty { text-align: center; padding: 2rem 0; }

	/* Filters bar */
	.news-filters {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
		flex-wrap: wrap;
		margin-bottom: 1.5rem;
		padding: 0.75rem 1rem;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
	}
	.news-filters__tags {
		display: flex;
		flex-wrap: wrap;
		gap: 0.35rem;
	}
	.filter-tag {
		padding: 0.3rem 0.65rem;
		font-size: 0.8rem;
		font-weight: 500;
		font-family: inherit;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: none;
		color: var(--muted);
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s, background 0.15s;
	}
	.filter-tag:hover { border-color: var(--accent); color: var(--fg); }
	.filter-tag--active {
		border-color: var(--accent);
		color: var(--accent);
		background: rgba(var(--accent-rgb, 59, 195, 110), 0.08);
		font-weight: 600;
	}
	.news-filters__sort { flex-shrink: 0; }
	.sort-select {
		padding: 0.35rem 0.65rem;
		font-size: 0.8rem;
		font-family: inherit;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--bg);
		color: var(--fg);
		cursor: pointer;
	}
	.sort-select:focus { outline: none; border-color: var(--accent); }

	@media (max-width: 500px) {
		.news-filters { flex-direction: column; align-items: flex-start; }
	}
</style>
