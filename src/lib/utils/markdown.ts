// =============================================================================
// Markdown & Sanitization Utilities
// =============================================================================
// Renders markdown content from the site's own data files (games, runners,
// rules, news posts). Since this content is committed to the repo and not
// user-submitted at runtime, it doesn't need DOMPurify sanitization.
//
// User-generated content (profile bios, etc.) is submitted through the
// Cloudflare Worker API which validates it server-side before storage.
// =============================================================================

import { marked } from 'marked';

/**
 * Render markdown string to HTML.
 * Used with {@html renderMarkdown(content)} in Svelte templates.
 *
 * Safe because content comes from repo markdown files, not user input.
 * User-submitted content goes through the Worker API for validation.
 */
export function renderMarkdown(input: string): string {
	if (!input) return '';
	return marked.parse(input, { async: false }) as string;
}

/**
 * Strip HTML tags and limit length.
 * For plain text contexts like meta descriptions, search excerpts, etc.
 */
export function sanitizeText(input: string, maxLength = 500): string {
	if (!input || typeof input !== 'string') return '';
	return input
		.replace(/<[^>]*>/g, '')
		.trim()
		.slice(0, maxLength);
}
