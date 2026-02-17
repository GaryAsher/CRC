// See https://svelte.dev/docs/kit/types#app.d.ts

import type { SupabaseClient, Session } from '@supabase/supabase-js';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			supabase: SupabaseClient;
			session: Session | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				// Add any Cloudflare Worker bindings here as needed, e.g.:
				// MY_KV: KVNamespace;
				// MY_D1: D1Database;
			};
			context?: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches?: CacheStorage;
		}
	}
}

export {};
