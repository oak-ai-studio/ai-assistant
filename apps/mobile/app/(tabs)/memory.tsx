import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { MemoryCard } from '@/components/MemoryCard';
import { MemoryCardSkeleton } from '@/components/MemoryCardSkeleton';
import { MemoryEmpty } from '@/components/MemoryEmpty';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import {
  MEMORY_FILTER_TABS,
  type MemoryFilter,
  type MemoryListItem,
  isMemoryInFilter,
} from '@/constants/memory';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/error';
import { trpcClient } from '@/utils/trpc';
import { MEMORY_PAGE_CONTEXT } from '@/constants/page-context';
import { useGlobalChat } from '@/components/chat/ChatOverlayProvider';

export default function MemoryScreen() {
  const router = useRouter();
  const { setPageContext } = useGlobalChat();
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  const { toast, showToast, hideToast } = useToast();

  const [activeFilter, setActiveFilter] = useState<MemoryFilter>('all');

  const memoryQuery = useQuery({
    queryKey: ['memory', 'list', userId],
    queryFn: () => trpcClient.memory.list.query({ userId, limit: 100 }),
    enabled: userId.length > 0,
  });

  useEffect(() => {
    if (memoryQuery.error) {
      showToast(getErrorMessage(memoryQuery.error, '加载记忆失败'));
    }
  }, [memoryQuery.error, showToast]);

  const allMemories = useMemo(
    () => (memoryQuery.data?.memories ?? []) as MemoryListItem[],
    [memoryQuery.data?.memories],
  );

  const memories = useMemo(
    () =>
      allMemories.filter((memory) => isMemoryInFilter(memory.type, activeFilter)),
    [activeFilter, allMemories],
  );

  const isInitialLoading = status === 'loading' || (memoryQuery.isLoading && !memoryQuery.data);
  const isRefreshing = !isInitialLoading && memoryQuery.isRefetching;

  const emptyDescription =
    activeFilter === 'all'
      ? '先创建一条，帮助助理更了解你。'
      : `「${MEMORY_FILTER_TABS.find((tab) => tab.key === activeFilter)?.label ?? '当前'}」分类下暂无记忆。`;

  useEffect(() => {
    setPageContext({
      ...MEMORY_PAGE_CONTEXT,
      data: {
        ...MEMORY_PAGE_CONTEXT.data,
        active_filter: activeFilter,
        total_memories: allMemories.length,
      },
    });
  }, [activeFilter, allMemories.length, setPageContext]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
            <Text style={[typography.bodyL, styles.backText]}>返回</Text>
          </Pressable>

          <Pressable style={styles.createButton} onPress={() => router.push('/memory/create')}>
            <Ionicons name="add" size={18} color={colors.offWhite} />
          </Pressable>
        </View>

        <View style={styles.headerRow}>
          <Text style={[typography.titleL, styles.title]}>记忆</Text>
          <Text style={[typography.bodyM, styles.subtitle]}>共 {allMemories.length} 条</Text>
        </View>

        <View style={styles.filterRow}>
          {MEMORY_FILTER_TABS.map((tab) => {
            const active = tab.key === activeFilter;

            return (
              <Pressable
                key={tab.key}
                style={[styles.filterChip, active && styles.filterChipActive]}
                onPress={() => setActiveFilter(tab.key)}
              >
                <Text
                  style={[
                    typography.bodyM,
                    styles.filterText,
                    active && styles.filterTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isInitialLoading ? (
          <View style={styles.skeletonList}>
            {Array.from({ length: 4 }).map((_, index) => (
              <MemoryCardSkeleton key={index} />
            ))}
          </View>
        ) : memoryQuery.isError && allMemories.length === 0 ? (
          <View style={styles.errorState}>
            <Text style={[typography.bodyM, styles.errorText]}>加载失败，请下拉刷新重试</Text>
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
        ) : (
          <FlatList
            data={memories}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MemoryCard
                memory={item}
                onPress={() => {
                  router.push({
                    pathname: '/memory/[id]',
                    params: { id: item.id },
                  });
                }}
              />
            )}
            onRefresh={() => {
              void memoryQuery.refetch();
            }}
            refreshing={isRefreshing}
            ListEmptyComponent={
              <MemoryEmpty
                description={emptyDescription}
                onCreatePress={() => router.push('/memory/create')}
              />
            }
            contentContainerStyle={[
              styles.listContent,
              memories.length === 0 && styles.listContentEmpty,
            ]}
            showsVerticalScrollIndicator={false}
          />
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
    paddingBottom: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  backText: {
    color: colors.ink60,
  },
  createButton: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.orange,
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
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.ink10,
    backgroundColor: colors.offWhite,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  listContent: {
    gap: 10,
    paddingBottom: 28,
  },
  listContentEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  skeletonList: {
    gap: 10,
    marginTop: 6,
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
