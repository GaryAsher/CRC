import { deLocalizeHref } from '$lib/paraglide/runtime';

/** @type {import('@sveltejs/kit').Reroute} */
export function reroute({ url }) {
	return deLocalizeHref(url.pathname);
}