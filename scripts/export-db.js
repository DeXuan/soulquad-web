#!/usr/bin/env node
/**
 * SoulQuad Database Export Script
 * Usage: node export-db.js
 *
 * Exports all database tables to JSON files in ./exports directory
 * Requires PostgreSQL connection and existing tables
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration - modify these for your environment
const CONFIG = {
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432'),
  database: process.env.PG_DATABASE || 'soulquad',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'postgres',
};

// Output directory
const EXPORT_DIR = path.join(__dirname, '..', 'exports');

// Tables to export in order (respecting foreign key dependencies)
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

async function exportTable(pool, tableName) {
  console.log(`Exporting ${tableName}...`);

  const client = await pool.connect();
  try {
    // Get table data
    const result = await client.query(`SELECT * FROM ${tableName}`);
    const rows = result.rows;

    // Get table structure for reference
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = $1
      ORDER BY ordinal_position
    `, [tableName]);

    const metadata = {
      exportedAt: new Date().toISOString(),
      rowCount: rows.length,
      columns: structureResult.rows.map(r => ({
        name: r.column_name,
        type: r.data_type,
        nullable: r.is_nullable === 'YES',
        default: r.column_default
      }))
    };

    return {
      metadata,
      data: rows
    };
  } finally {
    client.release();
  }
}

async function exportDatabase() {
  console.log('=== SoulQuad Database Export ===\n');
  console.log(`Connecting to PostgreSQL at ${CONFIG.host}:${CONFIG.port}...`);
  console.log(`Database: ${CONFIG.database}`);
  console.log(`User: ${CONFIG.user}\n`);

  // Create export directory
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
    console.log(`Created export directory: ${EXPORT_DIR}\n`);
  }

  // Generate export timestamp for filename
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const exportMeta = {
    exportedAt: new Date().toISOString(),
    pgVersion: '',
    nodeVersion: process.version,
    tables: {}
  };

  const pool = new Pool(CONFIG);

  try {
    // Test connection
    const client = await pool.connect();
    const serverVersion = await client.query('SHOW server_version');
    exportMeta.pgVersion = serverVersion.rows[0].server_version;
    console.log(`PostgreSQL version: ${exportMeta.pgVersion}\n`);
    client.release();

    // Export each table
    for (const table of TABLES) {
      try {
        const exported = await exportTable(pool, table);
        const filename = `${table}.json`;
        const filepath = path.join(EXPORT_DIR, filename);

        // Write data file
        fs.writeFileSync(filepath, JSON.stringify(exported, null, 2));
        console.log(`  ✓ ${table}: ${exported.data.length} rows -> ${filename}`);

        // Update metadata
        exportMeta.tables[table] = {
          rowCount: exported.data.length,
          filename
        };
      } catch (err) {
        console.log(`  ✗ ${table}: ${err.message}`);
        exportMeta.tables[table] = {
          error: err.message
        };
      }
    }

    // Write metadata file
    const metaFilename = `_metadata.json`;
    fs.writeFileSync(path.join(EXPORT_DIR, metaFilename), JSON.stringify(exportMeta, null, 2));

    console.log(`\n=== Export Summary ===`);
    console.log(`Export directory: ${EXPORT_DIR}`);
    console.log(`Total tables: ${TABLES.length}`);

    const successCount = Object.values(exportMeta.tables).filter(t => !t.error).length;
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${TABLES.length - successCount}`);

    // Create import script
    createImportScript();

    console.log(`\n✓ Export complete!`);
    console.log(`\nNext steps:`);
    console.log(`1. Upload all files from ${EXPORT_DIR} to your server`);
    console.log(`2. Run: node import-db.js on the server`);

  } catch (err) {
    console.error('\n✗ Export failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

function createImportScript() {
  const importScript = `#!/usr/bin/env node
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
  console.log(\`Importing \${tableName}...\`);

  if (!data || data.length === 0) {
    console.log(\`  → No data to import\`);
    return;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    if (CLEAR_TABLES) {
      // Disable triggers temporarily for faster import
      await client.query(\`SET session_replication_role = 'replica'\`);
      await client.query(\`DELETE FROM \${tableName}\`);
    }

    // Get column names from first row
    const columns = Object.keys(data[0]);
    const columnList = columns.join(', ');

    // Build placeholders for batch insert
    const rowPlaceholders = data.map((row, i) => {
      const rowPlaceholders = columns.map((col, j) => \`$\${i * columns.length + j + 1}\`).join(', ');
      return \`(\${rowPlaceholders})\`;
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

    const query = \`
      INSERT INTO \${tableName} (\${columnList})
      VALUES \${rowPlaceholders}
      ON CONFLICT DO NOTHING
    \`;

    await client.query(query, values);

    // Re-enable triggers
    await client.query(\`SET session_replication_role = DEFAULT\`);
    await client.query('COMMIT');

    console.log(\`  ✓ Imported \${data.length} rows into \${tableName}\`);

  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function importDatabase() {
  console.log('=== SoulQuad Database Import ===\\n');
  console.log(\`Import directory: \${IMPORT_DIR}\`);
  console.log(\`Target: \${CONFIG.host}:\${CONFIG.port}/\${CONFIG.database}\\n\`);

  // Check import directory exists
  if (!fs.existsSync(IMPORT_DIR)) {
    console.error(\`✗ Import directory not found: \${IMPORT_DIR}\`);
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
  console.log(\`Export date: \${meta.exportedAt}\`);
  console.log(\`PostgreSQL version: \${meta.pgVersion}\\n\`);

  const pool = new Pool(CONFIG);

  try {
    // Test connection
    const client = await pool.connect();
    console.log('✓ Connected to database\\n');
    client.release();

    // Import each table
    let successCount = 0;
    let totalRows = 0;

    for (const table of TABLE_ORDER) {
      const filename = \`\${table}.json\`;
      const filepath = path.join(IMPORT_DIR, filename);

      if (!fs.existsSync(filepath)) {
        console.log(\`  → \${table}: No file found, skipping\`);
        continue;
      }

      try {
        const tableData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        await importTable(pool, table, tableData.data);
        successCount++;
        totalRows += tableData.data.length;
      } catch (err) {
        console.log(\`  ✗ \${table}: \${err.message}\`);
      }
    }

    console.log(\`\\n=== Import Summary ===\`);
    console.log(\`Tables imported: \${successCount}/\${TABLE_ORDER.length}\`);
    console.log(\`Total rows: \${totalRows}\`);

    if (successCount === TABLE_ORDER.length) {
      console.log(\`\\n✓ Import complete!\`);
    } else {
      console.log(\`\\n⚠ Import completed with some errors\`);
    }

  } catch (err) {
    console.error('\\n✗ Import failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run import
importDatabase();
`;

  const scriptPath = path.join(EXPORT_DIR, 'import-db.js');
  fs.writeFileSync(scriptPath, importScript);
  console.log(`\n  → Created import script: import-db.js`);
}

exportDatabase();