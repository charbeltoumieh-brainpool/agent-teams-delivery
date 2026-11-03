// Basic test harness for tiny-strings. No dependencies.
const assert = require('node:assert');
const { slugify, truncate, capitalize, wordCount } = require('../src/index.js');

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
  } catch (error) {
    failures.push({ name, message: error.message });
  }
}

test('slugify basic', () => assert.strictEqual(slugify('Hello World!'), 'hello-world'));
test('slugify trims edges', () => assert.strictEqual(slugify('  Hi There  '), 'hi-there'));
// ticket #1: trailing/leading separators must be stripped, runs collapse to one '-'
test('slugify strips trailing punctuation (#1)', () => assert.strictEqual(slugify('Hello World!'), 'hello-world'));
test('slugify collapses separator runs (#1)', () => assert.strictEqual(slugify('  Foo -- Bar!!  '), 'foo-bar'));
test('slugify punctuation-only input -> empty string (#1)', () => assert.strictEqual(slugify('!!!'), ''));
test('slugify leading punctuation (#1)', () => assert.strictEqual(slugify('--Hello World--'), 'hello-world'));
test('slugify empty input (#1)', () => assert.strictEqual(slugify(''), ''));
test('slugify preserves inner digits (#1)', () => assert.strictEqual(slugify('Version 2.0!'), 'version-2-0'));
test('truncate short passthrough', () => assert.strictEqual(truncate('abc', 5), 'abc'));
// ticket #2: keep at most maxLength chars BEFORE the ellipsis (no off-by-one)
test('truncate adds ellipsis', () => assert.strictEqual(truncate('abcdef', 4), 'abc\u2026'));
test('truncate keeps exactly maxLength chars before ellipsis (#2)', () => assert.strictEqual(truncate('abcdef', 4).length, 4));
test('truncate maxLength 0 -> ellipsis only (#2)', () => assert.strictEqual(truncate('abcdef', 0), '\u2026'));
test('truncate maxLength 1 -> ellipsis only (#2)', () => assert.strictEqual(truncate('abcdef', 1), '\u2026'));
test('truncate maxLength === input length -> unchanged, no ellipsis (#2)', () => assert.strictEqual(truncate('abcdef', 6), 'abcdef'));
test('truncate maxLength === input length for short input (#2)', () => assert.strictEqual(truncate('abc', 3), 'abc'));
test('truncate one shorter than input (#2)', () => assert.strictEqual(truncate('abcd', 3), 'ab\u2026'));
test('truncate empty input (#2)', () => assert.strictEqual(truncate('', 4), ''));
test('truncate negative maxLength -> ellipsis only (#2)', () => assert.strictEqual(truncate('abcdef', -1), '\u2026'));
test('truncate never exceeds maxLength + 1 chars (#2)', () => {
  for (let maxLength = 0; maxLength <= 8; maxLength++) {
    const out = truncate('abcdefghij', maxLength);
    assert.ok(out.length <= maxLength + 1, `maxLength=${maxLength} gave ${out.length} chars`);
  }
});
test('capitalize', () => assert.strictEqual(capitalize('hello world'), 'Hello world'));
test('wordCount empty', () => assert.strictEqual(wordCount(''), 0));
test('wordCount spaces', () => assert.strictEqual(wordCount('  a  b   c '), 3));

console.log(`${passed} passed, ${failures.length} failed`);
for (const failure of failures) console.log(`FAIL: ${failure.name} -> ${failure.message}`);
process.exit(failures.length === 0 ? 0 : 1);
