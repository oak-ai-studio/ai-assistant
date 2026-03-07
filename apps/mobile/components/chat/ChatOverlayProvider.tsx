import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { usePathname, useSegments } from 'expo-router';
import { Portal } from '@gorhom/portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SecureStore from 'expo-secure-store';
import { ChatDrawer, ChatMessage } from '@/components/ChatDrawer';
import { FAB } from '@/components/chat/FAB';
import {
  PageContextPayload,
  getOpeningLineForPathname,
  getPageContextForPathname,
} from '@/constants/page-context';
import { trpcClient } from '@/utils/trpc';
import { useUserId } from '@/utils/userId';

type ChatPreset = 'open' | 'empty' | 'full';

type GlobalChatContextValue = {
  isOpen: boolean;
  openChat: () => void;
  openChatWithPreset: (preset: ChatPreset) => void;
  closeChat: () => void;
  pageContext: PageContextPayload;
  setPageContext: (context: PageContextPayload) => void;
};

type PersistedChatState = {
  conversationId: string | null;
  messages: ChatMessage[];
  userId: string | null;
  assistantId: string | null;
};

type ChatSession = {
  userId: string;
  assistantId: string;
};

const CHAT_STATE_KEY = 'global-chat-state-v1';
const GlobalChatContext = createContext<GlobalChatContextValue | undefined>(undefined);

function buildLocalId(prefix: 'user' | 'assistant'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  return '消息发送失败，请稍后重试。';
}

function sanitizePersistedMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (
      typeof item === 'object' &&
      item &&
      'id' in item &&
      'role' in item &&
      'content' in item &&
      typeof item.id === 'string' &&
      (item.role === 'assistant' || item.role === 'user') &&
      typeof item.content === 'string'
    ) {
      return [
        {
          id: item.id,
          role: item.role,
          content: item.content,
        },
      ];
    }

    return [];
  });
}

export function GlobalChatProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const { userId, isLoading: userIdLoading, error: userIdError } = useUserId();

  const rootSegment = (segments[0] ?? '') as string;
  const shouldShowGlobalChat = rootSegment !== '(onboarding)';

  const [isHydrated, setIsHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [snapIndex, setSnapIndex] = useState<0 | 1>(0);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [pageContext, setPageContextState] = useState<PageContextPayload>(
    getPageContextForPathname(pathname)
  );

  useEffect(() => {
    let active = true;

    const loadPersistedState = async () => {
      try {
        const raw = await SecureStore.getItemAsync(CHAT_STATE_KEY);
        if (!raw || !active) {
          return;
        }

        const parsed = JSON.parse(raw) as Partial<PersistedChatState>;
        const nextMessages = sanitizePersistedMessages(parsed.messages);

        setMessages(nextMessages);
        setConversationId(typeof parsed.conversationId === 'string' ? parsed.conversationId : null);

        if (typeof parsed.userId === 'string' && typeof parsed.assistantId === 'string') {
          setSession({
            userId: parsed.userId,
            assistantId: parsed.assistantId,
          });
        }
      } catch {
        setMessages([]);
      } finally {
        if (active) {
          setIsHydrated(true);
        }
      }
    };

    void loadPersistedState();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    const persistedState: PersistedChatState = {
      conversationId,
      messages,
      userId: session?.userId ?? null,
      assistantId: session?.assistantId ?? null,
    };

    void SecureStore.setItemAsync(CHAT_STATE_KEY, JSON.stringify(persistedState));
  }, [conversationId, isHydrated, messages, session]);

  useEffect(() => {
    if (!isHydrated || userIdLoading || !userId) {
      return;
    }

    if (session && session.userId !== userId) {
      setSession(null);
      setConversationId(null);
      setMessages([]);
      setDraft('');
      setErrorMessage(null);
    }
  }, [isHydrated, session, userId, userIdLoading]);

  useEffect(() => {
    setPageContextState(getPageContextForPathname(pathname));
  }, [pathname]);

  useEffect(() => {
    if (!shouldShowGlobalChat) {
      setIsOpen(false);
    }
  }, [shouldShowGlobalChat]);

  const openChat = useCallback(() => {
    setErrorMessage(null);
    setSnapIndex(0);
    setMessages((prev) => {
      if (prev.length > 0) {
        return prev;
      }

      return [
        {
          id: buildLocalId('assistant'),
          role: 'assistant',
          content: getOpeningLineForPathname(pathname),
        },
      ];
    });
    setIsOpen(true);
  }, [pathname]);

  const openChatWithPreset = useCallback(
    (preset: ChatPreset) => {
      setErrorMessage(null);
      setDraft('');

      if (preset === 'empty') {
        setMessages([]);
        setConversationId(null);
        setSnapIndex(0);
        setIsOpen(true);
        return;
      }

      setMessages((prev) => {
        if (prev.length > 0) {
          return prev;
        }

        return [
          {
            id: buildLocalId('assistant'),
            role: 'assistant',
            content: getOpeningLineForPathname(pathname),
          },
        ];
      });
      setSnapIndex(preset === 'full' ? 1 : 0);
      setIsOpen(true);
    },
    [pathname]
  );

  useEffect(() => {
    if (pathname.includes('vocabulary-chat-half')) {
      openChatWithPreset('open');
      return;
    }

    if (pathname.includes('vocabulary-chat-empty')) {
      openChatWithPreset('empty');
      return;
    }

    if (pathname.includes('vocabulary-chat-full')) {
      openChatWithPreset('full');
    }
  }, [openChatWithPreset, pathname]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  const setPageContext = useCallback((context: PageContextPayload) => {
    setPageContextState(context);
  }, []);

  const ensureSession = useCallback(async (): Promise<ChatSession> => {
    if (!userId) {
      throw new Error(userIdError ?? '用户标识初始化失败，请稍后重试');
    }

    if (session && session.userId === userId) {
      return session;
    }

    const result = await trpcClient.assistant.create.mutate({
      userId,
      name: '安迪',
    });

    const nextSession = {
      userId,
      assistantId: result.assistant.id,
    };

    setSession(nextSession);
    return nextSession;
  }, [session, userId, userIdError]);

  const onCreateConversation = useCallback(() => {
    setDraft('');
    setErrorMessage(null);
    setConversationId(null);
    setMessages([]);
  }, []);

  const onSend = useCallback(async () => {
    const content = draft.trim();
    if (!content || isSending) {
      return;
    }

    if (userIdLoading) {
      return;
    }

    if (!userId) {
      setErrorMessage(userIdError ?? '用户标识初始化失败，请稍后重试');
      return;
    }

    const localUserMessageId = buildLocalId('user');
    const currentPageContext = pageContext;

    setDraft('');
    setErrorMessage(null);
    setIsSending(true);
    setMessages((prev) => [
      ...prev,
      {
        id: localUserMessageId,
        role: 'user',
        content,
      },
    ]);

    try {
      const currentSession = await ensureSession();
      const result = await trpcClient.chat.sendMessage.mutate({
        userId: currentSession.userId,
        assistantId: currentSession.assistantId,
        conversationId: conversationId ?? undefined,
        message: content,
        pageContext: currentPageContext as Record<string, unknown>,
      });

      setConversationId(result.conversationId);
      setMessages((prev) => [
        ...prev.map((message) =>
          message.id === localUserMessageId
            ? {
                ...message,
                id: result.userMessage.id,
              }
            : message
        ),
        {
          id: result.assistantMessage.id,
          role: 'assistant',
          content: result.assistantMessage.content,
        },
      ]);
    } catch (error: unknown) {
      setErrorMessage(toErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }, [
    conversationId,
    draft,
    ensureSession,
    isSending,
    pageContext,
    userId,
    userIdError,
    userIdLoading,
  ]);

  const contextValue = useMemo(
    () => ({
      isOpen,
      openChat,
      openChatWithPreset,
      closeChat,
      pageContext,
      setPageContext,
    }),
    [closeChat, isOpen, openChat, openChatWithPreset, pageContext, setPageContext]
  );

  const openingLine = getOpeningLineForPathname(pathname);

  return (
    <GlobalChatContext.Provider value={contextValue}>
      {children}

      {shouldShowGlobalChat ? (
        <Portal>
          <View pointerEvents="box-none" style={styles.portalRoot}>
            {!isOpen ? <FAB bottom={insets.bottom + 24} onPress={openChat} /> : null}

            <ChatDrawer
              visible={isOpen}
              snapIndex={snapIndex}
              messages={messages}
              draft={draft}
              isSending={isSending}
              errorMessage={errorMessage}
              openingLine={openingLine}
              onDraftChange={setDraft}
              onClose={closeChat}
              onSend={onSend}
              onCreateConversation={onCreateConversation}
              topInset={insets.top + 40}
            />
          </View>
        </Portal>
      ) : null}
    </GlobalChatContext.Provider>
  );
}

export function useGlobalChat() {
  const context = useContext(GlobalChatContext);
  if (!context) {
    throw new Error('useGlobalChat must be used inside GlobalChatProvider');
  }

  return context;
}

const styles = StyleSheet.create({
  portalRoot: {
    ...StyleSheet.absoluteFillObject,
  },
});
