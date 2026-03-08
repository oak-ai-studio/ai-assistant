import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { MemoryType } from '@ai-assistant/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { MemoryTypeTag } from '@/components/MemoryTypeTag';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { MEMORY_TYPE_OPTIONS } from '@/constants/memory';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/error';
import { trpcClient } from '@/utils/trpc';

export default function CreateMemoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  const { toast, showToast, hideToast } = useToast();

  const [content, setContent] = useState('');
  const [type, setType] = useState<MemoryType>('preference');

  const createMutation = useMutation({
    mutationFn: (payload: { content: string; type: MemoryType }) =>
      trpcClient.memory.create.mutate({
        userId,
        content: payload.content,
        type: payload.type,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['memory', 'list', userId] });
      router.back();
    },
    onError: (error) => {
      showToast(getErrorMessage(error, '创建记忆失败'));
    },
  });

  const handleSave = async () => {
    const nextContent = content.trim();

    if (!userId || nextContent.length === 0) {
      showToast('请输入记忆内容');
      return;
    }

    await createMutation.mutateAsync({
      content: nextContent,
      type,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
            <Text style={[typography.bodyL, styles.backText]}>返回</Text>
          </Pressable>
        </View>

        <Text style={[typography.titleL, styles.title]}>创建记忆</Text>

        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[typography.mono, styles.sectionLabel]}>内容</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="例如：我更喜欢晚上学习"
              placeholderTextColor={colors.ink30}
              multiline
              maxLength={200}
              style={styles.contentInput}
              textAlignVertical="top"
            />
            <Text style={[typography.caption, styles.counter]}>{content.trim().length}/200</Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.mono, styles.sectionLabel]}>类型</Text>
            <View style={styles.typeRow}>
              {MEMORY_TYPE_OPTIONS.map((item) => (
                <MemoryTypeTag
                  key={item}
                  type={item}
                  selected={type === item}
                  onPress={() => setType(item)}
                />
              ))}
            </View>
          </View>
        </ScrollView>

        <Button
          onPress={() => {
            void handleSave();
          }}
          loading={status === 'loading' || createMutation.isPending}
          disabled={content.trim().length === 0 || !userId}
        >
          保存
        </Button>
      </View>

      <Toast
        visible={toast.visible}
        message={toast.message}
        variant={toast.variant}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.sand,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: colors.ink60,
  },
  title: {
    color: colors.ink,
  },
  form: {
    flex: 1,
  },
  formContent: {
    gap: 14,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    padding: 12,
    gap: 8,
  },
  sectionLabel: {
    color: colors.ink60,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  contentInput: {
    minHeight: 130,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.sandLight,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'DMSans_400Regular',
    fontSize: 14,
    color: colors.ink,
  },
  counter: {
    color: colors.ink60,
    textAlign: 'right',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
});
