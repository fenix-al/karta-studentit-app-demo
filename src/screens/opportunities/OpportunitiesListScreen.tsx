import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search } from 'lucide-react';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { JobItem } from '../../types';
import { JOBS } from '../../data/mockData';
import { JobCard } from './OpportunitiesHubScreen';

interface Props {
  title:       string;
  onBack:      () => void;
  onProfile:   (job: JobItem) => void;
  bottomInset: number;
}

export default function OpportunitiesListScreen({ title, onBack, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Kërko në listë...</Text>
        </View>
      </View>

      {/* ── Job list ─────────────────────────────────────────────────────── */}
      <FlatList
        data={JOBS}
        keyExtractor={j => j.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 24 }]}
        renderItem={({ item }) => (
          <JobCard job={item} onPress={() => onProfile(item)} />
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.lg,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: Colors.textPrimary, flex: 1,
  },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchPlaceholder: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted, flex: 1,
  },

  list: { padding: Spacing.xxl, gap: 16 },
});
