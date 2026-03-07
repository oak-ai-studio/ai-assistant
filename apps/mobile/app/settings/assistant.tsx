import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import {
  ASSISTANT_SKILLS,
  type AssistantSkillId,
  parseAssistantSkills,
} from '@/constants/assistant-config';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';
import { listSkills, reorderSkills, updateSkill } from '@/utils/api';
import {
  mapAssistantSkillIdToBackend,
  mapBackendSkillIdToAssistant,
} from '@/utils/skills';
import { useUserId } from '@/utils/userId';
import {
  getAssistantSettings,
  saveAssistantSettings,
} from '@/utils/assistant-settings';

type SkillLabelMap = Partial<Record<AssistantSkillId, string>>;

function SkillCheckbox({
  label,
  checked,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onToggle,
}: {
  label: string;
  checked: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.skillItem, checked && styles.skillItemChecked]}
    >
      <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
        {checked && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
      <Text style={[typography.bodyL, styles.skillLabel]}>{label}</Text>

      <View style={styles.orderActions}>
        <Pressable
          style={[styles.orderButton, !canMoveUp && styles.orderButtonDisabled]}
          onPress={onMoveUp}
          disabled={!canMoveUp}
        >
          <Ionicons name="chevron-up" size={14} color={canMoveUp ? colors.ink60 : colors.ink30} />
        </Pressable>
        <Pressable
          style={[styles.orderButton, !canMoveDown && styles.orderButtonDisabled]}
          onPress={onMoveDown}
          disabled={!canMoveDown}
        >
          <Ionicons
            name="chevron-down"
            size={14}
            color={canMoveDown ? colors.ink60 : colors.ink30}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const DEFAULT_SKILL_ORDER: AssistantSkillId[] = ASSISTANT_SKILLS.map((skill) => skill.id);

const uniqueSkillOrder = (ids: AssistantSkillId[]) => {
  const ordered = new Set<AssistantSkillId>();

  for (const id of ids) {
    ordered.add(id);
  }

  for (const fallbackId of DEFAULT_SKILL_ORDER) {
    ordered.add(fallbackId);
  }

  return [...ordered];
};

export default function AssistantSettingsScreen() {
  const router = useRouter();
  const { userId } = useUserId();
  const {
    previewName,
    previewRole,
    previewActiveSkills,
    previewOriginalSkills,
  } = useLocalSearchParams<{
    previewName?: string;
    previewRole?: string;
    previewActiveSkills?: string;
    previewOriginalSkills?: string;
  }>();

  const [assistantName, setAssistantName] = useState('');
  const [assistantRole, setAssistantRole] = useState('');
  const [activeSkills, setActiveSkills] = useState<AssistantSkillId[]>([]);
  const [originalSkills, setOriginalSkills] = useState<AssistantSkillId[]>([]);
  const [skillOrder, setSkillOrder] = useState<AssistantSkillId[]>(DEFAULT_SKILL_ORDER);
  const [skillLabels, setSkillLabels] = useState<SkillLabelMap>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [apiHydrated, setApiHydrated] = useState(false);

  const skillsQuery = useQuery({
    queryKey: ['skills', 'list', userId],
    queryFn: () => listSkills({ userId }),
    enabled: userId.length > 0,
  });

  const updateSkillMutation = useMutation({
    mutationFn: updateSkill,
  });

  const reorderSkillMutation = useMutation({
    mutationFn: reorderSkills,
  });

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getAssistantSettings();
      const previewActive = parseAssistantSkills(previewActiveSkills);
      const previewOriginal = parseAssistantSkills(previewOriginalSkills);

      setAssistantName(previewName ?? settings.assistantName);
      setAssistantRole(previewRole ?? settings.assistantRole);
      setActiveSkills(previewActive.length > 0 ? previewActive : settings.activeSkills);
      setOriginalSkills(previewOriginal.length > 0 ? previewOriginal : settings.activeSkills);
      setSkillOrder(uniqueSkillOrder(settings.activeSkills));
      setLoading(false);
    };

    void loadSettings();
  }, [previewActiveSkills, previewName, previewOriginalSkills, previewRole]);

  useEffect(() => {
    if (apiHydrated || !skillsQuery.data?.skills) {
      return;
    }

    const mapped = skillsQuery.data.skills
      .map((skill) => {
        const mappedId = mapBackendSkillIdToAssistant(skill.id);
        return mappedId
          ? {
              appSkillId: mappedId,
              sortOrder: skill.sortOrder,
              name: skill.name,
              isActive: skill.isActive,
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (mapped.length === 0) {
      setApiHydrated(true);
      return;
    }

    const labels: SkillLabelMap = {};
    for (const item of mapped) {
      labels[item.appSkillId] = item.name;
    }

    const activeFromApi = mapped
      .filter((item) => item.isActive)
      .map((item) => item.appSkillId);
    const orderFromApi = mapped.map((item) => item.appSkillId);

    setSkillLabels(labels);
    setSkillOrder(uniqueSkillOrder(orderFromApi));

    if (!previewActiveSkills) {
      setActiveSkills(activeFromApi);
      setOriginalSkills(activeFromApi);
    }

    setApiHydrated(true);
  }, [apiHydrated, previewActiveSkills, skillsQuery.data?.skills]);

  const orderedActiveSkills = useMemo(
    () => skillOrder.filter((skillId) => activeSkills.includes(skillId)),
    [activeSkills, skillOrder]
  );

  const newSkills = useMemo(
    () => orderedActiveSkills.filter((skillId) => !originalSkills.includes(skillId)),
    [orderedActiveSkills, originalSkills]
  );

  const hasNewSkills = newSkills.length > 0;

  const toggleSkill = (skillId: AssistantSkillId) => {
    setActiveSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((item) => item !== skillId)
        : [...prev, skillId]
    );
  };

  const moveSkill = (skillId: AssistantSkillId, direction: -1 | 1) => {
    setSkillOrder((prev) => {
      const index = prev.indexOf(skillId);
      const targetIndex = index + direction;

      if (index < 0 || targetIndex < 0 || targetIndex >= prev.length) {
        return prev;
      }

      const next = [...prev];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const handleSubmit = async () => {
    if (saving) {
      return;
    }

    setSaving(true);
    setSubmitError(null);

    try {
      await saveAssistantSettings({
        assistantName,
        assistantRole,
        activeSkills: orderedActiveSkills,
      });

      if (userId) {
        const skillOrders = skillOrder.map((skillId, index) => ({
          appSkillId: skillId,
          backendSkillId: mapAssistantSkillIdToBackend(skillId),
          sortOrder: index,
        }));

        await Promise.all(
          skillOrders.map((item) =>
            updateSkillMutation.mutateAsync({
              userId,
              skillId: item.backendSkillId,
              isActive: orderedActiveSkills.includes(item.appSkillId),
              sortOrder: item.sortOrder,
            })
          )
        );

        await reorderSkillMutation.mutateAsync({
          userId,
          skillOrders: skillOrders.map((item) => ({
            skillId: item.backendSkillId,
            sortOrder: item.sortOrder,
          })),
        });
      }

      if (!hasNewSkills) {
        router.replace('/(tabs)');
        return;
      }

      router.push({
        pathname: '/settings/skill-init',
        params: {
          skills: newSkills.join(','),
          step: '0',
        },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.orange} />
        </View>
      </SafeAreaView>
    );
  }

  const syncingSkills = skillsQuery.isLoading || updateSkillMutation.isPending || reorderSkillMutation.isPending;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100 }}
        >
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
            <Text style={[typography.bodyL, styles.backText]}>配置助理</Text>
          </Pressable>

          <View style={styles.avatar}>
            <Text style={styles.avatarText}>助</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[typography.mono, styles.fieldLabel]}>称呼</Text>
            <TextInput
              value={assistantName}
              onChangeText={setAssistantName}
              placeholder="安迪"
              placeholderTextColor={colors.ink30}
              style={styles.input}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[typography.mono, styles.fieldLabel]}>角色</Text>
            <TextInput
              value={assistantRole}
              onChangeText={setAssistantRole}
              placeholder="你是我的私人助理"
              placeholderTextColor={colors.ink30}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.input, styles.textarea]}
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[typography.mono, styles.fieldLabel]}>技能</Text>
            <Text style={[typography.bodyM, styles.skillTip]}>拖动替代方案：使用上下箭头调整顺序</Text>

            <View style={styles.skillListWrap}>
              {skillOrder.map((skillId, index) => {
                const config = ASSISTANT_SKILLS.find((item) => item.id === skillId);
                if (!config) {
                  return null;
                }

                const label = skillLabels[skillId] ?? config.name;

                return (
                  <SkillCheckbox
                    key={skillId}
                    label={label}
                    checked={activeSkills.includes(skillId)}
                    canMoveUp={index > 0}
                    canMoveDown={index < skillOrder.length - 1}
                    onMoveUp={() => moveSkill(skillId, -1)}
                    onMoveDown={() => moveSkill(skillId, 1)}
                    onToggle={() => toggleSkill(skillId)}
                  />
                );
              })}
            </View>
          </View>

          {skillsQuery.isError ? (
            <View style={styles.errorCard}>
              <Text style={[typography.bodyM, styles.errorText]}>技能同步失败，请稍后重试</Text>
            </View>
          ) : null}

          {submitError ? (
            <View style={styles.errorCard}>
              <Text style={[typography.bodyM, styles.errorText]}>{submitError}</Text>
            </View>
          ) : null}
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 120 }}
          style={styles.bottomAction}
        >
          <Button onPress={handleSubmit} loading={saving || syncingSkills}>
            {hasNewSkills ? '下一项' : '完成'}
          </Button>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 20,
  },
  backText: {
    color: colors.ink,
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: colors.orange,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarText: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 26,
    color: '#fff',
  },
  fieldGroup: {
    marginBottom: 20,
    gap: 8,
  },
  fieldLabel: {
    color: colors.ink60,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.sandLight,
    borderWidth: 1.5,
    borderColor: colors.ink10,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.ink,
  },
  textarea: {
    minHeight: 94,
    paddingTop: 11,
  },
  skillTip: {
    color: colors.ink60,
  },
  skillListWrap: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    padding: 12,
    gap: 10,
    ...shadows.sm,
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: colors.ink10,
    borderRadius: radius.md,
    backgroundColor: colors.offWhite,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  skillItemChecked: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeBg,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.ink30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandLight,
  },
  checkboxChecked: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  skillLabel: {
    color: colors.ink,
    flex: 1,
  },
  orderActions: {
    flexDirection: 'column',
    gap: 4,
  },
  orderButton: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.sandLight,
  },
  orderButtonDisabled: {
    backgroundColor: colors.offWhite,
  },
  errorCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: 'rgba(217,79,61,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  errorText: {
    color: colors.danger,
  },
  bottomAction: {
    marginTop: 16,
  },
});
