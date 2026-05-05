import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, TextInput, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Heart, ArrowDownUp, X } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { Business } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchOffers, recommendBusiness } from '../../services/api';
import { apiBizToBusiness } from '../../services/mappers';
import ListSkeleton from '../../components/ListSkeleton';

interface Props {
  title:       string;
  catSlug?:    string;
  onBack:      () => void;
  onProfile:   (biz: Business) => void;
  bottomInset: number;
}

export default function OffersListScreen({ title, catSlug, onBack, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortByDiscount, setSortByDiscount] = useState(false);
  const searchInputRef = useRef<TextInput | null>(null);
  const [voteOverrides, setVoteOverrides] = useState<Record<string, { votes: number; recommended: boolean }>>({});

  const { data, loading } = useFetch(
    () => fetchOffers(catSlug ? { category: catSlug } : undefined),
    [catSlug],
  );

  const allBiz: Business[] = useMemo(() =>
    ((data as any)?.items?.map(apiBizToBusiness) ?? []).map((biz: Business) => {
      const override = voteOverrides[biz.id];
      return override ? { ...biz, votes: override.votes, has_recommended: override.recommended } : biz;
    }),
    [data, voteOverrides],
  );

  const filtered = useMemo(() => {
    const list = search.trim()
      ? allBiz.filter(b => {
          const q = search.toLowerCase();
          return b.title.toLowerCase().includes(q) ||
                 b.category.toLowerCase().includes(q) ||
                 b.discount.toLowerCase().includes(q);
        })
      : allBiz;
    return [...list].sort((a, b) => {
      if (sortByDiscount) {
        const discountA = Number(a.discount.match(/\d+/)?.[0] ?? 0);
        const discountB = Number(b.discount.match(/\d+/)?.[0] ?? 0);
        return discountB - discountA;
      }
      return (b.votes ?? 0) - (a.votes ?? 0);
    });
  }, [allBiz, search, sortByDiscount]);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 120);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [searchOpen]);

  async function handleToggleRecommend(biz: Business) {
    const current = voteOverrides[biz.id] ?? {
      votes: biz.votes ?? 0,
      recommended: biz.has_recommended ?? false,
    };
    const wasRecommended = current.recommended;

    setVoteOverrides(prev => ({
      ...prev,
      [biz.id]: {
        votes: Math.max(0, current.votes + (wasRecommended ? -1 : 1)),
        recommended: !wasRecommended,
      },
    }));

    try {
      const res = await recommendBusiness(biz.id);
      setVoteOverrides(prev => ({
        ...prev,
        [biz.id]: { votes: res.votes, recommended: res.recommended },
      }));
    } catch {
      setVoteOverrides(prev => ({
        ...prev,
        [biz.id]: current,
      }));
      Alert.alert('Gabim', 'Nuk mund të regjistrohet rekomandimi. Provo përsëri.');
    }
  }

  return (
    <View style={styles.root}>

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerIconBtn}
              onPress={() => {
                if (searchOpen && search.trim()) {
                  setSearch('');
                }
                setSearchOpen((prev) => !prev);
              }}
              activeOpacity={0.85}
            >
              {searchOpen ? (
                <X size={18} color={Colors.textPrimary} strokeWidth={2.2} />
              ) : (
                <Search size={18} color={Colors.textPrimary} strokeWidth={2.2} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerIconBtn, sortByDiscount && styles.headerIconBtnActive]}
              onPress={() => setSortByDiscount((prev) => !prev)}
              activeOpacity={0.85}
            >
              <ArrowDownUp size={18} color={sortByDiscount ? '#0284c7' : Colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
        {searchOpen && (
          <View style={styles.searchBar}>
            <Search size={14} color={Colors.textMuted} strokeWidth={2} />
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Kërko në listë..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
        )}
      </View>

      {/* Loading */}
      {loading && (
        <ListSkeleton count={4} />
      )}

      {/* Vertical feed */}
      {!loading && (
        <FlatList
          data={filtered}
          keyExtractor={b => b.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 24 }]}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>
                {search ? 'Asnjë rezultat për kërkimin tuaj.' : 'Nuk ka biznese për momentin.'}
              </Text>
            </View>
          }
          renderItem={({ item: biz }) => (
            <TouchableOpacity style={styles.card} onPress={() => onProfile(biz)} activeOpacity={0.92}>

              {/* Big image */}
              <View style={styles.imageWrap}>
                <Image source={{ uri: biz.img }} style={styles.image} resizeMode="cover" />
                <View style={styles.imageGradient} />
                <View style={[styles.badge, { backgroundColor: biz.badgeColor }]}>
                  <Text style={styles.badgeText}>{biz.discount}</Text>
                </View>
                <TouchableOpacity
                  style={[styles.heartBtn, biz.has_recommended && styles.heartBtnActive]}
                  onPress={(event) => {
                    event.stopPropagation();
                    handleToggleRecommend(biz);
                  }}
                >
                  <Heart
                    size={18}
                    color={biz.has_recommended ? '#ef4444' : Colors.textSecondary}
                    fill={biz.has_recommended ? '#ef4444' : 'none'}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </View>

              {/* Body */}
              <View style={styles.body}>
                <View style={styles.bodyTop}>
                  <View style={styles.bodyLeft}>
                    <Text style={styles.cardTitle}>{biz.title}</Text>
                    <Text style={styles.cardDesc} numberOfLines={1}>{biz.desc}</Text>
                  </View>
                  <View style={styles.ratingBox}>
                    <Heart size={12} color="#ef4444" fill="#ef4444" strokeWidth={0} />
                    <Text style={styles.ratingText}>{biz.votes ?? 0}</Text>
                  </View>
                </View>
                <View style={styles.footer}>
                  <Text style={styles.footerText}>{biz.category}</Text>
                  <View style={styles.footerDot} />
                  <Text style={styles.footerText}>{biz.votes ?? 0} rekomandime</Text>
                  {biz.address ? (
                    <>
                      <View style={styles.footerDot} />
                      <Text style={styles.footerText} numberOfLines={1}>{biz.address}</Text>
                    </>
                  ) : null}
                </View>
              </View>

            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted },
  emptyWrap:   { paddingTop: 60, alignItems: 'center' },
  emptyText:   { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3, zIndex: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.sm },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, flexShrink: 0,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: Colors.textPrimary, flex: 1,
  },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerIconBtnActive: { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, fontFamily: Typography.fontMedium,
    fontSize: Typography.base, color: Colors.textPrimary,
  },

  // Cards
  listContent: { padding: Spacing.xxl, gap: Spacing.xxl },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  imageWrap: { height: 220, backgroundColor: Colors.borderLight },
  image:     { width: '100%', height: '100%' },
  imageGradient: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.10)' },
  badge: {
    position: 'absolute', top: 14, left: 14,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.md,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  badgeText: { color: '#fff', fontFamily: Typography.fontExtraBold, fontSize: Typography.base, textTransform: 'uppercase', letterSpacing: 0.5 },
  heartBtn: {
    position: 'absolute', top: 12, right: 12,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.90)',
    justifyContent: 'center', alignItems: 'center',
  },
  heartBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  body:      { padding: Spacing.xl },
  bodyTop:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  bodyLeft:  { flex: 1, paddingRight: Spacing.lg },
  cardTitle: { fontFamily: Typography.fontExtraBold, fontSize: 20, color: Colors.textPrimary, marginBottom: 4 },
  cardDesc:  { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary },
  ratingBox: {
    backgroundColor: '#fff1f2', borderWidth: 1, borderColor: '#fecdd3',
    paddingHorizontal: 8, paddingVertical: 6, borderRadius: Radius.sm,
    flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 0,
  },
  ratingText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#be123c' },
  footer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.borderLight, flexWrap: 'wrap',
  },
  footerDot:  { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.border },
  footerText: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
});

