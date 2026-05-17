const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({ user: 'postgres', password: 'SoulQuad2024!', host: 'localhost', database: 'soulquad' });

const avatarUrl = (seed) => 'https://api.dicebear.com/7.x/avataaars/png?seed=' + seed;

// Beautiful woman image URLs (using picsum for demo)
const womanImages = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop',
];

// 10 new moments
const moments = [
  // 5 moments with images (women users)
  { username: 'luna', content: '今天阳光真好，和闺蜜一起去了网红咖啡店拍照打卡。这家的拿铁拉花超美，味道也很棒！推荐给喜欢拍照的小姐姐们~', location: '成都', images: [womanImages[0]] },
  { username: 'sophia', content: '周末瑜伽课后拍的，感觉整个人都放松下来了。瑜伽真的能让心情变好，推荐大家试试！', location: '杭州', images: [womanImages[1]] },
  { username: 'crystal', content: '健身三个月对比图，坚持真的会有回报的！从最开始跑两步就喘，到现在能跑完5公里，感觉自己棒棒的~', location: '深圳', images: [womanImages[2]] },
  { username: 'grace', content: '今天的穿搭分享，春天就是要穿亮色系呀！这件黄色连衣裙是在韩国代购的，很显白哦~', location: '南京', images: [womanImages[3]] },
  { username: 'zoey', content: '刚做完头发护理，给大家看看对比效果。养发真的很重要，头发顺滑了整个人的气质都提升了！', location: '上海', images: [womanImages[4]] },

  // 5 moments without images (mix of users)
  { username: 'alex', content: '今天完成了项目代码review，学到了很多优化技巧。团队协作真的很重要，每个人都有自己的长处。', location: '北京', images: [] },
  { username: 'amy', content: '今天学生们的期末演出圆满结束，看着他们从不敢上台到自信表演，真的很有成就感。当老师最大的幸福就是这个时刻。', location: '武汉', images: [] },
  { username: 'nancy', content: '周末读了《原子习惯》这本书，感触很深。想要改变人生，就要从每天的小习惯开始。分享给大家：习惯改变命运。', location: '北京', images: [] },
  { username: 'daniel', content: '今天在法院开庭，案子终于有了结果。当律师最有成就感的时刻就是为当事人争取到合法权益。继续努力！', location: '深圳', images: [] },
  { username: 'peggy', content: '今天收到小患者的家长送来的锦旗，医者仁心，这份认可比什么都重要。继续做一个有温度的儿科医生！', location: '青岛', images: [] },
];

async function addMoments() {
  let count = 0;
  for (const m of moments) {
    try {
      // Get user id
      const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [m.username]);
      if (userResult.rows.length === 0) {
        console.log('User not found:', m.username);
        continue;
      }
      const userId = userResult.rows[0].id;
      const momentId = crypto.randomUUID();
      const imagesJson = JSON.stringify(m.images);
      const now = new Date().toISOString();

      await pool.query(`
        INSERT INTO moments (id, user_id, content, images_json, video_url, location, is_anonymous, anonymous_name, created_at, like_count, comment_count, share_count)
        VALUES ($1, $2, $3, $4, '', $5, false, '', $6, 0, 0, 0)
      `, [momentId, userId, m.content, imagesJson, m.location, now]);

      console.log('Added moment:', m.username, '-', m.content.substring(0, 30) + '...');
      count++;
    } catch (e) {
      console.error('Error adding moment:', e.message);
    }
  }
  console.log('\nTotal moments added:', count);
  await pool.end();
}

addMoments().catch(console.error);