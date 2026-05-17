import pg from 'pg';
import crypto from 'crypto';

const { Pool } = pg;

let pool = null;

export async function initDb() {
  pool = new Pool({
    host: process.env.PG_HOST || '47.116.77.67',
    port: process.env.PG_PORT || 5432,
    database: process.env.PG_DATABASE || 'soulquad',
    user: process.env.PG_USER || 'soulquad_user',
    password: process.env.PG_PASSWORD || 'SoulQuad2024!',
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

// Create tables and seed data
async function createTables() {
  const client = await pool.connect();
  try {
    await client.query(`
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
        is_anonymous BOOLEAN DEFAULT false,
        anonymous_name VARCHAR(50) DEFAULT '',
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

    // Migration: Add new columns to existing tables
    const migrations = [
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS password_salt VARCHAR(64) DEFAULT \'\'',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS height INTEGER DEFAULT 0',
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS education VARCHAR(50) DEFAULT ''",
      "ALTER TABLE users ADD COLUMN IF NOT EXISTS occupation VARCHAR(100) DEFAULT ''",
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS annual_income INTEGER DEFAULT 0',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT \'\'',
      'ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMP',
      'ALTER TABLE moments ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false',
      "ALTER TABLE moments ADD COLUMN IF NOT EXISTS anonymous_name VARCHAR(50) DEFAULT ''"
    ];

    for (const migration of migrations) {
      try {
        await client.query(migration);
      } catch (err) {
        // Ignore errors for columns that might already exist
      }
    }

    // Create user_blocklist table if not exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_blocklist (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        blocked_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, blocked_user_id)
      )
    `);

    // Create indexes for performance (ignore if exists)
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_users_city ON users(city)',
      'CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active)',
      'CREATE INDEX IF NOT EXISTS idx_users_mbti ON users(mbti)',
      'CREATE INDEX IF NOT EXISTS idx_users_soul_quadrant ON users(soul_quadrant)',
      'CREATE INDEX IF NOT EXISTS idx_users_profile_completed ON users(profile_completed)',
      'CREATE INDEX IF NOT EXISTS idx_matches_mutual ON matches(mutual_liked)',
      'CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id) WHERE is_read = false',
      'CREATE INDEX IF NOT EXISTS idx_moments_created_at ON moments(created_at DESC)',
      'CREATE INDEX IF NOT EXISTS idx_blocklist_user ON user_blocklist(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_blocklist_blocked ON user_blocklist(blocked_user_id)'
    ];

    for (const idx of indexes) {
      try {
        await client.query(idx);
      } catch (err) {
        // Ignore errors for indexes that might already exist
      }
    }

    // Check if we need to seed data
    const userCount = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) === 0) {
      console.log('Seeding database with sample users...');
      await seedData(client);
      console.log('Database seeded successfully');
    }
  } finally {
    client.release();
  }
}

async function seedData(client) {
  const simpleHash = (password) => {
    const salt = 'soulquad-salt-2024';
    return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  };
  const hashedPassword = simpleHash('demo123');

  const provinces = ['北京', '上海', '广东', '浙江', '江苏', '四川', '湖北', '湖南', '山东', '河南', '河北', '福建', '安徽', '陕西', '辽宁', '江西', '云南', '贵州', '广西', '山西'];
  const occupations = ['程序员', '产品经理', '设计师', '教师', '医生', '律师', '财务', '市场', '运营', 'HR', '建筑工程师', '金融分析师', '编辑', '摄影师', '自由职业'];
  const personalities = [
    '性格踏实稳重，不抽烟少喝酒，生活简单规律',
    '性格温和内向，平时喜欢宅家、偶尔运动，做事靠谱有责任心',
    '性格开朗健谈，喜欢结交新朋友，生活乐观积极',
    '性格独立理性，热爱学习和钻研，做事专注认真',
    '性格随和友善，待人真诚热情，生活自律健康',
    '性格稳重成熟，善于倾听和沟通，生活井井有条',
    '性格热情活泼，喜欢尝试新事物，生活充满激情',
    '性格细腻敏感，善于洞察人心，生活追求品质'
  ];
  const hobbies = [
    '平时喜欢宅家看书、偶尔运动健身',
    '平时喜欢旅游、摄影，热爱生活',
    '平时喜欢音乐、偶尔看电影，生活文艺',
    '平时喜欢运动跑步、偶尔做饭烹饪',
    '平时喜欢追剧、偶尔逛街购物',
    '平时喜欢研究美食、偶尔自己下厨',
    '平时喜欢户外运动、偶尔宅家玩游戏',
    '平时喜欢看书、偶尔听音乐，生活简单'
  ];
  const goals = [
    '想找性格温和、三观相合的对象，认真相处，奔着结婚去',
    '想找志同道合的人一起努力生活，相互支持，共同成长',
    '想找成熟稳重的人，安稳过日子，一起组建家庭',
    '想找温柔善良的女生，认真谈恋爱，以结婚为目的',
    '想找性格相近的人，互相理解包容，共同经营生活',
    '想找积极向上的伴侣，一起进步，追求更好的生活'
  ];

  const mbtiTypes = ['ENFP', 'INFP', 'ENFJ', 'INFJ', 'ENTP', 'INTP', 'ENTJ', 'INTJ', 'ESFP', 'ISFP', 'ESFJ', 'ISFJ', 'ESTP', 'ISTP', 'ESTJ', 'ISTJ'];
  const quadrants = ['explorer', 'builder', 'artist', 'philosopher'];
  const tiers = ['legend', 'top', 'excellent', 'ordinary'];
  const avatarBaseUrl = 'https://api.dicebear.com/7.x/micah/svg?seed=';

  function generateBio(gender, age, province, occupation, personality, hobby, goal) {
    const birthYear = 2026 - age;
    return `${birthYear}年${province}人，${occupation}，${personality}。${hobby}，${goal}。`;
  }

  const allUserIds = [];

  // Generate female users (25)
  for (let i = 0; i < 25; i++) {
    const age = 22 + Math.floor(Math.random() * 10);
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const occupation = occupations[Math.floor(Math.random() * occupations.length)];
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
    const goal = goals[Math.floor(Math.random() * goals.length)];
    const bio = generateBio('female', age, province, occupation, personality, hobby, goal);
    const mbti = mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)];
    const quadrant = quadrants[Math.floor(Math.random() * quadrants.length)];
    const tier = tiers[Math.floor(Math.random() * 2)];
    const avatarSeed = `female_${crypto.randomUUID()}`;
    const soulScore = 60 + Math.floor(Math.random() * 40);
    const matchCount = 5 + Math.floor(Math.random() * 55);
    const activity = 50 + Math.floor(Math.random() * 50);

    const id = crypto.randomUUID();
    allUserIds.push(id);
    const username = `user_f_${i + 1}`;
    const nickname = `UserF${i + 1}`;

    await client.query(`
      INSERT INTO users (id, username, password_hash, nickname, age, gender, mbti, soul_quadrant, bio, profile_completed, soul_score, match_count, activity_score, user_tier, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12, $13, $14)
    `, [id, username, hashedPassword, nickname, age, 'female', mbti, quadrant, bio, soulScore, matchCount, activity, tier, `${avatarBaseUrl}${avatarSeed}`]);
  }

  // Generate male users (30)
  for (let i = 0; i < 30; i++) {
    const age = 25 + Math.floor(Math.random() * 15);
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const occupation = occupations[Math.floor(Math.random() * occupations.length)];
    const personality = personalities[Math.floor(Math.random() * personalities.length)];
    const hobby = hobbies[Math.floor(Math.random() * hobbies.length)];
    const goal = goals[Math.floor(Math.random() * goals.length)];
    const bio = generateBio('male', age, province, occupation, personality, hobby, goal);
    const mbti = mbtiTypes[Math.floor(Math.random() * mbtiTypes.length)];
    const quadrant = quadrants[Math.floor(Math.random() * quadrants.length)];
    const tier = tiers[Math.floor(Math.random() * 2)];
    const avatarSeed = `male_${crypto.randomUUID()}`;
    const soulScore = 60 + Math.floor(Math.random() * 40);
    const matchCount = 5 + Math.floor(Math.random() * 55);
    const activity = 50 + Math.floor(Math.random() * 50);

    const id = crypto.randomUUID();
    allUserIds.push(id);
    const username = `user_m_${i + 1}`;
    const nickname = `UserM${i + 1}`;

    await client.query(`
      INSERT INTO users (id, username, password_hash, nickname, age, gender, mbti, soul_quadrant, bio, profile_completed, soul_score, match_count, activity_score, user_tier, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12, $13, $14)
    `, [id, username, hashedPassword, nickname, age, 'male', mbti, quadrant, bio, soulScore, matchCount, activity, tier, `${avatarBaseUrl}${avatarSeed}`]);
  }

  // Original demo users with better bios
  const seedUsers = [
    { username: 'alice', nickname: 'Alice', age: 25, gender: 'female', mbti: 'ENFP', quadrant: 'explorer', bio: '95年北京人，策划，性格开朗热情，喜欢旅行和探索新事物，爱看电影和美食。想找志同道合的人一起经历生活的精彩。', soul_score: 95, match_count: 55, activity: 90, tier: 'legend', avatar: `alice_${crypto.randomUUID()}` },
    { username: 'bob', nickname: 'Bob', age: 28, gender: 'male', mbti: 'INTJ', quadrant: 'philosopher', bio: '88年上海人，程序员，性格内敛理性，喜欢阅读哲学和历史，热爱音乐和艺术。想找一个能深度交流的精神伴侣。', soul_score: 88, match_count: 35, activity: 85, tier: 'top', avatar: `bob_${crypto.randomUUID()}` },
    { username: 'carol', nickname: 'Carol', age: 26, gender: 'female', mbti: 'INFP', quadrant: 'artist', bio: '96年广东人，设计师，性格文艺敏感，喜欢绘画和写作，追求精神世界的共鸣。想找一个理解自己内心世界的人。', soul_score: 75, match_count: 18, activity: 70, tier: 'excellent', avatar: `carol_${crypto.randomUUID()}` },
    { username: 'david', nickname: 'David', age: 30, gender: 'male', mbti: 'ESTJ', quadrant: 'builder', bio: '90年浙江人，建筑工程师，性格务实稳重，注重效率和结果，生活规律健康。想找一个踏实过日子的人。', soul_score: 72, match_count: 12, activity: 65, tier: 'excellent', avatar: `david_${crypto.randomUUID()}` },
    { username: 'emma', nickname: 'Emma', age: 24, gender: 'female', mbti: 'ENTP', quadrant: 'explorer', bio: '98年江苏人，产品经理，性格机智善辩，喜欢辩论和脑力激荡，生活多彩有趣。想找一个能跟得上自己节奏的人。', soul_score: 60, match_count: 5, activity: 50, tier: 'ordinary', avatar: `emma_${crypto.randomUUID()}` },
    { username: 'frank', nickname: 'Frank', age: 27, gender: 'male', mbti: 'ISFP', quadrant: 'artist', bio: '93年湖北人，音乐制作人，性格温和细腻，喜欢音乐创作和演出，追求自由的艺术生活。想找一个能欣赏艺术的人。', soul_score: 55, match_count: 3, activity: 40, tier: 'ordinary', avatar: `frank_${crypto.randomUUID()}` },
  ];

  for (const user of seedUsers) {
    const id = crypto.randomUUID();
    allUserIds.push(id);
    await client.query(`
      INSERT INTO users (id, username, password_hash, nickname, age, gender, mbti, soul_quadrant, bio, profile_completed, soul_score, match_count, activity_score, user_tier, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, $10, $11, $12, $13, $14)
    `, [id, user.username, hashedPassword, user.nickname, user.age, user.gender, user.mbti, user.quadrant, user.bio, user.soul_score, user.match_count, user.activity, user.tier, `${avatarBaseUrl}${user.avatar}`]);
  }

  // Seed some moments
  const momentContents = [
    { content: '今天天气真好，和朋友们一起去郊外野餐，感觉灵魂都在歌唱！', location: '北京朝阳公园' },
    { content: '刚做完MBTI测试，原来我是探险家人格！难怪总是向往自由和冒险。', location: '' },
    { content: '分享一组最近拍的照片，捕捉到了生活中的小美好。', location: '上海外滩' },
    { content: '有人推荐好听的歌吗？最近喜欢民谣，想要一些治愈系的音乐。', location: '' },
    { content: '健身打卡第30天，坚持真的很重要！最近感觉整个人都精神多了。', location: '广州珠江新城健身房' },
    { content: '读了一本很有启发的书，《原子习惯》真的推荐给每一个想改变自己的人。', location: '' },
    { content: '周末学做了红烧肉，虽然卖相一般，但味道还不错！成就感满满。', location: '深圳家里' },
    { content: '今天遇到一个很有意思的人，聊了很多关于人生规划的事情，希望能有更多交流。', location: '成都太古里' },
  ];

  for (let i = 0; i < momentContents.length; i++) {
    const mom = momentContents[i];
    const userId = allUserIds[i % allUserIds.length];
    const id = crypto.randomUUID();
    const now = new Date();
    now.setHours(now.getHours() - (i * 2));

    await client.query(`
      INSERT INTO moments (id, user_id, content, images_json, video_url, location, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [id, userId, mom.content, '[]', '', mom.location, now.toISOString()]);
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