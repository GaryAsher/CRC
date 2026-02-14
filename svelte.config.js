import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		// adapter-static generates a fully static site (works with GitHub Pages)
		// When ready to move to Cloudflare Pages, swap to:
		//   import adapter from '@sveltejs/adapter-cloudflare';
		adapter: adapter({
			pages: 'build',
			assets: 'build',
			fallback: '404.html',
			precompress: false,
			strict: false
		}),

		alias: {
			$data: 'src/data',
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$types: 'src/lib/types'
		},

		paths: {
			// Leave empty for root domain deployment
			base: ''
		}
	}
};

export default config;
