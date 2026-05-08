import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'soulquad.db');

let db = null;

export async function initDb() {
  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
    createTables();
    seedData();
  }

  return db;
}

export function getDb() {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db;
}

function createTables() {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL,
      age INTEGER DEFAULT 0,
      gender TEXT DEFAULT 'other',
      avatar_url TEXT DEFAULT '',
      avatar_data TEXT DEFAULT '',
      bio TEXT DEFAULT '',
      mbti TEXT,
      soul_quadrant TEXT,
      soul_score INTEGER DEFAULT 0,
      user_tier TEXT DEFAULT 'ordinary',
      is_verified INTEGER DEFAULT 0,
      profile_completed INTEGER DEFAULT 0,
      values_json TEXT DEFAULT '[]',
      interests_json TEXT DEFAULT '[]',
      ai_description TEXT DEFAULT '',
      match_count INTEGER DEFAULT 0,
      activity_score INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS matches (
      id TEXT PRIMARY KEY,
      oder_a_id TEXT NOT NULL,
      oder_b_id TEXT NOT NULL,
      soulmate_index INTEGER DEFAULT 0,
      user_a_liked INTEGER DEFAULT 0,
      user_b_liked INTEGER DEFAULT 0,
      mutual_liked INTEGER DEFAULT 0,
      unlocked_level INTEGER DEFAULT 1,
      match_status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      matched_at TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      match_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      read_at TEXT
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT DEFAULT '',
      content TEXT DEFAULT '',
      data TEXT DEFAULT '{}',
      read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(oder_a_id);
    CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(oder_b_id);
    CREATE INDEX IF NOT EXISTS idx_messages_match ON messages(match_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  `;

  db.run(sql);
  saveDb();
}

function saveDb() {
  if (db) {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

function seedData() {
  const simpleHash = (password) => crypto.createHash('sha256').update(password).digest('hex');
  const hashedPassword = simpleHash('demo123');

  const seedUsers = [
    // Existing users
    { username: 'alice', nickname: 'Alice', age: 25, gender: 'female', mbti: 'ENFP', quadrant: 'explorer', bio: '喜欢旅行和探索新事物', soul_score: 95, match_count: 55, activity: 90, tier: 'legend' },
    { username: 'bob', nickname: 'Bob', age: 28, gender: 'male', mbti: 'INTJ', quadrant: 'philosopher', bio: '热爱阅读和思考', soul_score: 88, match_count: 35, activity: 85, tier: 'top' },
    { username: 'carol', nickname: 'Carol', age: 26, gender: 'female', mbti: 'INFP', quadrant: 'artist', bio: '艺术爱好者', soul_score: 75, match_count: 18, activity: 70, tier: 'excellent' },
    { username: 'david', nickname: 'David', age: 30, gender: 'male', mbti: 'ESTJ', quadrant: 'builder', bio: '务实派，喜欢规划', soul_score: 72, match_count: 12, activity: 65, tier: 'excellent' },
    { username: 'emma', nickname: 'Emma', age: 24, gender: 'female', mbti: 'ENTP', quadrant: 'explorer', bio: '辩论家，善于思考', soul_score: 60, match_count: 5, activity: 50, tier: 'ordinary' },
    { username: 'frank', nickname: 'Frank', age: 27, gender: 'male', mbti: 'ISFP', quadrant: 'artist', bio: '音乐和艺术', soul_score: 55, match_count: 3, activity: 40, tier: 'ordinary' },

    // New female users - legend/top tier
    { username: 'nova', nickname: 'Nova', age: 23, gender: 'female', mbti: 'ENFJ', quadrant: 'explorer', bio: '星光不问赶路人', soul_score: 96, match_count: 60, activity: 95, tier: 'legend' },
    { username: 'luna', nickname: 'Luna', age: 26, gender: 'female', mbti: 'INFJ', quadrant: 'philosopher', bio: '月光下的梦想家', soul_score: 92, match_count: 45, activity: 88, tier: 'legend' },
    { username: 'aria', nickname: 'Aria', age: 24, gender: 'female', mbti: 'INTP', quadrant: 'philosopher', bio: '代码是诗，艺术是光', soul_score: 87, match_count: 38, activity: 82, tier: 'top' },
    { username: 'stella', nickname: 'Stella', age: 27, gender: 'female', mbti: 'ESTP', quadrant: 'explorer', bio: '星空下的冒险家', soul_score: 86, match_count: 32, activity: 80, tier: 'top' },
    { username: 'iris', nickname: 'Iris', age: 25, gender: 'female', mbti: 'ESFP', quadrant: 'artist', bio: '彩虹般的绚丽人生', soul_score: 78, match_count: 22, activity: 75, tier: 'excellent' },

    // New female users - excellent tier
    { username: 'grace', nickname: 'Grace', age: 22, gender: 'female', mbti: 'ISFP', quadrant: 'artist', bio: '优雅如你，温柔如水', soul_score: 74, match_count: 15, activity: 68, tier: 'excellent' },
    { username: 'ivy', nickname: 'Ivy', age: 28, gender: 'female', mbti: 'ISTJ', quadrant: 'builder', bio: '常青藤的坚韧', soul_score: 71, match_count: 11, activity: 62, tier: 'excellent' },
    { username: 'jade', nickname: 'Jade', age: 23, gender: 'female', mbti: 'ENTP', quadrant: 'explorer', bio: '翠玉般的珍贵', soul_score: 68, match_count: 8, activity: 58, tier: 'excellent' },
    { username: 'ruby', nickname: 'Ruby', age: 26, gender: 'female', mbti: 'ENFP', quadrant: 'explorer', bio: '红宝石般的热情', soul_score: 65, match_count: 6, activity: 55, tier: 'excellent' },

    // New male users - legend/top tier
    { username: 'kai', nickname: 'Kai', age: 27, gender: 'male', mbti: 'ENTJ', quadrant: 'explorer', bio: '海阔天空，任我飞翔', soul_score: 94, match_count: 52, activity: 92, tier: 'legend' },
    { username: 'leo', nickname: 'Leo', age: 29, gender: 'male', mbti: 'INTJ', quadrant: 'philosopher', bio: '狮子王的骄傲', soul_score: 90, match_count: 42, activity: 86, tier: 'top' },
    { username: 'marcus', nickname: 'Marcus', age: 25, gender: 'male', mbti: 'INTP', quadrant: 'philosopher', bio: '哲学的思辨者', soul_score: 89, match_count: 36, activity: 84, tier: 'top' },
    { username: 'axel', nickname: 'Axel', age: 28, gender: 'male', mbti: 'ESTJ', quadrant: 'builder', bio: '未来工程师', soul_score: 85, match_count: 30, activity: 78, tier: 'top' },
    { username: 'ryan', nickname: 'Ryan', age: 24, gender: 'male', mbti: 'ENFJ', quadrant: 'explorer', bio: '自由的灵魂', soul_score: 82, match_count: 28, activity: 76, tier: 'excellent' },

    // New male users - excellent tier
    { username: 'chase', nickname: 'Chase', age: 26, gender: 'male', mbti: 'ESFP', quadrant: 'artist', bio: '追逐星光的人', soul_score: 76, match_count: 20, activity: 72, tier: 'excellent' },
    { username: 'blake', nickname: 'Blake', age: 23, gender: 'male', mbti: 'ISFJ', quadrant: 'builder', bio: '沉稳如山', soul_score: 73, match_count: 14, activity: 66, tier: 'excellent' },
    { username: 'dylan', nickname: 'Dylan', age: 27, gender: 'male', mbti: 'INFP', quadrant: 'artist', bio: '音乐是我的语言', soul_score: 70, match_count: 10, activity: 60, tier: 'excellent' },
    { username: 'cody', nickname: 'Cody', age: 25, gender: 'male', mbti: 'ESTP', quadrant: 'explorer', bio: '活在当下', soul_score: 67, match_count: 7, activity: 54, tier: 'excellent' },
  ];

  seedUsers.forEach((user) => {
    const id = crypto.randomUUID();
    const stmt = db.prepare(`
      INSERT INTO users (id, username, password_hash, nickname, age, gender, mbti, soul_quadrant, bio, profile_completed, soul_score, match_count, activity_score, user_tier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `);
    stmt.bind([id, user.username, hashedPassword, user.nickname, user.age, user.gender, user.mbti, user.quadrant, user.bio, user.soul_score, user.match_count, user.activity, user.tier]);
    stmt.step();
    stmt.free();
  });

  saveDb();
}

export { saveDb };
