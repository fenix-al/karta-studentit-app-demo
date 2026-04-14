import React from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { StartupItem } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchStartups } from '../../services/api';
import { StartupCard } from './StartupHubScreen';
import ScreenState from '../../components/ScreenState';
import ListSkeleton from '../../components/ListSkeleton';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800';

function apiToStartupItem(s: any): StartupItem {
  const isCall = !!s.is_call;
  return {
    id: String(s.id),
    title: s.title ?? '',
    type: s.type_label ?? 'Startup',
    category: isCall ? 'thirrje' : 'udhezues',
    badgeBg: isCall ? '#fdf4ff' : '#eff6ff',
    badgeText: isCall ? '#7e22ce' : '#1d4ed8',
    badgeBorder: isCall ? '#e9d5ff' : '#bfdbfe',
    date: s.deadline || s.date || '',
    img: s.image || PLACEHOLDER,
    desc: s.excerpt ?? '',
    fullDesc: s.excerpt ?? '',
    criteria: [],
    actionText: isCall ? 'Apliko Tani' : 'Shiko Detajet',
    content: s.content ?? '',
    isCall,
    applyLink: s.apply_link ?? null,
    materials: (s.materials ?? []).map((material: any) => ({
      id: String(material.id),
      title: material.title ?? '',
      desc: material.excerpt ?? '',
    })),
  };
}

interface Props {
  title: string;
  initialType?: 'thirrje' | 'udhezues';
  onBack: () => void;
  onProfile: (itemId: string) => void;
  bottomInset: number;
}

export default function StartupListScreen({ title, initialType, onBack, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useFetch(() => fetchStartups(initialType ? { type: initialType === 'thirrje' ? 'thirrje-te-hapura' : 'udhezues-materiale' } as any : undefined) as Promise<any>, [initialType]);

  const items: StartupItem[] = (data?.items ?? []).map(apiToStartupItem);

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
          <Text style={styles.searchPlaceholder}>Kërko në listë...</Text>
        </View>
      </View>

      {loading ? (
        <ListSkeleton count={4} />
      ) : error ? (
        <View style={styles.centered}>
          <ScreenState
            icon="error"
            title="Gabim në ngarkim"
            message="Lista nuk u ngarkua dot."
            actionLabel="Provo përsëri"
            onAction={reload}
          />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centered}>
          <ScreenState
            icon="startup"
            title="Nuk ka startup të publikuara"
            message="Kur të shtohen postime të reja, ato do të shfaqen këtu."
            actionLabel="Kthehu ne Home"
            onAction={onBack}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.list, { paddingBottom: bottomInset + 24 }]}
          renderItem={({ item }) => (
            <StartupCard item={item} onPress={() => onProfile(item.id)} />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl, gap: 12 },

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
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: Colors.textPrimary, flex: 1,
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

  list: { padding: Spacing.xxl, gap: 20 },
});
