import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { MotiView } from 'moti';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';

function AssistantAvatar() {
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>助</Text>
    </View>
  );
}

export default function NameScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const handleNext = () => {
    router.push('/(onboarding)/choose-skill');
  };

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
          <AssistantAvatar />

          <Text style={[typography.titleL, styles.title]}>
            给助理起个名字？
          </Text>

          {/* 称呼 */}
          <View style={styles.fieldGroup}>
            <Text style={[typography.mono, styles.fieldLabel]}>称呼</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="安迪"
              placeholderTextColor={colors.ink30}
              style={styles.input}
            />
          </View>

          {/* 角色 */}
          <View style={styles.fieldGroup}>
            <Text style={[typography.mono, styles.fieldLabel]}>角色</Text>
            <TextInput
              value={role}
              onChangeText={setRole}
              placeholder="你是我的全能助理，了解我的喜好，帮我管理日常事务..."
              placeholderTextColor={colors.ink30}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.input, styles.textarea]}
            />
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 100, delay: 160 }}
          style={styles.buttonSection}
        >
          <Button onPress={handleNext}>下一项（1/2）</Button>
          <Button variant="ghost" onPress={handleNext}>跳过</Button>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  avatar: {
    width: 64,
    height: 64,
    backgroundColor: colors.orange,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  avatarText: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 26,
    color: '#fff',
  },
  title: {
    color: colors.ink,
    marginBottom: 28,
  },
  fieldGroup: {
    marginBottom: 20,
    gap: 6,
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
    height: 100,
    paddingTop: 11,
  },
  buttonSection: {
    gap: 10,
    marginTop: 32,
  },
});
