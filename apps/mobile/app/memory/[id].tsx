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
import type { MemoryType } from '@ai-assistant/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MemoryCardSkeleton } from '@/components/MemoryCardSkeleton';
import { MemoryTypeTag } from '@/components/MemoryTypeTag';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import {
  MEMORY_TYPE_OPTIONS,
  type MemoryListItem,
  formatMemoryDateTime,
} from '@/constants/memory';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { useToast } from '@/hooks/useToast';
import { getErrorMessage } from '@/utils/error';
import { trpcClient } from '@/utils/trpc';
import { useUserId } from '@/utils/userId';

export default function EditMemoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const queryClient = useQueryClient();
  const { userId } = useUserId();
  const { toast, showToast, hideToast } = useToast();

  const memoryId = useMemo(() => {
    if (typeof params.id === 'string') {
      return params.id;
    }

    if (Array.isArray(params.id)) {
      return params.id[0] ?? '';
    }

    return '';
  }, [params.id]);

  const memoryQuery = useQuery({
    queryKey: ['memory', 'detail', userId, memoryId],
    queryFn: async () => {
      const cached = queryClient.getQueryData<{ memories: MemoryListItem[] }>([
        'memory',
        'list',
        userId,
      ]);
      const cachedMemory = cached?.memories.find((item) => item.id === memoryId);

      if (cachedMemory) {
        return cachedMemory;
      }

      const result = await trpcClient.memory.list.query({ userId, limit: 200 });
      return (result.memories as MemoryListItem[]).find((item) => item.id === memoryId) ?? null;
    },
    enabled: userId.length > 0 && memoryId.length > 0,
  });

  const memory = memoryQuery.data;

  const [content, setContent] = useState('');
  const [type, setType] = useState<MemoryType>('preference');

  useEffect(() => {
    if (!memory) {
      return;
    }

    setContent(memory.content);
    setType(memory.type);
  }, [memory]);

  useEffect(() => {
    if (memoryQuery.error) {
      showToast(getErrorMessage(memoryQuery.error, '加载记忆失败'));
    }
  }, [memoryQuery.error, showToast]);

  const updateMutation = useMutation({
    mutationFn: (payload: { content: string; type: MemoryType }) =>
      trpcClient.memory.update.mutate({
        id: memoryId,
        userId,
        content: payload.content,
        type: payload.type,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['memory'] });
      router.back();
    },
    onError: (error) => {
      showToast(getErrorMessage(error, '保存失败'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () =>
      trpcClient.memory.delete.mutate({
        id: memoryId,
        userId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['memory'] });
      router.back();
    },
    onError: (error) => {
      showToast(getErrorMessage(error, '删除失败'));
    },
  });

  const hasChanges = memory
    ? content.trim() !== memory.content || type !== memory.type
    : false;

  const handleSave = async () => {
    const nextContent = content.trim();

    if (nextContent.length === 0) {
      showToast('记忆内容不能为空');
      return;
    }

    await updateMutation.mutateAsync({
      content: nextContent,
      type,
    });
  };

  const handleDelete = () => {
    Alert.alert('删除记忆', '删除后无法恢复，确定删除吗？', [
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

  const isLoading = memoryQuery.isLoading && !memoryQuery.data;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
            <Text style={[typography.bodyL, styles.backText]}>返回</Text>
          </Pressable>
        </View>

        <Text style={[typography.titleL, styles.title]}>编辑记忆</Text>

        {isLoading ? (
          <View style={styles.skeletonWrap}>
            <MemoryCardSkeleton />
            <MemoryCardSkeleton />
          </View>
        ) : !memory ? (
          <View style={styles.errorState}>
            <Text style={[typography.bodyM, styles.errorText]}>这条记忆不存在或已被删除</Text>
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
                <Text style={[typography.mono, styles.sectionLabel]}>内容</Text>
                <TextInput
                  value={content}
                  onChangeText={setContent}
                  placeholder="请输入记忆内容"
                  placeholderTextColor={colors.ink30}
                  multiline
                  maxLength={200}
                  textAlignVertical="top"
                  style={styles.contentInput}
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

              <View style={styles.section}>
                <Text style={[typography.mono, styles.sectionLabel]}>创建时间</Text>
                <Text style={[typography.bodyM, styles.timeText]}>{formatMemoryDateTime(memory.createdAt)}</Text>
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
  typeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
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
