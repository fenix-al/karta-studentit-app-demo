import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Share2, Heart, Calendar, MapPin, HandHeart, CheckCircle,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { ActActivity } from '../../types';

interface Props {
  activity:    ActActivity;
  onBack:      () => void;
  bottomInset: number;
}

// Height of the sticky footer (button + note + padding top)
const FOOTER_H = 110;

export default function ActProfileScreen({ activity, onBack, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [joined, setJoined] = useState(false);

  return (
    <View style={styles.root}>

      {/* ── Sticky white header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
          <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Share2 size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Heart size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Scrollable content ─────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + FOOTER_H + 16 }}
      >

        {/* Hero image */}
        <View style={styles.heroPad}>
          <View style={styles.heroWrap}>
            <Image source={{ uri: activity.img }} style={styles.heroImage} resizeMode="cover" />
            <View style={[styles.catBadge, { backgroundColor: activity.badgeColor }]}>
              <Text style={styles.catBadgeText}>{activity.category}</Text>
            </View>
          </View>
        </View>

        {/* Title */}
        <View style={styles.titlePad}>
          <Text style={styles.title}>{activity.title}</Text>
        </View>

        {/* Info box */}
        <View style={styles.infoBoxPad}>
          <View style={styles.infoBox}>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#f0f9ff' }]}>
                <Calendar size={20} color="#0ea5e9" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Data & Ora</Text>
                <Text style={styles.infoValue}>{activity.fullDate} • {activity.time}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#fff1f2' }]}>
                <MapPin size={20} color="#f43f5e" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Vendndodhja</Text>
                <Text style={styles.infoValue}>{activity.location}</Text>
              </View>
            </View>

          </View>
        </View>

        {/* Description */}
        <View style={styles.descPad}>
          <Text style={styles.descTitle}>Rreth Aktivitetit</Text>
          <View style={styles.descCard}>
            <Text style={styles.descText}>{activity.fullDesc}</Text>
          </View>
        </View>

      </ScrollView>

      {/* ── Sticky bottom action ────────────────────────────────────────────── */}
      <View style={[styles.stickyFooter, { paddingBottom: bottomInset + 16 }]}>
        <TouchableOpacity
          style={[styles.joinBtn, joined && styles.joinBtnDone]}
          activeOpacity={0.88}
          onPress={() => !joined && setJoined(true)}
        >
          {joined
            ? <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
            : <HandHeart size={20} color="#fff" strokeWidth={2} />
          }
          <Text style={styles.joinBtnText}>
            {joined ? 'Je Regjistruar në Aktivitet' : 'Merr Pjesë si Vullnetar'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Skanoni kartën kur të paraqiteni për të marrë Pikë Vullnetarizmi.
        </Text>
      </View>

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
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },

  // Hero
  heroPad: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  heroWrap: {
    height: 224, borderRadius: Radius.xxl + 4,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.borderLight,
  },
  heroImage: { width: '100%', height: '100%' },
  catBadge: {
    position: 'absolute', top: 14, left: 14,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  catBadgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 11,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 0.8,
  },

  // Title
  titlePad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  title: {
    fontFamily: Typography.fontExtraBold, fontSize: 22,
    color: '#003366', lineHeight: 30,
  },

  // Info box
  infoBoxPad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  infoBox: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  infoIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  infoLabel: {
    fontFamily: Typography.fontBold, fontSize: Typography.xs,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  infoValue: {
    fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.lg },

  // Description
  descPad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl },
  descTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  descCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  descText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md,
    color: Colors.textSecondary, lineHeight: 24,
  },

  // Sticky footer
  stickyFooter: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: Spacing.xxl,
    paddingTop: 16,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 }, elevation: 10,
  },
  joinBtn: {
    backgroundColor: '#0aa8a7', borderRadius: Radius.xxl,
    paddingVertical: 15, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#0aa8a7', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  joinBtnDone: { backgroundColor: '#10b981', shadowColor: '#10b981' },
  joinBtnText: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.lg,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  footerNote: {
    fontFamily: Typography.fontMedium, fontSize: 10,
    color: Colors.textMuted, textAlign: 'center', marginTop: 8,
  },
});
