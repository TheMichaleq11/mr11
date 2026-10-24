// Bezpieczne wyświetlanie HTML z USOS (aktualności, ankiety) — tylko podstawowe tagi.
import sanitizeHtml from 'sanitize-html';

export function cleanHtml(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, {
    allowedTags: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'h3', 'h4', 'blockquote', 'img', 'span', 'div', 'table', 'thead', 'tbody', 'tr', 'td', 'th'],
    allowedAttributes: { a: ['href'], img: ['src', 'alt'] },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https'] },
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' }),
    },
  });
}

export function plainText(html: string | null | undefined): string {
  if (!html) return '';
  return sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
}
