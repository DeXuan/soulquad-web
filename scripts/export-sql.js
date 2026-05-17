#!/usr/bin/env node
/**
 * SoulQuad Database Schema + Data Export to SQL Script
 * Generates a single SQL file that creates all tables and inserts all data
 * Usage: node export-sql.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXPORT_DIR = path.join(__dirname, '..', 'exports');
const OUTPUT_FILE = path.join(__dirname, '..', 'soulquad-data.sql');

// ============== SQL TEMPLATES ==============

const CREATE_TABLES_SQL = `
-- ============================================
-- SoulQuad Database Schema
-- Generated: ${new Date().toISOString()}
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  nickname VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  age INTEGER DEFAULT 0,
  gender VARCHAR(20) DEFAULT 'other',
  avatar_url TEXT DEFAULT '',
  avatar_data TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  mbti VARCHAR(10),
  soul_quadrant VARCHAR(50),
  soul_score INTEGER DEFAULT 0,
  user_tier VARCHAR(20) DEFAULT 'ordinary',
  is_verified BOOLEAN DEFAULT false,
  profile_completed BOOLEAN DEFAULT false,
  values_json JSONB DEFAULT '[]',
  interests_json JSONB DEFAULT '[]',
  ai_description TEXT DEFAULT '',
  match_count INTEGER DEFAULT 0,
  activity_score INTEGER DEFAULT 0,
  height INTEGER DEFAULT 0,
  education VARCHAR(50) DEFAULT '',
  occupation VARCHAR(100) DEFAULT '',
  annual_income INTEGER DEFAULT 0,
  city VARCHAR(100) DEFAULT '',
  last_active TIMESTAMP,
  password_salt VARCHAR(64) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oder_a_id UUID NOT NULL REFERENCES users(id),
  oder_b_id UUID NOT NULL REFERENCES users(id),
  soulmate_index INTEGER DEFAULT 0,
  user_a_liked BOOLEAN DEFAULT false,
  user_b_liked BOOLEAN DEFAULT false,
  mutual_liked BOOLEAN DEFAULT false,
  unlocked_level INTEGER DEFAULT 1,
  match_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  matched_at TIMESTAMP
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id),
  sender_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) DEFAULT '',
  content TEXT DEFAULT '',
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moments table
CREATE TABLE IF NOT EXISTS moments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT DEFAULT '',
  images_json JSONB DEFAULT '[]',
  video_url TEXT DEFAULT '',
  location TEXT DEFAULT '',
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  is_anonymous BOOLEAN DEFAULT false,
  anonymous_name VARCHAR(50) DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Moment likes table
CREATE TABLE IF NOT EXISTS moment_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES moments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(moment_id, user_id)
);

-- Moment comments table
CREATE TABLE IF NOT EXISTS moment_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moment_id UUID NOT NULL REFERENCES moments(id),
  user_id UUID NOT NULL REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User blocklist table
CREATE TABLE IF NOT EXISTS user_blocklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, blocked_user_id)
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(oder_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(oder_b_id);
CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_moments_user ON moments(user_id);
CREATE INDEX IF NOT EXISTS idx_moment_likes_moment ON moment_likes(moment_id);
CREATE INDEX IF NOT EXISTS idx_moment_comments_moment ON moment_comments(moment_id);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active);
CREATE INDEX IF NOT EXISTS idx_users_mbti ON users(mbti);
CREATE INDEX IF NOT EXISTS idx_users_soul_quadrant ON users(soul_quadrant);
CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed);
CREATE INDEX IF NOT EXISTS idx_matches_mutual ON matches(mutual_liked);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_moments_created_at ON moments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blocklist_user ON user_blocklist(user_id);
CREATE INDEX IF NOT EXISTS idx_blocklist_blocked ON user_blocklist(blocked_user_id);
`;

// Columns to exclude from export (exist locally but not on older server schema)
const EXCLUDED_COLUMNS = {
  users: ['city', 'last_active', 'password_salt'],
  moments: ['share_count']
};

// Standard SoulQuad columns per table (canonical set, used when source data lacks column info)
const STANDARD_COLUMNS = {
  users: ['id', 'username', 'nickname', 'password_hash', 'age', 'gender', 'avatar_url', 'avatar_data', 'bio', 'mbti', 'soul_quadrant', 'soul_score', 'user_tier', 'is_verified', 'profile_completed', 'values_json', 'interests_json', 'ai_description', 'match_count', 'activity_score', 'height', 'education', 'occupation', 'annual_income', 'city', 'last_active', 'password_salt', 'created_at', 'updated_at'],
  matches: ['id', 'oder_a_id', 'oder_b_id', 'soulmate_index', 'user_a_liked', 'user_b_liked', 'mutual_liked', 'unlocked_level', 'match_status', 'created_at', 'matched_at'],
  messages: ['id', 'match_id', 'sender_id', 'content', 'message_type', 'created_at', 'read_at'],
  notifications: ['id', 'user_id', 'type', 'title', 'content', 'data', 'is_read', 'created_at'],
  moments: ['id', 'user_id', 'content', 'images_json', 'video_url', 'location', 'like_count', 'comment_count', 'is_anonymous', 'anonymous_name', 'created_at'],
  moment_likes: ['id', 'moment_id', 'user_id', 'created_at'],
  moment_comments: ['id', 'moment_id', 'user_id', 'content', 'created_at'],
  user_blocklist: ['id', 'user_id', 'blocked_user_id', 'created_at']
};

function escapeValue(val) {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'true' : 'false';
  if (typeof val === 'number') return val.toString();
  if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${val.toString().replace(/'/g, "''")}'`;
}

function rowToInsertSQL(tableName, columns, row) {
  const values = columns.map(col => {
    const val = row[col];
    return escapeValue(val);
  });
  return `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});`;
}

// ============== MAIN ==============

async function main() {
  console.log('=== SoulQuad SQL Schema + Data Export ===\n');

  // Check export directory
  if (!fs.existsSync(EXPORT_DIR)) {
    console.error(`Export directory not found: ${EXPORT_DIR}`);
    console.error('Please run export-db.js first.');
    process.exit(1);
  }

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

  let sql = CREATE_TABLES_SQL;
  let totalRows = 0;

  // Read metadata
  const metaPath = path.join(EXPORT_DIR, '_metadata.json');
  if (!fs.existsSync(metaPath)) {
    console.error('Metadata file not found. Please run export-db.js first.');
    process.exit(1);
  }

  const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  console.log(`Source export date: ${meta.exportedAt}`);
  console.log(`PostgreSQL version: ${meta.pgVersion}\n`);

  // Generate INSERT statements for each table
  for (const table of TABLES) {
    const filepath = path.join(EXPORT_DIR, `${table}.json`);
    if (!fs.existsSync(filepath)) {
      console.log(`  → ${table}: No file found, skipping`);
      continue;
    }

    try {
      const tableData = JSON.parse(fs.readFileSync(filepath, 'utf8'));
      const data = tableData.data;

      if (!data || data.length === 0) {
        console.log(`  → ${table}: No data, skipping`);
        continue;
      }

      // Get columns from first row, filtered to standard columns only (skip missing server columns)
      const standardCols = STANDARD_COLUMNS[table] || Object.keys(data[0]);
      const excluded = EXCLUDED_COLUMNS[table] || [];
      const columns = standardCols.filter(col => !excluded.includes(col) && Object.keys(data[0]).includes(col));
      const columnList = columns.join(', ');

      if (!columns.length) {
        console.log(`  → ${table}: All columns skipped (no matching server columns), skipping`);
        continue;
      }

      // Generate batch INSERT statements (100 rows per statement for efficiency)
      const batchSize = 100;
      let batch = [];

      for (const row of data) {
        const values = columns.map(col => escapeValue(row[col]));
        batch.push(`(${values.join(', ')})`);

        if (batch.length >= batchSize) {
          sql += `\nINSERT INTO ${table} (${columnList}) VALUES ${batch.join(', ')};`;
          batch = [];
        }
      }

      // Flush remaining
      if (batch.length > 0) {
        sql += `\nINSERT INTO ${table} (${columnList}) VALUES ${batch.join(', ')};`;
      }

      console.log(`  ✓ ${table}: ${data.length} rows`);
      totalRows += data.length;

    } catch (err) {
      console.log(`  ✗ ${table}: ${err.message}`);
    }
  }

  // Write SQL file
  fs.writeFileSync(OUTPUT_FILE, sql);

  console.log(`\n=== Export Complete ===`);
  console.log(`Output file: ${OUTPUT_FILE}`);
  console.log(`Total rows: ${totalRows}`);
  console.log(`File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\nTo import on server:`);
  console.log(`  psql -h localhost -U postgres -d soulquad -f soulquad-data.sql`);
}

main();