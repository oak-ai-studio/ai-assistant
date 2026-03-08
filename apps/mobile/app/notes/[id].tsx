import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { NoteCardSkeleton } from '@/components/NoteCardSkeleton';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { formatNoteDateTime, type NoteListItem } from '@/constants/notes';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/error';
import { trpcClient } from '@/utils/trpc';

const TITLE_MAX_LENGTH = 40;
const CONTENT_MAX_LENGTH = 1000;

export default function EditNoteScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const { toast, showToast, hideToast } = useToast();

  const noteId = useMemo(() => {
    if (typeof params.id === 'string') {
      return params.id;
    }

    if (Array.isArray(params.id)) {
      return params.id[0] ?? '';
    }

    return '';
  }, [params.id]);

  const noteQuery = useQuery({
    queryKey: ['notes', 'detail', userId, noteId],
    queryFn: async () => {
      const cached = queryClient.getQueryData<{ notes: NoteListItem[] }>([
        'notes',
        'list',
        userId,
      ]);
      const cachedNote = cached?.notes.find((item) => item.id === noteId);

      if (cachedNote) {
        return cachedNote;
      }

      return trpcClient.notes.getById.query({
        userId,
        id: noteId,
      });
    },
    enabled: userId.length > 0 && noteId.length > 0,
  });

  const note = noteQuery.data;

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (!note) {
      return;
    }

    setTitle(note.title ?? '');
    setContent(note.content);
  }, [note]);

  useEffect(() => {
    if (noteQuery.error) {
      showToast(getErrorMessage(noteQuery.error, '加载笔记失败'));
    }
  }, [noteQuery.error, showToast]);

  const updateMutation = useMutation({
    mutationFn: (payload: { title?: string; content?: string }) =>
      trpcClient.notes.update.mutate({
        id: noteId,
        userId,
        title: payload.title,
        content: payload.content,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notes'] });
      router.back();
    },
    onError: (error) => {
      showToast(getErrorMessage(error, '保存失败'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      trpcClient.notes.delete.mutate({
        id: noteId,
        userId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['notes'] });
      router.back();
    },
    onError: (error) => {
      showToast(getErrorMessage(error, '删除失败'));
    },
  });

  const hasChanges = note
    ? title.trim() !== (note.title ?? '').trim() || content.trim() !== note.content
    : false;

  const handleSave = async () => {
    const nextContent = content.trim();

    if (nextContent.length === 0) {
      showToast('笔记内容不能为空');
      return;
    }

    await updateMutation.mutateAsync({
      title: title.trim(),
      content: nextContent,
    });
  };

  const handleDelete = () => {
    Alert.alert('删除笔记', '删除后无法恢复，确定删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          void deleteMutation.mutateAsync();
        },
      },
    ]);
  };

  const isLoading = noteQuery.isLoading && !noteQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
            <Text style={[typography.bodyL, styles.backText]}>返回</Text>
          </Pressable>
        </View>

        <Text style={[typography.titleL, styles.title]}>编辑笔记</Text>

        {isLoading ? (
          <View style={styles.skeletonWrap}>
            <NoteCardSkeleton />
            <NoteCardSkeleton />
          </View>
        ) : !note ? (
          <View style={styles.errorState}>
            <Text style={[typography.bodyM, styles.errorText]}>这条笔记不存在或已被删除</Text>
            <Button size="sm" variant="secondary" onPress={() => router.back()}>
              返回列表
            </Button>
          </View>
        ) : (
          <>
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
                  placeholder="请输入笔记内容"
                  placeholderTextColor={colors.ink30}
                  multiline
                  maxLength={CONTENT_MAX_LENGTH}
                  textAlignVertical="top"
                  style={styles.contentInput}
                />
                <Text style={[typography.caption, styles.counter]}>
                  {content.trim().length}/{CONTENT_MAX_LENGTH}
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={[typography.mono, styles.sectionLabel]}>创建时间</Text>
                <Text style={[typography.bodyM, styles.timeText]}>
                  {formatNoteDateTime(note.createdAt)}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.actionRow}>
              <Button
                variant="danger"
                style={styles.actionButton}
                onPress={handleDelete}
                loading={deleteMutation.isPending}
              >
                删除
              </Button>
              <Button
                style={styles.actionButton}
                onPress={() => {
                  void handleSave();
                }}
                loading={updateMutation.isPending}
                disabled={!hasChanges || content.trim().length === 0}
              >
                保存
              </Button>
            </View>
          </>
        )}
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
  skeletonWrap: {
    gap: 10,
    marginTop: 4,
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
    minHeight: 160,
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
  timeText: {
    color: colors.ink,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  errorText: {
    color: colors.ink60,
    textAlign: 'center',
  },
});
