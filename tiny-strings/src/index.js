// tiny-strings: string helpers used by the delivery-pipeline demo.
// Zero dependencies, pure Node.js, so any teammate can run the tests.

/** slugify('Hello World!') -> 'hello-world' */
function slugify(input) {
  return String(input)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

/** truncate('abcdef', 4) -> 'abc\u2026' */
function truncate(input, maxLength) {
  const value = String(input);
  if (value.length <= maxLength) return value;
  return value.slice(0, maxLength) + '\u2026';
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

module.exports = { slugify, truncate, capitalize, wordCount };
