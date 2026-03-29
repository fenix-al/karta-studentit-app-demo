import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { KvrActivity } from '../../types';
import { KVR_ACTIVITIES, KVR_GROUPS } from '../../data/mockData';
import { KVRActivityCard } from './KVRHubScreen';

const NAVY = '#003366';

const ALL_PILL = { id: 'all', name: 'Të gjitha' };

interface Props {
  title:        string;
  initialCatId: string;
  onBack:       () => void;
  onProfile:    (activity: KvrActivity) => void;
  bottomInset:  number;
}

export default function KVRListScreen({ title, initialCatId, onBack, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState(initialCatId);

  const pills = [ALL_PILL, ...KVR_GROUPS.map(g => ({ id: g.id, name: g.name }))];

  const filtered = activeCat === 'all'
    ? KVR_ACTIVITIES
    : KVR_ACTIVITIES.filter(a => a.catId === activeCat);

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

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {pills.map(p => (
            <TouchableOpacity
              key={p.id}
              style={[styles.filterPill, activeCat === p.id && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setActiveCat(p.id)}
            >
              <Text style={[styles.filterText, activeCat === p.id && styles.filterTextActive]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── List ────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyEmoji}>📰</Text>
          <Text style={styles.emptyTitle}>Nuk ka postime</Text>
          <Text style={styles.emptyText}>Lajmet për këtë grup do të shfaqen këtu.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={a => a.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 24 }]}
          renderItem={({ item }) => (
            <View style={styles.fullWidthCard}>
              <KVRActivityCard activity={item} onPress={() => onProfile(item)} />
            </View>
          )}
        />
      )}

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
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: NAVY, flex: 1,
  },
  filterList: { gap: 8 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  filterPillActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary },
  filterTextActive: { color: '#fff' },

  // The FlatList uses KVRActivityCard in horizontal mode — override to full-width
  list: { padding: Spacing.xxl, gap: 20 },

  fullWidthCard: { width: '100%' },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary, marginBottom: 6 },
  emptyText:  { fontFamily: Typography.fontMedium, fontSize: Typography.md, color: Colors.textMuted, textAlign: 'center' },
});
