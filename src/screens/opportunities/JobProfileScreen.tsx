import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Share2, Heart, MapPin,
  Briefcase, Clock, DollarSign, CheckCircle, Building,
} from 'lucide-react';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { JobItem } from '../../types';

interface Props {
  job:         JobItem;
  onBack:      () => void;
  bottomInset: number;
}

export default function JobProfileScreen({ job, onBack, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [applied, setApplied] = useState(false);

  return (
    <View style={styles.root}>

      {/* ── Transparent overlay header ────────────────────────────────────── */}
      <View style={[styles.overlayHeader, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.overlayBtn} onPress={onBack} activeOpacity={0.8}>
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
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >

        {/* ── Hero image ────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Image source={{ uri: job.img }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
        </View>

        {/* ── Floating badge + title ────────────────────────────────────── */}
        <View style={styles.mainInfo}>
          <View style={[styles.badge, { backgroundColor: job.badgeBg, borderColor: job.badgeBorder }]}>
            <Text style={[styles.badgeText, { color: job.badgeText }]}>{job.type}</Text>
          </View>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <View style={styles.companyRow}>
            <Building size={15} color={Colors.textMuted} strokeWidth={2} />
            <Text style={styles.companyName}>{job.company}</Text>
          </View>
        </View>

        {/* ── Info box ─────────────────────────────────────────────────── */}
        <View style={styles.infoBoxPad}>
          <View style={styles.infoBox}>

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: Colors.surfaceBg }]}>
                <MapPin size={20} color={Colors.textSecondary} strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Vendndodhja</Text>
                <Text style={styles.infoValue}>{job.location}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#fffbeb' }]}>
                <Briefcase size={20} color="#f59e0b" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Lloji i Pozicionit</Text>
                <Text style={styles.infoValue}>{job.type} / {job.duration}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#fff1f2' }]}>
                <Clock size={20} color="#be123c" strokeWidth={2} />
              </View>
              <View>
                <Text style={[styles.infoLabel, { color: '#f43f5e' }]}>Afati i Aplikimit</Text>
                <Text style={styles.infoValue}>{job.date}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#ecfdf5' }]}>
                <DollarSign size={20} color="#10b981" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Paga / Shpërblimi</Text>
                <Text style={[styles.infoValue, { color: '#059669' }]}>{job.salary}</Text>
              </View>
            </View>

          </View>
        </View>

        {/* ── Description ───────────────────────────────────────────────── */}
        <View style={styles.descPad}>
          <Text style={styles.descTitle}>Përshkrimi i Pozicionit</Text>
          <View style={styles.descCard}>
            <Text style={styles.descText}>{job.desc}</Text>
            <Text style={styles.criteriaTitle}>Kriteret:</Text>
            {[
              'Student në vitin e 2-të ose 3-të.',
              'Dëshirë për të mësuar dhe punuar në ekip.',
              'Njohuri bazë në paketën Office/Mjetet digjitale.',
            ].map((c, i) => (
              <View key={i} style={styles.criteriaRow}>
                <View style={styles.criteriaDot} />
                <Text style={styles.criteriaText}>{c}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Apply button ──────────────────────────────────────────────── */}
        <View style={styles.applyPad}>
          <TouchableOpacity
            style={[styles.applyBtn, applied && styles.applyBtnDone]}
            activeOpacity={0.88}
            onPress={() => !applied && setApplied(true)}
          >
            <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
            <Text style={styles.applyBtnText}>
              {applied ? 'Aplikimi u Dërgua!' : 'Apliko Tani'}
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },

  // Overlay header
  overlayHeader: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg, zIndex: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  overlayBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  overlayRight: { flexDirection: 'row', gap: 8 },

  // Hero
  hero: { height: 280 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.20)' },

  // Main info
  mainInfo: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl, paddingBottom: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight, marginBottom: Spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, marginBottom: Spacing.md,
  },
  badgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 10,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  jobTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.h2,
    color: Colors.textPrimary, lineHeight: 30, marginBottom: Spacing.sm,
  },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  companyName: {
    fontFamily: Typography.fontSemiBold, fontSize: Typography.md, color: Colors.textSecondary,
  },

  // Info box
  infoBoxPad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  infoBox: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
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
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  descText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md,
    color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.lg,
  },
  criteriaTitle: {
    fontFamily: Typography.fontBold, fontSize: Typography.lg,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  criteriaRow:  { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  criteriaDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: Colors.textMuted, marginTop: 7, flexShrink: 0,
  },
  criteriaText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md,
    color: Colors.textSecondary, lineHeight: 22, flex: 1,
  },

  // Apply button
  applyPad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl },
  applyBtn: {
    backgroundColor: '#dc2626', borderRadius: Radius.xxl,
    paddingVertical: 16, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#dc2626', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  applyBtnDone: { backgroundColor: '#10b981', shadowColor: '#10b981' },
  applyBtnText: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.lg,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
  },
});
