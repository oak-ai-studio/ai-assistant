import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';

type ChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

interface ChatDrawerProps {
  visible: boolean;
  messages: ChatMessage[];
  onClose: () => void;
  onCreateConversation: () => void;
}

const WINDOW_HEIGHT = Dimensions.get('window').height;
const MIN_HEIGHT = WINDOW_HEIGHT * 0.5;
const MAX_HEIGHT = WINDOW_HEIGHT * 0.88;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function ChatDrawer({
  visible,
  messages,
  onClose,
  onCreateConversation,
}: ChatDrawerProps) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState('');
  const sheetHeight = useRef(new Animated.Value(0)).current;
  const currentHeight = useRef(0);

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
    if (visible) {
      sheetHeight.setValue(0);
      currentHeight.current = 0;
      animateHeight(MIN_HEIGHT);
    }
  }, [sheetHeight, visible]);

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
            MAX_HEIGHT
          );
          sheetHeight.setValue(next);
        },
        onPanResponderRelease: (_, gestureState) => {
          const next = clamp(
            currentHeight.current - gestureState.dy,
            MIN_HEIGHT,
            MAX_HEIGHT
          );

          if (gestureState.vy > 1.2 && next <= MIN_HEIGHT + 24) {
            closeSheet();
            return;
          }

          if (next > (MIN_HEIGHT + MAX_HEIGHT) / 2) {
            animateHeight(MAX_HEIGHT);
            return;
          }

          animateHeight(MIN_HEIGHT);
        },
      }),
    []
  );

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={closeSheet}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        <Pressable style={styles.backdrop} onPress={closeSheet} />

        <Animated.View
          style={[
            styles.sheet,
            {
              height: sheetHeight,
              paddingBottom: Math.max(insets.bottom, 14),
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

            <ScrollView
              style={styles.messagesScroll}
              contentContainerStyle={styles.messagesContainer}
              showsVerticalScrollIndicator={false}
            >
              {messages.map((message) => {
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
              })}
            </ScrollView>

            <View style={styles.inputRow}>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder="输入你的问题"
                placeholderTextColor={colors.ink30}
                style={styles.input}
              />
              <Pressable style={styles.iconButton}>
                <Ionicons name="mic-outline" size={18} color={colors.ink60} />
              </Pressable>
              <Pressable style={[styles.iconButton, styles.sendButton]}>
                <Ionicons name="send" size={16} color="#fff" />
              </Pressable>
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
    backgroundColor: 'rgba(26,24,20,0.26)',
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
    height: 54,
    justifyContent: 'center',
    alignItems: 'center',
  },
  handleHitArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 54,
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 8,
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
    backgroundColor: colors.sand,
  },
  sendButton: {
    backgroundColor: colors.orange,
  },
});
