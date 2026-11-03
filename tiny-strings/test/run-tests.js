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
test('truncate adds ellipsis', () => assert.strictEqual(truncate('abcdef', 4), 'abc\u2026'));
test('capitalize', () => assert.strictEqual(capitalize('hello world'), 'Hello world'));
test('wordCount empty', () => assert.strictEqual(wordCount(''), 0));
test('wordCount spaces', () => assert.strictEqual(wordCount('  a  b   c '), 3));

console.log(`${passed} passed, ${failures.length} failed`);
for (const failure of failures) console.log(`FAIL: ${failure.name} -> ${failure.message}`);
process.exit(failures.length === 0 ? 0 : 1);
