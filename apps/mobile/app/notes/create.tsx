import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/error';
import { trpcClient } from '@/utils/trpc';

const TITLE_MAX_LENGTH = 40;
const CONTENT_MAX_LENGTH = 1000;

export default function CreateNoteScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  const { toast, showToast, hideToast } = useToast();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const createMutation = useMutation({
    mutationFn: (payload: { title?: string; content: string }) =>
      trpcClient.notes.create.mutate({
        userId,
        title: payload.title,
        content: payload.content,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notes', 'list', userId] });
      router.back();
    },
    onError: (error) => {
      showToast(getErrorMessage(error, '创建笔记失败'));
    },
  });

  const handleSave = async () => {
    const nextContent = content.trim();
    const nextTitle = title.trim();

    if (!userId || nextContent.length === 0) {
      showToast('请输入笔记内容');
      return;
    }

    await createMutation.mutateAsync({
      title: nextTitle.length > 0 ? nextTitle : undefined,
      content: nextContent,
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

        <Text style={[typography.titleL, styles.title]}>创建笔记</Text>

        <ScrollView
          style={styles.form}
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={[typography.mono, styles.sectionLabel]}>标题</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="给笔记起个标题（可选）"
              placeholderTextColor={colors.ink30}
              maxLength={TITLE_MAX_LENGTH}
              style={styles.titleInput}
            />
            <Text style={[typography.caption, styles.counter]}>
              {title.trim().length}/{TITLE_MAX_LENGTH}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[typography.mono, styles.sectionLabel]}>内容</Text>
            <TextInput
              value={content}
              onChangeText={setContent}
              placeholder="快速记录你的想法"
              placeholderTextColor={colors.ink30}
              multiline
              maxLength={CONTENT_MAX_LENGTH}
              style={styles.contentInput}
              textAlignVertical="top"
            />
            <Text style={[typography.caption, styles.counter]}>
              {content.trim().length}/{CONTENT_MAX_LENGTH}
            </Text>
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
  titleInput: {
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
  contentInput: {
    minHeight: 140,
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
});
