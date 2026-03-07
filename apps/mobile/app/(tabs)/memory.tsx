import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { MemoryType } from '@ai-assistant/shared';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';
import {
  createMemory,
  deleteMemory,
  listMemories,
  type MemoryItem,
  updateMemory,
} from '@/utils/api';
import { useUserId } from '@/utils/userId';

type DateFilter = 'all' | 'today' | 'week';

const DATE_FILTERS: Array<{ key: DateFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'today', label: '今天' },
  { key: 'week', label: '近7天' },
];

const MEMORY_TYPES: MemoryType[] = [
  'preference',
  'fact',
  'experience',
  'other',
  'habit',
  'weakness',
  'progress',
  'personality',
];

const MEMORY_TYPE_LABELS: Record<MemoryType, string> = {
  preference: '偏好',
  fact: '事实',
  experience: '经历',
  other: '其他',
  habit: '习惯',
  weakness: '弱项',
  progress: '进展',
  personality: '性格',
};

const formatDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes()
  ).padStart(2, '0')}`;
};

const getFilterDateRange = (filter: DateFilter): { startDate?: string; endDate?: string } => {
  if (filter === 'all') {
    return {};
  }

  const now = new Date();
  const endDate = now.toISOString();

  if (filter === 'today') {
    const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return {
      startDate: startDate.toISOString(),
      endDate,
    };
  }

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  return {
    startDate: weekStart.toISOString(),
    endDate,
  };
};

export default function MemoryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId, isLoading: userIdLoading, error: userIdError } = useUserId();

  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [draft, setDraft] = useState('');
  const [draftType, setDraftType] = useState<MemoryType>('preference');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [mutationError, setMutationError] = useState<string | null>(null);

  const dateRange = useMemo(() => getFilterDateRange(dateFilter), [dateFilter]);

  const memoryQuery = useQuery({
    queryKey: ['memory', 'list', userId, dateFilter],
    queryFn: () =>
      listMemories({
        userId,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      }),
    enabled: userId.length > 0,
  });

  const createMutation = useMutation({
    mutationFn: createMemory,
    onSuccess: async () => {
      setDraft('');
      setMutationError(null);
      await queryClient.invalidateQueries({
        queryKey: ['memory', 'list', userId],
      });
    },
    onError: (error) => {
      setMutationError(error instanceof Error ? error.message : '创建记忆失败');
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateMemory,
    onSuccess: async () => {
      setEditingId(null);
      setEditingContent('');
      setMutationError(null);
      await queryClient.invalidateQueries({
        queryKey: ['memory', 'list', userId],
      });
    },
    onError: (error) => {
      setMutationError(error instanceof Error ? error.message : '更新记忆失败');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteMemory,
    onSuccess: async () => {
      setMutationError(null);
      await queryClient.invalidateQueries({
        queryKey: ['memory', 'list', userId],
      });
    },
    onError: (error) => {
      setMutationError(error instanceof Error ? error.message : '删除记忆失败');
    },
  });

  const isMutating =
    createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleCreate = async () => {
    const content = draft.trim();

    if (!content || !userId) {
      return;
    }

    await createMutation.mutateAsync({
      userId,
      content,
      type: draftType,
      confidence: 0.8,
    });
  };

  const handleDelete = async (memoryId: string) => {
    if (!userId || deleteMutation.isPending) {
      return;
    }

    await deleteMutation.mutateAsync({
      userId,
      id: memoryId,
    });
  };

  const handleUpdate = async () => {
    const content = editingContent.trim();

    if (!content || !userId || !editingId) {
      return;
    }

    await updateMutation.mutateAsync({
      id: editingId,
      userId,
      content,
    });
  };

  const renderMemoryCard = ({ item }: { item: MemoryItem }) => {
    const isEditing = editingId === item.id;

    return (
      <View style={styles.memoryCard}>
        <View style={styles.memoryMetaRow}>
          <Text style={[typography.mono, styles.memoryType]}>{MEMORY_TYPE_LABELS[item.type]}</Text>
          <Text style={[typography.bodyM, styles.memoryDate]}>{formatDate(item.updatedAt)}</Text>
        </View>

        {isEditing ? (
          <TextInput
            value={editingContent}
            onChangeText={setEditingContent}
            style={styles.editInput}
            multiline
            textAlignVertical="top"
          />
        ) : (
          <Text style={[typography.bodyL, styles.memoryText]}>{item.content}</Text>
        )}

        <View style={styles.memoryActionRow}>
          {isEditing ? (
            <>
              <Button size="sm" variant="secondary" onPress={() => setEditingId(null)}>
                取消
              </Button>
              <Button
                size="sm"
                onPress={handleUpdate}
                loading={updateMutation.isPending}
                disabled={editingContent.trim().length === 0}
              >
                保存
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                onPress={() => {
                  setEditingId(item.id);
                  setEditingContent(item.content);
                }}
              >
                编辑
              </Button>
              <Button
                size="sm"
                variant="danger"
                onPress={() => {
                  void handleDelete(item.id);
                }}
                loading={deleteMutation.isPending}
              >
                删除
              </Button>
            </>
          )}
        </View>
      </View>
    );
  };

  const memories = memoryQuery.data?.memories ?? [];
  const queryError = memoryQuery.error instanceof Error ? memoryQuery.error.message : null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={18} color={colors.ink} />
          <Text style={[typography.bodyL, styles.backText]}>返回首页</Text>
        </Pressable>

        <View style={styles.headerRow}>
          <Text style={[typography.titleL, styles.title]}>记忆</Text>
          <Text style={[typography.bodyM, styles.subtitle]}>总计 {memoryQuery.data?.total ?? 0} 条</Text>
        </View>

        <View style={styles.filterRow}>
          {DATE_FILTERS.map((item) => {
            const selected = dateFilter === item.key;

            return (
              <Pressable
                key={item.key}
                style={[styles.filterChip, selected && styles.filterChipActive]}
                onPress={() => setDateFilter(item.key)}
              >
                <Text
                  style={[
                    typography.bodyM,
                    styles.filterText,
                    selected && styles.filterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.createCard}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="新增一条记忆"
            placeholderTextColor={colors.ink30}
            multiline
            style={styles.createInput}
          />

          <View style={styles.typeRow}>
            {MEMORY_TYPES.map((type) => {
              const selected = draftType === type;

              return (
                <Pressable
                  key={type}
                  onPress={() => setDraftType(type)}
                  style={[styles.typeChip, selected && styles.typeChipActive]}
                >
                  <Text style={[typography.bodyM, selected ? styles.typeTextActive : styles.typeText]}>
                    {MEMORY_TYPE_LABELS[type]}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Button
            onPress={() => {
              void handleCreate();
            }}
            loading={createMutation.isPending}
            disabled={draft.trim().length === 0 || !userId}
          >
            添加记忆
          </Button>
        </View>

        {(mutationError || userIdError || queryError) && (
          <View style={styles.errorCard}>
            <Text style={[typography.bodyM, styles.errorText]}>
              {mutationError ?? userIdError ?? queryError}
            </Text>
          </View>
        )}

        {userIdLoading || memoryQuery.isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator color={colors.orange} />
            <Text style={[typography.bodyM, styles.stateText]}>加载记忆中...</Text>
          </View>
        ) : memoryQuery.isError ? (
          <View style={styles.centerState}>
            <Text style={[typography.bodyM, styles.stateText]}>加载失败，请重试</Text>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                void memoryQuery.refetch();
              }}
            >
              重试
            </Button>
          </View>
        ) : memories.length === 0 ? (
          <View style={styles.centerState}>
            <Text style={[typography.bodyM, styles.stateText]}>
              当前筛选条件下暂无记忆，先添加一条吧
            </Text>
          </View>
        ) : (
          <FlatList
            data={memories}
            keyExtractor={(item) => item.id}
            renderItem={renderMemoryCard}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            extraData={{ editingId, editingContent, isMutating }}
          />
        )}
      </View>
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
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 14,
  },
  backText: {
    color: colors.ink60,
  },
  headerRow: {
    marginBottom: 12,
  },
  title: {
    color: colors.ink,
  },
  subtitle: {
    color: colors.ink60,
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.offWhite,
  },
  filterChipActive: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeBg,
  },
  filterText: {
    color: colors.ink60,
  },
  filterTextActive: {
    color: colors.orange,
  },
  createCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    padding: 12,
    marginBottom: 12,
    gap: 10,
    ...shadows.sm,
  },
  createInput: {
    minHeight: 70,
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.sandLight,
  },
  typeChipActive: {
    borderColor: colors.orange,
    backgroundColor: colors.orangeBg,
  },
  typeText: {
    color: colors.ink60,
  },
  typeTextActive: {
    color: colors.orange,
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
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  stateText: {
    color: colors.ink60,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 28,
    gap: 10,
  },
  memoryCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    padding: 12,
    gap: 10,
    ...shadows.sm,
  },
  memoryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memoryType: {
    color: colors.orange,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  memoryDate: {
    color: colors.ink30,
  },
  memoryText: {
    color: colors.ink,
  },
  editInput: {
    minHeight: 64,
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
  memoryActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
});
