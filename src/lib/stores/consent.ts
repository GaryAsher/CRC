// =============================================================================
// Cookie Consent Store
// =============================================================================
// Manages cookie consent preferences. Replaces the inline JS from
// _includes/cookie-consent.html in the Jekyll site.
// =============================================================================

import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

const STORAGE_KEY = 'crc_cookie_consent';

export interface CookieConsent {
	essential: boolean;
	analytics: boolean;
	timestamp: string;
}

function loadConsent(): CookieConsent | null {
	if (!browser) return null;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

function createConsentStore() {
	const existing = loadConsent();
	const { subscribe, set } = writable<CookieConsent | null>(existing);

	function save(prefs: Omit<CookieConsent, 'timestamp'>) {
		const consent: CookieConsent = {
			...prefs,
			timestamp: new Date().toISOString()
		};
		if (browser) {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
		}
		set(consent);
		applyConsent(consent);
	}

	function acceptAll() {
		save({ essential: true, analytics: true });
	}

	function rejectNonEssential() {
		save({ essential: true, analytics: false });
	}

	function saveSettings(analytics: boolean) {
		save({ essential: true, analytics });
	}

	// Apply consent on load if it exists
	if (existing) {
		applyConsent(existing);
	}

	return {
		subscribe,
		acceptAll,
		rejectNonEssential,
		saveSettings,
		get: () => get({ subscribe })
	};
}

function applyConsent(prefs: CookieConsent) {
	if (!browser) return;
	if (prefs.analytics) {
		loadAnalytics();
	}
}

function loadAnalytics() {
	if (!browser) return;
	if (document.getElementById('cf-analytics-script')) return;
	const token = document.querySelector<HTMLMetaElement>('meta[name="cf-analytics-token"]');
	if (!token) return;
	const script = document.createElement('script');
	script.id = 'cf-analytics-script';
	script.defer = true;
	script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
	script.setAttribute('data-cf-beacon', JSON.stringify({ token: token.content }));
	document.head.appendChild(script);
}

export const consent = createConsentStore();

/** Whether the user has made a choice at all */
export const hasConsented = writable<boolean>(loadConsent() !== null);

// Keep hasConsented in sync
consent.subscribe((value) => {
	hasConsented.set(value !== null);
});
