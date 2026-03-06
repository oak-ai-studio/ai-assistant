import * as SecureStore from 'expo-secure-store';
import {
  ASSISTANT_SKILLS,
  type AssistantSkillId,
  isAssistantSkillId,
} from '@/constants/assistant-config';

const ASSISTANT_SETTINGS_KEY = 'assistant-settings';
const DEFAULT_ACTIVE_SKILLS: AssistantSkillId[] = ['vocab', 'chat', 'cooking'];

export type AssistantSettings = {
  assistantName: string;
  assistantRole: string;
  activeSkills: AssistantSkillId[];
};

const getFallbackSkills = (): AssistantSkillId[] =>
  DEFAULT_ACTIVE_SKILLS.filter((skillId) =>
    ASSISTANT_SKILLS.some((skill) => skill.id === skillId)
  );

const DEFAULT_SETTINGS: AssistantSettings = {
  assistantName: '安迪',
  assistantRole: '你是我的私人助理',
  activeSkills: getFallbackSkills(),
};

const sanitizeSkills = (value: unknown): AssistantSkillId[] => {
  if (!Array.isArray(value)) {
    return [...DEFAULT_SETTINGS.activeSkills];
  }

  const selected = new Set<AssistantSkillId>();

  for (const item of value) {
    if (typeof item === 'string' && isAssistantSkillId(item)) {
      selected.add(item);
    }
  }

  return [...selected];
};

const sanitizeSettings = (value: Partial<AssistantSettings>): AssistantSettings => ({
  assistantName: value.assistantName?.trim() || DEFAULT_SETTINGS.assistantName,
  assistantRole: value.assistantRole?.trim() || DEFAULT_SETTINGS.assistantRole,
  activeSkills: sanitizeSkills(value.activeSkills),
});

export const getAssistantSettings = async (): Promise<AssistantSettings> => {
  try {
    const raw = await SecureStore.getItemAsync(ASSISTANT_SETTINGS_KEY);

    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(raw) as Partial<AssistantSettings>;
    return sanitizeSettings(parsed);
  } catch {
    return DEFAULT_SETTINGS;
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

