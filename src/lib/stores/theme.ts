// =============================================================================
// Theme Store
// =============================================================================
// Manages dark/light theme preference.
// Replaces the inline theme toggle JS in _includes/header.html.
// =============================================================================

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'dark' | 'light';

function getInitialTheme(): Theme {
	if (!browser) return 'dark'; // SSR default

	// Check localStorage first
	const stored = localStorage.getItem('crc-theme');
	if (stored === 'light' || stored === 'dark') return stored;

	// Fall back to system preference
	if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';

	return 'dark';
}

export const theme = writable<Theme>(getInitialTheme());

// Sync to DOM and localStorage whenever it changes
if (browser) {
	theme.subscribe((value) => {
		document.documentElement.setAttribute('data-theme', value);
		localStorage.setItem('crc-theme', value);
	});
}

export function toggleTheme() {
	theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
}
