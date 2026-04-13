import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Colors, Radius, Spacing, Typography } from '../../constants/Theme';

interface Props {
  title: string;
  description: string;
  bottomInset: number;
  onBack: () => void;
  children?: React.ReactNode;
}

export default function SettingsSubscreen({
  title,
  description,
  bottomInset,
  onBack,
  children,
}: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
          <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: bottomInset + 32 }]}
      >
        <View style={styles.hero}>
          <Text style={styles.eyebrow}>CILESIMET</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.description}>{description}</Text>
        </View>

        {children ? (
          <View style={styles.sectionStack}>{children}</View>
        ) : (
          <View style={styles.placeholderCard}>
            <Text style={styles.placeholderTitle}>Kjo faqe eshte gati per permbajtje</Text>
            <Text style={styles.placeholderText}>
              Struktura, header-i dhe navigimi jane aktivizuar. Hapi tjeter eshte te
              mbushet vetem permbajtja e kesaj faqeje.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
  },
  hero: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
    marginBottom: Spacing.lg,
  },
  eyebrow: {
    fontFamily: Typography.fontBold,
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: 10,
  },
  title: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xxl,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  description: {
    fontFamily: Typography.fontRegular,
    fontSize: Typography.md,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  sectionStack: {
    gap: Spacing.lg,
  },
  placeholderCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xxl,
    padding: Spacing.xxl,
  },
  placeholderTitle: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  placeholderText: {
    fontFamily: Typography.fontRegular,
    fontSize: Typography.md,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
});
