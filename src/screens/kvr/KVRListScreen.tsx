import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, ScrollView,
  TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { KvrActivity } from '../../types';
import { KVRActivityCard } from './KVRHubScreen';
import { useFetch } from '../../hooks/useFetch';
import { fetchKvr, fetchKvrCategories } from '../../services/api';
import ScreenState from '../../components/ScreenState';
import ListSkeleton from '../../components/ListSkeleton';

const NAVY = '#003366';
const ALL_PILL = { id: 'all', name: 'Të gjitha' };
const PLACEHOLDER = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800';

function apiToKvrActivity(k: any): KvrActivity {
  return {
    id: String(k.id),
    title: k.title ?? '',
    category: k.category ?? '',
    catId: k.cat_id ?? '',
    date: k.date ?? '',
    img: k.image || PLACEHOLDER,
    desc: k.excerpt ?? '',
    fullDesc: k.content ?? k.excerpt ?? '',
    location: k.location ?? 'Bashkia Shkodër',
  };
}

interface Props {
  title: string;
  initialCatId: string;
  onBack: () => void;
  onProfile: (activityId: string) => void;
  bottomInset: number;
}

export default function KVRListScreen({ title, initialCatId, onBack, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState(initialCatId || 'all');

  const {
    data: categoryData,
    loading: categoryLoading,
  } = useFetch(() => fetchKvrCategories());

  const {
    data,
    loading,
    error,
    reload,
  } = useFetch(
    () => fetchKvr(activeCat === 'all' ? undefined : { category: activeCat }) as Promise<any>,
    [activeCat],
  );

  useEffect(() => {
    setActiveCat(initialCatId || 'all');
  }, [initialCatId]);

  const pills = useMemo(
    () => [ALL_PILL, ...((categoryData ?? []).map((item) => ({ id: item.slug, name: item.name })))],
    [categoryData],
  );

  const items: KvrActivity[] = (data?.items ?? []).map(apiToKvrActivity);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
        >
          {pills.map((pill) => (
            <TouchableOpacity
              key={pill.id}
              style={[styles.filterPill, activeCat === pill.id && styles.filterPillActive]}
              activeOpacity={0.8}
              onPress={() => setActiveCat(pill.id)}
            >
              <Text style={[styles.filterText, activeCat === pill.id && styles.filterTextActive]}>
                {pill.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading || categoryLoading ? (
        <ListSkeleton count={4} />
      ) : error ? (
        <View style={styles.centered}>
          <ScreenState
            icon="error"
            title="Gabim në ngarkim"
            message="Postimet e KVR nuk u ngarkuan dot."
            actionLabel="Provo përsëri"
            onAction={reload}
          />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <ScreenState
            icon="empty"
            title="Nuk ka postime"
            message="Lajmet për këtë kategori do të shfaqen këtu."
            actionLabel="Kthehu ne Home"
            onAction={onBack}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 24 }]}
          renderItem={({ item }) => (
            <View style={styles.fullWidthCard}>
              <KVRActivityCard activity={item} onPress={() => onProfile(item.id)} fullWidth />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: Spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xxl,
    color: NAVY,
    flex: 1,
  },
  filterList: { gap: 8 },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  filterPillActive: { backgroundColor: NAVY, borderColor: NAVY },
  filterText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary },
  filterTextActive: { color: '#fff' },

  list: { padding: Spacing.xxl, gap: 20 },
  fullWidthCard: { width: '100%' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl, gap: 12 },
});
