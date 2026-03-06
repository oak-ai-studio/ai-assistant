import { PropsWithChildren, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, useSegments } from 'expo-router';
import { Portal } from '@gorhom/portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChatDrawer, ChatMessage } from '@/components/ChatDrawer';
import {
  PageContextPayload,
  getPageContextForPathname,
} from '@/constants/page-context';
import { colors, radius } from '@/constants/tokens';
import { shadows } from '@/constants/shadows';

type GlobalChatContextValue = {
  isOpen: boolean;
  openChat: () => void;
  openChatWithPreset: (preset: 'open' | 'empty' | 'full') => void;
  closeChat: () => void;
  pageContext: PageContextPayload;
  setPageContext: (context: PageContextPayload) => void;
};

const GlobalChatContext = createContext<GlobalChatContextValue | undefined>(undefined);

const previewMessages: ChatMessage[] = [
  {
    id: 'assistant-preview-1',
    role: 'assistant',
    content: '今天单词练习里有个词：albeit，你想先记它吗？',
  },
  {
    id: 'user-preview-1',
    role: 'user',
    content: '记住了',
  },
  {
    id: 'assistant-preview-2',
    role: 'assistant',
    content: '太好了。那我考考你，和我对话时你回答我。',
  },
];

export function GlobalChatProvider({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const segments = useSegments();
  const insets = useSafeAreaInsets();
  const [isOpen, setIsOpen] = useState(false);
  const [snapIndex, setSnapIndex] = useState<0 | 1>(0);
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pageContext, setPageContextState] = useState<PageContextPayload>(
    getPageContextForPathname(pathname)
  );

  const rootSegment = (segments[0] ?? '') as string;
  const shouldShowGlobalChat = rootSegment === '(tabs)' || rootSegment === '(skills)';

  useEffect(() => {
    setPageContextState(getPageContextForPathname(pathname));
  }, [pathname]);

  useEffect(() => {
    if (!shouldShowGlobalChat) {
      setIsOpen(false);
    }
  }, [shouldShowGlobalChat]);

  const openChat = useCallback(() => {
    setSnapIndex(0);
    setIsOpen(true);
  }, []);

  const openChatWithPreset = useCallback((preset: 'open' | 'empty' | 'full') => {
    if (preset === 'open') {
      setMessages(previewMessages);
      setDraft('');
      setSnapIndex(0);
      setIsOpen(true);
      return;
    }

    if (preset === 'empty') {
      setMessages([]);
      setDraft('');
      setSnapIndex(0);
      setIsOpen(true);
      return;
    }

    setMessages(previewMessages);
    setDraft('');
    setSnapIndex(1);
    setIsOpen(true);
  }, []);

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

  const onCreateConversation = useCallback(() => {
    setMessages([]);
    setDraft('');
  }, []);

  const onSend = useCallback(() => {
    const content = draft.trim();
    if (!content) {
      return;
    }

    const timestamp = Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${timestamp}`,
        role: 'user',
        content,
      },
      {
        id: `assistant-${timestamp + 1}`,
        role: 'assistant',
        content: `收到，我会结合 ${pageContext.current_page} 页面信息继续帮你。`,
      },
    ]);
    setDraft('');
  }, [draft, pageContext.current_page]);

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

  return (
    <GlobalChatContext.Provider value={contextValue}>
      {children}

      {shouldShowGlobalChat ? (
        <Portal>
          <View pointerEvents="box-none" style={styles.portalRoot}>
            {!isOpen ? (
              <Pressable
                style={[
                  styles.fab,
                  {
                    bottom: insets.bottom + 24,
                    right: 24,
                  },
                ]}
                onPress={openChat}
              >
                <Ionicons name="chatbubble-ellipses" size={24} color="#fff" />
              </Pressable>
            ) : null}

            <ChatDrawer
              visible={isOpen}
              snapIndex={snapIndex}
              messages={messages}
              draft={draft}
              onDraftChange={setDraft}
              onClose={closeChat}
              onSend={onSend}
              onCreateConversation={onCreateConversation}
              topInset={insets.top + 52}
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
  fab: {
    position: 'absolute',
    zIndex: 40,
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.orange,
  },
});
