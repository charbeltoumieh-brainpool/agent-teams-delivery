// tiny-strings: string helpers used by the delivery-pipeline demo.
// Zero dependencies, pure Node.js, so any teammate can run the tests.

/**
 * slugify('Hello World!') -> 'hello-world'
 * Non-alphanumeric runs collapse to a single '-', and leading/trailing
 * separators are stripped, so punctuation-only input yields ''.
 */
function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * truncate('abcdef', 4) -> 'abc\u2026'
 * At most `maxLength` characters are kept before the ellipsis is appended,
 * so the result never exceeds maxLength + 1 characters.
 * Truncating to 0 (or a negative length) yields just the ellipsis, and input
 * that already fits in maxLength is returned unchanged.
 */
function truncate(input, maxLength) {
  const value = String(input);
  const limit = Math.max(0, Number(maxLength) || 0);
  if (value.length <= limit) return value;
  return value.slice(0, Math.max(0, limit - 1)) + '\u2026';
}

/** capitalize('hello world') -> 'Hello world' */
function capitalize(input) {
  const value = String(input);
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1);
}

/**
 * wordCount('a b c') -> 3
 *
 * Tokenisation rule (documented for ticket #6):
 *   1. The input is split on runs of whitespace (/\s+/) after trimming.
 *   2. A token counts as a word only if it contains at least one
 *      alphanumeric character ([A-Za-z0-9]) -- tokens made up purely of
 *      punctuation are dropped instead of counted.
 *
 * Consequences of that rule:
 *   - punctuation-only tokens are never words: 'hi   ,   there' -> 2, '!!!' -> 0.
 *   - Hyphens and apostrophes are NOT split: 'well-known' -> 1,
 *     "don't" -> 1 (an internal hyphen/apostrophe is not whitespace, so the
 *     token stays whole as long as it also holds an alphanumeric char).
 *   - A token that mixes letters and punctuation still counts once:
 *     'hello!' -> 1.
 *   - Whitespace-only or empty input -> 0.
 */
const PUNCTUATION_ONLY_TOKEN = /^[^A-Za-z0-9]+$/;

function wordCount(input) {
  const trimmed = String(input).trim();
  if (!trimmed) return 0;
  return trimmed
    .split(/\s+/)
    .filter((token) => token.length > 0 && !PUNCTUATION_ONLY_TOKEN.test(token)).length;
}

module.exports = { slugify, truncate, capitalize, wordCount };
