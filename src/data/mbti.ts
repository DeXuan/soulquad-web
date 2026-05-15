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
  },
  {
    id: 13,
    question: "当别人提出批评时，你更可能：",
    optionA: { text: "分析批评是否合理", type: "T" },
    optionB: { text: "体会批评背后的情绪", type: "F" }
  },
  {
    id: 14,
    question: "你通常更喜欢：",
    optionA: { text: "按照计划安排时间", type: "J" },
    optionB: { text: "随遇而安，保持弹性", type: "P" }
  },
  {
    id: 15,
    question: "你更擅长：",
    optionA: { text: "处理眼前的实际问题", type: "S" },
    optionB: { text: "发现新的可能与创意", type: "N" }
  },
  {
    id: 16,
    question: "在亲密关系中，你更倾向于：",
    optionA: { text: "直接说出你的需求", type: "E" },
    optionB: { text: "通过关心表达你的情感", type: "I" }
  },
  {
    id: 17,
    question: "你更享受哪种旅行方式：",
    optionA: { text: "攻略详细的观光行程", type: "J" },
    optionB: { text: "说走就走的自由之旅", type: "P" }
  },
  {
    id: 18,
    question: "当需要做重大决定时，你更依赖：",
    optionA: { text: "深入的分析和推理", type: "T" },
    optionB: { text: "内心的直觉和感受", type: "F" }
  },
  {
    id: 19,
    question: "你更喜欢什么样的工作环境：",
    optionA: { text: "安静独立的空间", type: "I" },
    optionB: { text: "热闹有互动的氛围", type: "E" }
  },
  {
    id: 20,
    question: "阅读时你更偏爱：",
    optionA: { text: "纪实类和知识性内容", type: "S" },
    optionB: { text: "科幻小说和奇幻故事", type: "N" }
  },
  {
    id: 21,
    question: "面对规则时，你通常会：",
    optionA: { text: "严格遵守既定规则", type: "J" },
    optionB: { text: "根据情况灵活变通", type: "P" }
  },
  {
    id: 22,
    question: "你更容易被什么吸引：",
    optionA: { text: "优美的文字和表达", type: "N" },
    optionB: { text: "真实的数据和事实", type: "S" }
  },
  {
    id: 23,
    question: "与朋友发生分歧时，你通常会：",
    optionA: { text: "理性讨论找出解决方案", type: "T" },
    optionB: { text: "换位思考维护和谐关系", type: "F" }
  },
  {
    id: 24,
    question: "空闲时间你更想：",
    optionA: { text: "学习提升自己", type: "I" },
    optionB: { text: "和朋友一起出去玩", type: "E" }
  },
  {
    id: 25,
    question: "你更喜欢的生活节奏是：",
    optionA: { text: "规律稳定的日常", type: "J" },
    optionB: { text: "充满变化和惊喜", type: "P" }
  },
  {
    id: 26,
    question: "当你面对压力时，你倾向于：",
    optionA: { text: "制定计划逐步解决", type: "J" },
    optionB: { text: "随遇而安顺其自然", type: "P" }
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
