import React, { useState } from 'react';
import {
  View, Text, FlatList, ScrollView,
  TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { ActActivity } from '../../types';
import { ACT_ACTIVITIES, ACT_CATEGORIES } from '../../data/mockData';

interface Props {
  title:        string;
  initialCatId: string;
  onBack:       () => void;
  onProfile:    (activity: ActActivity) => void;
  bottomInset:  number;
}

export default function ActListScreen({ title, initialCatId, onBack, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState(initialCatId);

  const filtered = activeCat === 'all'
    ? ACT_ACTIVITIES
    : ACT_ACTIVITIES.filter(a => a.catId === activeCat);

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

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {ACT_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.filterPill, activeCat === cat.id && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setActiveCat(cat.id)}
            >
              <Text style={styles.filterEmoji}>{cat.icon}</Text>
              <Text style={[styles.filterText, activeCat === cat.id && styles.filterTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* ── Activity list ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Nuk ka aktivitete për këtë kategori aktualisht.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={a => a.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 24 }]}
          renderItem={({ item }) => (
            <ActivityCardFull activity={item} onPress={() => onProfile(item)} />
          )}
        />
      )}

    </View>
  );
}

// Full-width vertical card for the list view
function ActivityCardFull({ activity, onPress }: { activity: ActActivity; onPress: () => void }) {
  const [day, mon] = activity.dateStr.split(' ');
  return (
    <TouchableOpacity style={listCardStyles.card} onPress={onPress} activeOpacity={0.9}>
      <View style={listCardStyles.imageWrap}>
        <Image source={{ uri: activity.img }} style={listCardStyles.image} resizeMode="cover" />
        <View style={[listCardStyles.catBadge, { backgroundColor: activity.badgeColor }]}>
          <Text style={listCardStyles.catBadgeText}>{activity.category}</Text>
        </View>
        <View style={listCardStyles.dateBadge}>
          <Text style={listCardStyles.dateDay}>{day}</Text>
          <Text style={listCardStyles.dateMon}>{mon}</Text>
        </View>
      </View>
      <View style={listCardStyles.body}>
        <Text style={listCardStyles.title}>{activity.title}</Text>
        <Text style={listCardStyles.desc} numberOfLines={2}>{activity.desc}</Text>
        <View style={listCardStyles.footer}>
          <Text style={listCardStyles.location}>📍 {activity.location}</Text>
          <Text style={listCardStyles.readMore}>Lexo më shumë →</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const listCardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
    overflow: 'visible',
  },
  imageWrap: {
    height: 192, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    overflow: 'visible', backgroundColor: Colors.borderLight,
  },
  image: {
    width: '100%', height: '100%',
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
  },
  catBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  catBadgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 10,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6,
  },
  dateBadge: {
    position: 'absolute', bottom: -18, right: 16,
    backgroundColor: Colors.white, borderWidth: 2, borderColor: '#0aa8a7',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 4, zIndex: 10,
  },
  dateDay: { fontFamily: Typography.fontExtraBold, fontSize: 16, color: '#003366', lineHeight: 18 },
  dateMon: { fontFamily: Typography.fontBold, fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', marginTop: 1 },
  body: { padding: Spacing.xl, paddingTop: Spacing.xxl + 4 },
  title: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: '#003366', lineHeight: 24, marginBottom: 6,
  },
  desc: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base,
    color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg,
  },
  footer: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md,
  },
  location: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary },
  readMore: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#0aa8a7' },
});

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
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: '#003366', flex: 1,
  },
  filterList: { gap: 8 },
  filterPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  filterPillActive: { backgroundColor: '#003366', borderColor: '#003366' },
  filterEmoji: { fontSize: 13 },
  filterText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary },
  filterTextActive: { color: '#fff' },

  list: { padding: Spacing.xxl, gap: 24 },
  emptyWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl },
  emptyText: { fontFamily: Typography.fontMedium, fontSize: Typography.md, color: Colors.textMuted, textAlign: 'center' },
});
