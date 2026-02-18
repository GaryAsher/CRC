import { getPosts } from '$lib/server/data';
import type { RequestHandler } from './$types';

export const prerender = true;

export const GET: RequestHandler = async () => {
	const posts = getPosts();
	const siteUrl = 'https://www.challengerun.net';

	const items = posts
		.slice(0, 20)
		.map((post) => {
			const date = post.date instanceof Date ? post.date : new Date(post.date);
			const pubDate = isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
			const excerpt = post.excerpt
				|| post.description
				|| post.content?.replace(/<[^>]*>/g, '').replace(/[#*_`~]/g, '').slice(0, 200).trim();
			return `
    <item>
      <title><![CDATA[${post.title || 'Untitled'}]]></title>
      <link>${siteUrl}/news/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/news/${post.slug}</guid>
      <pubDate>${pubDate}</pubDate>
      ${post.author ? `<author>${post.author}</author>` : ''}
      ${excerpt ? `<description><![CDATA[${excerpt}]]></description>` : ''}
    </item>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Challenge Run Community</title>
    <link>${siteUrl}</link>
    <description>News and updates from the Challenge Run Community</description>
    <language>en-us</language>
    <atom:link href="${siteUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

	return new Response(xml.trim(), {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600'
		}
	});
};
