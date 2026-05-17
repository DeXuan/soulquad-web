import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import { query, get } from '../db/database.js';
import { authMiddleware } from './auth.js';
import { MBTI_TYPES, QUADRANT_INFO } from './mbti-data.js';

export const aiRoutes = Router();

aiRoutes.use(authMiddleware);

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || ''
});

aiRoutes.post('/soul-description', async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const user = await get('SELECT * FROM users WHERE id = $1', [userId]);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.mbti || !user.soul_quadrant) {
      return res.status(400).json({ error: 'Please complete soul test first' });
    }

    const mbtiInfo = MBTI_TYPES[user.mbti] || { name: '未知', description: '' };
    const quadrantInfo = QUADRANT_INFO[user.soul_quadrant] || { name: '未知', emoji: '' };
    const values = typeof user.values_json === 'string' ? JSON.parse(user.values_json || '[]') : (user.values_json || []);
    const interests = typeof user.interests_json === 'string' ? JSON.parse(user.interests_json || '[]') : (user.interests_json || []);

    if (!process.env.ANTHROPIC_API_KEY) {
      const mockDescription = generateMockDescription(user, mbtiInfo, quadrantInfo, values, interests);
      await query('UPDATE users SET ai_description = $1 WHERE id = $2', [mockDescription.description, userId]);
      return res.json(mockDescription);
    }

    try {
      const prompt = `你是一个专业的性格分析师。请为以下用户生成一份个性化的灵魂描述：

用户信息：
- MBTI性格类型：${user.mbti} (${mbtiInfo.name})
- 性格描述：${mbtiInfo.description}
- 灵魂象限：${quadrantInfo.emoji} ${quadrantInfo.name}
- 价值观：${values.join('、') || '未设置'}
- 兴趣爱好：${interests.join('、') || '未设置'}
- 性别：${user.gender === 'male' ? '男' : user.gender === 'female' ? '女' : '其他'}
- 年龄：${user.age || '未设置'}

请生成一份温暖、有深度的灵魂解读，包含：
1. 灵魂特质（50字左右）
2. 理想伴侣特征（60字左右）
3. 相处建议（50字左右）

请用中文回复，格式如下：
{"traits": "...", "idealPartner": "...", "advice": "..."}`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        result = {
          traits: responseText.slice(0, 50),
          idealPartner: responseText.slice(50, 110),
          advice: responseText.slice(110, 160)
        };
      }

      const fullDescription = `【灵魂特质】${result.traits}\n\n【理想伴侣】${result.idealPartner}\n\n【相处建议】${result.advice}`;

      await query('UPDATE users SET ai_description = $1 WHERE id = $2', [fullDescription, userId]);

      res.json({
        description: fullDescription,
        traits: result.traits,
        idealPartner: result.idealPartner,
        advice: result.advice
      });
    } catch (error) {
      console.error('AI API error:', error);
      const mockDescription = generateMockDescription(user, mbtiInfo, quadrantInfo, values, interests);
      await query('UPDATE users SET ai_description = $1 WHERE id = $2', [mockDescription.description, userId]);
      res.json(mockDescription);
    }
  } catch (err) {
    console.error('Soul description error:', err);
    res.status(500).json({ error: 'Failed to generate description' });
  }
});

function generateMockDescription(user, mbtiInfo, quadrantInfo, values, interests) {
  const descriptions = {
    explorer: {
      traits: '你是一个天生的探险家，热爱自由，喜欢尝试新事物。你的生活充满了色彩和惊喜。',
      idealPartner: '寻找一个能够理解你对自由的渴望、愿意陪你一起探索世界的伴侣。',
      advice: '给彼此足够的空间，一起规划旅行和冒险，会让关系更加亲密。'
    },
    builder: {
      traits: '你踏实稳重，注重实际，善于规划和组织。你是值得信赖的依靠。',
      idealPartner: '欣赏你的稳定性，能够理解你对秩序的需求的人。',
      advice: '学会欣赏过程中的小惊喜，不要只专注于结果。'
    },
    artist: {
      traits: '你情感丰富，追求美和独特的表达方式。你有着独特的审美和创造力。',
      idealPartner: '能够欣赏你的艺术气质，理解你内心深处情感的人。',
      advice: '找到一个能够与你产生情感共鸣的伴侣很重要。'
    },
    philosopher: {
      traits: '你善于思考，追求深度和真理。你对生活有独特的洞察力。',
      idealPartner: '能够与你进行深度对话，支持你思考的人。',
      advice: '有时候行动比思考更重要，试着活在当下。'
    }
  };

  const desc = descriptions[user.soul_quadrant] || descriptions.philosopher;

  return {
    description: `【灵魂特质】${desc.traits}\n\n【理想伴侣】${desc.idealPartner}\n\n【相处建议】${desc.advice}`,
    traits: desc.traits,
    idealPartner: desc.idealPartner,
    advice: desc.advice
  };
}