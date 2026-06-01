#!/usr/bin/env node

/**
 * check-preview.js
 *
 * Gates NEW puzzle content staged in data/puzzle-preview.json before it is
 * promoted into data/puzzles.json. These are content-quality rules that apply
 * only to new entries — the historical puzzles.json predates them and is not
 * required to satisfy them. Structural validation of the live file remains the
 * job of validate-puzzles.js.
 *
 * Rules enforced here:
 *   - Structural sanity on each preview entry (same shape as validate-puzzles.js)
 *   - Cipher is a true permutation of A–Z (no duplicate letters)   [hard error]
 *   - Cipher has no run of 3+ consecutive alphabet letters         [hard error]
 *     (ascending or descending), to avoid obvious solving patterns
 *   - Wordle word was not used in the prior 6 months               [hard error]
 *     (checked against puzzles.json history AND earlier preview entries)
 *   - Wordle word is not an obvious plural ending in "S"           [warning]
 *     ("plural" can't be detected reliably, so a human/the skill decides)
 *
 * Usage: node scripts/check-preview.js
 * Exit code 0 = clean (warnings allowed), 1 = one or more hard errors.
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const HISTORY_PATH = path.join(DATA, 'puzzles.json');
const PREVIEW_PATH = path.join(DATA, 'puzzle-preview.json');

const SIX_MONTHS_DAYS = 183;

function loadJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    console.error(`❌ Could not read/parse ${path.basename(p)}: ${e.message}`);
    process.exit(1);
  }
}

const history = loadJson(HISTORY_PATH);
const preview = loadJson(PREVIEW_PATH);

const errors = [];
const warnings = [];

const previewEntries = Object.entries(preview).sort((a, b) =>
  a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0
);

if (previewEntries.length === 0) {
  console.log('ℹ️  puzzle-preview.json is empty — nothing to check.');
  process.exit(0);
}

// Longest run of consecutive alphabet letters (±1) in a string.
function maxConsecutiveRun(s) {
  let max = 1;
  let run = 1;
  for (let i = 1; i < s.length; i++) {
    const d = s.charCodeAt(i) - s.charCodeAt(i - 1);
    run = d === 1 || d === -1 ? run + 1 : 1;
    if (run > max) max = run;
  }
  return max;
}

for (const [date, puzzle] of previewEntries) {
  const tag = `[${date}]`;

  if (typeof puzzle !== 'object' || puzzle === null) {
    errors.push(`${tag} entry must be an object`);
    continue;
  }

  // --- Structural sanity (mirrors validate-puzzles.js) ---
  const scrypt = puzzle.scryptogram;
  if (!scrypt || typeof scrypt !== 'object') {
    errors.push(`${tag} missing scryptogram object`);
  } else {
    for (const k of ['solution', 'hint', 'cipher']) {
      if (!(k in scrypt)) errors.push(`${tag} scryptogram missing "${k}"`);
    }
  }
  if (!puzzle.prompt || typeof puzzle.prompt !== 'object') {
    errors.push(`${tag} missing prompt object`);
  } else {
    for (const k of ['reference', 'referenceText', 'question', 'response']) {
      if (!(k in puzzle.prompt)) errors.push(`${tag} prompt missing "${k}"`);
    }
  }

  // --- Cipher rules ---
  const cipher = scrypt && scrypt.cipher;
  if (typeof cipher === 'string') {
    const letters = cipher.replace(/[^A-Za-z]/g, '');
    if (letters !== letters.toUpperCase()) {
      errors.push(`${tag} cipher must be uppercase`);
    }
    if (letters.length !== 26) {
      errors.push(`${tag} cipher must have 26 letters (found ${letters.length})`);
    } else {
      // True permutation: all 26 distinct (validate-puzzles.js does not check this)
      if (new Set(letters).size !== 26) {
        errors.push(`${tag} cipher has duplicate letters — must be a permutation of A–Z`);
      }
      // Derangement: no letter in its natural position
      for (let i = 0; i < 26; i++) {
        if (letters[i] === String.fromCharCode(65 + i)) {
          errors.push(`${tag} cipher has "${letters[i]}" in its natural position (${i + 1})`);
        }
      }
    }
    // No run of 3+ consecutive alphabet letters
    const run = maxConsecutiveRun(letters);
    if (run > 2) {
      errors.push(
        `${tag} cipher has a run of ${run} consecutive letters ("${cipher}") — max allowed is 2`
      );
    }
  }
}

// --- Wordle 6-month reuse (history + earlier preview entries) ---
// Build a chronological list of every prior use of each word.
const priorUses = Object.entries(history)
  .filter(([, p]) => typeof p.wordle === 'string')
  .map(([d, p]) => ({ date: d, word: p.wordle.toUpperCase() }));

for (const [date, puzzle] of previewEntries) {
  const tag = `[${date}]`;
  const word = typeof puzzle.wordle === 'string' ? puzzle.wordle.toUpperCase() : null;
  if (!word) {
    errors.push(`${tag} wordle is missing or not a string`);
    continue;
  }
  if (word.length !== 5) {
    errors.push(`${tag} wordle must be exactly 5 letters (found ${word.length}: "${word}")`);
  }

  const curT = new Date(date).getTime();
  for (const use of priorUses) {
    if (use.word !== word) continue;
    if (use.date >= date) continue; // only look backwards
    const days = Math.round((curT - new Date(use.date).getTime()) / 86400000);
    if (days < SIX_MONTHS_DAYS) {
      errors.push(
        `${tag} wordle "${word}" was used ${days} days ago (${use.date}) — must be ≥ 6 months`
      );
    }
  }

  // Plural-S warning: single trailing S (skip "SS" words like CROSS/BLESS).
  if (/[^S]S$/.test(word)) {
    warnings.push(
      `${tag} wordle "${word}" ends in "S" — confirm it is NOT a plural (verbs/other -S words are fine)`
    );
  }

  // This preview word now counts as a prior use for later dates in the same batch.
  priorUses.push({ date, word });
}

// --- Report ---
if (warnings.length) {
  console.warn(`\n⚠️  ${warnings.length} warning(s) — review manually:\n`);
  warnings.forEach(w => console.warn(`  • ${w}`));
}

if (errors.length) {
  console.error(`\n❌ check-preview failed with ${errors.length} error(s):\n`);
  errors.forEach(e => console.error(`  • ${e}`));
  console.error('');
  process.exit(1);
}

console.log(
  `\n✅ puzzle-preview.json passed content checks (${previewEntries.length} entries` +
    `${warnings.length ? `, ${warnings.length} warning(s)` : ''}).`
);
process.exit(0);
