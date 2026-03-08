import { useCallback, useEffect, useMemo, useRef, type ElementRef } from 'react';
import {
  ActivityIndicator,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetFooter,
  BottomSheetTextInput,
  type BottomSheetFooterProps,
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

const COMPOSER_HEIGHT = 120;

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
  const inputRef = useRef<ElementRef<typeof BottomSheetTextInput> | null>(null);
  const snapPoints = useMemo(() => ['50%', '90%'], []);
  const composerBottomPadding = Math.max(insets.bottom, 12);

  const draftRef = useRef(draft);
  draftRef.current = draft;
  const isSendingRef = useRef(isSending);
  isSendingRef.current = isSending;
  const onDraftChangeRef = useRef(onDraftChange);
  onDraftChangeRef.current = onDraftChange;
  const onSendRef = useRef(onSend);
  onSendRef.current = onSend;

  const prevDraftRef = useRef(draft);
  useEffect(() => {
    if (prevDraftRef.current !== '' && draft === '') {
      inputRef.current?.clear();
    }
    prevDraftRef.current = draft;
  }, [draft]);

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

  const animatedFooterPosition = useSharedValue(0);

  const renderFooter = useCallback(
    (props: BottomSheetFooterProps) => {
      animatedFooterPosition.value = 0;
      return (
        <BottomSheetFooter {...props} bottomInset={composerBottomPadding}>
          <View style={styles.inputSection}>
            <View style={styles.composerCard}>
              <BottomSheetTextInput
                ref={inputRef}
                defaultValue={draftRef.current}
                onChangeText={(text: string) => {
                  draftRef.current = text;
                  onDraftChangeRef.current(text);
                }}
                placeholder="说点什么..."
                placeholderTextColor={colors.ink30}
                style={styles.input}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                editable={!isSendingRef.current}
              />
              <View style={styles.actionButtons}>
                <Pressable style={styles.iconCircle} onPress={() => {}}>
                  <Ionicons name="mic-outline" size={16} color={colors.ink60} />
                </Pressable>
                <Pressable
                  style={[
                    styles.iconCircle,
                    styles.sendCircle,
                    (!draftRef.current.trim() || isSendingRef.current) && styles.sendButtonDisabled,
                  ]}
                  disabled={!draftRef.current.trim() || isSendingRef.current}
                  onPress={() => onSendRef.current()}
                >
                  <Ionicons name="send" size={14} color="#fff" />
                </Pressable>
              </View>
            </View>
          </View>
        </BottomSheetFooter>
      );
    },
    [composerBottomPadding]
  );

  const listFooterHeight = composerBottomPadding + COMPOSER_HEIGHT + 16;

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
        enableContentPanningGesture={false}
        enablePanDownToClose
        onChange={handleSheetChange}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
        topInset={topInset}
        style={styles.sheetRoot}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handle}
        footerComponent={renderFooter}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerSpacer} />
          <Pressable style={styles.addButton} onPress={onCreateConversation}>
            <Ionicons name="add" size={18} color={colors.ink60} />
          </Pressable>
        </View>

        <BottomSheetFlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item: ChatMessage) => item.id}
          renderItem={renderMessage}
          style={styles.messagesScroll}
          contentContainerStyle={[
            styles.messagesContainer,
            { paddingBottom: listFooterHeight },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={[typography.titleM, styles.emptyStateText]}>{openingLine}</Text>
            </View>
          }
          ListFooterComponent={
            <>
              {isSending ? (
                <View style={styles.statusRow}>
                  <ActivityIndicator size="small" color={colors.orange} />
                  <Text style={[typography.bodyM, styles.statusText]}>正在生成回复...</Text>
                </View>
              ) : null}
              {errorMessage ? (
                <Text style={[typography.bodyM, styles.errorText]}>{errorMessage}</Text>
              ) : null}
            </>
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        />
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
    paddingHorizontal: 0,
    paddingTop: 4,
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
    marginTop: 8,
  },
  statusText: {
    color: colors.ink60,
  },
  errorText: {
    color: colors.danger,
    marginTop: 8,
  },
  inputSection: {
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  composerCard: {
    minHeight: 100,
    backgroundColor: colors.offWhite,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingTop: 12,
    paddingLeft: 16,
    paddingRight: 92,
    paddingBottom: 14,
  },
  actionButtons: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
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
    minHeight: 48,
    maxHeight: 84,
    color: colors.ink,
    fontFamily: 'DMSans_400Regular',
    fontSize: 15,
    lineHeight: 22,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  sendCircle: {
    backgroundColor: colors.orange,
    borderColor: colors.orange,
  },
  sendButtonDisabled: {
    opacity: 0.35,
  },
});
