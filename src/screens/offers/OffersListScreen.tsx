import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  Image, TextInput, ActivityIndicator, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Heart, ArrowDownUp } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { Business } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchOffers } from '../../services/api';
import { apiBizToBusiness } from '../../services/mappers';

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

  const { data, loading } = useFetch(
    () => fetchOffers(catSlug ? { category: catSlug } : undefined),
    [catSlug],
  );

  const allBiz: Business[] = useMemo(() =>
    (data as any)?.items?.map(apiBizToBusiness) ?? [],
    [data],
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return allBiz;
    const q = search.toLowerCase();
    return allBiz.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.category.toLowerCase().includes(q) ||
      b.discount.toLowerCase().includes(q),
    );
  }, [allBiz, search]);

  return (
    <View style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        </View>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Search size={14} color={Colors.textMuted} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder="Kërko në listë..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
          </View>
          <TouchableOpacity style={styles.sortBtn}>
            <ArrowDownUp size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Loading ──────────────────────────────────────────────────── */}
      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.textMuted} />
          <Text style={styles.loadingText}>Duke ngarkuar bizneset...</Text>
        </View>
      )}

      {/* ── Vertical feed ────────────────────────────────────────────── */}
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
                <TouchableOpacity style={styles.heartBtn}>
                  <Heart size={18} color={Colors.textSecondary} strokeWidth={2} />
                </TouchableOpacity>
                <View style={styles.timeChip}>
                  <Text style={styles.timeText}>{biz.time}</Text>
                </View>
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

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 3, zIndex: 20,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.lg },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, flexShrink: 0,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: Colors.textPrimary, flex: 1,
  },
  searchRow: { flexDirection: 'row', gap: 12 },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: 12,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: {
    flex: 1, fontFamily: Typography.fontMedium,
    fontSize: Typography.base, color: Colors.textPrimary,
  },
  sortBtn: {
    width: 52, borderRadius: Radius.xl,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // ── Cards ───────────────────────────────────────────────────────────────────
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
  timeChip: {
    position: 'absolute', bottom: 12, right: 12,
    backgroundColor: 'rgba(15,23,42,0.70)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.md,
  },
  timeText:  { color: '#7dd3fc', fontFamily: Typography.fontBold, fontSize: Typography.sm },
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
