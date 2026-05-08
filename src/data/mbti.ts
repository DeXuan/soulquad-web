import { MBTI, SoulQuadrant } from '../types';

export interface MBTIQuestion {
  id: number;
  question: string;
  optionA: { text: string; type: string };
  optionB: { text: string; type: string };
}

export const MBTI_QUESTIONS: MBTIQuestion[] = [
  {
    id: 1,
    question: "在社交场合中，你通常会：",
    optionA: { text: "主动与陌生人交谈", type: "E" },
    optionB: { text: "等待别人来接近你", type: "I" }
  },
  {
    id: 2,
    question: "你更倾向于：",
    optionA: { text: "关注现实和当下", type: "S" },
    optionB: { text: "思考未来的可能性", type: "N" }
  },
  {
    id: 3,
    question: "在做决定时，你更看重：",
    optionA: { text: "逻辑和客观因素", type: "T" },
    optionB: { text: "他人感受和影响", type: "F" }
  },
  {
    id: 4,
    question: "你的生活方式更喜欢：",
    optionA: { text: "有计划、有组织", type: "J" },
    optionB: { text: "灵活随性、顺其自然", type: "P" }
  },
  {
    id: 5,
    question: "周末你更想：",
    optionA: { text: "参加聚会或社交活动", type: "E" },
    optionB: { text: "独自在家看书或休息", type: "I" }
  },
  {
    id: 6,
    question: "当你学习新事物时，你喜欢：",
    optionA: { text: "具体实用的方法", type: "S" },
    optionB: { text: "理论和概念探索", type: "N" }
  },
  {
    id: 7,
    question: "你容易被什么打动：",
    optionA: { text: "有力度的论证", type: "T" },
    optionB: { text: "情感化的故事", type: "F" }
  },
  {
    id: 8,
    question: "你更喜欢：",
    optionA: { text: "按照计划行事", type: "J" },
    optionB: { text: "保持开放选择", type: "P" }
  },
  {
    id: 9,
    question: "在工作中，你喜欢：",
    optionA: { text: "与多人合作交流", type: "E" },
    optionB: { text: "独立专注完成", type: "I" }
  },
  {
    id: 10,
    question: "你更关注：",
    optionA: { text: "实际发生的事", type: "S" },
    optionB: { text: "潜在的可能性", type: "N" }
  },
  {
    id: 11,
    question: "你认为公正应该是：",
    optionA: { text: "一视同仁的原则", type: "T" },
    optionB: { text: "因人而异的关怀", type: "F" }
  },
  {
    id: 12,
    question: "你倾向于：",
    optionA: { text: "按时完成任务", type: "J" },
    optionB: { text: "最后时刻再处理", type: "P" }
  }
];

export const MBTI_TYPES: Record<string, { name: string; description: string; quadrant: SoulQuadrant }> = {
  'INTJ': { name: '思想家', description: '善于分析、追求完美的理想主义者', quadrant: 'philosopher' },
  'INTP': { name: '哲学家', description: '逻辑性强、好奇心旺盛的思考者', quadrant: 'philosopher' },
  'ENTJ': { name: '指挥官', description: '天生领导者、果断决策者', quadrant: 'explorer' },
  'ENTP': { name: '辩论家', description: '思维敏捷、创意思维的发明家', quadrant: 'explorer' },
  'INFJ': { name: '倡导者', description: '理想主义、富有同理心的引路人', quadrant: 'philosopher' },
  'INFP': { name: '调停者', description: '诗意善良、追求真实的梦想家', quadrant: 'artist' },
  'ENFJ': { name: '主人公', description: '魅力四射、激励他人的领袖', quadrant: 'explorer' },
  'ENFP': { name: '竞选者', description: '热情洋溢、充满可能性的探险家', quadrant: 'explorer' },
  'ISTJ': { name: '物流师', description: '责任心强、踏实可靠的守护者', quadrant: 'builder' },
  'ISFJ': { name: '守护者', description: '温暖体贴、默默奉献的照顾者', quadrant: 'builder' },
  'ESTJ': { name: '总经理', description: '高效务实、注重秩序的管理者', quadrant: 'builder' },
  'ESFJ': { name: '执政官', description: '热情友好、重视和谐的社交者', quadrant: 'builder' },
  'ISTP': { name: '鉴赏家', description: '大胆实际、动手能力强的探索者', quadrant: 'explorer' },
  'ISFP': { name: '艺术家', description: '灵活敏捷、追求独特的创作者', quadrant: 'artist' },
  'ESTP': { name: '企业家', description: '精力充沛、享受当下的行动派', quadrant: 'explorer' },
  'ESFP': { name: '表演者', description: '富有感染力、热爱生活的娱乐者', quadrant: 'artist' }
};

export const QUADRANT_INFO: Record<SoulQuadrant, { name: string; emoji: string; description: string }> = {
  'explorer': {
    name: '探险家',
    emoji: '🚀',
    description: '勇于尝试、追求刺激、热爱冒险'
  },
  'builder': {
    name: '建造者',
    emoji: '🏗️',
    description: '踏实稳定、注重实际、善于规划'
  },
  'artist': {
    name: '艺术家',
    emoji: '🎨',
    description: '追求美感、情感丰富、富有创造力'
  },
  'philosopher': {
    name: '思想家',
    emoji: '🤔',
    description: '热爱思考、追求真理、理想主义'
  }
};

export const VALUES = [
  '真诚', '自由', '成长', '安全感', '成就感',
  '爱', '快乐', '责任', '探索', '传统'
];

export const INTERESTS = [
  '阅读', '旅行', '音乐', '运动', '美食',
  '电影', '摄影', '艺术', '科技', '户外',
  '编程', '游戏', '健身', '时尚', '冥想'
];

export function calculateMBTI(answers: string[]): MBTI {
  let e = 0, i = 0, s = 0, n = 0, t = 0, f = 0, j = 0, p = 0;

  answers.forEach((answer, index) => {
    const q = MBTI_QUESTIONS[index];
    if (!q) return;

    if (answer === 'A') {
      if (q.optionA.type === 'E') e++;
      else if (q.optionA.type === 'S') s++;
      else if (q.optionA.type === 'T') t++;
      else if (q.optionA.type === 'J') j++;
    } else {
      if (q.optionB.type === 'I') i++;
      else if (q.optionB.type === 'N') n++;
      else if (q.optionB.type === 'F') f++;
      else if (q.optionB.type === 'P') p++;
    }
  });

  const mbti =
    (e > i ? 'E' : 'I') +
    (s > n ? 'S' : 'N') +
    (t > f ? 'T' : 'F') +
    (j > p ? 'J' : 'P');

  return mbti as MBTI;
}

export function getSoulQuadrant(mbti: MBTI): SoulQuadrant {
  const info = MBTI_TYPES[mbti];
  return info?.quadrant || 'philosopher';
}

export function calculateSoulCompatibility(mbtiA: MBTI, mbtiB: MBTI): number {
  let matches = 0;
  for (let i = 0; i < 4; i++) {
    if (mbtiA[i] === mbtiB[i]) matches++;
  }
  return (matches / 4) * 100;
}
