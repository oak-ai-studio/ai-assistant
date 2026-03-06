import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '@/constants/tokens';
import { typography } from '@/constants/typography';
import { shadows } from '@/constants/shadows';
import { VOCABULARY_SETTINGS_PAGE_CONTEXT } from '@/constants/page-context';
import { useGlobalChat } from '@/components/chat/ChatOverlayProvider';

export default function VocabularySettingsScreen() {
  const router = useRouter();
  const { disable } = useLocalSearchParams<{ disable?: string }>();
  const { setPageContext } = useGlobalChat();
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    setPageContext(VOCABULARY_SETTINGS_PAGE_CONTEXT);
  }, [setPageContext]);

  useEffect(() => {
    setConfirmVisible(disable === 'confirm');
  }, [disable]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={18} color={colors.ink} />
            <Text style={[typography.titleM, styles.backText]}>背单词配置</Text>
          </Pressable>
        </View>

        <View style={styles.contentCard}>
          <Text style={[typography.titleL, styles.title]}>背单词配置</Text>
          <Text style={[typography.bodyL, styles.subtitle]}>配置项开发中</Text>
        </View>

        <View style={styles.footerAction}>
          <Pressable
            style={styles.disableButton}
            onPress={() => setConfirmVisible(true)}
          >
            <Text style={[typography.bodyL, styles.disableButtonText]}>停用技能</Text>
          </Pressable>
        </View>
      </View>

      <Modal
        transparent
        visible={confirmVisible}
        animationType="fade"
        onRequestClose={() => setConfirmVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmVisible(false)}>
          <Pressable
            style={styles.modalCard}
            onPress={(event) => event.stopPropagation()}
          >
            <Text style={[typography.titleM, styles.modalTitle]}>确定停用这个技能吗？</Text>
            <Text style={[typography.bodyM, styles.modalDescription]}>
              停用后背单词入口会从首页移除，历史记录会保留（占位逻辑）。
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.modalButtonGhost]}
                onPress={() => setConfirmVisible(false)}
              >
                <Text style={[typography.bodyL, styles.modalButtonGhostText]}>取消</Text>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.modalButtonDanger]}
                onPress={() => {
                  setConfirmVisible(false);
                  router.replace('/(tabs)');
                }}
              >
                <Text style={[typography.bodyL, styles.modalButtonDangerText]}>确定</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
    paddingTop: 8,
  },
  headerRow: {
    marginTop: 16,
    marginBottom: 16,
  },
  backButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: colors.ink,
  },
  contentCard: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    padding: 20,
    ...shadows.sm,
  },
  title: {
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    color: colors.ink60,
  },
  footerAction: {
    marginTop: 'auto',
    marginBottom: 28,
  },
  disableButton: {
    backgroundColor: colors.offWhite,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disableButtonText: {
    color: colors.danger,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(26,24,20,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.offWhite,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.ink10,
    padding: 18,
    ...shadows.md,
  },
  modalTitle: {
    color: colors.ink,
    marginBottom: 8,
  },
  modalDescription: {
    color: colors.ink60,
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderWidth: 1,
  },
  modalButtonGhost: {
    borderColor: colors.ink10,
    backgroundColor: colors.sandLight,
  },
  modalButtonDanger: {
    borderColor: colors.danger,
    backgroundColor: colors.danger,
  },
  modalButtonGhostText: {
    color: colors.ink60,
  },
  modalButtonDangerText: {
    color: '#fff',
  },
});
