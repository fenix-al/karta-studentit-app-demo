import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Share2, Heart, Star, Gift, MapPin, Phone, Navigation, ThumbsUp } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { Business } from '../../types';

interface Props {
  business:    Business;
  onBack:      () => void;
  bottomInset: number;
}

export default function BusinessProfileScreen({ business: biz, onBack, bottomInset }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>

      {/* ── Transparent overlay header ─────────────────────────────── */}
      <View style={[styles.overlayHeader, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.overlayBtn} onPress={onBack}>
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.overlayRight}>
          <TouchableOpacity style={styles.overlayBtn}>
            <Share2 size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.overlayBtn}>
            <Heart size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 32 }}
      >

        {/* ── Hero image ────────────────────────────────────────────── */}
        <View style={styles.heroWrap}>
          <Image source={{ uri: biz.img }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroGradient} />
        </View>

        {/* ── Floating discount bar ─────────────────────────────────── */}
        <View style={styles.discountBarWrap}>
          <View style={styles.discountBar}>
            <Gift size={18} color="#78350f" strokeWidth={2} />
            <Text style={styles.discountText}>{biz.discount}</Text>
          </View>
        </View>

        {/* ── Main info ─────────────────────────────────────────────── */}
        <View style={styles.mainInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{biz.title}</Text>
            <View style={styles.ratingBadge}>
              <Star size={14} color="#f59e0b" fill="#f59e0b" strokeWidth={0} />
              <Text style={styles.ratingText}>{biz.rating}</Text>
            </View>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>🏷️  {biz.category}</Text>
          </View>
        </View>

        {/* ── Rules ────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rregullat dhe Detajet</Text>
          <View style={styles.divider} />
          <View style={styles.rulesBox}>
            <Text style={styles.rulesText}>{biz.rules}</Text>
          </View>
        </View>

        {/* ── Recommend ────────────────────────────────────────────── */}
        <View style={styles.recommendRow}>
          <Text style={styles.recommendLabel}>A keni mbetur të kënaqur?</Text>
          <TouchableOpacity style={styles.recommendBtn} activeOpacity={0.85}>
            <ThumbsUp size={15} color="#fff" strokeWidth={2} />
            <Text style={styles.recommendText}>Rekomando ({biz.recommendations})</Text>
          </TouchableOpacity>
        </View>

        {/* ── Contact card ──────────────────────────────────────────── */}
        <View style={styles.contactCard}>

          <View style={styles.contactRow}>
            <View style={styles.contactIconRed}>
              <MapPin size={16} color="#f43f5e" strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Adresa</Text>
              <Text style={styles.contactValue}>{biz.address}</Text>
            </View>
          </View>

          <View style={styles.contactRow}>
            <View style={styles.contactIconGray}>
              <Phone size={16} color={Colors.textSecondary} strokeWidth={2} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.contactLabel}>Kontakti</Text>
              <Text style={styles.contactValue}>{biz.phone}</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.mapBtn} activeOpacity={0.85}>
            <Navigation size={18} color="#fff" strokeWidth={2} />
            <Text style={styles.actionBtnText}>Udhëzime në Hartë</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.85}>
            <Star size={18} color="#f59e0b" fill="#f59e0b" strokeWidth={0} />
            <Text style={styles.actionBtnText}>Lër Review në Google</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },

  // ── Overlay header ───────────────────────────────────────────────────────────
  overlayHeader: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg, zIndex: 30,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  overlayBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.88)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  overlayRight: { flexDirection: 'row', gap: 8 },

  // ── Hero ────────────────────────────────────────────────────────────────────
  heroWrap: { height: 280, backgroundColor: Colors.borderLight },
  heroImage: { width: '100%', height: '100%' },
  heroGradient: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 100,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },

  // ── Discount bar ─────────────────────────────────────────────────────────────
  discountBarWrap: { paddingHorizontal: Spacing.xxl, marginTop: -24, zIndex: 10 },
  discountBar: {
    backgroundColor: '#fbbf24', borderRadius: Radius.xl, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: '#f59e0b',
    shadowColor: '#f59e0b', shadowOpacity: 0.35, shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 }, elevation: 5,
  },
  discountText: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.lg,
    color: '#78350f', textTransform: 'uppercase', letterSpacing: 2,
  },

  // ── Main info ────────────────────────────────────────────────────────────────
  mainInfo: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: Spacing.md },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontFamily: Typography.fontExtraBold, fontSize: 26, color: Colors.textPrimary, flex: 1, paddingRight: 12, lineHeight: 32 },
  ratingBadge: {
    backgroundColor: '#fffbeb', borderRadius: Radius.md, borderWidth: 1, borderColor: '#fef3c7',
    paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 0,
  },
  ratingText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#92400e' },
  categoryBadge: {
    backgroundColor: Colors.white, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  categoryText: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },

  // ── Rules ────────────────────────────────────────────────────────────────────
  section: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xl },
  sectionTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: 12 },
  divider: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: Colors.border, marginBottom: Spacing.lg },
  rulesBox: {
    backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  rulesText: { fontFamily: Typography.fontMedium, fontSize: Typography.md, color: Colors.textSecondary, lineHeight: 22 },

  // ── Recommend ────────────────────────────────────────────────────────────────
  recommendRow: {
    marginHorizontal: Spacing.xxl, marginBottom: Spacing.xl,
    backgroundColor: Colors.white, padding: Spacing.lg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.borderLight,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  recommendLabel: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary, flex: 1, paddingRight: 8 },
  recommendBtn: {
    backgroundColor: '#dc2626', borderRadius: Radius.md,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    shadowColor: '#dc2626', shadowOpacity: 0.3, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  recommendText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#fff' },

  // ── Contact card ─────────────────────────────────────────────────────────────
  contactCard: {
    marginHorizontal: Spacing.xxl, marginBottom: Spacing.xl,
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  contactRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: Spacing.lg },
  contactIconRed: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff1f2', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  contactIconGray: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  contactLabel: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  contactValue: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary },
  mapBtn: {
    backgroundColor: '#0ea5e9', borderRadius: Radius.md, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginBottom: 10,
    shadowColor: '#0ea5e9', shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  reviewBtn: {
    backgroundColor: '#0f172a', borderRadius: Radius.md, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
  },
  actionBtnText: { color: '#fff', fontFamily: Typography.fontBold, fontSize: Typography.md },
});
