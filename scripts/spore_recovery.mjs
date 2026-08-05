#!/usr/bin/env node
// scripts/spore_recovery.mjs — Standalone Organizer Spore Recovery Tool
// Verifies SHA-256 integrity hash and instantly restores/regrows the platform database from a Spore Archive.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'milyfe-platform', 'data', 'db.json');

function runRecovery() {
  console.log('=== MiLyfe OS — Standalone Organizer Spore Recovery ===');
  const inFile = process.argv[2];
  if (!inFile || !fs.existsSync(inFile)) {
    console.error('Usage: node scripts/spore_recovery.mjs <path_to_spore_archive.jsonld>');
    process.exit(1);
  }

  const raw = fs.readFileSync(inFile, 'utf8');
  let archive = null;
  try {
    archive = JSON.parse(raw);
  } catch (e) {
    console.error('ERROR: Could not parse Spore Archive file as JSON');
    process.exit(1);
  }

  if (archive.type !== 'MiLyfeSporeArchive_v1' || !archive.data || !archive.archiveHash) {
    console.error('ERROR: Invalid MiLyfeSporeArchive_v1 format');
    process.exit(1);
  }

  const computedHash = crypto.createHash('sha256').update(JSON.stringify(archive.data)).digest('hex');
  if (computedHash !== archive.archiveHash) {
    console.error(`ERROR: Integrity check FAILED!`);
    console.error(`  Expected Hash : ${archive.archiveHash}`);
    console.error(`  Computed Hash : ${computedHash}`);
    console.error('The archive file may be corrupted or tampered.');
    process.exit(1);
  }

  console.log('✓ SHA-256 Integrity check passed.');
  fs.writeFileSync(DB_PATH, JSON.stringify(archive.data, null, 2));
  console.log(`✓ Database successfully restored at: ${DB_PATH}`);
  console.log(`✓ Restored ${archive.data.users?.length || 0} citizen(s), ${archive.data.circles?.length || 0} circle(s), and ${archive.data.ledger?.length || 0} ledger transaction(s).`);
}

runRecovery();
