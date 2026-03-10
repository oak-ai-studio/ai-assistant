export type MemoryType =
  | 'preference'
  | 'habit'
  | 'fact'
  | 'weakness'
  | 'progress'
  | 'personality';

export type MessageRole = 'user' | 'assistant';

export type TodoPriority = 'high' | 'medium';

export interface BaseEntity {
  id: string;
  createdAt: Date;
}
