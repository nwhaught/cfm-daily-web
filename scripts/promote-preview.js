#!/usr/bin/env node

/**
 * promote-preview.js
 *
 * Merges the staged entries in data/puzzle-preview.json into data/puzzles.json,
 * keeps the result sorted chronologically by date key, then empties the preview
 * so the next week starts clean. Does NOT touch git — run validate + commit
 * after (the cfm-weekly-puzzle skill does this).
 *
 * Refuses to overwrite an existing date in puzzles.json unless --force is given,
 * so an accidental re-promote can't silently clobber published content.
 *
 * Usage: node scripts/promote-preview.js [--force]
 */

const fs = require('fs');
const path = require('path');

const DATA = path.join(__dirname, '..', 'data');
const HISTORY_PATH = path.join(DATA, 'puzzles.json');
const PREVIEW_PATH = path.join(DATA, 'puzzle-preview.json');
const FORCE = process.argv.includes('--force');

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

const history = loadJson(HISTORY_PATH);
const preview = loadJson(PREVIEW_PATH);

const previewDates = Object.keys(preview);
if (previewDates.length === 0) {
  console.error('❌ puzzle-preview.json is empty — nothing to promote.');
  process.exit(1);
}

const collisions = previewDates.filter(d => d in history);
if (collisions.length && !FORCE) {
  console.error(
    `❌ These dates already exist in puzzles.json: ${collisions.join(', ')}\n` +
      `   Re-run with --force to overwrite them intentionally.`
  );
  process.exit(1);
}

// Merge, then sort by ISO date key (lexical sort == chronological for YYYY-MM-DD).
const merged = { ...history, ...preview };
const sorted = {};
for (const key of Object.keys(merged).sort()) {
  sorted[key] = merged[key];
}

fs.writeFileSync(HISTORY_PATH, JSON.stringify(sorted, null, 2) + '\n');
fs.writeFileSync(PREVIEW_PATH, '{}\n');

// Suggested commit message in the repo's existing style (e.g. "June 8-14").
const dates = previewDates.slice().sort();
const first = new Date(dates[0]);
const last = new Date(dates[dates.length - 1]);
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const sameMonth = first.getUTCMonth() === last.getUTCMonth();
const label = sameMonth
  ? `${MONTHS[first.getUTCMonth()]} ${first.getUTCDate()}-${last.getUTCDate()}`
  : `${MONTHS[first.getUTCMonth()]} ${first.getUTCDate()} - ${MONTHS[last.getUTCMonth()]} ${last.getUTCDate()}`;

console.log(`✅ Promoted ${previewDates.length} entr${previewDates.length === 1 ? 'y' : 'ies'} (${dates[0]} → ${dates[dates.length - 1]}).`);
console.log(`   puzzles.json now has ${Object.keys(sorted).length} entries; preview cleared.`);
console.log(`\nSuggested commit message: ${label}`);
