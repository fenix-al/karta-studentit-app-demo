import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { CourseCategory, CourseItem } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchKursCategories, fetchKurset } from '../../services/api';
import { CourseCard } from './CoursesHubScreen';
import ScreenState from '../../components/ScreenState';

const mapCourse = (k: any): CourseItem => ({
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
  img: k.image ?? '',
  desc: k.excerpt ?? '',
  isEnrolled: !!k.is_enrolled,
  enrollStatus: k.enroll_status ?? null,
  canEnroll: !!k.can_enroll,
});

interface Props {
  title: string;
  categorySlug?: string;
  onBack: () => void;
  onProfile: (course: CourseItem) => void;
  bottomInset: number;
}

export default function CoursesListScreen({ title, categorySlug, onBack, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState(categorySlug ?? 'all');
  const { data, loading, error, reload } = useFetch(() => fetchKurset({ category: activeCat === 'all' ? '' : activeCat }) as Promise<any>, [activeCat]);
  const { data: catData } = useFetch(() => fetchKursCategories());
  const courses: CourseItem[] = (data?.items ?? []).map(mapCourse);
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
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Liste reale e kurseve</Text>
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
      ) : courses.length === 0 ? (
        <View style={styles.centered}>
          <ScreenState
            icon="empty"
            title="Nuk ka kurse"
            message="Nuk ka kurse te publikuara ne kete kategori."
            actionLabel="Kthehu ne Home"
            onAction={onBack}
          />
        </View>
      ) : (
        <FlatList
          data={courses}
          keyExtractor={(c) => c.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 24 }]}
          renderItem={({ item }) => <CourseCard course={item} onPress={() => onProfile(item)} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg }, centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  header: { backgroundColor: Colors.white, paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.lg }, iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  headerTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary, flex: 1 }, searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl, paddingHorizontal: Spacing.lg, paddingVertical: 14, borderWidth: 1, borderColor: Colors.border }, searchPlaceholder: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted, flex: 1 },
  catSection: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, paddingVertical: Spacing.lg },
  catList: { paddingHorizontal: Spacing.xxl, gap: 8 },
  catPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white },
  catPillActive: { backgroundColor: Colors.textPrimary, borderColor: Colors.textPrimary },
  catEmoji: { fontSize: 14 },
  catText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary },
  catTextActive: { color: '#fff' },
  list: { padding: Spacing.xxl, gap: 20 },
});
