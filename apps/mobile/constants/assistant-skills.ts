import { Ionicons } from '@expo/vector-icons';

export type AssistantSkillId = 'vocab' | 'chat' | 'cooking' | 'news';

export type AssistantSkillItem = {
  id: AssistantSkillId;
  name: string;
  desc: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
};

type SkillConfigQuestion = {
  id: string;
  question: string;
  options: string[];
};

type SkillConfig = {
  title: string;
  questions: SkillConfigQuestion[];
};

export const ASSISTANT_SKILLS: AssistantSkillItem[] = [
  {
    id: 'vocab',
    icon: 'book-outline',
    name: '背单词',
    desc: '科学记忆，每天进步一点',
  },
  {
    id: 'chat',
    icon: 'chatbubble-ellipses-outline',
    name: '随便聊聊',
    desc: '随时陪你说说话',
  },
  {
    id: 'cooking',
    icon: 'restaurant-outline',
    name: '做饭助理',
    desc: '下厨更轻松，食谱随手得',
  },
  {
    id: 'news',
    icon: 'newspaper-outline',
    name: '看新闻',
    desc: '快速了解关注领域的动态',
  },
];

export const SKILL_CONFIGS: Record<AssistantSkillId, SkillConfig> = {
  vocab: {
    title: '背单词',
    questions: [
      {
        id: 'vocab-frequency',
        question: '多久和你背一次单词？',
        options: ['每天', '每周', '自定义...'],
      },
    ],
  },
  cooking: {
    title: '做饭助理',
    questions: [
      {
        id: 'cooking-reminder',
        question: '提醒你购买食材？',
        options: ['是', '否'],
      },
    ],
  },
  chat: {
    title: '随便聊聊',
    questions: [
      {
        id: 'chat-style',
        question: '你希望助理聊天时的风格是？',
        options: ['轻松有趣', '温暖治愈', '直接理性'],
      },
    ],
  },
  news: {
    title: '看新闻',
    questions: [
      {
        id: 'news-topic',
        question: '获取什么新闻？',
        options: ['AI新闻', '体育新闻', '云计算'],
      },
      {
        id: 'news-source',
        question: '从哪里获取新闻？',
        options: ['小红书', '抖音', 'X/推特'],
      },
    ],
  },
};

export const isAssistantSkillId = (value: string): value is AssistantSkillId =>
  value in SKILL_CONFIGS;

export const parseAssistantSkillsParam = (
  skillsParam?: string | string[]
): AssistantSkillId[] => {
  const raw = Array.isArray(skillsParam) ? skillsParam.join(',') : skillsParam;

  if (!raw) {
    return [];
  }

  const uniqueSkills = new Set<AssistantSkillId>();

  for (const item of raw.split(',')) {
    const normalizedItem = item.trim();

    if (isAssistantSkillId(normalizedItem)) {
      uniqueSkills.add(normalizedItem);
    }
  }

  return [...uniqueSkills];
};

export const getSkillConfigStepCount = (skills: AssistantSkillId[]) =>
  skills.reduce((total, skillId) => total + SKILL_CONFIGS[skillId].questions.length, 0);
