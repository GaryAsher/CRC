import adapter from '@sveltejs/adapter-cloudflare';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	preprocess: vitePreprocess(),

	kit: {
		adapter: adapter({
			// Cloudflare Pages options
			routes: {
				include: ['/*'],
				exclude: ['<all>']
			}
		}),

		alias: {
			$data: 'src/data',
			$components: 'src/lib/components',
			$stores: 'src/lib/stores',
			$types: 'src/lib/types'
		},

		paths: {
			base: ''
		}
	}
};

export default config;
