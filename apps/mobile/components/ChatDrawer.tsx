import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  ActivityIndicator,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import BottomSheet, {
  BottomSheetFlatList,
  type BottomSheetFlatListMethods,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';

export type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

type ChatDrawerProps = {
  visible: boolean;
  snapIndex: 0 | 1;
  messages: ChatMessage[];
  draft: string;
  isSending: boolean;
  errorMessage: string | null;
  openingLine: string;
  topInset: number;
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSend: () => void;
  onCreateConversation: () => void;
};

export function ChatDrawer({
  visible,
  snapIndex,
  messages,
  draft,
  isSending,
  errorMessage,
  openingLine,
  topInset,
  onDraftChange,
  onClose,
  onSend,
  onCreateConversation,
}: ChatDrawerProps) {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const listRef = useRef<BottomSheetFlatListMethods | null>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);

  useEffect(() => {
    if (!visible) {
      bottomSheetRef.current?.close();
      return;
    }

    requestAnimationFrame(() => {
      bottomSheetRef.current?.snapToIndex(snapIndex);
    });
  }, [snapIndex, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({ animated: true });
    });
  }, [isSending, messages.length, visible]);

  const handleSheetChange = useCallback(
    (nextIndex: number) => {
      if (nextIndex === -1) {
        onClose();
      }
    },
    [onClose]
  );

  const renderMessage = useCallback<ListRenderItem<ChatMessage>>(
    ({ item }) => {
      const isUser = item.role === 'user';

      return (
        <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
          {isUser ? (
            <View style={styles.userBubble}>
              <Text style={[typography.bodyL, styles.userMessageText]}>{item.content}</Text>
            </View>
          ) : (
            <Text style={[typography.titleM, styles.assistantMessageText]}>{item.content}</Text>
          )}
        </View>
      );
    },
    []
  );

  return (
    <View pointerEvents="box-none" style={styles.portalRoot}>
      {visible ? (
        <Pressable style={styles.backdrop} onPress={onClose}>
          <BlurView intensity={16} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>
      ) : null}

      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose
        onChange={handleSheetChange}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        topInset={topInset}
        bottomInset={insets.bottom}
        style={styles.sheetRoot}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
      >
        <View style={styles.sheetContent}>
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />
            <Pressable style={styles.addButton} onPress={onCreateConversation}>
              <Ionicons name="add" size={18} color={colors.ink60} />
            </Pressable>
          </View>

          {messages.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={[typography.titleM, styles.emptyStateText]}>{openingLine}</Text>
            </View>
          ) : (
            <BottomSheetFlatList
              ref={listRef}
              data={messages}
              keyExtractor={(item: ChatMessage) => item.id}
              renderItem={renderMessage}
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          )}

          {isSending ? (
            <View style={styles.statusRow}>
              <ActivityIndicator size="small" color={colors.orange} />
              <Text style={[typography.bodyM, styles.statusText]}>正在生成回复...</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <Text style={[typography.bodyM, styles.errorText]}>{errorMessage}</Text>
          ) : null}

          <View style={styles.inputSection}>
            <View style={styles.inputRow}>
              <TextInput
                value={draft}
                onChangeText={onDraftChange}
                placeholder="说点什么..."
                placeholderTextColor={colors.ink30}
                style={styles.input}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSending}
              />
              <Pressable style={styles.micButton} onPress={() => {}}>
                <Ionicons name="mic-outline" size={18} color={colors.ink60} />
              </Pressable>
              <Pressable
                style={[styles.sendButton, (!draft.trim() || isSending) && styles.sendButtonDisabled]}
                disabled={!draft.trim() || isSending}
                onPress={onSend}
              >
                <Ionicons name="send" size={16} color="#fff" />
              </Pressable>
            </View>
          </View>
        </View>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  portalRoot: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetRoot: {
    ...shadows.lg,
  },
  sheetBackground: {
    backgroundColor: colors.sandLight,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink10,
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.ink30,
  },
  sheetContent: {
    flex: 1,
  },
  headerRow: {
    height: 48,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  headerSpacer: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 48,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.offWhite,
  },
  emptyWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  emptyStateText: {
    color: colors.ink,
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 16,
  },
  messageRow: {
    alignSelf: 'flex-start',
    maxWidth: '86%',
  },
  messageRowUser: {
    alignSelf: 'flex-end',
  },
  assistantMessageText: {
    color: colors.ink,
  },
  userBubble: {
    backgroundColor: colors.orange,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadows.orange,
  },
  userMessageText: {
    color: '#fff',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  statusText: {
    color: colors.ink60,
  },
  errorText: {
    color: colors.danger,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  inputSection: {
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingLeft: 10,
    paddingRight: 8,
    paddingVertical: 10,
  },
  micButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandLight,
    borderWidth: 1,
    borderColor: colors.ink10,
  },
  input: {
    flex: 1,
    minHeight: 56,
    maxHeight: 112,
    color: colors.ink,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  sendButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.45,
  },
});
