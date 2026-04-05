import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, FlatList, ActivityIndicator, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Calendar, MapPin } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { CourseCategory, CourseItem } from '../../types';
import { HOW_IT_WORKS } from '../../data/mockData';
import { useFetch } from '../../hooks/useFetch';
import { fetchKursCategories, fetchKurset } from '../../services/api';
import ScreenState from '../../components/ScreenState';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800';

function apiToCourseItem(k: any): CourseItem {
  return {
    id: String(k.id),
    title: k.title ?? '',
    category: k.categories?.[0] ?? 'Kurs',
    categories: k.categories ?? [],
    categorySlugs: k.category_slugs ?? [],
    badgeColor: '#0891b2',
    date: k.start_date ?? '',
    location: k.location ?? 'Shkoder',
    duration: k.duration ?? '—',
    cert: k.certification_text ?? 'Po, pas perfundimit',
    seats: typeof k.free_spots === 'number' && k.total_spots ? `${k.free_spots} / ${k.total_spots} vende` : (k.total_spots ? `${k.total_spots} vende` : ''),
    totalSpots: k.total_spots ?? 0,
    freeSpots: typeof k.free_spots === 'number' ? k.free_spots : null,
    img: k.image || PLACEHOLDER,
    desc: k.excerpt ?? '',
    isEnrolled: !!k.is_enrolled,
    enrollStatus: k.enroll_status ?? null,
    canEnroll: !!k.can_enroll,
  };
}

interface Props {
  onBack: () => void;
  onList: (title: string, categorySlug?: string) => void;
  onProfile: (course: CourseItem) => void;
  bottomInset: number;
}

export default function CoursesHubScreen({ onBack, onList, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState('all');
  const { data, loading, error, reload } = useFetch(() => fetchKurset({ category: activeCat === 'all' ? '' : activeCat }) as Promise<any>, [activeCat]);
  const { data: catData } = useFetch(() => fetchKursCategories());
  const courses: CourseItem[] = (data?.items ?? []).map(apiToCourseItem);

  const categories = useMemo<CourseCategory[]>(() => {
    const live = (catData ?? []).map((c) => ({ id: c.slug, name: c.name, icon: '•' }));
    return [{ id: 'all', name: 'Te gjitha', icon: '•' }, ...live];
  }, [catData]);

  return (
    <View style={styles.root}>
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
          <Text style={styles.searchPlaceholder}>Kurse, trajnime, kategori...</Text>
        </View>
      </View>

      <View style={styles.catSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catList}>
          {categories.map((cat) => (
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

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 24 }}>
        <View style={styles.sectionMb}>
          <Text style={[styles.sectionTitle, styles.sectionPadH]}>Si funksionon</Text>
          <FlatList
            data={HOW_IT_WORKS}
            horizontal
            keyExtractor={(s) => s.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
            renderItem={({ item }) => (
              <View style={styles.stepCard}>
                <View style={styles.stepBadge}><Text style={styles.stepBadgeNum}>{item.num}</Text></View>
                <Text style={styles.stepTitle}>{item.title}</Text>
                <Text style={styles.stepDesc}>{item.desc}</Text>
              </View>
            )}
          />
        </View>

        <View style={styles.sectionMb}>
          <View style={[styles.sectionHeader, styles.sectionPadH]}>
            <View>
              <Text style={styles.sectionTitle}>Kurset e Hapura</Text>
              <Text style={styles.sectionSubtitle}>Data reale, kategori reale dhe regjistrim i drejtperdrejte.</Text>
            </View>
            <TouchableOpacity style={styles.seeAllBtn} onPress={() => onList(activeCat === 'all' ? 'Te gjitha Kurset' : `Kategoria: ${categories.find((c) => c.id === activeCat)?.name ?? ''}`, activeCat === 'all' ? undefined : activeCat)}>
              <Text style={styles.seeAllText}>Shiko te gjitha</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}><ActivityIndicator size="large" color="#e30613" /></View>
          ) : error ? (
            <View style={styles.centered}>
              <ScreenState
                icon="error"
                title="Gabim ne ngarkim"
                message={error}
                actionLabel="Provo perseri"
                onAction={reload}
              />
            </View>
          ) : (
            <View style={styles.courseListWrap}>
              {courses.length ? (
                courses.map((course) => <CourseCard key={course.id} course={course} onPress={() => onProfile(course)} />)
              ) : (
                <ScreenState
                  icon="empty"
                  title="Nuk ka kurse"
                  message="Kur te publikohen kurse te reja, do te shfaqen ketu."
                  actionLabel="Kthehu ne Home"
                  onAction={onBack}
                />
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export function CourseCard({ course, onPress }: { course: CourseItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.courseCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.courseImageWrap}>
        <Image source={{ uri: course.img }} style={styles.courseImage} resizeMode="cover" />
        <View style={styles.courseOverlay} />
        <View style={[styles.courseBadge, { backgroundColor: course.badgeColor }]}>
          <Text style={styles.courseBadgeText}>{course.category}</Text>
        </View>
      </View>
      <View style={styles.courseBody}>
        <Text style={styles.courseTitle}>{course.title}</Text>
        <View style={styles.courseMeta}>
          <View style={styles.courseMetaRow}><Calendar size={13} color={Colors.textMuted} /><Text style={styles.courseMetaText}>Fillon: {course.date || '—'}</Text></View>
          <View style={styles.courseMetaRow}><MapPin size={13} color={Colors.textMuted} /><Text style={styles.courseMetaText}>{course.location}</Text></View>
        </View>
        <View style={styles.courseActionRow}>
          <Text style={[styles.courseActionText, course.isEnrolled && styles.courseActionTextDone]}>
            {course.isEnrolled ? 'Jeni regjistruar tashme' : 'Shiko detajet & regjistrohu'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg }, scroll: { flex: 1 }, centered: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: { backgroundColor: Colors.white, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.lg }, headerSub: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }, headerTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border },
  searchPlaceholder: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted, flex: 1 },
  catSection: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingVertical: Spacing.lg }, catList: { paddingHorizontal: Spacing.xxl, gap: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  catPillActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary }, catEmoji: { fontSize: 14 }, catText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary }, catTextActive: { color: '#fff' },
  sectionPadH: { paddingHorizontal: Spacing.xxl }, sectionMb: { marginBottom: Spacing.xxxl }, sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: Spacing.lg },
  sectionTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary, marginBottom: Spacing.lg }, sectionSubtitle: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, marginTop: -Spacing.md, maxWidth: 240 },
  seeAllBtn: { backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full }, seeAllText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#0ea5e9' },
  hList: { paddingHorizontal: Spacing.xxl, gap: 12, paddingBottom: 4, paddingTop: 4 }, stepCard: { width: 200, backgroundColor: Colors.white, borderRadius: Radius.xxl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight }, stepBadge: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#dc2626', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md }, stepBadgeNum: { fontFamily: Typography.fontExtraBold, fontSize: Typography.md, color: '#fff' }, stepTitle: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary, marginBottom: 4 }, stepDesc: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },
  courseListWrap: { paddingHorizontal: Spacing.xxl, gap: 20 }, courseCard: { backgroundColor: Colors.white, borderRadius: Radius.xxl + 4, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 3 },
  courseImageWrap: { height: 176, backgroundColor: Colors.borderLight }, courseImage: { width: '100%', height: '100%' }, courseOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.30)' }, courseBadge: { position: 'absolute', top: 14, left: 14, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md }, courseBadgeText: { color: '#fff', fontFamily: Typography.fontExtraBold, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  courseBody: { padding: Spacing.xl }, courseTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary, marginBottom: Spacing.md, lineHeight: 24 }, courseMeta: { gap: 8, marginBottom: Spacing.lg }, courseMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 }, courseMetaText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary },
  courseActionRow: { backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl, paddingVertical: 13, alignItems: 'center', borderWidth: 1, borderColor: '#fecaca' }, courseActionText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#dc2626' }, courseActionTextDone: { color: '#166534' },
});
