import { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';
import { HOME_PAGE_CONTEXT } from '@/constants/page-context';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { TopRightMenu } from '@/components/TopRightMenu';
import { useGlobalChat } from '@/components/chat/ChatOverlayProvider';
import { ASSISTANT_SKILLS, type AssistantSkillId } from '@/constants/assistant-config';
import { listSkills } from '@/utils/api';
import { resolveSkillIcon, SKILL_SUBTITLE_MAP } from '@/utils/skills';
import { getAssistantSettings } from '@/utils/assistant-settings';
import { useUserId } from '@/utils/userId';
import { useAuth } from '@/hooks/useAuth';

type Reminder = {
  id: string;
  text: string;
  tag: string;
};

type SkillCardItem = {
  id: string;
  name: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  subtitle: string;
};

const mockReminders: Reminder[] = [
  { id: '1', text: '今天还差 5 个单词就完成目标了', tag: '背单词' },
  { id: '2', text: '你已经连续学习 7 天了，继续加油！', tag: '做饭' },
];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return '上午好～';
  if (hour < 18) return '下午好～';
  return '晚上好～';
};

function ScalePressable({
  onPress,
  style,
  children,
}: {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      style={style}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 20, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 220 });
      }}
      onPress={onPress}
    >
      <Animated.View style={[animatedStyle, styles.scaledContent]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { state, menu, chat } = useLocalSearchParams<{
    state?: string;
    menu?: string;
    chat?: string;
  }>();
  const { openChat, setPageContext } = useGlobalChat();
  const { signOut } = useAuth();
  const { userId, isLoading: userIdLoading } = useUserId();

  const [settingsVisible, setSettingsVisible] = useState(false);
  const [legacyMenuVisible, setLegacyMenuVisible] = useState(false);
  const [localActiveSkills, setLocalActiveSkills] = useState<AssistantSkillId[]>([]);

  const isEmptyState = state === 'empty';

  const reminders = useMemo(
    () => (isEmptyState ? [] : mockReminders).slice(0, 3),
    [isEmptyState]
  );

  const skillQuery = useQuery({
    queryKey: ['skills', 'list', userId],
    queryFn: () => listSkills({ userId }),
    enabled: userId.length > 0,
  });

  const skills = useMemo<SkillCardItem[]>(() => {
    const source = skillQuery.data?.skills ?? [];

    const activeSkills = source
      .filter((skill) => skill.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        icon: resolveSkillIcon(skill.id, skill.icon),
        subtitle: SKILL_SUBTITLE_MAP[skill.id] ?? '开始使用这个技能',
      }));

    if (isEmptyState) {
      return activeSkills.filter((skill) => skill.id === 'chat');
    }

    return activeSkills;
  }, [isEmptyState, skillQuery.data?.skills]);

  const fallbackSkills = useMemo<SkillCardItem[]>(() => {
    if (localActiveSkills.length === 0) {
      return [];
    }

    return localActiveSkills
      .map((skillId) => ASSISTANT_SKILLS.find((item) => item.id === skillId))
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .map((skill) => ({
        id: skill.id,
        name: skill.name,
        icon: skill.icon,
        subtitle: SKILL_SUBTITLE_MAP[skill.id] ?? skill.desc,
      }));
  }, [localActiveSkills]);

  const displaySkills = useMemo(() => {
    if (skills.length > 0) {
      return skills;
    }

    if (fallbackSkills.length > 0) {
      return fallbackSkills;
    }

    return [];
  }, [fallbackSkills, skills]);

  const onRouteFromMenu = (route: '/settings/assistant' | '/(tabs)/memory') => {
    setSettingsVisible(false);
    setLegacyMenuVisible(false);
    router.push(route);
  };

  const handleSignOut = async () => {
    setSettingsVisible(false);
    setLegacyMenuVisible(false);
    await signOut();
    router.replace('/(onboarding)');
  };

  useEffect(() => {
    setSettingsVisible(menu === 'open');
    setLegacyMenuVisible(menu === 'legacy');
  }, [menu]);

  useEffect(() => {
    setPageContext(HOME_PAGE_CONTEXT);
  }, [setPageContext]);

  useEffect(() => {
    if (chat === 'open') {
      openChat();
    }
  }, [chat, openChat]);

  useEffect(() => {
    let mounted = true;

    const loadLocalSettings = async () => {
      const settings = await getAssistantSettings();
      if (!mounted) {
        return;
      }

      setLocalActiveSkills(settings.activeSkills);
    };

    void loadLocalSettings();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!__DEV__) {
      return;
    }

    console.log('[HomeScreen] skills debug', {
      userId,
      userIdLoading,
      queryStatus: skillQuery.status,
      queryError: skillQuery.error instanceof Error ? skillQuery.error.message : null,
      apiSkills: skillQuery.data?.skills,
      fallbackSkills: localActiveSkills,
      finalRenderCount: displaySkills.length,
    });
  }, [
    displaySkills.length,
    localActiveSkills,
    skillQuery.data?.skills,
    skillQuery.error,
    skillQuery.status,
    userId,
    userIdLoading,
  ]);

  const onSkillPress = (skillId: string) => {
    if (skillId === 'vocab' || skillId === 'vocabulary' || skillId === 'english_learning') {
      router.push('/(tabs)/vocabulary' as never);
      return;
    }

    if (skillId === 'chat') {
      openChat();
      return;
    }

    if (skillId === 'cooking') {
      router.push('/(tabs)/cooking' as never);
      return;
    }

    openChat();
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopRightMenu
        visible={settingsVisible}
        onVisibleChange={setSettingsVisible}
        items={[
          {
            key: 'assistant',
            label: '助理',
            onPress: () => onRouteFromMenu('/settings/assistant'),
          },
          {
            key: 'memory',
            label: '记忆',
            onPress: () => onRouteFromMenu('/(tabs)/memory'),
          },
          {
            key: 'signout',
            label: '退出登录',
            destructive: true,
            onPress: () => {
              void handleSignOut();
            },
          },
        ]}
      />

      <View style={styles.inner}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.greetingRow}>
            <View>
              <Text style={[typography.titleL, styles.greeting]}>{getGreeting()}</Text>
              <Text style={[typography.titleL, styles.question]}>有什么需要？</Text>
            </View>
          </View>

          <View style={styles.reminderCard}>
            {reminders.length === 0 ? (
              <Text style={[typography.bodyL, styles.emptyReminderText]}>无提醒</Text>
            ) : (
              reminders.map((reminder, index) => (
                <View key={reminder.id} style={styles.reminderItem}>
                  <Text style={[typography.bodyL, styles.reminderText]}>
                    {index + 1}. {reminder.text}
                  </Text>
                  <Badge variant="orange">{reminder.tag}</Badge>
                </View>
              ))
            )}
          </View>

          {userIdLoading || skillQuery.isLoading ? (
            <View style={styles.statusCard}>
              <Text style={[typography.bodyL, styles.statusText]}>技能加载中...</Text>
            </View>
          ) : skillQuery.isError ? (
            <View style={styles.statusCard}>
              <Text style={[typography.bodyL, styles.statusText]}>技能加载失败，请重试</Text>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => {
                  void skillQuery.refetch();
                }}
              >
                重试
              </Button>
            </View>
          ) : displaySkills.length === 0 ? (
            <View style={styles.statusCard}>
              <Text style={[typography.bodyL, styles.statusText]}>暂无可用技能，先去配置助理吧</Text>
              <Button size="sm" onPress={() => onRouteFromMenu('/settings/assistant')}>
                去配置
              </Button>
            </View>
          ) : (
            <View style={styles.skillGrid}>
              {displaySkills.map((skill) => (
                <ScalePressable
                  key={skill.id}
                  style={[styles.skillCard, displaySkills.length === 1 && styles.skillCardSingle]}
                  onPress={() => onSkillPress(skill.id)}
                >
                  <View style={styles.skillIconBox}>
                    <Ionicons name={skill.icon} size={18} color={colors.ink60} style={styles.icon18} />
                  </View>
                  <Text style={[typography.titleM, styles.skillTitle]}>{skill.name}</Text>
                  <Text
                    style={[typography.bodyM, styles.skillSubtitle]}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {skill.subtitle}
                  </Text>
                  <View style={styles.skillDot}>
                    <View style={styles.skillDotCircle}>
                      <Ionicons
                        name="chatbubble-ellipses-outline"
                        size={12}
                        color={colors.ink60}
                        style={styles.icon12}
                      />
                    </View>
                  </View>
                </ScalePressable>
              ))}
            </View>
          )}
        </ScrollView>
      </View>

      <Modal
        transparent
        visible={legacyMenuVisible}
        animationType="fade"
        onRequestClose={() => setLegacyMenuVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setLegacyMenuVisible(false)}>
          <View style={styles.menuCard}>
            <Pressable
              style={styles.menuItem}
              onPress={() => onRouteFromMenu('/settings/assistant')}
            >
              <Text style={[typography.bodyL, styles.menuText]}>助理</Text>
            </Pressable>

            <Pressable
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => onRouteFromMenu('/(tabs)/memory')}
            >
              <Text style={[typography.bodyL, styles.menuText]}>记忆</Text>
            </Pressable>

            <Pressable
              style={[styles.menuItem, styles.menuItemBorder]}
              onPress={() => {
                void handleSignOut();
              }}
            >
              <Text style={[typography.bodyL, styles.menuTextDanger]}>退出登录</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  scaledContent: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 120,
    gap: 14,
  },
  greetingRow: {
    marginTop: 16,
    marginBottom: 8,
  },
  greeting: {
    color: colors.ink,
  },
  question: {
    color: colors.ink,
    marginTop: 2,
  },
  reminderCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 124,
    justifyContent: 'center',
    ...shadows.sm,
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  reminderText: {
    color: colors.ink,
    flex: 1,
  },
  emptyReminderText: {
    color: colors.ink60,
  },
  statusCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
    ...shadows.sm,
  },
  statusText: {
    color: colors.ink60,
  },
  skillGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillCard: {
    width: '48%',
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    height: 128,
    justifyContent: 'flex-start',
    ...shadows.sm,
  },
  skillCardSingle: {
    width: '100%',
  },
  skillIconBox: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.ink10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandLight,
    marginBottom: 10,
  },
  skillTitle: {
    color: colors.ink,
    marginBottom: 4,
    paddingRight: 36,
  },
  skillSubtitle: {
    color: colors.ink60,
    paddingRight: 36,
  },
  skillDot: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    width: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skillDotCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandLight,
  },
  icon12: {
    lineHeight: 12,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  icon18: {
    lineHeight: 18,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,24,20,0.12)',
    paddingTop: 100,
    paddingRight: 24,
    alignItems: 'flex-end',
  },
  menuCard: {
    width: 132,
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink10,
    overflow: 'hidden',
    ...shadows.md,
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: colors.ink10,
  },
  menuText: {
    color: colors.ink,
  },
  menuTextDanger: {
    color: colors.danger,
  },
});
