import React, { useState } from 'react';
import {
  View, Text, ScrollView, FlatList,
  TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, MapPin, Clock, Building } from 'lucide-react';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { JobItem } from '../../types';
import { JOB_CATEGORIES, JOBS } from '../../data/mockData';

interface Props {
  onBack:      () => void;
  onList:      (title: string) => void;
  onProfile:   (job: JobItem) => void;
  bottomInset: number;
}

export default function OpportunitiesHubScreen({ onBack, onList, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState('all');

  return (
    <View style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>Qendra e Mundësive</Text>
            <Text style={styles.headerTitle}>Karriera & Praktika</Text>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Kërko pozicion ose kompani...</Text>
        </View>
      </View>

      {/* ── Category pills ──────────────────────────────────────────────── */}
      <View style={styles.catSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        >
          {JOB_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, activeCat === cat.id && styles.catPillActive]}
              activeOpacity={0.8}
              onPress={() => {
                setActiveCat(cat.id);
                if (cat.id !== 'all') onList(cat.name);
              }}
            >
              <Text style={styles.catEmoji}>{cat.icon}</Text>
              <Text style={[styles.catText, activeCat === cat.id && styles.catTextActive]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >

        {/* ── Më të fundit ─────────────────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <View style={[styles.sectionHeader, styles.sectionPadH]}>
            <View>
              <Text style={styles.sectionTitle}>Më të fundit</Text>
              <Text style={styles.sectionSubtitle}>Gjej mundësi për punësim dhe praktika.</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => onList('Të gjitha Mundësitë')}
            >
              <Text style={styles.seeAllText}>Shiko të gjitha</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.jobListWrap}>
            {JOBS.map(job => (
              <JobCard key={job.id} job={job} onPress={() => onProfile(job)} />
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Shared job card (reused in ListScreen) ────────────────────────────────────
export function JobCard({ job, onPress }: { job: JobItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.92}>

      {/* Top row: logo + badge */}
      <View style={styles.jobCardTop}>
        <View style={styles.jobLogo}>
          <Image source={{ uri: job.img }} style={styles.jobLogoImg} resizeMode="cover" />
        </View>
        <View style={[styles.jobBadge, { backgroundColor: job.badgeBg, borderColor: job.badgeBorder }]}>
          <Text style={[styles.jobBadgeText, { color: job.badgeText }]}>{job.type}</Text>
        </View>
      </View>

      {/* Title + company */}
      <View style={styles.jobCardMid}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        <View style={styles.jobCompanyRow}>
          <Building size={13} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.jobCompany}>{job.company}</Text>
        </View>
      </View>

      {/* Description */}
      <Text style={styles.jobDesc} numberOfLines={2}>{job.desc}</Text>

      {/* Footer: location + deadline */}
      <View style={styles.jobFooter}>
        <View style={styles.jobLocation}>
          <MapPin size={12} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.jobLocationText}>{job.location}</Text>
        </View>
        <View style={styles.jobDeadline}>
          <Clock size={12} color="#be123c" strokeWidth={2} />
          <Text style={styles.jobDeadlineText}>Afati: {job.date}</Text>
        </View>
      </View>

    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },

  // Header
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
  headerSub: {
    fontFamily: Typography.fontBold, fontSize: Typography.xs,
    color: '#f43f5e', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
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

  // Categories
  catSection: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    paddingVertical: Spacing.lg,
  },
  catList: { paddingHorizontal: Spacing.xxl, gap: 8 },
  catPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  catPillActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  catEmoji: { fontSize: 13 },
  catText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary },
  catTextActive: { color: '#fff' },

  // Section helpers
  sectionPadH: { paddingHorizontal: Spacing.xxl },
  sectionMb:   { marginBottom: Spacing.xxxl, marginTop: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: Colors.textPrimary, marginBottom: 2,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary,
  },
  seeAllBtn: {
    backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
  },
  seeAllText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#0ea5e9' },

  // Job cards
  jobListWrap: { paddingHorizontal: Spacing.xxl, gap: 16 },
  jobCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  jobCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  jobLogo: {
    width: 56, height: 56, borderRadius: 14,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.borderLight,
  },
  jobLogoImg: { width: '100%', height: '100%' },
  jobBadge: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1,
  },
  jobBadgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 10,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  jobCardMid: { marginBottom: Spacing.sm },
  jobTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: Colors.textPrimary, marginBottom: 4, lineHeight: 22,
  },
  jobCompanyRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  jobCompany: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary,
  },
  jobDesc: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base,
    color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg,
  },
  jobFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  jobLocation: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  jobLocationText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary,
  },
  jobDeadline: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff1f2', paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.sm,
  },
  jobDeadlineText: {
    fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#be123c',
  },
});
