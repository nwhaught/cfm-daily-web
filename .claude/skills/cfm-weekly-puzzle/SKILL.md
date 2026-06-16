---
name: cfm-weekly-puzzle
description: Create a week of daily puzzle entries (scryptogram + wordle + reflection prompt) for the cfm-daily app, drawn from the LDS Come Follow Me curriculum for the relevant week. Use when the user asks to build/draft the next week's puzzles, fill puzzle-preview.json, or promote staged puzzles into puzzles.json. Always begins with a themes discussion and waits for the user's go-ahead before writing content.
---

# CFM Weekly Puzzle Builder

Produces one week (typically 7 contiguous days) of puzzle entries for the
cfm-daily app. Output is staged in `data/puzzle-preview.json`, reviewed by the
user, then promoted into `data/puzzles.json` and committed.

The hard part is **choosing good questions and responses**. All content must be
drawn from or inspired by the LDS Church's *Come Follow Me* curriculum for the
relevant week. So this skill is deliberately gated: discuss themes first, write
only when told, promote only when told.

## Workflow — follow in order, and STOP where indicated

### Step 0 — Determine the target week
- The default target is the **7 days immediately following the last date in
  `data/puzzles.json`**. Run `node -e "const d=require('./data/puzzles.json');const k=Object.keys(d).sort();console.log('last:',k[k.length-1])"`
  to find it. Weeks run **Monday–Sunday**.
- If `puzzle-preview.json` already holds entries, treat those dates as the target
  week (the user may be mid-cycle). Confirm the date range with the user.

### Step 1 — Themes discussion (STOP after this)
- Look up the official Come Follow Me reading block for the target week at
  churchofjesuschrist.org (use WebFetch on the come-follow-me schedule, or
  WebSearch for "Come Follow Me 2026 <dates>"). Identify the scripture block and
  its title.
- Write a short discussion of the **key themes** for that week: the central
  doctrines, a few candidate verses, and the angle you'd take for the daily
  reflection questions. This guides the content.
- **STOP. Present the themes and wait for the user's direction.** Do not write
  any puzzle content until the user says to proceed. The user will steer the
  direction (which themes to emphasize, tone, specific passages) before content
  is created.

### Step 2 — Create content (only when the user says to)
Write all 7 entries into `data/puzzle-preview.json`, following the exact
structure in `puzzles.json`. Per-entry shape:

```json
"YYYY-MM-DD": {
  "scryptogram": {
    "solution": "lowercase scripture verse, punctuation preserved",
    "hint": "Book Chapter:Verse",
    "cipher": "26-LETTER SUBSTITUTION ALPHABET"
  },
  "wordle": "FIVEL",
  "prompt": {
    "reference": "Book Chapter:Verse(s) — the CFM passage for the week",
    "referenceText": "the full KJV/scripture text of that reference",
    "question": "2–4 sentence reflective question, second person, personal",
    "response": "a thoughtful 3–5 sentence devotional reflection"
  }
}
```

Content guidance (match the voice of existing entries):
- **scryptogram.solution** — a memorable verse, thematically tied to the week.
  Lowercase, keep original punctuation. Can be drawn from anywhere in scripture,
  not just the week's block. **Bias toward quoting the entire verse**; only trim
  to the memorable clause when the full verse would run long. A **200-character
  soft cap** is enforced as a warning (see constraints) — over that, prefer a
  coherent excerpt that still ends on a complete thought.
- **prompt.reference / referenceText** — the actual Come Follow Me passage for
  that week; the `question` and `response` should engage it personally and
  pastorally, the way the existing June entries do (honest, warm, not preachy).
- **question style** — prefer **plainer, shorter questions** over long, literary,
  multi-clause ones. Aim for a direct, **catechetical** feel (often a simple
  two-part question) rather than writerly prose.
- **wordle** — a 5-letter word resonant with the day's theme.
- **cipher** — see constraints below; it must be a valid derangement permutation
  with no obvious runs.

After writing, **run the checker and fix anything it flags**:
```
npm run check-preview
```
Iterate until it passes (warnings are okay if you've confirmed them). Then tell
the user the week is staged and ready for their manual review.

### Step 3 — User reviews manually
The user reviews `puzzle-preview.json` themselves. Wait for them to approve or
request edits. Apply edits, re-run `npm run check-preview`.

### Step 4 — Promote + commit + push (only when the user says to)
```
npm run promote          # merges preview -> puzzles.json (sorted), clears preview
npm run validate         # structural validation of the live file
git add data/puzzles.json data/puzzle-preview.json
git commit -m "<promote's suggested message, e.g. 'June 8-14'>"
git push
```
`promote` prints a suggested commit message in the repo's existing style. If
`validate` fails, fix `puzzles.json` before committing.

## Constraints

These are enforced automatically by `npm run check-preview` (see
`scripts/check-preview.js`) — they gate new content only, not the historical file:

1. **Cipher is a true permutation** of A–Z (26 distinct letters), and a
   **derangement** (no letter in its own natural position). [hard]
2. **Cipher has no run of 3+ consecutive alphabet letters**, ascending or
   descending (e.g. no `...DEF...` or `...MLK...`), so no obvious substitution
   pattern emerges while solving. [hard]
3. **Wordle not reused within 6 months** — checked against `puzzles.json`
   history and earlier entries in the same batch. [hard]
4. **Wordle is not a plural ending in "S"** — flagged as a **warning** because
   "plural" can't be detected reliably. When you see this warning, judge it
   yourself: verbs (OBEYS) and words like CROSS/BRASS/CHAOS are fine; plural
   nouns (SIGNS, IDOLS, WALLS) are not. Pick a different word if it's a plural.
5. **Scryptogram solution ≤ 200 characters** — a **soft cap** flagged as a
   **warning**. Bias toward including the whole verse; when the full verse
   exceeds the cap, trim to a coherent excerpt that ends on a complete thought.

When generating a cipher, the easiest reliable method: produce a random
permutation of A–Z, then verify it's a derangement with no 3-letter consecutive
run (regenerate if not). `check-preview` will confirm.

## Quick reference
- Stage here: `data/puzzle-preview.json`
- Live data: `data/puzzles.json`
- Check new content: `npm run check-preview`
- Validate live file: `npm run validate`
- Promote: `npm run promote`
