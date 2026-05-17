const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ user: 'postgres', password: 'SoulQuad2024!', host: 'localhost', database: 'soulquad' });

const avatarUrl = (seed) => 'https://api.dicebear.com/7.x/avataaars/png?seed=' + seed;

const hash = '4ec166f198ea354b6ef15f12d8dbdfc06a149c4eedb1557c0e198b9887910288e0532b5cde38af8bb67d24306838bc8797001554d5427998d09d33e64fba4eb8';

const newUsers = [
  // Female 25 more (with _f suffix)
  { username: 'emma_f', nickname: 'Emma', age: 24, gender: 'female', bio: '96年广州女孩，宠物美容师，性格温柔可爱，喜欢小动物，待人友善。希望找到同样爱护小动物的他。', mbti: 'ENFP', quadrant: 'artist', city: '广州', height: 158, education: '本科', occupation: '宠物美容师', income: 10 },
  { username: 'fiona_f', nickname: 'Fiona', age: 26, gender: 'female', bio: '94年成都姑娘，瑜伽教练，性格平和宁静，热爱瑜伽和冥想。希望找到内心平静的他。', mbti: 'INFJ', quadrant: 'artist', city: '成都', height: 163, education: '本科', occupation: '瑜伽教练', income: 15 },
  { username: 'gina_f', nickname: 'Gina', age: 27, gender: 'female', bio: '93年深圳姐姐，物流主管，性格干练果断，喜欢高效做事。希望找到效率至上、工作认真的他。', mbti: 'ESTJ', quadrant: 'builder', city: '深圳', height: 164, education: '本科', occupation: '物流主管', income: 28 },
  { username: 'helen_f', nickname: 'Helen', age: 25, gender: 'female', bio: '95年杭州女孩，外贸业务员，性格开朗活泼，喜欢和不同国家的人交流。', mbti: 'ESFP', quadrant: 'explorer', city: '杭州', height: 162, education: '本科', occupation: '外贸业务员', income: 12 },
  { username: 'iris_f', nickname: 'Iris2', age: 24, gender: 'female', bio: '98年上海小姑娘，网店店主，性格独立自主，喜欢自由职业的生活。', mbti: 'ENTP', quadrant: 'explorer', city: '上海', height: 160, education: '本科', occupation: '网店店主', income: 18 },
  { username: 'julia_f', nickname: 'Julia', age: 28, gender: 'female', bio: '92年北京姐姐，审计师，性格细致严谨，喜欢分析数字。希望找到严谨可靠的他。', mbti: 'ISTJ', quadrant: 'builder', city: '北京', height: 165, education: '硕士', occupation: '审计师', income: 32 },
  { username: 'karen_f', nickname: 'Karen', age: 26, gender: 'female', bio: '94年南京姑娘，文案策划，性格创意无限，喜欢用文字表达思想。', mbti: 'INFP', quadrant: 'artist', city: '南京', height: 163, education: '本科', occupation: '文案策划', income: 14 },
  { username: 'lisa_f', nickname: 'Lisa', age: 23, gender: 'female', bio: '97年武汉女孩，大四学生，性格充满活力，对未来充满期待。希望找到一个能共同成长的他。', mbti: 'ENFP', quadrant: 'explorer', city: '武汉', height: 161, education: '本科', occupation: '学生', income: 5 },
  { username: 'mary_f', nickname: 'Mary', age: 27, gender: 'female', bio: '93年西安小姐姐，插画师，性格浪漫细腻，喜欢用画笔记录生活。', mbti: 'ISFP', quadrant: 'artist', city: '西安', height: 162, education: '本科', occupation: '插画师', income: 16 },
  { username: 'nana_f', nickname: 'Nana', age: 29, gender: 'female', bio: '91年重庆女孩，餐厅老板，性格热情好客，喜欢烹饪和招待客人。', mbti: 'ESFJ', quadrant: 'builder', city: '重庆', height: 164, education: '本科', occupation: '餐厅老板', income: 25 },
  { username: 'oops_f', nickname: 'Oops', age: 25, gender: 'female', bio: '95年天津女孩，运营专员，性格机灵古怪，总是有些出其不意的想法。', mbti: 'ENTP', quadrant: 'explorer', city: '天津', height: 161, education: '本科', occupation: '运营专员', income: 12 },
  { username: 'patty_f', nickname: 'Patty', age: 26, gender: 'female', bio: '94年青岛姑娘，婚礼策划，性格浪漫梦幻，喜欢策划完美婚礼。', mbti: 'ENFJ', quadrant: 'artist', city: '青岛', height: 163, education: '本科', occupation: '婚礼策划', income: 18 },
  { username: 'queen_f', nickname: 'Queen2', age: 28, gender: 'female', bio: '92年长沙姐姐，时尚博主，性格走在潮流前线，喜欢分享穿搭心得。', mbti: 'ESFP', quadrant: 'explorer', city: '长沙', height: 164, education: '本科', occupation: '时尚博主', income: 22 },
  { username: 'rose_f', nickname: 'Rose', age: 24, gender: 'female', bio: '96年哈尔滨女孩，花艺师，性格温柔细腻，喜欢用鲜花装点生活。', mbti: 'ISFP', quadrant: 'artist', city: '哈尔滨', height: 162, education: '本科', occupation: '花艺师', income: 10 },
  { username: 'sasa_f', nickname: 'Sasa', age: 27, gender: 'female', bio: '93年广州姑娘，美容顾问，性格追求完美，对美有独特见解。', mbti: 'ESTJ', quadrant: 'builder', city: '广州', height: 164, education: '本科', occupation: '美容顾问', income: 20 },
  { username: 'tutu_f', nickname: 'Tutu', age: 25, gender: 'female', bio: '95年成都女孩，图书管理员，性格文静内敛，喜欢安安静静看书。', mbti: 'INFJ', quadrant: 'philosopher', city: '成都', height: 160, education: '本科', occupation: '图书管理员', income: 10 },
  { username: 'ulia_f', nickname: 'Ulia', age: 26, gender: 'female', bio: '94年深圳姐姐，游戏运营，性格热爱游戏，喜欢ACG文化。', mbti: 'INTP', quadrant: 'philosopher', city: '深圳', height: 163, education: '本科', occupation: '游戏运营', income: 20 },
  { username: 'vivi_f', nickname: 'Vivi', age: 24, gender: 'female', bio: '96年杭州小姑娘，短视频博主，性格活泼可爱，喜欢展示才艺。', mbti: 'ESFP', quadrant: 'explorer', city: '杭州', height: 158, education: '本科', occupation: '短视频博主', income: 15 },
  { username: 'wing_f', nickname: 'Wing', age: 28, gender: 'female', bio: '92年厦门女孩，瑜伽老师，性格追求身心平衡，热爱冥想和自然。', mbti: 'INFP', quadrant: 'artist', city: '厦门', height: 165, education: '硕士', occupation: '瑜伽老师', income: 22 },
  { username: 'xixi_f', nickname: 'Xixi', age: 25, gender: 'female', bio: '95年苏州姑娘，绣娘，性格传统典雅，热爱传统手工艺。', mbti: 'ISFJ', quadrant: 'artist', city: '苏州', height: 162, education: '本科', occupation: '绣娘', income: 12 },
  { username: 'yaya_f', nickname: 'Yaya', age: 27, gender: 'female', bio: '93年重庆姐姐，导游，性格热情大方，喜欢介绍各地风景文化。', mbti: 'ENFJ', quadrant: 'explorer', city: '重庆', height: 164, education: '本科', occupation: '导游', income: 18 },
  { username: 'zoe_f', nickname: 'Zoe2', age: 26, gender: 'female', bio: '94年昆明女孩，摄影师，性格文艺清新，喜欢用镜头记录美好。', mbti: 'INFP', quadrant: 'artist', city: '昆明', height: 161, education: '本科', occupation: '摄影师', income: 16 },
  { username: 'ada_f', nickname: 'Ada', age: 29, gender: 'female', bio: '91年济南姐姐，投资顾问，性格理性专业，喜欢分析市场和投资。', mbti: 'INTJ', quadrant: 'philosopher', city: '济南', height: 166, education: '硕士', occupation: '投资顾问', income: 40 },
  { username: 'beth_f', nickname: 'Beth', age: 24, gender: 'female', bio: '96年大连女孩，航空乘务，性格开朗大方，走过很多城市和国家。', mbti: 'ESFP', quadrant: 'explorer', city: '大连', height: 168, education: '本科', occupation: '航空乘务', income: 20 },
  { username: 'cici_f', nickname: 'Cici', age: 26, gender: 'female', bio: '94年西安姑娘，甜品师，性格甜蜜温柔，喜欢做各种美味甜点。', mbti: 'ENFJ', quadrant: 'artist', city: '西安', height: 162, education: '本科', occupation: '甜品师', income: 14 },

  // Male 25 more (with _m suffix)
  { username: 'adam_m', nickname: 'Adam', age: 28, gender: 'male', bio: '92年北京男孩，土木工程师，性格稳重踏实，喜欢工程项目。希望找到能理解他工作的她。', mbti: 'ISTJ', quadrant: 'builder', city: '北京', height: 176, education: '本科', occupation: '土木工程师', income: 25 },
  { username: 'brian_m', nickname: 'Brian', age: 30, gender: 'male', bio: '90年上海男士，心理咨询师，性格温暖关怀，善于倾听和开导他人。', mbti: 'INFJ', quadrant: 'philosopher', city: '上海', height: 175, education: '硕士', occupation: '心理咨询师', income: 35 },
  { username: 'carl_m', nickname: 'Carl', age: 27, gender: 'male', bio: '93年广州小哥，空调维修，性格技术过硬，动手能力超强。希望找到能欣赏技术能力的她。', mbti: 'ISTP', quadrant: 'builder', city: '广州', height: 173, education: '本科', occupation: '空调维修', income: 18 },
  { username: 'derek_m', nickname: 'Derek', age: 29, gender: 'male', bio: '91年深圳男士，数据分析师，性格理性冷静，喜欢和数据打交道。希望找到聪明的她。', mbti: 'INTP', quadrant: 'philosopher', city: '深圳', height: 177, education: '硕士', occupation: '数据分析师', income: 32 },
  { username: 'evan_m', nickname: 'Evan', age: 26, gender: 'male', bio: '94年成都男孩，奶茶店老板，性格随和健谈，喜欢调制各种奶茶饮品。', mbti: 'ESFP', quadrant: 'artist', city: '成都', height: 174, education: '本科', occupation: '奶茶店老板', income: 16 },
  { username: 'frank_m', nickname: 'Frank2', age: 31, gender: 'male', bio: '89年南京男士，建筑师，性格追求设计美感，喜欢标志性建筑作品。', mbti: 'INTJ', quadrant: 'philosopher', city: '南京', height: 178, education: '硕士', occupation: '建筑师', income: 45 },
  { username: 'gavin_m', nickname: 'Gavin', age: 27, gender: 'male', bio: '93年武汉小哥，快递员，性格勤快务实，每天奔波在城市的大街小巷。', mbti: 'ESFJ', quadrant: 'builder', city: '武汉', height: 174, education: '本科', occupation: '快递员', income: 12 },
  { username: 'harry_m', nickname: 'Harry', age: 28, gender: 'male', bio: '92年西安男士，广告设计师，性格创意无限，喜欢视觉设计工作。', mbti: 'ENFP', quadrant: 'artist', city: '西安', height: 176, education: '本科', occupation: '广告设计师', income: 20 },
  { username: 'ivan_m', nickname: 'Ivan', age: 26, gender: 'male', bio: '94年重庆男孩，健身教练，性格阳光健康，热爱运动和健身。', mbti: 'ESTP', quadrant: 'explorer', city: '重庆', height: 180, education: '本科', occupation: '健身教练', income: 18 },
  { username: 'jimmy_m', nickname: 'Jimmy', age: 29, gender: 'male', bio: '91年天津男士，知识产权律师，性格严谨专业，保护创新和专利。', mbti: 'INTJ', quadrant: 'philosopher', city: '天津', height: 176, education: '硕士', occupation: '知识产权律师', income: 38 },
  { username: 'kyle_m', nickname: 'Kyle', age: 27, gender: 'male', bio: '93年青岛哥，外卖小哥，性格勤快老实，每天为生活奔波。', mbti: 'ISFP', quadrant: 'builder', city: '青岛', height: 174, education: '本科', occupation: '外卖小哥', income: 10 },
  { username: 'lucas_m', nickname: 'Lucas', age: 25, gender: 'male', bio: '95年长沙小哥，程序员，性格闷骚内向，喜欢加班写代码。希望找到能理解程序员的他。', mbti: 'INTP', quadrant: 'philosopher', city: '长沙', height: 175, education: '本科', occupation: '程序员', income: 22 },
  { username: 'mark_m', nickname: 'Mark', age: 28, gender: 'male', bio: '92年哈尔滨男士，剧本杀店主，性格社交达人，喜欢推理和角色扮演。', mbti: 'ENTP', quadrant: 'explorer', city: '哈尔滨', height: 177, education: '本科', occupation: '剧本杀店主', income: 20 },
  { username: 'noah_m', nickname: 'Noah', age: 30, gender: 'male', bio: '90年广州男士，家具设计师，性格匠心独运，喜欢手工制作家具。', mbti: 'INFP', quadrant: 'artist', city: '广州', height: 176, education: '本科', occupation: '家具设计师', income: 28 },
  { username: 'owen_m', nickname: 'Owen', age: 26, gender: 'male', bio: '94年杭州男孩，茶叶店老板，性格淡泊名利，热爱茶文化和慢生活。', mbti: 'ISFJ', quadrant: 'artist', city: '杭州', height: 174, education: '本科', occupation: '茶叶店老板', income: 15 },
  { username: 'paul_m', nickname: 'Paul', age: 29, gender: 'male', bio: '91年厦门男士，潜水教练，性格冒险刺激，喜欢探索海底世界。', mbti: 'ESFP', quadrant: 'explorer', city: '厦门', height: 178, education: '本科', occupation: '潜水教练', income: 25 },
  { username: 'quinn_m', nickname: 'Quinn', age: 27, gender: 'male', bio: '93年苏州男孩，调酒师，性格优雅神秘，喜欢调制各种鸡尾酒。', mbti: 'ISFP', quadrant: 'artist', city: '苏州', height: 175, education: '本科', occupation: '调酒师', income: 16 },
  { username: 'rex_m', nickname: 'Rex', age: 31, gender: 'male', bio: '89年郑州男士，工程监理，性格负责严格，对工程质量精益求精。', mbti: 'ESTJ', quadrant: 'builder', city: '郑州', height: 177, education: '本科', occupation: '工程监理', income: 30 },
  { username: 'sam_m', nickname: 'Sam2', age: 28, gender: 'male', bio: '92年东莞先生，模具设计师，性格精密细致，喜欢设计和制作精密模具。', mbti: 'ISTJ', quadrant: 'builder', city: '东莞', height: 175, education: '本科', occupation: '模具设计师', income: 24 },
  { username: 'tom_m', nickname: 'Tom', age: 26, gender: 'male', bio: '94年沈阳小哥，武术教练，性格刚强有力，热爱中国武术。', mbti: 'ISTP', quadrant: 'builder', city: '沈阳', height: 180, education: '本科', occupation: '武术教练', income: 18 },
  { username: 'uma_m', nickname: 'Uma', age: 29, gender: 'male', bio: '91年上海男士，赛车手，性格追求速度，喜欢赛车和极限运动。', mbti: 'ESTP', quadrant: 'explorer', city: '上海', height: 178, education: '本科', occupation: '赛车手', income: 35 },
  { username: 'vince_m', nickname: 'Vince', age: 27, gender: 'male', bio: '93年济南男孩，淘宝店主，性格灵活经营，喜欢电商行业。', mbti: 'ENTP', quadrant: 'explorer', city: '济南', height: 175, education: '本科', occupation: '淘宝店主', income: 20 },
  { username: 'wade_m', nickname: 'Wade', age: 30, gender: 'male', bio: '90年石家庄男士，煤矿工程师，性格稳重踏实，工作环境艰苦但收入不错。', mbti: 'ISTJ', quadrant: 'builder', city: '石家庄', height: 176, education: '本科', occupation: '煤矿工程师', income: 40 },
  { username: 'yale_m', nickname: 'Yale', age: 28, gender: 'male', bio: '92年南昌先生，书店老板，性格文艺安静，热爱阅读和写作。', mbti: 'INFJ', quadrant: 'philosopher', city: '南昌', height: 174, education: '本科', occupation: '书店老板', income: 14 },
  { username: 'zack_m', nickname: 'Zack', age: 26, gender: 'male', bio: '94年昆明兄弟，野外摄影师，性格热爱自然，喜欢记录野生动物。', mbti: 'ENFP', quadrant: 'explorer', city: '昆明', height: 177, education: '本科', occupation: '野外摄影师', income: 22 },
];

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
  console.log('\nTotal added this batch:', count, 'users');
  await pool.end();
}

addUsers().catch(console.error);