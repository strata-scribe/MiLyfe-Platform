#!/usr/bin/env node
// scripts/spore_backup.mjs — Standalone Organizer Spore Backup Tool
// Exports a cryptographically hashed, W3C-compatible Spore Archive JSON-LD snapshot of the local database.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DB_PATH = path.join(ROOT_DIR, 'milyfe-platform', 'data', 'db.json');

function runBackup() {
  console.log('=== MiLyfe OS — Standalone Organizer Spore Backup ===');
  if (!fs.existsSync(DB_PATH)) {
    console.error(`ERROR: Database file not found at ${DB_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_PATH, 'utf8');
  const dbData = JSON.parse(raw);
  const normalizedPayload = JSON.stringify(dbData);
  const archiveHash = crypto.createHash('sha256').update(normalizedPayload).digest('hex');

  const sporeArchive = {
    "@context": "https://milyfe.fun/contexts/MiLyfeSporeArchive_v1.jsonld",
    type: "MiLyfeSporeArchive_v1",
    exportedAt: new Date().toISOString(),
    archiveHash,
    signature: crypto.createHmac('sha256', 'milyfe_local_secret').update(archiveHash).digest('hex'),
    data: dbData
  };

  const outFile = process.argv[2] || path.join(ROOT_DIR, `milyfe-spore-snapshot-${new Date().toISOString().slice(0,10)}.jsonld`);
  fs.writeFileSync(outFile, JSON.stringify(sporeArchive, null, 2));
  console.log(`✓ Spore Archive successfully exported to: ${outFile}`);
  console.log(`✓ SHA-256 Integrity Hash: ${archiveHash}`);
  console.log(`✓ Contains ${dbData.users?.length || 0} citizen(s), ${dbData.circles?.length || 0} circle(s), and ${dbData.ledger?.length || 0} ledger transaction(s).`);
}

runBackup();
