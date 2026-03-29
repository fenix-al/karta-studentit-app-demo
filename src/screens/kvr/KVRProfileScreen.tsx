import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Share2, Calendar, MapPin } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { KvrActivity } from '../../types';

const NAVY = '#003366';

interface Props {
  activity:    KvrActivity;
  onBack:      () => void;
  bottomInset: number;
}

export default function KVRProfileScreen({ activity, onBack, bottomInset }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>

      {/* ── Sticky white header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
          <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn}>
          <Share2 size={18} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >

        {/* ── Category badge + title + meta ─────────────────────────────── */}
        <View style={styles.titlePad}>
          <View style={styles.catBadge}>
            <Text style={styles.catBadgeText}>{activity.category}</Text>
          </View>
          <Text style={styles.title}>{activity.title}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Calendar size={14} color={Colors.textMuted} strokeWidth={2} />
              <Text style={styles.metaText}>{activity.date}</Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <MapPin size={14} color={Colors.textMuted} strokeWidth={2} />
              <Text style={styles.metaText}>{activity.location}</Text>
            </View>
          </View>
        </View>

        {/* ── Hero image ────────────────────────────────────────────────── */}
        <View style={styles.heroPad}>
          <View style={styles.heroWrap}>
            <Image source={{ uri: activity.img }} style={styles.heroImage} resizeMode="cover" />
          </View>
        </View>

        {/* ── Article body ──────────────────────────────────────────────── */}
        <View style={styles.articlePad}>
          <View style={styles.articleCard}>
            <Text style={styles.articleText}>{activity.fullDesc}</Text>

            {/* Highlighted quote */}
            <View style={styles.quoteBox}>
              <Text style={styles.quoteText}>
                "KVR përfaqëson zërin e rinisë shkodrane. Pjesëmarrja e studentëve në këto takime është thelbësore për vendimmarrjen lokale."
              </Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3, zIndex: 10,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },

  // Title block
  titlePad: {
    paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl, paddingBottom: Spacing.lg,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe', borderWidth: 1, borderColor: '#bae6fd',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginBottom: Spacing.lg,
  },
  catBadgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 10,
    color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  title: {
    fontFamily: Typography.fontExtraBold, fontSize: 22,
    color: NAVY, lineHeight: 30, marginBottom: Spacing.lg,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight },

  // Hero
  heroPad: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  heroWrap: {
    height: 220, borderRadius: Radius.xxl,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  heroImage: { width: '100%', height: '100%' },

  // Article
  articlePad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl },
  articleCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xxl,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  articleText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md,
    color: Colors.textSecondary, lineHeight: 24, marginBottom: Spacing.xl,
  },
  quoteBox: {
    backgroundColor: Colors.surfaceBg, borderRadius: 12,
    borderLeftWidth: 4, borderLeftColor: '#0ea5e9',
    paddingVertical: 14, paddingHorizontal: Spacing.lg,
  },
  quoteText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base,
    color: Colors.textPrimary, lineHeight: 22, fontStyle: 'italic',
  },
});
