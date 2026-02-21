// =============================================================================
// Theme Store
// =============================================================================
// Manages dark/light theme preference AND custom theme (colors, font, etc.)
// =============================================================================

import { writable } from 'svelte/store';
import { browser } from '$app/environment';

type Theme = 'dark' | 'light';

export interface CustomTheme {
	accentColor: string;
	bgColor: string;
	surfaceColor: string;
	fontFamily: string;
	textOutline: 'none' | 'light' | 'dark' | 'auto';
	bgImageUrl: string;
	bgOpacity: number;
}

export const THEME_DEFAULTS: CustomTheme = {
	accentColor: '#3BC36E',
	bgColor: '#0f0f0f',
	surfaceColor: '#0b0b0b',
	fontFamily: 'system',
	textOutline: 'none',
	bgImageUrl: '',
	bgOpacity: 15,
};

export const FONT_MAP: Record<string, string> = {
	inter: "'Inter', sans-serif",
	roboto: "'Roboto', sans-serif",
	poppins: "'Poppins', sans-serif",
	montserrat: "'Montserrat', sans-serif",
	nunito: "'Nunito', sans-serif",
	ubuntu: "'Ubuntu', sans-serif",
};

// ── Dark / Light toggle ───────────────────────────────────────────────────

function getInitialTheme(): Theme {
	if (!browser) return 'dark';
	const stored = localStorage.getItem('crc-theme');
	if (stored === 'light' || stored === 'dark') return stored;
	if (window.matchMedia('(prefers-color-scheme: light)').matches) return 'light';
	return 'dark';
}

export const theme = writable<Theme>(getInitialTheme());

if (browser) {
	theme.subscribe((value) => {
		document.documentElement.setAttribute('data-theme', value);
		localStorage.setItem('crc-theme', value);
	});
}

export function toggleTheme() {
	theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
}

// ── Custom Theme ──────────────────────────────────────────────────────────

/** Convert hex color to "r, g, b" string for use in rgba() */
function hexToRgb(hex: string): string | null {
	const m = hex.replace('#', '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
	if (!m) return null;
	return `${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}`;
}

/** Compute text-shadow CSS value for a given outline option */
export function outlineShadow(outline: CustomTheme['textOutline'], bgColor?: string): string {
	if (outline === 'none') return 'none';
	if (outline === 'light') return '0 0 4px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.6)';
	if (outline === 'dark') return '0 0 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.6)';
	// auto — use dark outline on dark bg, light outline on light bg
	if (bgColor) {
		const rgb = hexToRgb(bgColor);
		if (rgb) {
			const parts = rgb.split(',').map(s => parseInt(s.trim()));
			const luminance = (parts[0] * 299 + parts[1] * 587 + parts[2] * 114) / 1000;
			if (luminance < 128) {
				return '0 0 4px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.6)';
			}
		}
	}
	return '0 0 4px rgba(255,255,255,0.8), 0 0 2px rgba(255,255,255,0.6)';
}

/** Apply a custom theme object to the document root */
export function applyCustomTheme(data: Partial<CustomTheme>) {
	if (!browser) return;
	const s = document.documentElement.style;

	// Accent + derived focus colors
	if (data.accentColor) {
		s.setProperty('--accent', data.accentColor);
		const rgb = hexToRgb(data.accentColor);
		if (rgb) {
			s.setProperty('--accent-rgb', rgb);
			s.setProperty('--focus', `rgba(${rgb}, 0.6)`);
			s.setProperty('--focus-2', `rgba(${rgb}, 0.35)`);
		}
	}

	// Core colors
	if (data.bgColor) s.setProperty('--bg', data.bgColor);
	if (data.surfaceColor) s.setProperty('--surface', data.surfaceColor);

	// Font
	if (data.fontFamily && data.fontFamily !== 'system' && FONT_MAP[data.fontFamily]) {
		s.setProperty('--font-family', FONT_MAP[data.fontFamily]);
	} else if (data.fontFamily === 'system') {
		s.removeProperty('--font-family');
	}

	// Text outline
	if (data.textOutline) {
		const shadow = outlineShadow(data.textOutline, data.bgColor);
		if (shadow === 'none') {
			s.removeProperty('--text-outline');
		} else {
			s.setProperty('--text-outline', shadow);
		}
	}

	// Background image
	if (data.bgImageUrl !== undefined) {
		if (data.bgImageUrl) {
			s.setProperty('--bg-image', `url('${data.bgImageUrl}')`);
			s.setProperty('--bg-image-opacity', String((data.bgOpacity ?? 15) / 100));
		} else {
			s.removeProperty('--bg-image');
			s.removeProperty('--bg-image-opacity');
		}
	}
}

/** Load custom theme from localStorage and apply it. Returns the data if found. */
export function loadCustomThemeFromStorage(): CustomTheme | null {
	if (!browser) return null;
	try {
		const saved = localStorage.getItem('crc-custom-theme');
		if (!saved) return null;
		const data = JSON.parse(saved) as CustomTheme;
		applyCustomTheme(data);
		return data;
	} catch {
		return null;
	}
}

/** Save custom theme to localStorage and apply it. */
export function saveCustomThemeToStorage(data: CustomTheme) {
	if (!browser) return;
	localStorage.setItem('crc-custom-theme', JSON.stringify(data));
	applyCustomTheme(data);
}

/** Clear custom theme and reset to defaults. */
export function clearCustomTheme() {
	if (!browser) return;
	localStorage.removeItem('crc-custom-theme');
	const s = document.documentElement.style;
	s.removeProperty('--accent');
	s.removeProperty('--accent-rgb');
	s.removeProperty('--focus');
	s.removeProperty('--focus-2');
	s.removeProperty('--bg');
	s.removeProperty('--surface');
	s.removeProperty('--font-family');
	s.removeProperty('--text-outline');
	s.removeProperty('--bg-image');
	s.removeProperty('--bg-image-opacity');
}
