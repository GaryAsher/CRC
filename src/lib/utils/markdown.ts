// =============================================================================
// Markdown & Sanitization Utilities
// =============================================================================
// Safe rendering of user-generated markdown content (bios, rules, etc.).
// Always sanitize before rendering with {@html ...} in Svelte.
// =============================================================================

import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Render markdown string to sanitized HTML.
 * Safe for use with {@html renderMarkdown(content)} in Svelte templates.
 */
export function renderMarkdown(input: string): string {
	if (!input) return '';
	const raw = marked.parse(input, { async: false }) as string;
	return DOMPurify.sanitize(raw, {
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
		// Force all links to open in new tab with noopener
		ALLOW_DATA_ATTR: false,
		ADD_ATTR: ['target'],
	});
}

/**
 * Sanitize plain text input (strip HTML, limit length).
 * For non-markdown user inputs like names, statuses, etc.
 */
export function sanitizeText(input: string, maxLength = 500): string {
	if (!input || typeof input !== 'string') return '';
	return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] }).trim().slice(0, maxLength);
}
