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
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import {
  ASSISTANT_SKILLS,
  type AssistantSkillId,
  getSkillConfigStepCount,
  parseAssistantSkillsParam,
} from '@/constants/assistant-skills';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';
import {
  getAssistantSettings,
  saveAssistantSettings,
} from '@/utils/assistant-settings';

function SkillCard({
  name,
  selected,
  onToggle,
}: {
  name: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 20, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 20, stiffness: 200 });
      }}
      onPress={onToggle}
    >
      <Animated.View
        style={[animatedStyle, styles.skillCard, selected && styles.skillCardSelected]}
      >
        <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
          {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
        </View>
        <Text style={[typography.bodyL, styles.skillText]}>{name}</Text>
      </Animated.View>
    </Pressable>
  );
}

export default function AssistantSettingsScreen() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      const settings = await getAssistantSettings();

      const parsedPreviewActiveSkills = parseAssistantSkillsParam(previewActiveSkills);
      const parsedPreviewOriginalSkills = parseAssistantSkillsParam(previewOriginalSkills);

      const resolvedActiveSkills =
        parsedPreviewActiveSkills.length > 0
          ? parsedPreviewActiveSkills
          : settings.activeSkills;
      const resolvedOriginalSkills =
        parsedPreviewOriginalSkills.length > 0
          ? parsedPreviewOriginalSkills
          : settings.activeSkills;

      setAssistantName(previewName ?? settings.assistantName);
      setAssistantRole(previewRole ?? settings.assistantRole);
      setActiveSkills(resolvedActiveSkills);
      setOriginalSkills(resolvedOriginalSkills);
      setLoading(false);
    };

    loadSettings();
  }, [previewActiveSkills, previewName, previewOriginalSkills, previewRole]);

  const newSkills = useMemo(
    () => activeSkills.filter((skillId) => !originalSkills.includes(skillId)),
    [activeSkills, originalSkills]
  );

  const hasNewSkills = newSkills.length > 0;
  const totalSteps = 1 + getSkillConfigStepCount(newSkills);

  const toggleSkill = (skillId: AssistantSkillId) => {
    setActiveSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((item) => item !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSave = async () => {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      const saved = await saveAssistantSettings({
        assistantName,
        assistantRole,
        activeSkills,
      });

      if (!hasNewSkills) {
        router.replace('/(tabs)');
        return;
      }

      router.push({
        pathname: '/settings/skill-config',
        params: {
          skills: newSkills.join(','),
          currentStepStart: '2',
          totalSteps: String(totalSteps),
        },
      });

      setAssistantName(saved.assistantName);
      setAssistantRole(saved.assistantRole);
      setActiveSkills(saved.activeSkills);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="small" color={colors.orange} />
        </View>
      </SafeAreaView>
    );
  }

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
            <View style={styles.skillList}>
              {ASSISTANT_SKILLS.map((skill) => (
                <SkillCard
                  key={skill.id}
                  name={skill.name}
                  selected={activeSkills.includes(skill.id)}
                  onToggle={() => toggleSkill(skill.id)}
                />
              ))}
            </View>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 120 }}
          style={styles.buttonWrap}
        >
          <Button onPress={handleSave} loading={saving}>
            {hasNewSkills ? `下一项（1/${totalSteps}）` : '完成'}
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
    minHeight: 96,
    paddingTop: 11,
  },
  skillList: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    padding: 12,
    gap: 10,
    ...shadows.sm,
  },
  skillCard: {
    borderWidth: 1,
    borderColor: colors.ink10,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.offWhite,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  skillCardSelected: {
    backgroundColor: colors.orangeBg,
    borderColor: colors.orange,
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
  checkboxSelected: {
    borderColor: colors.orange,
    backgroundColor: colors.orange,
  },
  skillText: {
    color: colors.ink,
  },
  buttonWrap: {
    marginTop: 24,
  },
});
