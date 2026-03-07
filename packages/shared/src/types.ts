export type MemoryType =
  | 'preference'
  | 'fact'
  | 'experience'
  | 'other'
  | 'habit'
  | 'weakness'
  | 'progress'
  | 'personality';

export type MessageRole = 'user' | 'assistant';

export type TodoPriority = 'high' | 'medium';

export interface BaseEntity {
  id: string;
  createdAt: Date;
}
