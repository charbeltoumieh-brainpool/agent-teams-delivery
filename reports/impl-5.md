# impl-5.md — dev-core implementation report for ticket #5

## 1. Identity

| Field | Value |
|---|---|
| Ticket | #5 — feat: add `excerpt(text, maxLength)` with word-boundary truncation |
| Branch | `feat/5-excerpt` |
| Base SHA branched from | `73d702642ab030f5035a8647cda2e187bf254f5a` (`73d7026` = origin/main after PR #10 / issue #3 merged) |
| Commit | `ee3e0eb` — `feat(excerpt): add word-boundary truncation helper (refs #5)` |
| Dependency | #2 (truncate off-by-one) merged as `140801e` — confirmed done |
| Files touched | `tiny-strings/src/index.js`, `tiny-strings/test/run-tests.js` (only) |

Base was re-fetched with `git fetch origin` before and after the work: origin/main was still
`73d7026` both times, so no rebase/conflict resolution was required. PR #11 (#4) had not landed at
the time of this report.

## 2. Acceptance criteria — VERBATIM from `gh issue view 5`

Quoted exactly as written in the issue (`## Acceptance criteria`):

```
- [ ] `excerpt('the quick brown fox', 11) === 'the quick\u2026'` (no mid-word cut)
- [ ] `excerpt('short', 20) === 'short'`
- [ ] A single word longer than maxLength is hard-cut safely (no throw)
- [ ] Tests added, `node test/run-tests.js` passes
```

Issue summary (verbatim):

> Add `excerpt(text, maxLength)` that returns a truncated excerpt and appends an ellipsis, keeping whole words when possible.

Issue note (verbatim):

> This ticket will likely reuse the behaviour fixed by #2 — do NOT start until #2 is merged (see Depends on).


All four ACs are covered by named tests (mapping in §6).

## 3. Reuse-vs-reimplement decision (explicit)

**Decision: REUSE `truncate()` internally for the cut.** `excerpt()` does not reimplement the
ellipsis/limit arithmetic.

**Why:**

1. `truncate()` (shipped in #2) is the single source of truth for the ellipsis contract: keep at most
   `maxLength` chars before the ellipsis, `maxLength` 0/negative → bare `'…'`, text that fits →
   unchanged, empty input → `''`, never exceeds `maxLength + 1`. Duplicating that arithmetic is how
   the #2 off-by-one bug gets reintroduced in a second place.
2. `excerpt()` therefore inherits — and provably stays consistent with — truncate's boundary
   behaviour, which the tests assert directly (§6, "agrees with truncate" cases).

**How the layering works:** `excerpt()` normalises the same way as its neighbours
(`String(input)`, `Math.max(0, Number(maxLength) || 0)`), returns the input untouched when it fits
(exactly like `truncate`), and otherwise searches for the last whitespace boundary that begins
*before* the cut point.

- **Boundary found** → cut at the boundary, drop the separator run, append `'…'`. This gives
  `'the quick…'` (AC1) with no dangling space.
- **No boundary found** (single over-long word, punctuation-only with no whitespace, or the first
  word itself overflowing) → delegate to `truncate(value, limit)`, i.e. the documented hard cut.
  This gives `'super…'` for AC3 and guarantees excerpt can never be *more* permissive than truncate.

**Consistency evidence at the boundary (raw test names, all passing):**

- `excerpt agrees with truncate when the text has no word boundary (#5)` — for
  `supercalifragilistic` and every `maxLength` 0..10, `excerpt(x,n) === truncate(x,n)`.
- `excerpt agrees with truncate for text that already fits (#5)` — `excerpt('short',20) === truncate('short',20)`,
  `excerpt('',4) === truncate('',4)`.
- `excerpt never exceeds its budget when it appends an ellipsis (#5)` — sweeps 5 texts (Latin,
  Cyrillic, CJK, unbreakable) × `maxLength` 0..12 and asserts the `maxLength`-including-ellipsis
  budget, with the documented `maxLength <= 1` bare-`'…'` degenerate case called out explicitly.

There is **one deliberate, named divergence** from `truncate()` when a whitespace run sits inside
the kept window: excerpt drops that separator (`'!!!…'`), truncate keeps it (`'!!! …'`). See D2.
This is not a contradiction of truncate's contract — excerpt's contract is *separator-free output*,
and it is only exercised where a boundary exists. Where no boundary exists, the two agree exactly.
## 4. Non-string rule (matches the neighbours)

`excerpt` coerces with `String(input)`, identical to `slugify`, `truncate`, `capitalize`,
`wordCount` and `isPalindrome` (all documented in their JSDoc). So `null` → `'null'`,
`undefined` → `'undefined'`, numbers → their decimal string; nothing throws. `maxLength` goes
through `Math.max(0, Number(maxLength) || 0)`, the exact expression `truncate()` uses, so a
non-numeric or missing `maxLength` is treated as `0` → bare `'…'`. The rule and both coercion
paths are documented in the new JSDoc block and asserted by 6 tests.

## 5. Unicode note (lesson from #6)

No letter/number classification is performed at all in `excerpt` — the boundary test is a plain
whitespace regex `\s+\S*$`. Because it makes no ASCII-only assumption, non-Latin input is never
zeroed or mis-split. Cyrillic and CJK are covered by dedicated regression guards, including
`'привет мир как дела'` → `'привет мир…'` and `'你好世界你好世界'` → `'你好世…'`. There is
therefore no ASCII-only character class anywhere in this diff (deliberate: the #6 mistake mode is
structurally absent, not merely tested around).

No fixes for other tickets were folded into this diff, and the PR body makes no claims about other
branches.


## 6. AC → test mapping

| AC | Test(s) |
|---|---|
| AC1 `excerpt('the quick brown fox', 11) === 'the quick…'` (no mid-word cut) | `excerpt cuts at a word boundary (#5)`, `excerpt never leaves a trailing space before the ellipsis (#5)`, `excerpt single-space boundary is dropped, not kept (#5)` |
| AC2 `excerpt('short', 20) === 'short'` | `excerpt returns short text unchanged (#5)`, plus maxLength == / > text length cases |
| AC3 single word longer than maxLength hard-cut, no throw | `excerpt hard-cuts a single over-long word without throwing (#5)`, `... never exceeds maxLength chars (#5)`, `... over-long first word hard-cuts even when later words exist (#5)` |
| AC4 tests added, suite passes | 88 passed / 0 failed / EXIT=0 (§7) |

Additional requested edge cases, all present: empty string; empty string + maxLength 0; maxLength 0;
maxLength 1; negative maxLength; maxLength == text length; maxLength > text length; single word
no spaces (both fit and over-long); leading whitespace; trailing whitespace; consecutive spaces;
single-space boundary; punctuation-only (with and without whitespace); Cyrillic; CJK (spaced and
unspaced); mixed non-Latin; null; number; `undefined`; numeric-string and non-numeric `maxLength`;
missing `maxLength`; dangling-separator probes; over-long-word probes.

## 7. Raw test output

```
$ node test/run-tests.js
88 passed, 0 failed
EXIT=0
```

## 8. Named decisions (behaviour the ticket does not specify)

- **D1 — the boundary search only looks LEFT of the cut point.** If the first word itself overflows,
there is no boundary before the cut, so excerpt hard-cuts the first word even though later words
exist. `excerpt('supercalifragilistic expedition', 8) === 'superca…'`. Rationale: any other choice
would have to push a word *past* the limit, breaking the `maxLength` budget that AC1 and #2's
contract both depend on; hard-cutting keeps the budget the caller asked for.
- **D2 — the separator run at the cut is dropped, so output never ends with whitespace.**
`excerpt('alpha beta gamma', 8) === 'alpha…'` (not `'alpha …'`). Consequence: for punctuation-only
text containing whitespace, `excerpt('!!! ... ---', 5) === '!!!…'`, which is deliberately *not*
byte-identical to `truncate('!!! ... ---', 5)` (`'!!! …'`). Rationale: a dangling separator before an
ellipsis is the visual defect excerpt exists to avoid; when there is no boundary excerpt still
delegates to truncate, so the divergence is confined to inputs where a boundary exists.
- **D3 — "word boundary" means whitespace, not a language-aware word segmenter.** CJK runs are
therefore treated as one unbreakable word: `excerpt('你好世界 好', 5) === '你好世界…'` (fits exactly),
and an over-long CJK run hard-cuts. Rationale: consistent with `wordCount`'s already-documented
whitespace-only tokenisation rule (#6), and it keeps the module zero-dependency — no ICU
dictionary breaking. Documented in JSDoc so the limitation is explicit rather than accidental.
- **D4 — `maxLength <= 1` yields the bare `'…'`.** Inherited verbatim from `truncate` (#2): with no
room for a character plus the ellipsis, only the ellipsis is emitted (1 char, i.e. the documented
`maxLength + 1` degenerate bound rather than a `maxLength` violation). Tested for both 0 and 1 and
for negative input.

## 9. Diff summary

```
 tiny-strings/src/index.js      |  60 ++++++++++++++++-
 tiny-strings/test/run-tests.js | 146 ++++++++++++++++++++++++++++++++++++++++-
 2 files changed, 204 insertions(+), 2 deletions(-)
```

- `src/index.js`: one new `excerpt(input, maxLength)` function with a full JSDoc block (contract,
  reuse note, whitespace notes, non-string rule) and `excerpt` added to `module.exports`. No other
  helper touched.
- `test/run-tests.js`: `excerpt` added to the `require` destructuring; 34 new `test(...)` cases.
  No existing assertion changed, so all 54 pre-existing tests still pass.
- Unrelated working-tree noise (`README.md` local edit, untracked `backlog/`, `pipeline.config.json`,
  `reports/`) was left uncommitted — the commit contains only the two files above.

## 10. Gate

- `node test/run-tests.js` → **88 passed, 0 failed, EXIT=0** (green locally, so the PR is ready for QA).
- Draft PR opened with body `Closes #5`, then marked ready. Not merged — release-manager owns merge.

```json
{
  "taskId": "task_impl_5",
  "status": "ready_for_qa",
  "blockers": [],
  "artifacts": [
    "branch:feat/5-excerpt",
    "commit:ee3e0eb",
    "base:73d702642ab030f5035a8647cda2e187bf254f5a",
    "tiny-strings/src/index.js",
    "tiny-strings/test/run-tests.js",
    "reports/impl-5.md",
    "test-output:88 passed, 0 failed, EXIT=0"
  ],
  "nextOwner": "qa-engineer"
}
```

