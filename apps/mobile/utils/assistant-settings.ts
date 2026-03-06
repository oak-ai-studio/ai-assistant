import * as SecureStore from 'expo-secure-store';
import {
  ASSISTANT_SKILLS,
  type AssistantSkillId,
  isAssistantSkillId,
} from '@/constants/assistant-skills';

const ASSISTANT_SETTINGS_KEY = 'assistant-settings';
const DEFAULT_FALLBACK_SKILLS: AssistantSkillId[] = ['vocab', 'chat', 'cooking'];

export type AssistantSettings = {
  assistantName: string;
  assistantRole: string;
  activeSkills: AssistantSkillId[];
};

const DEFAULT_ACTIVE_SKILLS: AssistantSkillId[] = DEFAULT_FALLBACK_SKILLS.filter((skillId) =>
  ASSISTANT_SKILLS.some((skill) => skill.id === skillId)
);

export const DEFAULT_ASSISTANT_SETTINGS: AssistantSettings = {
  assistantName: '安迪',
  assistantRole: '你是我的全能助理',
  activeSkills: DEFAULT_ACTIVE_SKILLS,
};

const sanitizeSkillIds = (skills: unknown): AssistantSkillId[] => {
  if (!Array.isArray(skills)) {
    return [...DEFAULT_ACTIVE_SKILLS];
  }

  const uniqueSkills = new Set<AssistantSkillId>();

  for (const item of skills) {
    if (typeof item === 'string' && isAssistantSkillId(item)) {
      uniqueSkills.add(item);
    }
  }

  return [...uniqueSkills];
};

const sanitizeSettings = (input: Partial<AssistantSettings>): AssistantSettings => ({
  assistantName: input.assistantName?.trim() || DEFAULT_ASSISTANT_SETTINGS.assistantName,
  assistantRole: input.assistantRole?.trim() || DEFAULT_ASSISTANT_SETTINGS.assistantRole,
  activeSkills: sanitizeSkillIds(input.activeSkills),
});

export const getAssistantSettings = async (): Promise<AssistantSettings> => {
  try {
    const rawValue = await SecureStore.getItemAsync(ASSISTANT_SETTINGS_KEY);

    if (!rawValue) {
      return DEFAULT_ASSISTANT_SETTINGS;
    }

    const parsed = JSON.parse(rawValue) as Partial<AssistantSettings>;
    return sanitizeSettings(parsed);
  } catch {
    return DEFAULT_ASSISTANT_SETTINGS;
  }
};

export const saveAssistantSettings = async (
  settings: AssistantSettings
): Promise<AssistantSettings> => {
  const sanitized = sanitizeSettings(settings);

  await SecureStore.setItemAsync(
    ASSISTANT_SETTINGS_KEY,
    JSON.stringify(sanitized)
  );

  return sanitized;
};
