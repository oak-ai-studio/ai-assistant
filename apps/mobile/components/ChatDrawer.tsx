import { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  onDraftChange: (value: string) => void;
  onClose: () => void;
  onSend: () => void;
  onCreateConversation: () => void;
  topInset: number;
};

const WINDOW_HEIGHT = Dimensions.get('window').height;
const MIN_HEIGHT = WINDOW_HEIGHT * 0.5;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function ChatDrawer({
  visible,
  snapIndex,
  messages,
  draft,
  onDraftChange,
  onClose,
  onSend,
  onCreateConversation,
  topInset,
}: ChatDrawerProps) {
  const insets = useSafeAreaInsets();
  const sheetHeight = useRef(new Animated.Value(0)).current;
  const currentHeight = useRef(0);

  const maxHeight = useMemo(
    () => Math.min(WINDOW_HEIGHT * 0.9, WINDOW_HEIGHT - topInset),
    [topInset]
  );

  const animateHeight = (toValue: number, onEnd?: () => void) => {
    Animated.spring(sheetHeight, {
      toValue,
      tension: 130,
      friction: 20,
      useNativeDriver: false,
    }).start(() => {
      currentHeight.current = toValue;
      onEnd?.();
    });
  };

  const closeSheet = () => {
    animateHeight(0, onClose);
  };

  useEffect(() => {
    if (!visible) {
      return;
    }

    const targetHeight = snapIndex === 1 ? maxHeight : MIN_HEIGHT;
    sheetHeight.setValue(0);
    currentHeight.current = 0;
    animateHeight(targetHeight);
  }, [maxHeight, sheetHeight, snapIndex, visible]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dy) > 4,
        onPanResponderGrant: () => {
          sheetHeight.stopAnimation((value) => {
            currentHeight.current = value;
          });
        },
        onPanResponderMove: (_, gestureState) => {
          const next = clamp(
            currentHeight.current - gestureState.dy,
            MIN_HEIGHT,
            maxHeight
          );
          sheetHeight.setValue(next);
        },
        onPanResponderRelease: (_, gestureState) => {
          const next = clamp(
            currentHeight.current - gestureState.dy,
            MIN_HEIGHT,
            maxHeight
          );

          if (gestureState.vy > 1.1 && next <= MIN_HEIGHT + 24) {
            closeSheet();
            return;
          }

          if (next > (MIN_HEIGHT + maxHeight) / 2) {
            animateHeight(maxHeight);
            return;
          }

          animateHeight(MIN_HEIGHT);
        },
      }),
    [maxHeight]
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={closeSheet}
      statusBarTranslucent
    >
      <View style={styles.modalRoot} pointerEvents="box-none">
        <Pressable style={styles.backdrop} onPress={closeSheet}>
          <BlurView intensity={16} tint="dark" style={StyleSheet.absoluteFill} />
        </Pressable>

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          <KeyboardAvoidingView
            style={styles.keyboardAvoiding}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.handleRow}>
              <View {...panResponder.panHandlers} style={styles.handleHitArea}>
                <View style={styles.handle} />
              </View>
              <Pressable style={styles.addButton} onPress={onCreateConversation}>
                <Ionicons name="add" size={18} color={colors.ink60} />
              </Pressable>
            </View>

            <View style={styles.messagesSection}>
              {messages.length === 0 ? (
                <Text style={[typography.titleM, styles.emptyStateText]}>
                  嗨呀，有什么我可以帮你的吗？
                </Text>
              ) : (
                messages.map((message) => {
                  const isUser = message.role === 'user';

                  return (
                    <View
                      key={message.id}
                      style={[styles.messageRow, isUser && styles.messageRowUser]}
                    >
                      {isUser ? (
                        <View style={styles.userBubble}>
                          <Text style={[typography.bodyL, styles.userMessageText]}>
                            {message.content}
                          </Text>
                        </View>
                      ) : (
                        <Text style={[typography.titleM, styles.assistantMessageText]}>
                          {message.content}
                        </Text>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            <View style={styles.inputSection}>
              <View style={styles.inputRow}>
                <TextInput
                  value={draft}
                  onChangeText={onDraftChange}
                  placeholder="说点什么..."
                  placeholderTextColor={colors.ink30}
                  style={styles.input}
                  onSubmitEditing={onSend}
                  returnKeyType="send"
                />
                <Pressable style={styles.iconButton} onPress={onSend}>
                  <Ionicons name="send" size={16} color="#fff" />
                </Pressable>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheet: {
    backgroundColor: colors.sandLight,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.ink10,
    overflow: 'hidden',
    ...shadows.lg,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  handleRow: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleHitArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 42,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.ink30,
  },
  addButton: {
    position: 'absolute',
    right: 20,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.offWhite,
  },
  messagesSection: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
  emptyStateText: {
    color: colors.ink,
    marginTop: 10,
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
  inputSection: {
    paddingTop: 10,
    paddingHorizontal: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.offWhite,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.ink,
    minHeight: 22,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
  },
});
