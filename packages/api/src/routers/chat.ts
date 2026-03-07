import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { sendChatMessage, getConversationMessages, ChatServiceError } from '../services/chat';
import { createChatLLMProvider, LLMProviderError } from '../services/llm';
import { scheduleConversationMemoryExtraction } from '../services/memory';
import { publicProcedure, router } from '../trpc';

const sendMessageInputSchema = z.object({
  userId: z.string().min(1),
  assistantId: z.string().min(1),
  conversationId: z.string().min(1).optional(),
  skillId: z.string().min(1).optional(),
  message: z.string().min(1).max(4000),
  pageContext: z.record(z.string(), z.unknown()).optional(),
  historyLimit: z.number().int().min(1).max(100).optional(),
});

const getConversationInputSchema = z.object({
  userId: z.string().min(1),
  assistantId: z.string().min(1),
  conversationId: z.string().min(1),
  limit: z.number().int().min(1).max(200).optional(),
});

export const chatRouter = router({
  sendMessage: publicProcedure.input(sendMessageInputSchema).mutation(async ({ ctx, input }) => {
    try {
      const llmProvider = ctx.llmProvider ?? createChatLLMProvider();

      const result = await sendChatMessage(
        {
          prisma: ctx.prisma,
          llmProvider,
        },
        input,
      );

      scheduleConversationMemoryExtraction({
        prisma: ctx.prisma,
        llmProvider,
        conversationId: result.conversationId,
      });

      return result;
    } catch (error: unknown) {
      throw toTRPCError(error);
    }
  }),

  getConversation: publicProcedure.input(getConversationInputSchema).query(async ({ ctx, input }) => {
    try {
      return await getConversationMessages(
        {
          prisma: ctx.prisma,
        },
        input,
      );
    } catch (error: unknown) {
      throw toTRPCError(error);
    }
  }),
});

function toTRPCError(error: unknown): TRPCError {
  if (error instanceof TRPCError) {
    return error;
  }

  if (error instanceof ChatServiceError) {
    if (error.code === 'ASSISTANT_NOT_FOUND' || error.code === 'CONVERSATION_NOT_FOUND') {
      return new TRPCError({
        code: 'NOT_FOUND',
        message: error.message,
      });
    }
  }

  if (error instanceof LLMProviderError) {
    if (error.code === 'TIMEOUT') {
      return new TRPCError({
        code: 'TIMEOUT',
        message: 'LLM 请求超时，请稍后重试。',
      });
    }

    if (error.code === 'API_ERROR') {
      return new TRPCError({
        code: 'BAD_GATEWAY',
        message: 'LLM API 返回错误，请稍后重试。',
      });
    }

    if (error.code === 'NETWORK_ERROR') {
      return new TRPCError({
        code: 'SERVICE_UNAVAILABLE',
        message: '网络错误，暂时无法连接 LLM 服务。',
      });
    }

    if (error.code === 'CONFIG_ERROR') {
      return new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'LLM 服务配置缺失。',
      });
    }
  }

  return new TRPCError({
    code: 'INTERNAL_SERVER_ERROR',
    message: '聊天服务发生未知错误。',
    cause: error,
  });
}
