// =============================================================================
// Browser-Side Supabase Client
// =============================================================================
// Used in Svelte components for:
// - OAuth sign-in flows (signInWithOAuth)
// - Real-time subscriptions (if added later)
// - Client-side auth state changes
//
// NOTE: This uses the PUBLIC anon key which is safe to expose.
// Row Level Security in Supabase controls what data users can access.
// =============================================================================

import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		flowType: 'pkce',
		persistSession: true
	}
});
