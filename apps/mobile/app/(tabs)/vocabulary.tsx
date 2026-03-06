import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';
import {
  VOCABULARY_LIST_PAGE_CONTEXT,
  type PageContextPayload,
} from '@/constants/page-context';
import { TopRightMenu } from '@/components/TopRightMenu';
import { useGlobalChat } from '@/components/chat/ChatOverlayProvider';

type WordCard = {
  id: string;
  word: string;
  pos: string;
  meaning: string;
};

type VocabularyScreenProps = {
  initialChatPreset?: 'open' | 'empty' | 'full';
};

const mockWords: WordCard[] = [
  { id: '1', word: 'albeit', pos: 'conj.', meaning: '尽管' },
  { id: '2', word: 'who', pos: 'prep.', meaning: '谁' },
  { id: '3', word: 'cohesive', pos: 'adj.', meaning: '有凝聚力的' },
  { id: '4', word: 'vivid', pos: 'adj.', meaning: '生动的' },
  { id: '5', word: 'retain', pos: 'v.', meaning: '记住' },
  { id: '6', word: 'alleviate', pos: 'v.', meaning: '缓解' },
  { id: '7', word: 'notion', pos: 'n.', meaning: '概念' },
];

export function VocabularyScreen({ initialChatPreset }: VocabularyScreenProps) {
  const router = useRouter();
  const { menu, chat, drawer } = useLocalSearchParams<{
    menu?: string;
    chat?: string;
    drawer?: string;
  }>();
  const { closeChat, openChatWithPreset, setPageContext } = useGlobalChat();
  const [menuVisible, setMenuVisible] = useState(false);
  const [currentWord, setCurrentWord] = useState<WordCard>(mockWords[0]);

  const contextPayload = useMemo<PageContextPayload>(
    () => ({
      ...VOCABULARY_LIST_PAGE_CONTEXT,
      data: {
        current_word: {
          word: currentWord.word,
          pos: currentWord.pos,
        },
      },
    }),
    [currentWord.pos, currentWord.word]
  );

  useEffect(() => {
    setPageContext(contextPayload);
  }, [contextPayload, setPageContext]);

  useEffect(() => {
    setMenuVisible(menu === 'open');
  }, [menu]);

  useEffect(() => {
    if (initialChatPreset) {
      openChatWithPreset(initialChatPreset);
      return;
    }

    const menuPreset =
      menu === 'chat-open'
        ? 'open'
        : menu === 'chat-empty'
          ? 'empty'
          : menu === 'chat-full'
            ? 'full'
            : menu === 'chat-close'
              ? 'close'
              : undefined;
    const preset = drawer ?? chat ?? menuPreset;

    if (preset === 'open' || preset === 'empty' || preset === 'full') {
      openChatWithPreset(preset);
      return;
    }

    if (preset === 'close') {
      closeChat();
    }
  }, [chat, closeChat, drawer, initialChatPreset, menu, openChatWithPreset]);

  return (
    <SafeAreaView style={styles.container}>
      <TopRightMenu
        visible={menuVisible}
        onVisibleChange={setMenuVisible}
        items={[
          {
            key: 'settings',
            label: '配置',
            onPress: () => router.push('/(skills)/vocabulary/settings'),
          },
          {
            key: 'disable',
            label: '停用技能',
            destructive: true,
            onPress: () => router.push('/(skills)/vocabulary/settings?disable=confirm'),
          },
        ]}
      />

      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
            <Text style={[typography.titleM, styles.headerTitle]}>背单词</Text>
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        >
          {mockWords.map((word) => {
            const isActive = word.id === currentWord.id;

            return (
              <Pressable
                key={word.id}
                style={[styles.wordCard, isActive && styles.wordCardActive]}
                onPress={() => setCurrentWord(word)}
              >
                <Text style={[typography.titleM, styles.wordText]}>
                  {word.word} {word.pos}
                </Text>
                <Text style={[typography.bodyM, styles.meaningText]}>{word.meaning}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

export default function VocabularyRouteScreen() {
  return <VocabularyScreen />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerRow: {
    marginTop: 16,
    marginBottom: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  headerTitle: {
    color: colors.ink,
  },
  listContent: {
    paddingBottom: 120,
    gap: 12,
  },
  wordCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingHorizontal: 18,
    paddingVertical: 16,
    ...shadows.sm,
  },
  wordCardActive: {
    borderColor: colors.orange50,
    backgroundColor: colors.orange10,
  },
  wordText: {
    color: colors.ink,
    marginBottom: 4,
  },
  meaningText: {
    color: colors.ink60,
  },
});
