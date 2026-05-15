import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

let pool = null;

export async function initDb() {
  pool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'soulquad',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'postgres',
  });

  // Test connection
  const client = await pool.connect();
  console.log('PostgreSQL connected');
  client.release();

  // Create tables if not exist
  await createTables();

  return pool;
}

export function getDb() {
  if (!pool) {
    throw new Error('Database not initialized');
  }
  return pool;
}

async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        nickname VARCHAR(100) NOT NULL,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

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

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        match_id UUID NOT NULL REFERENCES matches(id),
        sender_id UUID NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        message_type VARCHAR(20) DEFAULT 'text',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        read_at TIMESTAMP
      );

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

      CREATE TABLE IF NOT EXISTS moments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id),
        content TEXT DEFAULT '',
        images_json JSONB DEFAULT '[]',
        video_url TEXT DEFAULT '',
        location TEXT DEFAULT '',
        like_count INTEGER DEFAULT 0,
        comment_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS moment_likes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        moment_id UUID NOT NULL REFERENCES moments(id),
        user_id UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(moment_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS moment_comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        moment_id UUID NOT NULL REFERENCES moments(id),
        user_id UUID NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(oder_a_id);
      CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(oder_b_id);
      CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
      CREATE INDEX IF NOT EXISTS idx_moments_user ON moments(user_id);
      CREATE INDEX IF NOT EXISTS idx_moment_likes_moment ON moment_likes(moment_id);
      CREATE INDEX IF NOT EXISTS idx_moment_comments_moment ON moment_comments(moment_id);
    `);
  } finally {
    client.release();
  }
}

// Helper function for queries - handles async/pool pattern
export async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

// For backwards compatibility with sql.js callers that used stmt.step() / stmt.getAsObject()
// Returns an array of objects like sql.js
export async function all(sql, params = []) {
  const result = await query(sql, params);
  return result.rows;
}

export async function get(sql, params = []) {
  const result = await query(sql, params);
  return result.rows[0] || null;
}

export async function run(sql, params = []) {
  const result = await query(sql, params);
  return { lastInsertRowid: result.rowCount };
}

// Close pool
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}