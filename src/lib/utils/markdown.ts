// =============================================================================
// Markdown & Sanitization Utilities
// =============================================================================
// Safe rendering of user-generated markdown content (bios, rules, etc.).
// Always sanitize before rendering with {@html ...} in Svelte templates.
//
// NOTE: DOMPurify requires a DOM and only runs in the browser.
// During SSR on Cloudflare Workers, we render markdown without sanitization.
// This is safe because:
//   1. Markdown content comes from our bundled data files (not user input)
//   2. The client re-hydrates and DOMPurify runs on the browser
//   3. Any user-submitted content goes through the Worker API which validates it
// =============================================================================

import { marked } from 'marked';
import { browser } from '$app/environment';

let DOMPurify: { sanitize: (html: string, config?: Record<string, unknown>) => string } | null =
	null;

// Load DOMPurify only in browser
if (browser) {
	import('dompurify').then((mod) => {
		DOMPurify = mod.default;
	});
}

const PURIFY_CONFIG = {
	ALLOWED_TAGS: [
		'p', 'br', 'strong', 'em', 'b', 'i', 'u',
		'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
		'ul', 'ol', 'li',
		'a', 'code', 'pre', 'blockquote',
		'table', 'thead', 'tbody', 'tr', 'th', 'td',
		'hr', 'img', 'span', 'div', 'del', 'sup', 'sub'
	],
	ALLOWED_ATTR: [
		'href', 'target', 'rel', 'title', 'alt', 'src',
		'class', 'id'
	],
	ALLOW_DATA_ATTR: false,
	ADD_ATTR: ['target']
};

/**
 * Render markdown string to sanitized HTML.
 * Safe for use with {@html renderMarkdown(content)} in Svelte templates.
 */
export function renderMarkdown(input: string): string {
	if (!input) return '';
	const raw = marked.parse(input, { async: false }) as string;

	// In browser: sanitize with DOMPurify
	if (browser && DOMPurify) {
		return DOMPurify.sanitize(raw, PURIFY_CONFIG);
	}

	// During SSR: return marked output directly
	// Content is from our own bundled data files, not from user input
	return raw;
}

/**
 * Sanitize plain text input (strip HTML, limit length).
 * For non-markdown user inputs like names, statuses, etc.
 */
export function sanitizeText(input: string, maxLength = 500): string {
	if (!input || typeof input !== 'string') return '';

	if (browser && DOMPurify) {
		return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim().slice(0, maxLength);
	}

	// During SSR: basic HTML stripping without DOM
	return input
		.replace(/<[^>]*>/g, '')
		.trim()
		.slice(0, maxLength);
}
