import React, { useState } from 'react';
import {
  View, Text, ScrollView, FlatList, ActivityIndicator,
  TouchableOpacity, Image, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Calendar, MapPin } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { CourseItem } from '../../types';
import { COURSE_CATEGORIES, HOW_IT_WORKS } from '../../data/mockData';
import { useFetch } from '../../hooks/useFetch';
import { fetchKurset } from '../../services/api';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800';

function apiToCourseItem(k: any): CourseItem {
  return {
    id:        String(k.id),
    title:     k.title      ?? '',
    category:  k.categories?.[0] ?? 'Kurs',
    badgeColor: '#0891b2',
    date:      k.start_date ?? '',
    location:  k.location   ?? 'Shkodër',
    duration:  k.duration   ?? '',
    cert:      '',
    seats:     k.total_spots ? `${k.total_spots} vende` : '',
    img:       k.image       || PLACEHOLDER,
    desc:      k.excerpt     ?? '',
  };
}

interface Props {
  onBack:      () => void;
  onList:      (title: string) => void;
  onProfile:   (course: CourseItem) => void;
  bottomInset: number;
}

export default function CoursesHubScreen({ onBack, onList, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState('all');

  const { data, loading, error, reload } = useFetch(() => fetchKurset() as Promise<any>);
  const courses: CourseItem[] = (data?.items ?? []).map(apiToCourseItem);

  return (
    <View style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>Eksploro</Text>
            <Text style={styles.headerTitle}>Kurset Rinore</Text>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Kërko trajnim, aftësi...</Text>
        </View>
      </View>

      {/* ── Category pills ──────────────────────────────────────────────── */}
      <View style={styles.catSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        >
          {COURSE_CATEGORIES.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.catPill, activeCat === cat.id && styles.catPillActive]}
              activeOpacity={0.8}
              onPress={() => {
                setActiveCat(cat.id);
                if (cat.id !== 'all') onList(`Kategoria: ${cat.name}`);
              }}
            >
              {cat.icon ? <Text style={styles.catEmoji}>{cat.icon}</Text> : null}
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

        {/* ── Si funksionon ────────────────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <Text style={[styles.sectionTitle, styles.sectionPadH]}>
            Si funksionon (shkurt)
          </Text>
          <FlatList
            data={HOW_IT_WORKS}
            horizontal
            keyExtractor={s => s.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
            renderItem={({ item: step }) => (
              <View style={styles.stepCard}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeNum}>{step.num}</Text>
                </View>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc}</Text>
              </View>
            )}
          />
        </View>

        {/* ── Kurset e Hapura ──────────────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <View style={[styles.sectionHeader, styles.sectionPadH]}>
            <View>
              <Text style={styles.sectionTitle}>Kurset e Hapura</Text>
              <Text style={styles.sectionSubtitle}>Rezervo vendin tënd së shpejti.</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => onList('Të gjitha Kurset')}
            >
              <Text style={styles.seeAllText}>Shiko të gjitha</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#e30613" />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>
                ⚠️ {typeof error === 'object' && error !== null && 'message' in error ? (error as Error).message : String(error)}
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={reload}>
                <Text style={styles.retryText}>Provo Përsëri</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.courseListWrap}>
              {courses.map(course => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onPress={() => onProfile(course)}
                />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

// ── Shared course card (reused in ListScreen) ─────────────────────────────────
export function CourseCard({ course, onPress }: { course: CourseItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.courseImageWrap}>
        <Image source={{ uri: course.img }} style={styles.courseImage} resizeMode="cover" />
        <View style={styles.courseOverlay} />
        <View style={[styles.courseBadge, { backgroundColor: course.badgeColor }]}>
          <Text style={styles.courseBadgeText}>KURS • {course.category}</Text>
        </View>
      </View>
      <View style={styles.courseBody}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <View style={styles.courseMeta}>
          <View style={styles.courseMetaRow}>
            <Calendar size={13} color={Colors.textMuted} strokeWidth={2} />
            <Text style={styles.courseMetaText}>Fillon: {course.date}</Text>
          </View>
          <View style={styles.courseMetaRow}>
            <MapPin size={13} color={Colors.textMuted} strokeWidth={2} />
            <Text style={styles.courseMetaText}>{course.location}</Text>
          </View>
        </View>
        <View style={styles.courseActionRow}>
          <Text style={styles.courseActionText}>Shiko Detajet & Regjistrohu</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll:  { flex: 1 },
  centered: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary },
  retryBtn:  { backgroundColor: '#e30613', paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full },
  retryText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#fff' },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  headerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.lg,
  },
  headerSub: {
    fontFamily: Typography.fontBold, fontSize: Typography.xs,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
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
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: Radius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  catPillActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  catEmoji: { fontSize: 14 },
  catText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary },
  catTextActive: { color: '#fff' },

  // Section helpers
  sectionPadH: { paddingHorizontal: Spacing.xxl },
  sectionMb:   { marginBottom: Spacing.xxxl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: Colors.textPrimary, marginBottom: Spacing.lg,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, marginTop: -Spacing.md,
  },
  seeAllBtn: {
    backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
  },
  seeAllText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#0ea5e9' },

  // How it works
  hList: { paddingHorizontal: Spacing.xxl, gap: 12, paddingBottom: 4, paddingTop: 4 },
  stepCard: {
    width: 200, backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  stepBadge: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#dc2626',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    shadowColor: '#dc2626', shadowOpacity: 0.25, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  stepBadgeNum: { fontFamily: Typography.fontExtraBold, fontSize: Typography.md, color: '#fff' },
  stepTitle: {
    fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary, marginBottom: 4,
  },
  stepDesc: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18,
  },

  // Course cards
  courseListWrap: { paddingHorizontal: Spacing.xxl, gap: 20 },
  courseCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  courseImageWrap: { height: 176, backgroundColor: Colors.borderLight },
  courseImage:     { width: '100%', height: '100%' },
  courseOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  courseBadge: {
    position: 'absolute', top: 14, left: 14,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  courseBadgeText: {
    color: '#fff', fontFamily: Typography.fontExtraBold,
    fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8,
  },
  courseBody: { padding: Spacing.xl },
  courseTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: Colors.textPrimary, marginBottom: Spacing.md, lineHeight: 24,
  },
  courseMeta:    { gap: 8, marginBottom: Spacing.lg },
  courseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  courseMetaText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary,
  },
  courseActionRow: {
    backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl,
    paddingVertical: 13, alignItems: 'center',
    borderWidth: 1, borderColor: '#fecaca',
  },
  courseActionText: {
    fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#dc2626',
  },
});
