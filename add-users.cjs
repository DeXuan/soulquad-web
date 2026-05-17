const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ user: 'postgres', password: 'SoulQuad2024!', host: 'localhost', database: 'soulquad' });

const avatarUrl = (seed) => 'https://api.dicebear.com/7.x/avataaars/png?seed=' + seed;

// 50 new users with bio and avatar
const newUsers = [
  // Female 25
  { username: 'sophia', nickname: 'Sophia', age: 27, gender: 'female', bio: '91年杭州小姐姐，注册会计师，性格温柔体贴，喜欢烹饪和瑜伽，追求工作与生活的平衡。希望找到一个稳重顾家的他。', mbti: 'ISFJ', quadrant: 'builder', city: '杭州', height: 163, education: '本科', occupation: '会计', income: 20 },
  { username: 'luna', nickname: 'Luna', age: 24, gender: 'female', bio: '98年成都妹子，舞蹈老师，性格活泼开朗，喜欢旅行和摄影，热爱生活的一切美好。', mbti: 'ESFP', quadrant: 'explorer', city: '成都', height: 160, education: '本科', occupation: '舞蹈老师', income: 12 },
  { username: 'crystal', nickname: 'Crystal', age: 26, gender: 'female', bio: '94年深圳小姐姐，金融分析师，性格独立理性，喜欢阅读财经类书籍，热爱健身。希望找到志同道合的伴侣。', mbti: 'INTJ', quadrant: 'philosopher', city: '深圳', height: 165, education: '硕士', occupation: '金融分析师', income: 35 },
  { username: 'amy', nickname: 'Amy', age: 25, gender: 'female', bio: '95年武汉女孩，中学教师，性格耐心温柔，喜欢小动物和手工DIY，待人真诚。', mbti: 'INFP', quadrant: 'artist', city: '武汉', height: 158, education: '本科', occupation: '教师', income: 10 },
  { username: 'grace', nickname: 'Grace', age: 28, gender: 'female', bio: '92年南京姑娘，律师，性格果断干练，喜欢看书和看展，追求精神层面的契合。', mbti: 'ENTJ', quadrant: 'builder', city: '南京', height: 168, education: '硕士', occupation: '律师', income: 40 },
  { username: 'iris', nickname: 'Iris', age: 24, gender: 'female', bio: '98年西安小妹，新媒体运营，性格古灵精怪，喜欢刷剧和追星，社交达人。', mbti: 'ENFP', quadrant: 'explorer', city: '西安', height: 162, education: '本科', occupation: '新媒体运营', income: 15 },
  { username: 'ivy', nickname: 'Ivy', age: 27, gender: 'female', bio: '93年重庆辣妈，品牌策划，性格直爽热情，喜欢火锅和唱歌，热爱生活。', mbti: 'ESFJ', quadrant: 'artist', city: '重庆', height: 164, education: '本科', occupation: '品牌策划', income: 25 },
  { username: 'jade', nickname: 'Jade', age: 26, gender: 'female', bio: '94年天津姐姐，心理咨询师，性格温暖细腻，擅长倾听。希望找到内心成熟的男士。', mbti: 'INFJ', quadrant: 'philosopher', city: '天津', height: 166, education: '硕士', occupation: '心理咨询师', income: 30 },
  { username: 'lily', nickname: 'Lily', age: 23, gender: 'female', bio: '99年上海应届生，市场营销专业，性格阳光开朗，喜欢尝试新事物，对未来充满期待。', mbti: 'ENFP', quadrant: 'explorer', city: '上海', height: 161, education: '本科', occupation: '市场营销', income: 8 },
  { username: 'nancy', nickname: 'Nancy', age: 29, gender: 'female', bio: '91年北京大妞，资深HR，性格知性优雅，喜欢品茶和读书。希望找到真诚靠谱的灵魂伴侣。', mbti: 'INTJ', quadrant: 'philosopher', city: '北京', height: 167, education: '硕士', occupation: '人力资源', income: 45 },
  { username: 'olivia', nickname: 'Olivia', age: 25, gender: 'female', bio: '95年苏州女孩，园林设计师，性格温柔婉约，热爱大自然，喜欢养花弄草。', mbti: 'ISFP', quadrant: 'artist', city: '苏州', height: 163, education: '本科', occupation: '园林设计师', income: 18 },
  { username: 'peggy', nickname: 'Peggy', age: 28, gender: 'female', bio: '92年青岛姑娘，儿科医生，性格耐心爱心，喜欢小孩子，空闲时做志愿者。', mbti: 'ENFJ', quadrant: 'builder', city: '青岛', height: 164, education: '硕士', occupation: '医生', income: 35 },
  { username: 'queen', nickname: 'Queen', age: 26, gender: 'female', bio: '94年长沙辣妹，美食博主，性格豪爽直率，喜欢探店吃美食。', mbti: 'ESTP', quadrant: 'explorer', city: '长沙', height: 160, education: '本科', occupation: '美食博主', income: 20 },
  { username: 'rachel', nickname: 'Rachel', age: 27, gender: 'female', bio: '93年哈尔滨女孩，公务员，性格稳重成熟，喜欢历史和传统文化。', mbti: 'ISTJ', quadrant: 'builder', city: '哈尔滨', height: 165, education: '本科', occupation: '公务员', income: 15 },
  { username: 'sarah', nickname: 'Sarah', age: 24, gender: 'female', bio: '96年广州靓女，跨境电商，性格时尚前卫，喜欢购物和旅行，懂穿搭。', mbti: 'ESFP', quadrant: 'explorer', city: '广州', height: 162, education: '本科', occupation: '跨境电商', income: 15 },
  { username: 'tina', nickname: 'Tina', age: 26, gender: 'female', bio: '94年大连女孩，海归硕士，性格开放包容，喜欢油画和钢琴。', mbti: 'INFP', quadrant: 'artist', city: '大连', height: 166, education: '硕士', occupation: '艺术策展', income: 25 },
  { username: 'una', nickname: 'Una', age: 25, gender: 'female', bio: '95年昆明姑娘，导游，性格热情大方，喜欢四处奔走看世界，待人友善。', mbti: 'ENFJ', quadrant: 'explorer', city: '昆明', height: 163, education: '本科', occupation: '导游', income: 12 },
  { username: 'vivian', nickname: 'Vivian', age: 28, gender: 'female', bio: '92年厦门女孩，建筑设计师，性格独立理性，喜欢挑战和创新。', mbti: 'INTP', quadrant: 'philosopher', city: '厦门', height: 164, education: '硕士', occupation: '建筑设计师', income: 38 },
  { username: 'wendy', nickname: 'Wendy', age: 26, gender: 'female', bio: '94年郑州姑娘，空姐，性格开朗健谈，走过很多城市，见多识广。', mbti: 'ESTJ', quadrant: 'builder', city: '郑州', height: 167, education: '本科', occupation: '空乘', income: 22 },
  { username: 'xena', nickname: 'Xena', age: 27, gender: 'female', bio: '93年东莞姐姐，创业者，性格坚韧不拔，喜欢挑战自我，热爱健身和跑步。', mbti: 'ENTJ', quadrant: 'builder', city: '东莞', height: 164, education: '本科', occupation: '创业者', income: 30 },
  { username: 'yuki', nickname: 'Yuki', age: 24, gender: 'female', bio: '96年沈阳萌妹，游戏原画师，性格可爱活泼，喜欢二次元和画画。', mbti: 'ISFP', quadrant: 'artist', city: '沈阳', height: 158, education: '本科', occupation: '游戏原画', income: 12 },
  { username: 'zoey', nickname: 'Zoey', age: 29, gender: 'female', bio: '91年上海女强人，投资总监，性格果断干练，职场精英，喜欢品酒和高尔夫。', mbti: 'INTJ', quadrant: 'philosopher', city: '上海', height: 166, education: '硕士', occupation: '投资总监', income: 60 },
  { username: 'bella', nickname: 'Bella', age: 25, gender: 'female', bio: '95年福州女孩，幼教老师，性格温柔有爱，喜欢小朋友和手工。', mbti: 'ENFJ', quadrant: 'artist', city: '福州', height: 162, education: '本科', occupation: '幼教老师', income: 10 },
  { username: 'cathy', nickname: 'Cathy', age: 27, gender: 'female', bio: '93年济南姑娘，杂志编辑，性格文艺小资，喜欢看书、喝咖啡和逛展。', mbti: 'INFJ', quadrant: 'philosopher', city: '济南', height: 164, education: '硕士', occupation: '杂志编辑', income: 20 },
  { username: 'diana', nickname: 'Diana', age: 26, gender: 'female', bio: '94年石家庄女孩，药剂学博士，性格稳重细心，热爱科研，生活简单。', mbti: 'ISTJ', quadrant: 'builder', city: '石家庄', height: 163, education: '博士', occupation: '药剂师', income: 28 },

  // Male 25
  { username: 'alex', nickname: 'Alex', age: 28, gender: 'male', bio: '92年北京小伙，软件工程师，性格沉稳内敛，喜欢编程和音乐，热爱技术钻研。希望找到能理解程序员世界的她。', mbti: 'INTP', quadrant: 'philosopher', city: '北京', height: 175, education: '本科', occupation: '软件工程师', income: 30 },
  { username: 'brad', nickname: 'Brad', age: 30, gender: 'male', bio: '90年上海男士，产品经理，性格成熟稳重，善于沟通协调，喜欢管理类书籍。希望找到有共同语言的伴侣。', mbti: 'ENTJ', quadrant: 'builder', city: '上海', height: 178, education: '硕士', occupation: '产品经理', income: 45 },
  { username: 'chris', nickname: 'Chris', age: 27, gender: 'male', bio: '93年广州帅哥，健身教练，性格阳光开朗，热爱运动，喜欢跑步和游泳。希望找到爱运动的她。', mbti: 'ESFP', quadrant: 'explorer', city: '广州', height: 180, education: '本科', occupation: '健身教练', income: 18 },
  { username: 'daniel', nickname: 'Daniel', age: 26, gender: 'male', bio: '94年深圳男孩，律师，性格理性冷静，喜欢辩论和阅读法律类书籍。希望找到聪明睿智的她。', mbti: 'INTJ', quadrant: 'philosopher', city: '深圳', height: 176, education: '硕士', occupation: '律师', income: 35 },
  { username: 'eric', nickname: 'Eric', age: 29, gender: 'male', bio: '91年成都哥，厨师，性格热情好客，喜欢做川菜，待人真诚。希望找到爱吃美食的她。', mbti: 'ESFJ', quadrant: 'artist', city: '成都', height: 172, education: '本科', occupation: '厨师', income: 20 },
  { username: 'felix', nickname: 'Felix', age: 25, gender: 'male', bio: '95年武汉小哥，自媒体博主，性格有趣幽默，喜欢拍视频和直播。希望找到能一起创作的她。', mbti: 'ENFP', quadrant: 'explorer', city: '武汉', height: 174, education: '本科', occupation: '自媒体博主', income: 15 },
  { username: 'george', nickname: 'George', age: 31, gender: 'male', bio: '89年南京男士，创业者，性格坚毅果敢，喜欢挑战商业极限。希望找到能共同奋斗的她。', mbti: 'ENTJ', quadrant: 'builder', city: '南京', height: 177, education: '硕士', occupation: '创业者', income: 50 },
  { username: 'henry', nickname: 'Henry', age: 27, gender: 'male', bio: '93年西安男士，摄影师，性格艺术气质，喜欢捕捉生活中的美好瞬间。希望找到懂艺术审美的她。', mbti: 'INFP', quadrant: 'artist', city: '西安', height: 175, education: '本科', occupation: '摄影师', income: 22 },
  { username: 'ian', nickname: 'Ian', age: 28, gender: 'male', bio: '92年重庆帅哥，房产销售，性格健谈热情，熟悉重庆房产市场。希望找到顾家的她。', mbti: 'ESTJ', quadrant: 'builder', city: '重庆', height: 173, education: '本科', occupation: '房产销售', income: 25 },
  { username: 'jack', nickname: 'Jack', age: 26, gender: 'male', bio: '94年天津小哥，金融交易员，性格冷静理性，喜欢研究市场走势。希望找到理性独立的她。', mbti: 'INTJ', quadrant: 'philosopher', city: '天津', height: 176, education: '硕士', occupation: '金融交易员', income: 40 },
  { username: 'kevin', nickname: 'Kevin', age: 29, gender: 'male', bio: '91年青岛男士，医生，性格细心负责，救死扶伤是神圣职业。希望找到善良有爱心的她。', mbti: 'ISFJ', quadrant: 'builder', city: '青岛', height: 178, education: '硕士', occupation: '医生', income: 38 },
  { username: 'leo', nickname: 'Leo', age: 25, gender: 'male', bio: '95年长沙小哥，消防员，性格勇敢无畏，保护人民安全。希望找到理解他工作的她。', mbti: 'ISTJ', quadrant: 'builder', city: '长沙', height: 180, education: '本科', occupation: '消防员', income: 15 },
  { username: 'mike', nickname: 'Mike', age: 27, gender: 'male', bio: '93年哈尔滨男士，咖啡师，性格温和细腻，手冲咖啡是一绝。希望找到同样热爱生活的她。', mbti: 'ISFP', quadrant: 'artist', city: '哈尔滨', height: 174, education: '本科', occupation: '咖啡师', income: 12 },
  { username: 'nick', nickname: 'Nick', age: 30, gender: 'male', bio: '90年杭州男士，高校教师，性格儒雅博学，喜欢学术研究。希望找到有内涵的她。', mbti: 'INFJ', quadrant: 'philosopher', city: '杭州', height: 176, education: '博士', occupation: '高校教师', income: 20 },
  { username: 'oscar', nickname: 'Oscar', age: 26, gender: 'male', bio: '94年苏州男孩，室内设计师，性格审美在线，喜欢创意设计。希望找到有品味的她。', mbti: 'ENFP', quadrant: 'artist', city: '苏州', height: 175, education: '本科', occupation: '室内设计师', income: 18 },
  { username: 'peter', nickname: 'Peter', age: 28, gender: 'male', bio: '92年厦门男士，船长，性格豁达开朗，喜欢航海和户外运动。希望找到热爱自然的她。', mbti: 'ESFP', quadrant: 'explorer', city: '厦门', height: 179, education: '本科', occupation: '船长', income: 28 },
  { username: 'quincy', nickname: 'Quincy', age: 27, gender: 'male', bio: '93年昆明兄弟，野生动物保护员，性格热爱自然，喜欢动物。希望找到同样热爱环保的她。', mbti: 'INFP', quadrant: 'artist', city: '昆明', height: 174, education: '本科', occupation: '野生动物保护', income: 14 },
  { username: 'ryan', nickname: 'Ryan', age: 29, gender: 'male', bio: '91年济南男士，销售总监，性格善谈交际，喜欢拓展人脉。希望找到善于社交的她。', mbti: 'ENFJ', quadrant: 'builder', city: '济南', height: 177, education: '本科', occupation: '销售总监', income: 42 },
  { username: 'steve', nickname: 'Steve', age: 31, gender: 'male', bio: '89年石家庄男士，物流经理，性格务实高效，喜欢物流行业。希望找到踏实稳重的她。', mbti: 'ESTJ', quadrant: 'builder', city: '石家庄', height: 175, education: '本科', occupation: '物流经理', income: 32 },
  { username: 'tony', nickname: 'Tony', age: 26, gender: 'male', bio: '94年东莞小哥，模具工程师，性格技术宅，喜欢钻研技术。希望找到能理解他专注的她。', mbti: 'ISTP', quadrant: 'builder', city: '东莞', height: 173, education: '本科', occupation: '模具工程师', income: 20 },
  { username: 'ulysses', nickname: 'Ulysses', age: 28, gender: 'male', bio: '92年沈阳男士，文物修复师，性格沉静专注，热爱传统文化。希望找到有文化底蕴的她。', mbti: 'INTJ', quadrant: 'philosopher', city: '沈阳', height: 176, education: '硕士', occupation: '文物修复师', income: 25 },
  { username: 'victor', nickname: 'Victor', age: 30, gender: 'male', bio: '90年上海男士，投资人，性格眼光精准，喜欢价值投资。希望找到有智慧的她。', mbti: 'INTJ', quadrant: 'philosopher', city: '上海', height: 178, education: '硕士', occupation: '投资人', income: 60 },
  { username: 'walter', nickname: 'Walter', age: 27, gender: 'male', bio: '93年福州男孩，茶叶商人，性格温和儒雅，热爱茶文化。希望找到喜欢品茶的她。', mbti: 'INFJ', quadrant: 'artist', city: '福州', height: 175, education: '本科', occupation: '茶叶商人', income: 22 },
  { username: 'xavier', nickname: 'Xavier', age: 29, gender: 'male', bio: '91年郑州男士，游戏策划，性格创意无限，喜欢游戏行业。希望找到爱玩游戏的她。', mbti: 'ENFP', quadrant: 'explorer', city: '郑州', height: 177, education: '本科', occupation: '游戏策划', income: 30 },
  { username: 'yuri', nickname: 'Yuri', age: 26, gender: 'male', bio: '94年南昌兄弟，记者，性格好奇心强，喜欢四处采访。希望找到有见解的她。', mbti: 'ENTP', quadrant: 'explorer', city: '南昌', height: 174, education: '本科', occupation: '记者', income: 16 },
];

const hash = '4ec166f198ea354b6ef15f12d8dbdfc06a149c4eedb1557c0e198b9887910288e0532b5cde38af8bb67d24306838bc8797001554d5427998d09d33e64fba4eb8';

async function addUsers() {
  let count = 0;
  for (const u of newUsers) {
    try {
      await pool.query(`
        INSERT INTO users (id, username, password_hash, nickname, age, gender, avatar_url, bio, mbti, soul_quadrant, soul_score, user_tier, is_verified, profile_completed, ai_description, created_at, city, height, education, occupation, annual_income, has_house, has_car, purpose, mode, values_json, interests_json, password_salt, match_count, activity_score)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ordinary', true, true, '', NOW(), $12, $13, $14, $15, $16, false, false, '恋爱', '认真', '[]', '[]', '', 0, 50)
      `, [crypto.randomUUID(), u.username, hash, u.nickname, u.age, u.gender, avatarUrl(u.username), u.bio, u.mbti, u.quadrant, Math.floor(Math.random() * 40) + 50, u.city, u.height, u.education, u.occupation, u.income]);
      console.log('Added:', u.nickname, '(' + u.gender + ')');
      count++;
    } catch (e) {
      console.error('Error adding', u.username, ':', e.message);
    }
  }
  console.log('\nTotal added:', count, 'users');
  await pool.end();
}

addUsers().catch(console.error);