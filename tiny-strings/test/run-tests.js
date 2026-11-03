// Basic test harness for tiny-strings. No dependencies.
const assert = require('node:assert');
const { slugify, truncate, capitalize, wordCount, isPalindrome } = require('../src/index.js');

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
// ticket #6: punctuation-only tokens must not be counted as words
// rule: split on /\s+/, drop tokens with no Unicode letter/number (\p{L}/\p{N})
test('wordCount ignores punctuation-only token (#6)', () => assert.strictEqual(wordCount('hi   ,   there'), 2));
test('wordCount punctuation-only input -> 0 (#6)', () => assert.strictEqual(wordCount('!!!'), 0));
test('wordCount whitespace-only input -> 0 (#6)', () => assert.strictEqual(wordCount('   '), 0));
test('wordCount mixed words and punctuation-only tokens (#6)', () =>
  assert.strictEqual(wordCount('  one ,  two . -- three  '), 3));
test('wordCount keeps tokens that mix letters and punctuation (#6)', () =>
  assert.strictEqual(wordCount('hello! world?'), 2));
test('wordCount hyphenated/apostrophe words count once (#6)', () =>
  assert.strictEqual(wordCount("well-known don't"), 2));
test('wordCount digits count as words (#6)', () => assert.strictEqual(wordCount('v2 , 3'), 2));
// ticket #6 re-QA regression guard: the punctuation rule must be Unicode-aware,
// so non-Latin-script words are NOT dropped as punctuation (they were 0 when the
// rule was ASCII-only, while origin/main returned 2).
test('wordCount CJK words are counted (#6)', () => assert.strictEqual(wordCount('你好 世界'), 2));
test('wordCount Cyrillic words are counted (#6)', () => assert.strictEqual(wordCount('привет мир'), 2));
test('wordCount Greek/Arabic/Hangul words are counted (#6)', () =>
  assert.strictEqual(wordCount('γειά σου  مرحبا بالعالم  안녕 하세요'), 6));
test('wordCount non-Latin mixed with punctuation-only tokens (#6)', () =>
  assert.strictEqual(wordCount('你好 , 世界 !!!'), 2));
test('wordCount emoji-only token -> 0 (#6)', () => assert.strictEqual(wordCount('😀 🎉'), 0));
test('wordCount punctuation-only non-ASCII -> 0 (#6)', () =>
  assert.strictEqual(wordCount('！！！ 。。。'), 0));
test('wordCount emoji mixed with words (#6)', () =>
  assert.strictEqual(wordCount('hello 😀 world'), 2));

// ticket #3: isPalindrome ignores case and non-alphanumerics; Unicode-aware (\p{L}\p{N}), not ASCII-only
test('isPalindrome ignores case + punctuation (#3)', () => assert.strictEqual(isPalindrome('A man, a plan, a canal: Panama'), true));
test('isPalindrome returns false for non-palindrome (#3)', () => assert.strictEqual(isPalindrome('hello'), false));
test('isPalindrome empty string -> true (#3)', () => assert.strictEqual(isPalindrome(''), true));
test('isPalindrome numeric string true (#3)', () => assert.strictEqual(isPalindrome('12321'), true));
test('isPalindrome numeric string false (#3)', () => assert.strictEqual(isPalindrome('12345'), false));
test('isPalindrome punctuation-only -> true (#3)', () => assert.strictEqual(isPalindrome('!!! ... ---'), true));
test('isPalindrome single char -> true (#3)', () => assert.strictEqual(isPalindrome('x'), true));
test('isPalindrome unicode case fold (#3)', () => assert.strictEqual(isPalindrome('ÄbBä'), true));
test('isPalindrome accented non-palindrome (#3)', () => assert.strictEqual(isPalindrome('Élu par cette crapule'), false));
// unicode-aware filter proof: accented letters survive and are compared, they are not stripped
// (an ASCII-only filter would strip them, yielding '' -> true)
test('isPalindrome accented input is compared, not stripped (#3)', () => assert.strictEqual(isPalindrome('éàb'), false));
// regression guard: ASCII-only filtering would drop non-Latin letters entirely
test('isPalindrome non-Latin (Cyrillic) palindrome (#3)', () => assert.strictEqual(isPalindrome('А роза упала на лапу Азора'), true));
test('isPalindrome non-Latin (Cyrillic) non-palindrome (#3)', () => assert.strictEqual(isPalindrome('привет'), false));
test('isPalindrome digits + letters mixed false (#3)', () => assert.strictEqual(isPalindrome('a1b2c'), false));
// documented non-string rule: String(input) coercion, same as the other helpers
test('isPalindrome non-string coerced via String(input) (#3)', () => assert.strictEqual(isPalindrome(12321), true));
test('isPalindrome null coerces to "null" (#3)', () => assert.strictEqual(isPalindrome(null), false));

console.log(`${passed} passed, ${failures.length} failed`);
for (const failure of failures) console.log(`FAIL: ${failure.name} -> ${failure.message}`);
process.exit(failures.length === 0 ? 0 : 1);
