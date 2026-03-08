import { useEffect, useMemo } from 'react';
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
import { NoteCard } from '@/components/NoteCard';
import { NoteCardSkeleton } from '@/components/NoteCardSkeleton';
import { NoteEmpty } from '@/components/NoteEmpty';
import { Button } from '@/components/ui/Button';
import { Toast } from '@/components/ui/Toast';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/hooks/useAuth';
import { getErrorMessage } from '@/utils/error';
import { trpcClient } from '@/utils/trpc';
import type { NoteListItem } from '@/constants/notes';

export default function NotesScreen() {
  const router = useRouter();
  const { user, status } = useAuth();
  const userId = user?.id ?? '';
  const { toast, showToast, hideToast } = useToast();

  const notesQuery = useQuery({
    queryKey: ['notes', 'list', userId],
    queryFn: () => trpcClient.notes.list.query({ userId, limit: 100 }),
    enabled: userId.length > 0,
  });

  useEffect(() => {
    if (notesQuery.error) {
      showToast(getErrorMessage(notesQuery.error, '加载笔记失败'));
    }
  }, [notesQuery.error, showToast]);

  const notes = useMemo(
    () => (notesQuery.data?.notes ?? []) as NoteListItem[],
    [notesQuery.data?.notes],
  );
  const total = notesQuery.data?.total ?? notes.length;

  const isInitialLoading = status === 'loading' || (notesQuery.isLoading && !notesQuery.data);
  const isRefreshing = !isInitialLoading && notesQuery.isRefetching;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.topRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
            <Text style={[typography.bodyL, styles.backText]}>返回</Text>
          </Pressable>

          <Pressable style={styles.createButton} onPress={() => router.push('/notes/create')}>
            <Ionicons name="add" size={18} color={colors.offWhite} />
          </Pressable>
        </View>

        <View style={styles.headerRow}>
          <Text style={[typography.titleL, styles.title]}>笔记</Text>
          <Text style={[typography.bodyM, styles.subtitle]}>共 {total} 条</Text>
        </View>

        {isInitialLoading ? (
          <View style={styles.skeletonList}>
            {Array.from({ length: 4 }).map((_, index) => (
              <NoteCardSkeleton key={index} />
            ))}
          </View>
        ) : notesQuery.isError && notes.length === 0 ? (
          <View style={styles.errorState}>
            <Text style={[typography.bodyM, styles.errorText]}>加载失败，请下拉刷新重试</Text>
            <Button
              size="sm"
              variant="secondary"
              onPress={() => {
                void notesQuery.refetch();
              }}
            >
              重试
            </Button>
          </View>
        ) : (
          <FlatList
            data={notes}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NoteCard
                note={item}
                onPress={() => {
                  router.push({
                    pathname: '/notes/[id]',
                    params: { id: item.id },
                  });
                }}
              />
            )}
            onRefresh={() => {
              void notesQuery.refetch();
            }}
            refreshing={isRefreshing}
            ListEmptyComponent={
              <NoteEmpty
                onCreatePress={() => router.push('/notes/create')}
              />
            }
            contentContainerStyle={[
              styles.listContent,
              notes.length === 0 && styles.listContentEmpty,
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
