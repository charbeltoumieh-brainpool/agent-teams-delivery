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

/** wordCount('a b c') -> 3 */
function wordCount(input) {
  const trimmed = String(input).trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
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

module.exports = { slugify, truncate, capitalize, wordCount, isPalindrome };
