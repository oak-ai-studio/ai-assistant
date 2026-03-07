import type { MemoryType } from '@ai-assistant/shared';
import type { PageContextPayload } from '@/constants/page-context';
import { apiRequest } from '@/utils/trpc';

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const unwrapPayload = (value: unknown): unknown => {
  if (!isRecord(value)) {
    return value;
  }

  if ('data' in value) {
    return value.data;
  }

  if ('result' in value && isRecord(value.result) && 'data' in value.result) {
    const resultData = value.result.data;
    if (isRecord(resultData) && 'json' in resultData) {
      return resultData.json;
    }

    return resultData;
  }

  return value;
};

const asString = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const asNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const asBoolean = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

export type ChatSendMessageInput = {
  userId: string;
  message: string;
  skillId?: string;
  pageContext?: PageContextPayload;
  conversationId?: string;
};

export type ChatSendMessageResult = {
  conversationId: string;
  message: {
    id: string;
    role: 'assistant';
    content: string;
    createdAt: string;
  };
};

export async function sendMessage(
  input: ChatSendMessageInput
): Promise<ChatSendMessageResult> {
  const raw = await apiRequest<unknown, ChatSendMessageInput>('/api/chat/sendMessage', {
    method: 'POST',
    body: input,
  });
  const payload = unwrapPayload(raw);

  if (!isRecord(payload)) {
    throw new Error('对话接口返回格式错误');
  }

  const messagePayload = isRecord(payload.message) ? payload.message : {};

  return {
    conversationId: asString(payload.conversationId, input.conversationId ?? ''),
    message: {
      id: asString(messagePayload.id, `assistant-${Date.now()}`),
      role: 'assistant',
      content: asString(messagePayload.content),
      createdAt: asString(messagePayload.createdAt, new Date().toISOString()),
    },
  };
}

export type MemoryItem = {
  id: string;
  content: string;
  type: MemoryType;
  skillSource: string | null;
  confidence: number;
  isUserEdited: boolean;
  createdAt: string;
  updatedAt: string;
};

const toMemoryItem = (value: unknown): MemoryItem => {
  const payload = isRecord(value) ? value : {};

  return {
    id: asString(payload.id),
    content: asString(payload.content),
    type: asString(payload.type, 'fact') as MemoryType,
    skillSource: typeof payload.skillSource === 'string' ? payload.skillSource : null,
    confidence: asNumber(payload.confidence, 0.8),
    isUserEdited: asBoolean(payload.isUserEdited),
    createdAt: asString(payload.createdAt, new Date().toISOString()),
    updatedAt: asString(payload.updatedAt, new Date().toISOString()),
  };
};

export type ListMemoriesInput = {
  userId: string;
  type?: MemoryType;
  skillSource?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
};

export type ListMemoriesResult = {
  memories: MemoryItem[];
  total: number;
};

export async function listMemories(
  input: ListMemoriesInput
): Promise<ListMemoriesResult> {
  const raw = await apiRequest<unknown>('/api/memory/list', {
    method: 'GET',
    query: input,
  });
  const payload = unwrapPayload(raw);

  if (Array.isArray(payload)) {
    const memories = payload.map(toMemoryItem).filter((item) => item.id.length > 0);
    return { memories, total: memories.length };
  }

  if (!isRecord(payload)) {
    return { memories: [], total: 0 };
  }

  const rawList = Array.isArray(payload.memories) ? payload.memories : [];
  const memories = rawList.map(toMemoryItem).filter((item) => item.id.length > 0);
  const total = asNumber(payload.total, memories.length);

  return { memories, total };
}

export type CreateMemoryInput = {
  userId: string;
  content: string;
  type: MemoryType;
  skillSource?: string;
  confidence?: number;
};

export async function createMemory(input: CreateMemoryInput): Promise<MemoryItem> {
  const raw = await apiRequest<unknown, CreateMemoryInput>('/api/memory/create', {
    method: 'POST',
    body: input,
  });

  return toMemoryItem(unwrapPayload(raw));
}

export type UpdateMemoryInput = {
  id: string;
  userId: string;
  content?: string;
  type?: MemoryType;
  confidence?: number;
};

export async function updateMemory(input: UpdateMemoryInput): Promise<MemoryItem> {
  const raw = await apiRequest<unknown, UpdateMemoryInput>('/api/memory/update', {
    method: 'POST',
    body: input,
  });

  return toMemoryItem(unwrapPayload(raw));
}

export type DeleteMemoryInput = {
  id: string;
  userId: string;
};

export async function deleteMemory(input: DeleteMemoryInput): Promise<{ success: boolean }> {
  const raw = await apiRequest<unknown, DeleteMemoryInput>('/api/memory/delete', {
    method: 'POST',
    body: input,
  });
  const payload = unwrapPayload(raw);

  if (!isRecord(payload)) {
    return { success: true };
  }

  return { success: asBoolean(payload.success, true) };
}

export type SkillItem = {
  id: string;
  name: string;
  icon: string;
  systemPrompt: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

const toSkillItem = (value: unknown): SkillItem => {
  const payload = isRecord(value) ? value : {};

  return {
    id: asString(payload.id),
    name: asString(payload.name),
    icon: asString(payload.icon),
    systemPrompt: asString(payload.systemPrompt),
    isActive: asBoolean(payload.isActive, true),
    sortOrder: asNumber(payload.sortOrder, 0),
    createdAt: asString(payload.createdAt, new Date().toISOString()),
    updatedAt: asString(payload.updatedAt, new Date().toISOString()),
  };
};

export type ListSkillsInput = {
  userId: string;
  isActive?: boolean;
};

export async function listSkills(
  input: ListSkillsInput
): Promise<{ skills: SkillItem[] }> {
  const raw = await apiRequest<unknown>('/api/skills/list', {
    method: 'GET',
    query: input,
  });
  const payload = unwrapPayload(raw);

  if (Array.isArray(payload)) {
    return {
      skills: payload.map(toSkillItem).filter((item) => item.id.length > 0),
    };
  }

  if (!isRecord(payload)) {
    return { skills: [] };
  }

  const rawSkills = Array.isArray(payload.skills) ? payload.skills : [];
  return {
    skills: rawSkills.map(toSkillItem).filter((item) => item.id.length > 0),
  };
}

export type UpdateSkillInput = {
  userId: string;
  skillId: string;
  name?: string;
  icon?: string;
  systemPrompt?: string;
  isActive?: boolean;
  sortOrder?: number;
};

export async function updateSkill(input: UpdateSkillInput): Promise<SkillItem> {
  const raw = await apiRequest<unknown, UpdateSkillInput>('/api/skills/update', {
    method: 'POST',
    body: input,
  });

  return toSkillItem(unwrapPayload(raw));
}

export type ReorderSkillsInput = {
  userId: string;
  skillOrders: Array<{
    skillId: string;
    sortOrder: number;
  }>;
};

export async function reorderSkills(
  input: ReorderSkillsInput
): Promise<{ success: boolean }> {
  const raw = await apiRequest<unknown, ReorderSkillsInput>('/api/skills/reorder', {
    method: 'POST',
    body: input,
  });
  const payload = unwrapPayload(raw);

  if (!isRecord(payload)) {
    return { success: true };
  }

  return { success: asBoolean(payload.success, true) };
}
