import { Ionicons } from '@expo/vector-icons';
import type { AssistantSkillId } from '@/constants/assistant-config';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const BACKEND_TO_FRONTEND_SKILL_ID: Record<string, AssistantSkillId> = {
  vocab: 'vocab',
  vocabulary: 'vocab',
  english_learning: 'vocab',
  chat: 'chat',
  cooking: 'cooking',
  news: 'news',
  notes: 'notes',
  note: 'notes',
};

const BACKEND_NAME_TO_FRONTEND_SKILL_ID: Record<string, AssistantSkillId> = {
  '背单词': 'vocab',
  '随便聊聊': 'chat',
  '做饭助理': 'cooking',
  '看新闻': 'news',
  '笔记': 'notes',
};

const SKILL_ICON_MAP: Record<string, IoniconName> = {
  vocab: 'book-outline',
  vocabulary: 'book-outline',
  english_learning: 'book-outline',
  chat: 'chatbubble-ellipses-outline',
  cooking: 'restaurant-outline',
  news: 'newspaper-outline',
  notes: 'document-text-outline',
  note: 'document-text-outline',
};

export const SKILL_SUBTITLE_MAP: Record<string, string> = {
  chat: '和我聊聊天吧',
  vocab: '开始今天的单词练习',
  english_learning: '开始今天的单词练习',
  cooking: '今天吃什么？',
  news: '快速查看重点资讯',
  notes: '随手记录你的想法',
};

export const mapBackendSkillToAssistant = (
  skill: { id: string; name: string }
): AssistantSkillId | null =>
  BACKEND_TO_FRONTEND_SKILL_ID[skill.id] ??
  BACKEND_NAME_TO_FRONTEND_SKILL_ID[skill.name] ??
  null;

export const resolveSkillIcon = (backendSkillId: string, icon?: string): IoniconName => {
  if (icon && icon in SKILL_ICON_MAP) {
    return SKILL_ICON_MAP[icon];
  }

  return SKILL_ICON_MAP[backendSkillId] ?? 'apps-outline';
};
