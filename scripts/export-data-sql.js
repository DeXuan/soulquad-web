#!/usr/bin/env node
/**
 * SoulQuad SQL Data Export Script
 * Generates INSERT statements with automatic schema migration:
 *   1. Adds missing columns (via ADD COLUMN IF NOT EXISTS) before inserting
 *   2. Inserts all data from local database
 *
 * Usage: node export-data-sql.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPORT_DIR = path.join(__dirname, '..', 'exports');
const OUTPUT_FILE = path.join(__dirname, '..', 'soulquad-data.sql');

// Tables in order (respecting FK dependencies)
const TABLES = [
  'users',
  'matches',
  'messages',
  'notifications',
  'moments',
  'moment_likes',
  'moment_comments',
  'user_blocklist'
];

// Migration: columns to add on target server if missing
// Each entry: [column_name, sql_type, default_value]
const MIGRATION_COLUMNS = {
  users: [
    ['city', 'VARCHAR(100)', "''"],
    ['last_active', 'TIMESTAMP', 'NULL'],
    ['password_salt', 'VARCHAR(64)', "''"],
    ['has_house', 'BOOLEAN', 'false'],
    ['has_car', 'BOOLEAN', 'false'],
    ['purpose', 'VARCHAR(100)', "''"],
    ['mode', 'VARCHAR(50)', "''"]
  ],
  moments: [
    ['share_count', 'INTEGER', '0']
  ]
};

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${val.toString().replace(/'/g, "''")}'`;
}

async function main() {
  console.log('=== SoulQuad SQL Data Export ===\n');

  if (!fs.existsSync(EXPORT_DIR)) {
    console.error(`Export directory not found: ${EXPORT_DIR}`);
    console.error('Please run export-db.js first.');
    process.exit(1);
  }

  const metaPath = path.join(EXPORT_DIR, '_metadata.json');
  if (!fs.existsSync(metaPath)) {
    console.error('Metadata file not found. Please run export-db.js first.');
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  console.log(`Source export date: ${meta.exportedAt}`);
  console.log(`PostgreSQL version: ${meta.pgVersion}\n`);

  let sql = `-- ============================================\n-- SoulQuad Data Export (Auto-Migration)\n-- Generated: ${new Date().toISOString()}\n-- Includes: ADD COLUMN IF NOT EXISTS + data INSERT\n-- ============================================\n\n-- STEP 1: Add missing columns (IF NOT EXISTS for safety on re-run)\n`;

  let totalRows = 0;

  // Generate ADD COLUMN statements from migration columns map
  for (const [table, cols] of Object.entries(MIGRATION_COLUMNS)) {
    for (const [colName, colType, defaultVal] of cols) {
      sql += `ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${colName} ${colType} DEFAULT ${defaultVal};\n`;
    }
  }

  sql += `\n-- STEP 2: Truncate existing data\n`;
  for (const table of TABLES) {
    sql += `TRUNCATE TABLE ${table} CASCADE;\n`;
  }

  sql += `\n-- STEP 3: Insert data\n`;

  for (const table of TABLES) {
    const filepath = path.join(EXPORT_DIR, `${table}.json`);
    if (!fs.existsSync(filepath)) {
      console.log(`  -> ${table}: No file found, skipping`);
      continue;
    }

    try {
      const tableData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      const data = tableData.data;

      if (!data || data.length === 0) {
        console.log(`  -> ${table}: No data, skipping`);
        continue;
      }

      // Use ALL columns from local data (target will auto-add missing ones)
      const columns = Object.keys(data[0]);
      const columnList = columns.join(', ');

      // Batch INSERT statements (100 rows per statement)
      const batchSize = 100;
      let batch = [];

      for (const row of data) {
        const values = columns.map(col => escapeValue(row[col]));
        batch.push(`(${values.join(', ')})`);

        if (batch.length >= batchSize) {
          sql += `INSERT INTO ${table} (${columnList}) VALUES ${batch.join(', ')};\n`;
          batch = [];
        }
      }

      if (batch.length > 0) {
        sql += `INSERT INTO ${table} (${columnList}) VALUES ${batch.join(', ')};\n`;
      }

      console.log(`  ok ${table}: ${data.length} rows`);
      totalRows += data.length;

    } catch (err) {
      console.log(`  fail ${table}: ${err.message}`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, sql);

  console.log(`\n=== Export Complete ===`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`Total rows: ${totalRows}`);
  console.log(`File size: ${(fs.statSync(OUTPUT_FILE).size / 1024).toFixed(2)} KB`);
  console.log(`\nTo import on server (one-liner):`);
  console.log(`  PG_PASSWORD='xxx' psql -h <host> -U postgres -d soulquad -f soulquad-data.sql`);
}

main();