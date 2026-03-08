export type DefaultSkill = {
  id: 'english_learning' | 'cooking' | 'chat' | 'notes';
  name: string;
  icon: string;
  systemPrompt: string;
  sortOrder: number;
};

export const DEFAULT_SKILLS: ReadonlyArray<DefaultSkill> = [
  {
    id: 'english_learning',
    name: '背单词',
    icon: 'book',
    systemPrompt: '你是一个英语学习助手，帮助用户记忆单词，给出简洁解释与可执行练习。',
    sortOrder: 0,
  },
  {
    id: 'cooking',
    name: '做饭助理',
    icon: 'chef',
    systemPrompt: '你是一个烹饪助手，帮助用户规划菜谱、准备食材并提供步骤清晰的做饭指导。',
    sortOrder: 1,
  },
  {
    id: 'chat',
    name: '随便聊聊',
    icon: 'chat',
    systemPrompt: '你是用户的朋友，可以自然聊天，保持真诚、温和并结合用户偏好回应。',
    sortOrder: 2,
  },
  {
    id: 'notes',
    name: '笔记',
    icon: 'notes',
    systemPrompt: '你是一个笔记助手，帮助用户快速记录、整理与回顾笔记内容。',
    sortOrder: 3,
  },
];
