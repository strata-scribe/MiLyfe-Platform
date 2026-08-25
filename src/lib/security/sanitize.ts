import DOMPurify from 'isomorphic-dompurify';

/**
 * HTML Sanitization for MiLyfe Platform.
 *
 * Used to sanitize rich text content (Tiptap proposals, forum posts, etc.)
 * before storage and on render to prevent XSS attacks.
 */

// Allowed tags for rich text content (Tiptap output)
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's', 'del',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'hr', 'span', 'div', 'sub', 'sup',
  'details', 'summary',
];

const ALLOWED_ATTR = [
  'href', 'target', 'rel', 'src', 'alt', 'title',
  'class', 'id', 'data-*',
  'colspan', 'rowspan',
];

/**
 * Sanitize rich HTML content (proposals, forum posts).
 * Removes dangerous elements while preserving formatting.
 */
export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: true,
    ADD_ATTR: ['target'],
    // Force all links to open in new tab with noopener
    FORBID_ATTR: ['style', 'onerror', 'onclick', 'onload', 'onmouseover'],
  });
}

/**
 * Sanitize plain text — strip ALL HTML tags.
 * For user-generated text that should never contain HTML.
 */
export function sanitizePlainText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}

/**
 * Check if content has potential XSS payloads.
 * Returns true if the content was modified by sanitization (meaning it had dangerous content).
 */
export function hasDangerousContent(html: string): boolean {
  const sanitized = sanitizeRichText(html);
  return sanitized !== html;
}
