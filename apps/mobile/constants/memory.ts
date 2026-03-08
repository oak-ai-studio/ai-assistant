import type { MemoryType } from '@ai-assistant/shared';
import { colors } from '@/constants/tokens';

export type MemoryFilter = 'all' | 'preference' | 'fact' | 'experience' | 'other';

export type MemoryListItem = {
  id: string;
  content: string;
  type: MemoryType;
  createdAt: string;
  updatedAt: string;
};

export const MEMORY_FILTER_TABS: Array<{ key: MemoryFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'preference', label: '偏好' },
  { key: 'fact', label: '事实' },
  { key: 'experience', label: '经历' },
  { key: 'other', label: '其他' },
];

export const MEMORY_TYPE_OPTIONS: MemoryType[] = [
  'preference',
  'fact',
  'habit',
  'progress',
  'weakness',
  'personality',
];

export const MEMORY_TYPE_META: Record<
  MemoryType,
  {
    label: string;
    shortLabel: string;
    color: string;
    bgColor: string;
    borderColor: string;
    group: Exclude<MemoryFilter, 'all'>;
  }
> = {
  preference: {
    label: '偏好',
    shortLabel: '偏好',
    color: colors.orange,
    bgColor: colors.orangeBg,
    borderColor: colors.orange20,
    group: 'preference',
  },
  fact: {
    label: '事实',
    shortLabel: '事实',
    color: colors.success,
    bgColor: colors.successBg,
    borderColor: 'rgba(58,140,92,0.2)',
    group: 'fact',
  },
  habit: {
    label: '习惯',
    shortLabel: '经历',
    color: colors.ink,
    bgColor: colors.sandLight,
    borderColor: colors.ink10,
    group: 'experience',
  },
  progress: {
    label: '进展',
    shortLabel: '经历',
    color: colors.orangeDim,
    bgColor: colors.orange10,
    borderColor: colors.orange20,
    group: 'experience',
  },
  weakness: {
    label: '弱项',
    shortLabel: '其他',
    color: colors.danger,
    bgColor: 'rgba(217,79,61,0.12)',
    borderColor: 'rgba(217,79,61,0.25)',
    group: 'other',
  },
  personality: {
    label: '性格',
    shortLabel: '其他',
    color: colors.ink60,
    bgColor: colors.ink05,
    borderColor: colors.ink10,
    group: 'other',
  },
};

export const getMemoryTypeLabel = (type: MemoryType) => MEMORY_TYPE_META[type].label;

export const getMemoryGroupLabel = (type: MemoryType) => MEMORY_TYPE_META[type].shortLabel;

export const isMemoryInFilter = (type: MemoryType, filter: MemoryFilter) => {
  if (filter === 'all') {
    return true;
  }

  return MEMORY_TYPE_META[type].group === filter;
};

const pad2 = (value: number) => String(value).padStart(2, '0');

export const formatMemoryListTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

export const formatMemoryDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};
