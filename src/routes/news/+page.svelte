<script lang="ts">
	import { formatDate } from '$lib/utils';
	import { renderMarkdown } from '$lib/utils/markdown';

	let { data } = $props();
</script>

<svelte:head><title>News | Challenge Run Community</title></svelte:head>

<div class="page-width">
	<div class="game-shell">
		<header class="page-header">
			<h1>News & Updates</h1>
			<p class="muted">Latest announcements, new games, rule changes, and community updates.</p>
			<p class="muted">
				<a href="/feed.xml" class="rss-link">📡 Subscribe via RSS</a>
			</p>
		</header>

		{#if data.posts.length > 0}
			<div class="news-list">
				{#each data.posts as post}
					<article class="card news-item">
						<div class="news-item__header">
							<h2 class="news-item__title">{post.title}</h2>
							<time class="news-item__date muted" datetime={String(post.date)}>
								{formatDate(post.date)}
							</time>
						</div>

						{#if (post as any).categories?.length}
							<div class="news-item__categories">
								{#each (post as any).categories as cat}
									<span class="tag tag--small">{cat}</span>
								{/each}
							</div>
						{/if}

						<div class="news-item__excerpt">
							{@html renderMarkdown(post.content)}
						</div>
					</article>
				{/each}
			</div>
		{:else}
			<div class="card">
				<p class="muted">No news posts yet. Check back soon!</p>
			</div>
		{/if}
	</div>
</div>
