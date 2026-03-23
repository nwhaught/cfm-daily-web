#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const PUZZLES_PATH = path.join(__dirname, '..', 'data', 'puzzles.json');

let data;
let errors = [];

// Rule 1: JSON must parse correctly
try {
  const raw = fs.readFileSync(PUZZLES_PATH, 'utf8');
  data = JSON.parse(raw);
} catch (e) {
  console.error(`❌ JSON parse error: ${e.message}`);
  process.exit(1);
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

for (const [date, puzzle] of Object.entries(data)) {
  const p = `[${date}]`;

  // Rule 2: Top-level keys must be YYYY-MM-DD
  if (!DATE_REGEX.test(date)) {
    errors.push(`${p} Key is not a valid YYYY-MM-DD date string`);
  }

  if (typeof puzzle !== 'object' || puzzle === null) {
    errors.push(`${p} Value must be an object`);
    continue;
  }

  // Rule 3: Must have exactly scryptogram, wordle, prompt
  const requiredKeys = ['scryptogram', 'wordle', 'prompt'];
  for (const key of requiredKeys) {
    if (!(key in puzzle)) {
      errors.push(`${p} Missing required key: "${key}"`);
    }
  }
  const extraKeys = Object.keys(puzzle).filter(k => !requiredKeys.includes(k));
  for (const key of extraKeys) {
    errors.push(`${p} Unexpected key: "${key}"`);
  }

  // Rule 4: scryptogram must have solution, hint, cipher
  const scrypt = puzzle.scryptogram;
  if (scrypt && typeof scrypt === 'object') {
    for (const key of ['solution', 'hint', 'cipher']) {
      if (!(key in scrypt)) {
        errors.push(`${p} scryptogram missing required key: "${key}"`);
      }
    }

    // Rule 5: cipher must contain exactly 26 all-caps letters, none in correct alphabet position
    const cipher = scrypt.cipher;
    if (cipher !== undefined) {
      if (typeof cipher !== 'string') {
        errors.push(`${p} scryptogram.cipher must be a string`);
      } else {
        const letters = cipher.replace(/[^A-Za-z]/g, '');
        if (letters !== letters.toUpperCase()) {
          errors.push(`${p} scryptogram.cipher must contain only uppercase letters`);
        } else if (letters.length !== 26) {
          errors.push(`${p} scryptogram.cipher must contain exactly 26 letters (found ${letters.length})`);
        } else {
          for (let i = 0; i < 26; i++) {
            const expected = String.fromCharCode(65 + i); // A=0, B=1, ...
            if (letters[i] === expected) {
              errors.push(`${p} scryptogram.cipher has letter "${expected}" in its correct position (position ${i + 1})`);
            }
          }
        }
      }
    }
  }

  // Rule 6: wordle must be exactly 5 characters
  const wordle = puzzle.wordle;
  if (wordle !== undefined) {
    if (typeof wordle !== 'string') {
      errors.push(`${p} wordle must be a string`);
    } else if (wordle.length !== 5) {
      errors.push(`${p} wordle must be exactly 5 characters (found ${wordle.length}: "${wordle}")`);
    }
  }

  // Rule 7: prompt must have reference, referenceText, question, response
  const prompt = puzzle.prompt;
  if (prompt && typeof prompt === 'object') {
    for (const key of ['reference', 'referenceText', 'question', 'response']) {
      if (!(key in prompt)) {
        errors.push(`${p} prompt missing required key: "${key}"`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`\n❌ puzzles.json validation failed with ${errors.length} error(s):\n`);
  for (const err of errors) {
    console.error(`  • ${err}`);
  }
  console.error('');
  process.exit(1);
} else {
  console.log(`✅ puzzles.json is valid (${Object.keys(data).length} entries)`);
  process.exit(0);
}
