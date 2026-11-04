// Basic test harness for tiny-strings. No dependencies.
const assert = require('node:assert');
const { slugify, truncate, capitalize, wordCount, isPalindrome, excerpt } = require('../src/index.js');

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

// ticket #5: excerpt(text, maxLength) - word-boundary truncation that reuses truncate()
// AC1: excerpt('the quick brown fox', 11) === 'the quick…' (no mid-word cut)
test('excerpt cuts at a word boundary (#5)', () => assert.strictEqual(excerpt('the quick brown fox', 11), 'the quick\u2026'));
// AC2: excerpt('short', 20) === 'short' (fits -> untouched, no ellipsis)
test('excerpt returns short text unchanged (#5)', () => assert.strictEqual(excerpt('short', 20), 'short'));
// AC3: a single word longer than maxLength is hard-cut safely (no throw)
test('excerpt hard-cuts a single over-long word without throwing (#5)', () => {
  assert.strictEqual(excerpt('supercalifragilistic', 6), 'super\u2026');
});
test('excerpt over-long word result never exceeds maxLength chars (#5)', () => {
  for (const maxLength of [1, 2, 3, 5, 8]) {
    assert.ok(excerpt('supercalifragilistic', maxLength).length <= maxLength, `maxLength=${maxLength}`);
  }
});

// --- AC1 boundary detail: no dangling separator / odd spacing at the cut ---
test('excerpt never leaves a trailing space before the ellipsis (#5)', () => {
  const samples = [
    ['the quick brown fox', 11],
    ['the quick brown fox', 9],
    ['the quick brown fox', 4],
    ['alpha beta gamma delta', 12],
    ['one two', 5],
  ];
  for (const [text, maxLength] of samples) {
    const out = excerpt(text, maxLength);
    assert.ok(!/\s\u2026$/.test(out), `dangling separator in ${JSON.stringify(out)} for maxLength=${maxLength}`);
  }
});

// --- edge cases required by the ticket ---
test('excerpt empty string (#5)', () => assert.strictEqual(excerpt('', 5), ''));
test('excerpt empty string with maxLength 0 (#5)', () => assert.strictEqual(excerpt('', 0), ''));
test('excerpt maxLength 0 -> ellipsis only, consistent with truncate (#5)', () =>
  assert.strictEqual(excerpt('the quick brown fox', 0), '\u2026'));
test('excerpt maxLength 1 -> ellipsis only, consistent with truncate (#5)', () =>
  assert.strictEqual(excerpt('the quick brown fox', 1), '\u2026'));
test('excerpt negative maxLength -> ellipsis only, consistent with truncate (#5)', () =>
  assert.strictEqual(excerpt('the quick brown fox', -3), '\u2026'));
test('excerpt maxLength exactly the text length -> unchanged (#5)', () =>
  assert.strictEqual(excerpt('the quick brown fox', 19), 'the quick brown fox'));
test('excerpt maxLength exceeding the text length -> unchanged (#5)', () =>
  assert.strictEqual(excerpt('hi there', 100), 'hi there'));
test('excerpt single word exactly at maxLength -> unchanged (#5)', () =>
  assert.strictEqual(excerpt('abcde', 5), 'abcde'));
test('excerpt single word, no spaces, shorter than maxLength -> unchanged (#5)', () =>
  assert.strictEqual(excerpt('hello', 10), 'hello'));
test('excerpt single word, no spaces, longer than maxLength -> hard cut (#5)', () =>
  assert.strictEqual(excerpt('helloworld', 5), 'hell\u2026'));
// D1 (named decision): an over-long FIRST word with later words also hard-cuts,
// because no word boundary exists to the LEFT of the cut point.
test('excerpt over-long first word hard-cuts even when later words exist (#5)', () =>
  assert.strictEqual(excerpt('supercalifragilistic expedition', 8), 'superca\u2026'));

// leading / trailing / consecutive whitespace
test('excerpt preserves leading whitespace (#5)', () =>
  assert.strictEqual(excerpt('  the quick brown fox', 13), '  the quick\u2026'));
test('excerpt trailing whitespace is dropped at the cut (#5)', () => {
  const out = excerpt('the quick   ', 9);
  assert.ok(!/\s\u2026$/.test(out), `dangling separator in ${JSON.stringify(out)}`);
});
test('excerpt collapses a run of consecutive spaces at the cut to one ellipsis (#5)', () => {
  const out = excerpt('alpha     beta gamma', 12);
  assert.ok(!/\s\u2026$/.test(out), `dangling separator in ${JSON.stringify(out)}`);
  assert.ok(!out.includes('  '), `double space in ${JSON.stringify(out)}`);
});
test('excerpt single-space boundary is dropped, not kept (#5)', () =>
  assert.strictEqual(excerpt('alpha beta gamma', 8), 'alpha\u2026'));

// D2 (named decision): punctuation-only text has no word boundary worth keeping,
// so excerpt drops the trailing whitespace run at the cut like it does for words
// ('!!!…'), while text that already fits is passed through untouched ('!!!').
// Note this intentionally differs from truncate()'s mid-space hard cut on the
// SAME input: excerpt's contract is separator-free output, truncate's is
// character-exact. When there is no boundary at all excerpt still delegates.
test('excerpt punctuation-only text drops the separator at the cut (#5)', () => {
  assert.strictEqual(excerpt('!!! ... ---', 5), '!!!\u2026');
  assert.strictEqual(excerpt('!!!', 10), '!!!');
});
test('excerpt delegates to truncate when there is no whitespace at all (#5)', () => {
  assert.strictEqual(excerpt('!!!...---', 5), truncate('!!!...---', 5));
});

// Unicode regression guards (lesson from #6): non-Latin text must survive,
// not be zeroed or mis-split by an ASCII-only assumption.
test('excerpt Cyrillic words cut at a word boundary (#5)', () =>
  assert.strictEqual(excerpt('привет мир как дела', 13), 'привет мир\u2026'));
test('excerpt Cyrillic text fully preserved when it fits (#5)', () =>
  assert.strictEqual(excerpt('привет мир', 20), 'привет мир'));
test('excerpt CJK text (no spaces) hard-cuts safely (#5)', () =>
  assert.strictEqual(excerpt('你好世界你好世界', 4), '你好世\u2026'));
test('excerpt CJK text cut at a whitespace boundary (#5)', () =>
  assert.strictEqual(excerpt('你好 世界', 4), '你好\u2026'));
test('excerpt mixed non-Latin words cut at boundary (#5)', () =>
  assert.strictEqual(excerpt('hello 世界 тест fox', 12), 'hello 世界\u2026'));
// D3 (named decision): the word boundary is whitespace only, so a CJK run is
// treated as one unbreakable word (no script-specific dictionary breaking),
// consistent with wordCount's documented whitespace-only tokenisation.
test('excerpt treats a CJK run as one unbreakable word (#5)', () =>
  assert.strictEqual(excerpt('你好世界 好', 5), '你好世界\u2026'));

// consistency check with truncate's contract at the boundary (reuse evidence):
// excerpt() keeps at most maxLength chars INCLUDING the ellipsis, except in the
// degenerate maxLength<=1 case where '#2' truncate() yields the bare '…' (1 char).
test('excerpt never exceeds its budget when it appends an ellipsis (#5)', () => {
  const texts = ['the quick brown fox', 'hi there', 'supercalifragilistic', 'привет мир как дела', '你好世界你好世界']; // prettier-ignore
  for (const text of texts) {
    for (let maxLength = 0; maxLength <= 12; maxLength++) {
      const out = excerpt(text, maxLength);
      if (out.endsWith('\u2026')) {
        if (maxLength <= 1) {
          assert.strictEqual(out, '\u2026', `maxLength=${maxLength} must yield bare ellipsis`);
        } else {
          assert.ok(out.length <= maxLength, `maxLength=${maxLength} text=${text} gave ${JSON.stringify(out)}`);
        }
      } else {
        assert.ok(text.length <= maxLength, `untruncated passthrough expected at maxLength=${maxLength}`);
      }
    }
  }
});
test('excerpt agrees with truncate when the text has no word boundary (#5)', () => {
  for (let maxLength = 0; maxLength <= 10; maxLength++) {
    assert.strictEqual(excerpt('supercalifragilistic', maxLength), truncate('supercalifragilistic', maxLength));
  }
});
test('excerpt agrees with truncate for text that already fits (#5)', () => {
  assert.strictEqual(excerpt('short', 20), truncate('short', 20));
  assert.strictEqual(excerpt('', 4), truncate('', 4));
});

// non-string coercion rule (String(input)), matching the neighbours
test('excerpt non-string coerced via String(input) (#5)', () =>
  assert.strictEqual(excerpt(123456789, 4), '123\u2026'));
test('excerpt null coerces to "null" (#5)', () => assert.strictEqual(excerpt(null, 10), 'null'));
test('excerpt undefined coerces to "undefined" and is cut (#5)', () =>
  assert.strictEqual(excerpt(undefined, 4), 'und\u2026'));
test('excerpt numeric-string maxLength 0 coercion -> ellipsis only (#5)', () =>
  assert.strictEqual(excerpt('hello world', '0'), '\u2026'));
test('excerpt non-numeric maxLength is treated as 0 (#5)', () =>
  assert.strictEqual(excerpt('hello world', 'abc'), '\u2026'));
test('excerpt does not throw for missing maxLength (#5)', () =>
  assert.strictEqual(excerpt('hello world'), '\u2026'));

console.log(`${passed} passed, ${failures.length} failed`);
for (const failure of failures) console.log(`FAIL: ${failure.name} -> ${failure.message}`);
process.exit(failures.length === 0 ? 0 : 1);
