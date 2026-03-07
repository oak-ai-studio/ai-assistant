import type { MemoryType } from '@ai-assistant/shared';

export const memoryTypeValues: [MemoryType, ...MemoryType[]] = [
  'preference',
  'habit',
  'fact',
  'weakness',
  'progress',
  'personality',
];

export const MIN_CONFIDENCE_THRESHOLD = 0.6;
