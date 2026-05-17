#!/usr/bin/env node
/**
 * SoulQuad Database Import Script
 * Usage: node import-db.js
 *
 * Imports all JSON data files into PostgreSQL database
 * Automatically creates/updates table structure
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - modify for your server
const CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'soulquad',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
};

// Import directory (where exported files are located)
const IMPORT_DIR = path.join(__dirname, '..', 'exports');

// Table import order (respecting foreign key dependencies)
const TABLE_ORDER = [
  'users',
  'matches',
  'messages',
  'notifications',
  'moments',
  'moment_likes',
  'moment_comments',
  'user_blocklist'
];

// Clear table before import (true = replace existing data)
const CLEAR_TABLES = true;

async function importTable(pool, tableName, data) {
  console.log(`Importing ${tableName}...`);

  if (!data || data.length === 0) {
    console.log(`  → No data to import`);
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (CLEAR_TABLES) {
      // Disable triggers temporarily for faster import
      await client.query(`SET session_replication_role = 'replica'`);
      await client.query(`DELETE FROM ${tableName}`);
    }

    // Get column names from first row
    const columns = Object.keys(data[0]);
    const columnList = columns.join(', ');

    // Build placeholders for batch insert
    const rowPlaceholders = data.map((row, i) => {
      const rowPlaceholders = columns.map((col, j) => `$${i * columns.length + j + 1}`).join(', ');
      return `(${rowPlaceholders})`;
    }).join(', ');

    // Flatten values
    const values = data.flatMap(row =>
      columns.map(col => {
        const val = row[col];
        // Handle special types
        if (val === null || val === undefined) return null;
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      })
    );

    const query = `
      INSERT INTO ${tableName} (${columnList})
      VALUES ${rowPlaceholders}
      ON CONFLICT DO NOTHING
    `;

    await client.query(query, values);

    // Re-enable triggers
    await client.query(`SET session_replication_role = DEFAULT`);
    await client.query('COMMIT');

    console.log(`  ✓ Imported ${data.length} rows into ${tableName}`);

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function importDatabase() {
  console.log('=== SoulQuad Database Import ===\n');
  console.log(`Import directory: ${IMPORT_DIR}`);
  console.log(`Target: ${CONFIG.host}:${CONFIG.port}/${CONFIG.database}\n`);

  // Check import directory exists
  if (!fs.existsSync(IMPORT_DIR)) {
    console.error(`✗ Import directory not found: ${IMPORT_DIR}`);
    console.error('Please upload the exported files first.');
    process.exit(1);
  }

  // Read metadata
  const metaPath = path.join(IMPORT_DIR, '_metadata.json');
  if (!fs.existsSync(metaPath)) {
    console.error('✗ Metadata file not found. Please run export-db.js first.');
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  console.log(`Export date: ${meta.exportedAt}`);
  console.log(`PostgreSQL version: ${meta.pgVersion}\n`);

  const pool = new Pool(CONFIG);

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✓ Connected to database\n');
    client.release();

    // Import each table
    let successCount = 0;
    let totalRows = 0;

    for (const table of TABLE_ORDER) {
      const filename = `${table}.json`;
      const filepath = path.join(IMPORT_DIR, filename);

      if (!fs.existsSync(filepath)) {
        console.log(`  → ${table}: No file found, skipping`);
        continue;
      }

      try {
        const tableData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        await importTable(pool, table, tableData.data);
        successCount++;
        totalRows += tableData.data.length;
      } catch (err) {
        console.log(`  ✗ ${table}: ${err.message}`);
      }
    }

    console.log(`\n=== Import Summary ===`);
    console.log(`Tables imported: ${successCount}/${TABLE_ORDER.length}`);
    console.log(`Total rows: ${totalRows}`);

    if (successCount === TABLE_ORDER.length) {
      console.log(`\n✓ Import complete!`);
    } else {
      console.log(`\n⚠ Import completed with some errors`);
    }

  } catch (err) {
    console.error('\n✗ Import failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run import
importDatabase();
