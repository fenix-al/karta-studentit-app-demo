import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, ActivityIndicator,
  TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, MapPin, Clock, Building } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { JobCategory, JobItem } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchJobCategories, fetchJobs } from '../../services/api';
import ScreenState from '../../components/ScreenState';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800';

function badgeStyle(typeSlugs: string[] = []): { badgeBg: string; badgeText: string; badgeBorder: string } {
  const t = (typeSlugs[0] ?? '').toLowerCase();
  if (t.includes('prakt')) return { badgeBg: '#f3e8ff', badgeText: '#7e22ce', badgeBorder: '#e9d5ff' };
  if (t.includes('part'))  return { badgeBg: '#fef9c3', badgeText: '#854d0e', badgeBorder: '#fde047' };
  if (t.includes('full'))  return { badgeBg: '#dcfce7', badgeText: '#166534', badgeBorder: '#86efac' };
  if (t.includes('vull'))  return { badgeBg: '#fff1f2', badgeText: '#be123c', badgeBorder: '#fecdd3' };
  return { badgeBg: '#e0f2fe', badgeText: '#0369a1', badgeBorder: '#bae6fd' };
}

export function apiToJobItem(o: any): JobItem {
  const badge = badgeStyle(o.type_slugs ?? []);
  return {
    id:       String(o.id),
    title:    o.title ?? '',
    company:  o.company ?? '',
    type:     (o.types?.[0] ?? 'Mundësi').toUpperCase(),
    typeSlug: o.type_slugs?.[0] ?? 'all',
    typeSlugs: o.type_slugs ?? [],
    ...badge,
    date:     o.deadline || o.date || '',
    location: o.location || 'Shkodër',
    salary:   o.salary ?? '',
    duration: '',
    img:      o.image || PLACEHOLDER,
    desc:     o.excerpt ?? '',
    applied:  !!o.is_applied,
    applyStatus: o.apply_status ?? null,
    canApply: !!o.can_apply,
    content:  o.content ?? '',
  };
}

interface Props {
  onBack:      () => void;
  onList:      (title: string, typeSlug?: string) => void;
  onProfile:   (job: JobItem) => void;
  bottomInset: number;
}

export default function OpportunitiesHubScreen({ onBack, onList, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState('all');
  const { data, loading, error, reload } = useFetch(
    () => fetchJobs({ type: activeCat === 'all' ? '' : activeCat }) as Promise<any>,
    [activeCat],
  );
  const { data: catData } = useFetch(() => fetchJobCategories());
  const jobs = ((data?.items ?? []) as any[]).map(apiToJobItem);

  const categories = useMemo<JobCategory[]>(() => {
    const live = (catData ?? []).map((c) => ({ id: c.slug, name: c.name, icon: '•' }));
    return [{ id: 'all', name: 'Të gjitha', icon: '•' }, ...live];
  }, [catData]);

  return (
    <View style={styles.root}>
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

      <View style={styles.catSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, activeCat === cat.id && styles.catPillActive]}
              activeOpacity={0.8}
              onPress={() => setActiveCat(cat.id)}
            >
              <Text style={styles.catEmoji}>{cat.icon}</Text>
              <Text style={[styles.catText, activeCat === cat.id && styles.catTextActive]}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e30613" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ScreenState
            icon="error"
            title="Gabim ne ngarkim"
            message={typeof error === 'object' && error !== null && 'message' in error ? (error as Error).message : String(error)}
            actionLabel="Provo përsëri"
            onAction={reload}
          />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        >
          <View style={styles.sectionMb}>
            <View style={[styles.sectionHeader, styles.sectionPadH]}>
              <View>
                <Text style={styles.sectionTitle}>Me të fundit</Text>
                <Text style={styles.sectionSubtitle}>{jobs.length} mundësi pune dhe praktikash.</Text>
              </View>
              <TouchableOpacity
                style={styles.seeAllBtn}
                onPress={() => onList(
                  activeCat === 'all' ? 'Të gjitha Mundësitë' : `Kategoria: ${categories.find((c) => c.id === activeCat)?.name ?? ''}`,
                  activeCat === 'all' ? undefined : activeCat,
                )}
              >
                <Text style={styles.seeAllText}>Shiko të gjitha</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.jobListWrap}>
              {jobs.length ? (
                jobs.map(job => (
                  <JobCard key={job.id} job={job} onPress={() => onProfile(job)} />
                ))
              ) : (
                <ScreenState
                  icon="briefcase"
                  title="Nuk ka mundësi"
                  message="Kur të publikohen mundësi të reja, do të shfaqen këtu."
                  actionLabel="Kthehu ne Home"
                  onAction={onBack}
                />
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

export function JobCard({ job, onPress }: { job: JobItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.jobCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.jobCardTop}>
        <View style={styles.jobLogo}>
          <Image source={{ uri: job.img }} style={styles.jobLogoImg} resizeMode="cover" />
        </View>
        <View style={[styles.jobBadge, { backgroundColor: job.badgeBg, borderColor: job.badgeBorder }]}>
          <Text style={[styles.jobBadgeText, { color: job.badgeText }]}>{job.type}</Text>
        </View>
      </View>

      <View style={styles.jobCardMid}>
        <Text style={styles.jobTitle}>{job.title}</Text>
        {job.company ? (
          <View style={styles.jobCompanyRow}>
            <Building size={13} color={Colors.textMuted} strokeWidth={2} />
            <Text style={styles.jobCompany}>{job.company}</Text>
          </View>
        ) : null}
      </View>

      {job.desc ? <Text style={styles.jobDesc} numberOfLines={2}>{job.desc}</Text> : null}

      <View style={styles.jobFooter}>
        <View style={styles.jobLocation}>
          <MapPin size={12} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.jobLocationText}>{job.location || 'Shkodër'}</Text>
        </View>
        {job.date ? (
          <View style={styles.jobDeadline}>
            <Clock size={12} color="#be123c" strokeWidth={2} />
            <Text style={styles.jobDeadlineText}>Afati: {job.date}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll:  { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.lg },
  headerSub: {
    fontFamily: Typography.fontBold, fontSize: Typography.xs,
    color: '#f43f5e', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  headerTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary },
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
  searchPlaceholder: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted, flex: 1 },

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
  sectionSubtitle: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary },
  seeAllBtn: { backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full },
  seeAllText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#0ea5e9' },

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
  jobBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, borderWidth: 1 },
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
  jobCompany: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary },
  jobDesc: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base,
    color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg,
  },
  jobFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  jobLocation: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  jobLocationText: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary },
  jobDeadline: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fff1f2', paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.sm,
  },
  jobDeadlineText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#be123c' },
});
