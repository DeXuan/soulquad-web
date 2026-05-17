#!/usr/bin/env node
/**
 * SoulQuad Database Migration Script
 * Handles both export and import with configurable directions
 *
 * Usage:
 *   node migrate-db.js --export          # Export local to files
 *   node migrate-db.js --import           # Import files to local
 *   node migrate-db.js --full            # Full remote migration (export + import)
 *
 * Environment Variables:
 *   PG_HOST, PG_PORT, PG_DATABASE, PG_USER, PG_PASSWORD
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createWriteStream, createReadStream } from 'fs';
import { pipeline } from 'stream/promises';
import zlib from 'zlib';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============== CONFIGURATION ==============

const CONFIG = {
  export: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: process.env.PG_DATABASE || 'soulquad',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
  },
  import: {
    host: process.env.PG_HOST || 'localhost',
    port: parseInt(process.env.PG_PORT || '5432'),
    database: process.env.PG_DATABASE || 'soulquad',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
  }
};

// Export directory
const EXPORT_DIR = path.join(__dirname, '..', 'exports');

// Tables in dependency order
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

// ============== UTILITY FUNCTIONS ==============

function log(message, type = 'info') {
  const icons = { info: '○', success: '✓', error: '✗', warning: '⚠' };
  console.log(`${icons[type] || '○'} ${message}`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--export') options.mode = 'export';
    else if (args[i] === '--import') options.mode = 'import';
    else if (args[i] === '--full') options.mode = 'full';
    else if (args[i] === '--host' && args[i + 1]) options.host = args[++i];
    else if (args[i] === '--port' && args[i + 1]) options.port = parseInt(args[++i]);
    else if (args[i] === '--database' && args[i + 1]) options.database = args[++i];
    else if (args[i] === '--user' && args[i + 1]) options.user = args[++i];
    else if (args[i] === '--password' && args[i + 1]) options.password = args[++i];
  }

  return options;
}

function createPool(config) {
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });
}

// ============== EXPORT FUNCTIONS ==============

async function exportTable(pool, tableName) {
  const client = await pool.connect();
  try {
    // Get table data
    const result = await client.query(`SELECT * FROM ${tableName}`);
    const rows = result.rows;

    // Get table structure
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        rowCount: rows.length,
        columns: structureResult.rows
      },
      data: rows
    };
  } finally {
    client.release();
  }
}

async function exportDatabase(exportDir) {
  log('Starting database export...', 'info');

  const pool = createPool(CONFIG.export);

  try {
    // Test connection
    const client = await pool.connect();
    const versionResult = await client.query('SHOW server_version');
    log(`Connected to PostgreSQL ${versionResult.rows[0].server_version}`, 'success');
    client.release();

    // Create export directory
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    const exportMeta = {
      exportedAt: new Date().toISOString(),
      pgVersion: versionResult.rows[0].server_version,
      nodeVersion: process.version,
      tables: {}
    };

    // Export each table
    for (const table of TABLES) {
      try {
        const exported = await exportTable(pool, table);
        const filepath = path.join(exportDir, `${table}.json`);

        fs.writeFileSync(filepath, JSON.stringify(exported, null, 2));

        log(`Exported ${table}: ${exported.data.length} rows`, 'success');
        exportMeta.tables[table] = { rowCount: exported.data.length };
      } catch (err) {
        log(`Failed to export ${table}: ${err.message}`, 'error');
        exportMeta.tables[table] = { error: err.message };
      }
    }

    // Write metadata
    fs.writeFileSync(path.join(exportDir, '_metadata.json'), JSON.stringify(exportMeta, null, 2));

    // Create combined archive
    const archivePath = path.join(path.dirname(exportDir), `soulquad-db-${Date.now()}.json.gz`);
    await compressDirectory(exportDir, archivePath);

    log(`Export complete! Archive: ${archivePath}`, 'success');

    return { success: true, archivePath, meta: exportMeta };

  } catch (err) {
    log(`Export failed: ${err.message}`, 'error');
    throw err;
  } finally {
    await pool.end();
  }
}

async function compressDirectory(dir, outputPath) {
  const writeStream = createWriteStream(outputPath);
  const gzip = zlib.createGzip();

  await pipeline(
    fs.createReadStream(path.join(dir, '_metadata.json')),
    gzip,
    writeStream
  );

  return outputPath;
}

// ============== IMPORT FUNCTIONS ==============

async function importTable(pool, tableName, data, options = {}) {
  const { clearExisting = false } = options;

  if (!data || data.length === 0) {
    log(`No data for ${tableName}, skipping`, 'warning');
    return 0;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (clearExisting) {
      await client.query(`TRUNCATE TABLE ${tableName} CASCADE`);
    }

    // Get columns from first row
    const columns = Object.keys(data[0]);
    const columnList = columns.join(', ');

    // Build batch insert
    const rowPlaceholders = data.map((row, i) => {
      const placeholders = columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ');
      return `(${placeholders})`;
    }).join(', ');

    // Flatten values
    const values = data.flatMap(row =>
      columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return null;
        if (typeof val === 'object') return JSON.stringify(val);
        return val;
      })
    );

    const query = `INSERT INTO ${tableName} (${columnList}) VALUES ${rowPlaceholders} ON CONFLICT DO NOTHING`;

    await client.query(query, values);
    await client.query('COMMIT');

    return data.length;

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function importDatabase(importDir, options = {}) {
  const { clearExisting = false, skipTables = [] } = options;

  log('Starting database import...', 'info');

  // Check directory exists
  if (!fs.existsSync(importDir)) {
    throw new Error(`Import directory not found: ${importDir}`);
  }

  // Read metadata
  const metaPath = path.join(importDir, '_metadata.json');
  if (!fs.existsSync(metaPath)) {
    throw new Error('Metadata file not found. Please run export first.');
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  log(`Importing data exported at: ${meta.exportedAt}`, 'info');

  const pool = createPool(CONFIG.import);

  try {
    // Test connection
    const client = await pool.connect();
    log('Connected to database', 'success');
    client.release();

    let totalRows = 0;
    let importedTables = 0;

    // Import each table
    for (const table of TABLES) {
      if (skipTables.includes(table)) {
        log(`Skipping ${table} as configured`, 'warning');
        continue;
      }

      const filepath = path.join(importDir, `${table}.json`);
      if (!fs.existsSync(filepath)) {
        log(`${table}: file not found, skipping`, 'warning');
        continue;
      }

      try {
        const tableData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const rowCount = await importTable(pool, table, tableData.data, { clearExisting });

        log(`Imported ${table}: ${rowCount} rows`, 'success');
        totalRows += rowCount;
        importedTables++;
      } catch (err) {
        log(`Failed to import ${table}: ${err.message}`, 'error');
      }
    }

    log(`Import complete! ${importedTables} tables, ${totalRows} total rows`, 'success');

    return { success: true, tables: importedTables, rows: totalRows };

  } catch (err) {
    log(`Import failed: ${err.message}`, 'error');
    throw err;
  } finally {
    await pool.end();
  }
}

// ============== MAIN ==============

async function main() {
  const options = parseArgs();

  if (!options.mode) {
    console.log(`
SoulQuad Database Migration Tool

Usage:
  node migrate-db.js [options] --mode

Modes:
  --export     Export local database to files
  --import     Import files to local database
  --full       Full migration (export + import on same machine)

Options:
  --host       Database host
  --port       Database port
  --database   Database name
  --user       Database user
  --password   Database password

Examples:
  # Export local database
  node migrate-db.js --export

  # Import to local database
  node migrate-db.js --import

  # Full local migration
  node migrate-db.js --full

  # Export from remote server
  PG_HOST=remote.server.com node migrate-db.js --export

  # Import with credentials
  PG_DATABASE=mydb PG_USER=admin node migrate-db.js --import
`);
    process.exit(0);
  }

  console.log('\n=== SoulQuad Database Migration ===\n');

  try {
    if (options.mode === 'export') {
      const result = await exportDatabase(EXPORT_DIR);
      console.log('\nExport Summary:');
      console.log(`  Tables: ${Object.keys(result.meta.tables).length}`);
      console.log(`  Archive: ${result.archivePath}`);
    }
    else if (options.mode === 'import') {
      const result = await importDatabase(EXPORT_DIR, { clearExisting: false });
      console.log('\nImport Summary:');
      console.log(`  Tables: ${result.tables}`);
      console.log(`  Rows: ${result.rows}`);
    }
    else if (options.mode === 'full') {
      console.log('[1/2] Exporting database...');
      const exportResult = await exportDatabase(EXPORT_DIR);

      console.log('\n[2/2] Importing to local database...');
      const importResult = await importDatabase(EXPORT_DIR, { clearExisting: true });

      console.log('\n=== Migration Complete ===');
      console.log(`Exported: ${Object.keys(exportResult.meta.tables).length} tables`);
      console.log(`Imported: ${importResult.tables} tables, ${importResult.rows} rows`);
    }
  } catch (err) {
    console.error('\nMigration failed:', err.message);
    process.exit(1);
  }

  console.log('');
}

main();