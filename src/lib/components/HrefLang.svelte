<script lang="ts">
	import { page } from '$app/stores';
	import { locales, localizeHref } from '$lib/paraglide/runtime';

	const baseUrl = 'https://www.challengerun.net';

	const links = $derived(
		locales.map(locale => ({
			locale,
			href: baseUrl + localizeHref($page.url.pathname, { locale })
		}))
	);

	// x-default points to the English (unprefixed) version
	const defaultHref = $derived(baseUrl + localizeHref($page.url.pathname, { locale: 'en' }));
</script>

<svelte:head>
	{#each links as link}
		<link rel="alternate" hreflang={link.locale} href={link.href} />
	{/each}
	<link rel="alternate" hreflang="x-default" href={defaultHref} />
</svelte:head>
