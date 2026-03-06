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
import {
  getAssistantSettings,
  saveAssistantSettings,
} from '@/utils/assistant-settings';

function SkillCheckbox({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
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
      const previewActive = parseAssistantSkills(previewActiveSkills);
      const previewOriginal = parseAssistantSkills(previewOriginalSkills);

      setAssistantName(previewName ?? settings.assistantName);
      setAssistantRole(previewRole ?? settings.assistantRole);
      setActiveSkills(previewActive.length > 0 ? previewActive : settings.activeSkills);
      setOriginalSkills(previewOriginal.length > 0 ? previewOriginal : settings.activeSkills);
      setLoading(false);
    };

    loadSettings();
  }, [previewActiveSkills, previewName, previewOriginalSkills, previewRole]);

  const newSkills = useMemo(
    () => activeSkills.filter((skillId) => !originalSkills.includes(skillId)),
    [activeSkills, originalSkills]
  );

  const hasNewSkills = newSkills.length > 0;

  const toggleSkill = (skillId: AssistantSkillId) => {
    setActiveSkills((prev) =>
      prev.includes(skillId)
        ? prev.filter((item) => item !== skillId)
        : [...prev, skillId]
    );
  };

  const handleSubmit = async () => {
    if (saving) {
      return;
    }

    setSaving(true);

    try {
      await saveAssistantSettings({
        assistantName,
        assistantRole,
        activeSkills,
      });

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
            <View style={styles.skillListWrap}>
              {ASSISTANT_SKILLS.map((skill) => (
                <SkillCheckbox
                  key={skill.id}
                  label={skill.name}
                  checked={activeSkills.includes(skill.id)}
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
          style={styles.bottomAction}
        >
          <Button onPress={handleSubmit} loading={saving}>
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
  },
  bottomAction: {
    marginTop: 16,
  },
});
