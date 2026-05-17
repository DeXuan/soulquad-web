// SQLite to PostgreSQL migration script
// Run: node migrate-from-sqlite.js

import Database from 'better-sqlite3';
import pg from 'pg';

const { Pool } = pg;

const sqliteDb = new Database('./dist-server/soulquad.db');
const pgPool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'soulquad',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'SoulQuad2024!',
});

async function migrate() {
  console.log('Starting SQLite to PostgreSQL migration...\n');

  const pgClient = await pgPool.connect();

  try {
    // Migrate users
    console.log('Migrating users...');
    const users = sqliteDb.prepare('SELECT * FROM users').all();
    console.log(`  Found ${users.length} users`);

    for (const user of users) {
      // Convert SQLite row to PostgreSQL insert, handling password_salt
      await pgClient.query(`
        INSERT INTO users (
          id, username, password_hash, nickname, age, gender, avatar_url, avatar_data, bio,
          mbti, soul_quadrant, soul_score, user_tier, is_verified, profile_completed,
          ai_description, created_at, city, height, education, occupation, annual_income,
          has_house, has_car, purpose, mode, values_json, interests_json, password_salt,
          match_count, activity_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          password_hash = EXCLUDED.password_hash,
          nickname = EXCLUDED.nickname,
          age = EXCLUDED.age,
          gender = EXCLUDED.gender,
          avatar_url = EXCLUDED.avatar_url,
          avatar_data = EXCLUDED.avatar_data,
          bio = EXCLUDED.bio,
          mbti = EXCLUDED.mbti,
          soul_quadrant = EXCLUDED.soul_quadrant,
          soul_score = EXCLUDED.soul_score,
          user_tier = EXCLUDED.user_tier,
          ai_description = EXCLUDED.ai_description,
          city = EXCLUDED.city,
          height = EXCLUDED.height,
          education = EXCLUDED.education,
          occupation = EXCLUDED.occupation,
          annual_income = EXCLUDED.annual_income
      `, [
        user.id, user.username, user.password_hash, user.nickname,
        user.age || 0, user.gender, user.avatar_url || '', user.avatar_data || '',
        user.bio || '', user.mbti || null, user.soul_quadrant || null,
        user.soul_score || 0, user.user_tier || 'ordinary', user.is_verified ? 1 : 0,
        user.profile_completed ? 1 : 0, user.ai_description || '',
        user.created_at || new Date().toISOString(),
        user.city || '', user.height || 0, user.education || '',
        user.occupation || '', user.annual_income || 0,
        user.has_house ? 1 : 0, user.has_car ? 1 : 0,
        user.purpose || '', user.mode || '',
        user.values_json || '[]', user.interests_json || '[]',
        user.password_salt || '',
        user.match_count || 0, user.activity_score || 0
      ]);
    }
    console.log('  Users migrated successfully');

    // Migrate matches
    console.log('\nMigrating matches...');
    const matches = sqliteDb.prepare('SELECT * FROM matches').all();
    console.log(`  Found ${matches.length} matches`);

    for (const match of matches) {
      await pgClient.query(`
        INSERT INTO matches (
          id, oder_a_id, oder_b_id, soulmate_index,
          user_a_liked, user_b_liked, mutual_liked, unlocked_level,
          match_status, created_at, matched_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          user_a_liked = EXCLUDED.user_a_liked,
          user_b_liked = EXCLUDED.user_b_liked,
          mutual_liked = EXCLUDED.mutual_liked,
          matched_at = EXCLUDED.matched_at
      `, [
        match.id, match.oder_a_id, match.oder_b_id,
        match.soulmate_index || 0,
        match.user_a_liked ? 1 : 0, match.user_b_liked ? 1 : 0,
        match.mutual_liked ? 1 : 0, match.unlocked_level || 0,
        match.match_status || 'pending',
        match.created_at || new Date().toISOString(),
        match.matched_at || null
      ]);
    }
    console.log('  Matches migrated successfully');

    // Migrate messages
    console.log('\nMigrating messages...');
    const messages = sqliteDb.prepare('SELECT * FROM messages').all();
    console.log(`  Found ${messages.length} messages`);

    for (const msg of messages) {
      await pgClient.query(`
        INSERT INTO messages (id, match_id, sender_id, content, message_type, created_at, read_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (id) DO NOTHING
      `, [
        msg.id, msg.match_id, msg.sender_id, msg.content,
        msg.message_type || 'text', msg.created_at || new Date().toISOString(),
        msg.read_at || null
      ]);
    }
    console.log('  Messages migrated successfully');

    // Migrate notifications
    console.log('\nMigrating notifications...');
    const notifications = sqliteDb.prepare('SELECT * FROM notifications').all();
    console.log(`  Found ${notifications.length} notifications`);

    for (const notif of notifications) {
      await pgClient.query(`
        INSERT INTO notifications (id, user_id, type, title, content, data, is_read, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (id) DO UPDATE SET
          is_read = EXCLUDED.is_read
      `, [
        notif.id, notif.user_id, notif.type,
        notif.title || '', notif.content || '',
        notif.data || '{}',
        notif.read ? 1 : 0,
        notif.created_at || new Date().toISOString()
      ]);
    }
    console.log('  Notifications migrated successfully');

    // Check if moments table exists in SQLite
    const momentsTableExists = sqliteDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='moments'").get();

    if (momentsTableExists) {
      // Migrate moments
      console.log('\nMigrating moments...');
      const moments = sqliteDb.prepare('SELECT * FROM moments').all();
      console.log(`  Found ${moments.length} moments`);

      for (const moment of moments) {
        await pgClient.query(`
          INSERT INTO moments (id, user_id, content, images_json, video_url, location, is_anonymous, anonymous_name, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          ON CONFLICT (id) DO UPDATE SET
            content = EXCLUDED.content,
            images_json = EXCLUDED.images_json
        `, [
          moment.id, moment.user_id, moment.content || '',
          moment.images_json || '[]', moment.video_url || '',
          moment.location || '',
          moment.is_anonymous ? 1 : 0,
          moment.anonymous_name || '',
          moment.created_at || new Date().toISOString()
        ]);
      }
      console.log('  Moments migrated successfully');
    } else {
      console.log('\nMoments table not found in SQLite, skipping...');
    }

    // Get counts for summary
    const momentCount = momentsTableExists ? moments.length : 0;

    console.log('\n========================================');
    console.log('Migration completed successfully!');
    console.log('========================================');
    console.log(`Users: ${users.length}`);
    console.log(`Matches: ${matches.length}`);
    console.log(`Messages: ${messages.length}`);
    console.log(`Notifications: ${notifications.length}`);
    console.log(`Moments: ${momentCount}`);

  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  } finally {
    sqliteDb.close();
    pgClient.release();
    await pgPool.end();
  }
}

migrate();