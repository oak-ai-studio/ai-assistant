export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface GenerateChatReplyInput {
  systemPrompt: string;
  messages: ChatMessage[];
}

export interface GenerateChatReplyOutput {
  content: string;
  model: string;
  provider: string;
}

export interface ChatLLMProvider {
  generateReply(input: GenerateChatReplyInput): Promise<GenerateChatReplyOutput>;
}
