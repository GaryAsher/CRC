// =============================================================================
// Markdown & Sanitization Utilities
// =============================================================================
// Renders markdown content and sanitizes the HTML output with DOMPurify.
// All markdown rendering goes through this module to ensure consistent
// XSS protection regardless of content source.
// =============================================================================

import { marked } from 'marked';
import DOMPurify from 'isomorphic-dompurify';

/**
 * Render markdown string to sanitized HTML.
 * Used with {@html renderMarkdown(content)} in Svelte templates.
 *
 * DOMPurify strips any injected scripts, event handlers, or dangerous
 * HTML while preserving safe formatting tags.
 */
export function renderMarkdown(input: string): string {
	if (!input) return '';
	const raw = marked.parse(input, { async: false }) as string;
	return DOMPurify.sanitize(raw);
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
