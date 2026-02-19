import type { Handle } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import {
  PUBLIC_SUPABASE_URL,
  PUBLIC_SUPABASE_ANON_KEY
} from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
  // ─── Skip auth entirely during prerender ───────────────────────
  // During build, SvelteKit prerenders certain pages. The synthetic
  // request has no real cookies or URL params, and accessing
  // url.searchParams throws. Safe to skip — prerendered pages
  // never need auth context.
  if (event.isSubRequest || !event.cookies.getAll().length && !event.request.headers.get('cookie')) {
    event.locals.session = null;
    return resolve(event);
  }

  // ─── Create Supabase client for this request ───────────────────
  event.locals.supabase = createClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false
      }
    }
  );

  // ─── Restore session from httpOnly cookies ─────────────────────
  const accessToken = event.cookies.get('sb-access-token');
  const refreshToken = event.cookies.get('sb-refresh-token');

  if (accessToken && refreshToken) {
    const { data } = await event.locals.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });
    event.locals.session = data.session;

    // Refresh cookies if token was renewed
    if (data.session && data.session.access_token !== accessToken) {
      event.cookies.set('sb-access-token', data.session.access_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60
      });
      event.cookies.set('sb-refresh-token', data.session.refresh_token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30
      });
    }
  } else {
    event.locals.session = null;
  }

  return resolve(event);
};
