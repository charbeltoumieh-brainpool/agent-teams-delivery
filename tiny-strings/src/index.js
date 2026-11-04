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
 *   2. A token counts as a word only if it contains at least one Unicode
 *      letter or number (\p{L} or \p{N}) -- tokens made up purely of
 *      punctuation are dropped instead of counted.
 *
 * Consequences of that rule:
 *   - punctuation-only tokens are never words: 'hi   ,   there' -> 2, '!!!' -> 0.
 *   - Script-agnostic: any Unicode letter/digit counts, so non-Latin input
 *     works too: '你好 世界' -> 2, 'привет мир' -> 2, '123' -> 1.
 *   - Hyphens and apostrophes are NOT split: 'well-known' -> 1,
 *     "don't" -> 1 (an internal hyphen/apostrophe is not whitespace, so the
 *     token stays whole as long as it also holds an alphanumeric char).
 *   - A token that mixes letters and punctuation still counts once:
 *     'hello!' -> 1.
 *   - Whitespace-only or empty input -> 0.
 */
const PUNCTUATION_ONLY_TOKEN = /^[^\p{L}\p{N}]+$/u;

function wordCount(input) {
  const trimmed = String(input).trim();
  if (!trimmed) return 0;
  return trimmed
    .split(/\s+/)
    .filter((token) => token.length > 0 && !PUNCTUATION_ONLY_TOKEN.test(token)).length;
}

/**
 * isPalindrome('A man, a plan, a canal: Panama') -> true
 * Comparison is case-insensitive and ignores every non-alphanumeric
 * character. Alphanumeric detection is Unicode-aware (\p{L} letters and
 * \p{N} numbers), so accented and non-Latin scripts are handled too, and
 * empty / punctuation-only input is considered a palindrome.
 * Non-string input is coerced with String(input), matching the convention
 * used by the other helpers (slugify, truncate, capitalize, wordCount);
 * null / undefined therefore become 'null' / 'undefined' rather than throwing.
 */
function isPalindrome(input) {
  const normalized = String(input)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
  let left = 0;
  let right = normalized.length - 1;
  while (left < right) {
    if (normalized[left] !== normalized[right]) return false;
    left++;
    right--;
  }
  return true;
}

/**
 * excerpt('the quick brown fox', 11) -> 'the quick\u2026'
 *
 * A word-boundary-aware wrapper around truncate(). The cut itself is delegated
 * to truncate() so the ellipsis contract stays in ONE place (see #2): at most
 * `maxLength` characters are kept before '\u2026', the ellipsis counts toward
 * maxLength, maxLength 0 / negative yields just '\u2026', text that already
 * fits is returned unchanged, and empty input returns ''.
 *
 * Word-boundary rule: when the text has to be cut, excerpt() looks for the last
 * run of whitespace that starts before the cut point and ends the excerpt at
 * the last word that fully fits. The separator run itself is dropped, so the
 * result never ends with a dangling space ('the quick\u2026', never 'the \u2026').
 * If no word boundary exists at all -- a single word longer than maxLength --
 * there is nothing to respect, so excerpt() falls back to truncate()'s hard cut
 * and returns a partial word (no throw, same length contract as truncate).
 *
 * Whitespace handling notes:
 *   - leading whitespace is preserved verbatim, it is not part of the boundary
 *     search (the cut only ever looks left of the cut point);
 *   - multiple consecutive spaces do not produce extra separators because the
 *     whole trailing whitespace run is replaced by the single ellipsis;
 *   - punctuation-only text has no words, so it is treated as unbreakable: with
 *     no whitespace it delegates straight to truncate()'s hard cut, and when it
 *     does contain whitespace the separator run at the cut is still dropped, so
 *     '!!! ... ---' with maxLength 5 yields '!!!\u2026' (never '!!! \u2026').
 *
 * Non-string input is coerced with String(input), matching the documented
 * convention of the other helpers (slugify, truncate, capitalize, wordCount,
 * isPalindrome); null / undefined become 'null' / 'undefined' rather than
 * throwing, and a non-numeric maxLength is treated as 0 via truncate().
 */
function excerpt(input, maxLength) {
  const value = String(input);
  // Same normalisation the neighbours use, so excerpt and truncate agree on
  // what an out-of-range / non-numeric maxLength means.
  const limit = Math.max(0, Number(maxLength) || 0);

  // Nothing to cut: identical to truncate()'s passthrough, no ellipsis.
  if (value.length <= limit) return value;

  // Look for the last whitespace run that begins before the cut point.
  // `cap` is the number of characters that fit (the ellipsis occupies one).
  const cap = Math.max(0, limit - 1);
  const head = value.slice(0, cap);
  const boundary = head.search(/\s+\S*$/);

  if (boundary > 0) {
    // Cut cleanly at the boundary and drop the separator run: no dangling space.
    const wordPart = head.slice(0, boundary);
    return wordPart.length ? wordPart + '\u2026' : truncate(value, limit);
  }

  // No usable word boundary (single long word, punctuation-only, or the first
  // word itself overflows): fall back to truncate()'s documented hard cut.
  return truncate(value, limit);
}

module.exports = { slugify, truncate, capitalize, wordCount, isPalindrome, excerpt };
