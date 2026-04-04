import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  Image, ActivityIndicator, StyleSheet, TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronLeft, Search, Clock, Heart } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { Business } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchOffers, fetchBusinessCategories, recommendBusiness } from '../../services/api';
import { apiBizToBusiness } from '../../services/mappers';

interface Props {
  onBack:      () => void;
  onList:      (title: string, catSlug?: string) => void;
  onProfile:   (biz: Business) => void;
  bottomInset: number;
}

export default function OffersHubScreen({ onBack, onList, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activePill, setActivePill] = useState('all');
  const [search, setSearch] = useState('');
  const [voteOverrides, setVoteOverrides] = useState<Record<string, { votes: number; recommended: boolean }>>({});

  const { data, loading, error, reload } = useFetch(() => fetchOffers());
  const { data: catData }               = useFetch(() => fetchBusinessCategories());

  // API already returns sorted by scan_count DESC — no client re-sort needed
  const rawItems: any[] = (data as any)?.items || [];
  const allBiz: Business[] = rawItems.map(apiBizToBusiness).map((biz: Business) => {
    const override = voteOverrides[biz.id];
    return override ? { ...biz, votes: override.votes, has_recommended: override.recommended } : biz;
  });

  const topRated = [...allBiz]
    .filter(biz => (biz.votes ?? 0) > 0)
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 10);

  const filteredBiz = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return [];

    return allBiz.filter((biz) =>
      biz.title.toLowerCase().includes(query) ||
      biz.category.toLowerCase().includes(query) ||
      biz.discount.toLowerCase().includes(query) ||
      biz.desc.toLowerCase().includes(query) ||
      biz.address.toLowerCase().includes(query)
    );
  }, [allBiz, search]);

  // Priority: Private first, then Publike, then Other — no duplicates
  const isPrivate = (slugs: string[]) =>
    slugs.some(s => s === 'sherbime-private' || s.includes('-private'));
  const isPublic  = (slugs: string[]) =>
    slugs.some(s =>
      s === 'sherbime-publike' || s.includes('-publike') ||
      s === 'transport' || s === 'histori-muze' ||
      s.includes('teatr') || s.includes('muzeu')
    );

  const privBiz: Business[] = [];
  const pubBiz:  Business[] = [];
  const otherBiz: Business[] = [];
  allBiz.forEach((biz, i) => {
    const slugs: string[] = rawItems[i]?.cat_slugs ?? [];
    if (isPrivate(slugs))      privBiz.push(biz);
    else if (isPublic(slugs))  pubBiz.push(biz);
    else                       otherBiz.push(biz);
  });

  // Categories from WordPress — "Të gjitha" pill prepended
  const wpcats: Array<{ id: string; slug: string; name: string; icon?: string }> =
    Array.isArray(catData)
      ? [{ id: 'all', slug: 'all', name: 'Të gjitha' }, ...(catData as any[]).map(t => ({ id: t.slug, slug: t.slug, name: t.name }))]
      : [{ id: 'all', slug: 'all', name: 'Të gjitha' }];

  const topRow    = wpcats.filter((_, i) => i % 2 === 0);
  const bottomRow = wpcats.filter((_, i) => i % 2 === 1);

  const visibleTopRated = search.trim() ? filteredBiz : topRated;
  const visiblePrivBiz = search.trim()
    ? filteredBiz.filter((biz) => privBiz.some((item) => item.id === biz.id))
    : privBiz;
  const visiblePubBiz = search.trim()
    ? filteredBiz.filter((biz) => pubBiz.some((item) => item.id === biz.id))
    : pubBiz;
  const visibleOtherBiz = search.trim()
    ? filteredBiz.filter((biz) => otherBiz.some((item) => item.id === biz.id))
    : otherBiz;

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

      {/* ── Fixed header ─────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backBtn} onPress={onBack}>
            <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>Eksploro</Text>
            <Text style={styles.headerTitle}>Përfitimet</Text>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Search size={14} color={Colors.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kërko biznes, ofertë..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
          <Text style={styles.searchText}>Kërko biznes, ofertë...</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >

        {/* ── 2-Row scrolling pill grid ─────────────────────────────── */}
        <View style={styles.pillsSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillsOuter}>
            <View style={styles.pillsGrid}>
              <View style={styles.pillsRow}>
                {topRow.map(p => <PillBtn key={p.id} id={p.id} name={p.name} active={activePill === p.id} onPress={() => { setActivePill(p.id); if (p.id !== 'all') onList(p.name, p.slug); }} />)}
              </View>
              <View style={styles.pillsRow}>
                {bottomRow.map(p => <PillBtn key={p.id} id={p.id} name={p.name} active={activePill === p.id} onPress={() => { setActivePill(p.id); if (p.id !== 'all') onList(p.name, p.slug); }} />)}
              </View>
            </View>
          </ScrollView>
        </View>

        {/* ── Promo Banner ─────────────────────────────────────────── */}
        <View style={styles.bannerWrap}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => onList('Të gjitha bizneset')}>
            <LinearGradient
              colors={['#38bdf8', '#2563eb']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={styles.banner}
            >
              <Text style={styles.bannerEmoji}>🏪</Text>
              <View style={styles.bannerBadge}>
                <Text style={styles.bannerBadgeText}>Zbritje Studentore</Text>
              </View>
              <Text style={styles.bannerTitle}>
                {allBiz.length > 0 ? `${allBiz.length}+ Biznese` : 'Bizneset'}
              </Text>
              <Text style={styles.bannerSub}>Zbrit me kartën tënde të studentit</Text>
              <View style={styles.bannerDots}>
                <View style={[styles.dot, { backgroundColor: '#fff' }]} />
                <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
                <View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.4)' }]} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Loading ───────────────────────────────────────────────── */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.textMuted} />
            <Text style={styles.loadingText}>Duke ngarkuar bizneset...</Text>
          </View>
        )}

        {/* ── Error ─────────────────────────────────────────────────── */}
        {!loading && !!error && (
          <View style={styles.errorWrap}>
            <Text style={styles.errorText}>
              ⚠️ {typeof error === 'object' && error !== null && 'message' in error ? (error as Error).message : String(error)}
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={reload}>
              <Text style={styles.retryText}>Provo Përsëri</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Më të rekomanduara (top by real scan count) ───────────── */}
        {!loading && visibleTopRated.length > 0 && (
          <HSection
            title={search.trim() ? 'Rezultatet e kërkimit' : 'Më të rekomanduara 🔥'}
            subtitle={search.trim() ? `${filteredBiz.length} biznese të gjetura` : (visibleTopRated[0]?.scans > 0 ? `Bazuar në ${visibleTopRated.reduce((s, b) => s + b.scans, 0)} skanime reale` : undefined)}
            data={visibleTopRated}
            onSeeAll={() => onList('Të gjitha bizneset')}
            onCard={onProfile}
            onToggleRecommend={handleToggleRecommend}
          />
        )}

        {/* ── Biznese Private ───────────────────────────────────────── */}
        {!loading && !search.trim() && visiblePrivBiz.length > 0 && (
          <HSection
            title="Biznese Private 🏪"
            data={visiblePrivBiz}
            onSeeAll={() => onList('Biznese Private', 'sherbime-private')}
            onCard={onProfile}
            onToggleRecommend={handleToggleRecommend}
          />
        )}

        {/* ── Biznese Publike ───────────────────────────────────────── */}
        {!loading && !search.trim() && visiblePubBiz.length > 0 && (
          <HSection
            title="Biznese Publike 🏛️"
            data={visiblePubBiz}
            onSeeAll={() => onList('Biznese Publike', 'sherbime-publike')}
            onCard={onProfile}
            onToggleRecommend={handleToggleRecommend}
          />
        )}

        {/* ── Të tjera ──────────────────────────────────────────────── */}
        {!loading && !search.trim() && visibleOtherBiz.length > 0 && (
          <HSection
            title="Partnerë të tjerë"
            data={visibleOtherBiz}
            onSeeAll={() => onList('Të gjitha bizneset')}
            onCard={onProfile}
            onToggleRecommend={handleToggleRecommend}
          />
        )}

        {/* ── Empty state ───────────────────────────────────────────── */}
        {!loading && ((search.trim() && filteredBiz.length === 0) || (!search.trim() && allBiz.length === 0)) && !error && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>
              {search.trim() ? 'Nuk u gjet asnjë biznes për këtë kërkim.' : 'Nuk ka biznese për momentin.'}
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Pill button ──────────────────────────────────────────────────────────────
function PillBtn({ id, name, active, onPress }: { id: string; name: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.pill, active && styles.pillActive]} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{name}</Text>
    </TouchableOpacity>
  );
}

// ─── Horizontal Section ───────────────────────────────────────────────────────
function HSection({ title, subtitle, data, onSeeAll, onCard, onToggleRecommend }: {
  title: string; subtitle?: string; data: Business[];
  onSeeAll: () => void; onCard: (b: Business) => void; onToggleRecommend: (b: Business) => void;
}) {
  return (
    <View style={styles.hSection}>
      <View style={styles.sectionHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
        </View>
        <TouchableOpacity style={styles.seeAllBtn} onPress={onSeeAll}>
          <Text style={styles.seeAllText}>Shiko të gjitha</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={data}
        horizontal
        keyExtractor={b => b.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.cardList}
        renderItem={({ item: biz }) => (
          <TouchableOpacity style={styles.bizCard} onPress={() => onCard(biz)} activeOpacity={0.92}>
            <View style={styles.bizImageWrap}>
              <Image source={{ uri: biz.img }} style={styles.bizImage} resizeMode="cover" />
              <View style={[styles.badge, { backgroundColor: biz.badgeColor }]}>
                <Text style={styles.badgeText} numberOfLines={1}>{biz.discount}</Text>
              </View>
              <TouchableOpacity
                style={[styles.bizHeartBtn, biz.has_recommended && styles.bizHeartBtnActive]}
                onPress={(event) => {
                  event.stopPropagation();
                  onToggleRecommend(biz);
                }}
              >
                <Heart
                  size={16}
                  color={biz.has_recommended ? '#ef4444' : Colors.textSecondary}
                  fill={biz.has_recommended ? '#ef4444' : 'none'}
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <View style={styles.timeChip}>
                <Clock size={10} color="#fff" strokeWidth={2} />
                <Text style={styles.timeText} numberOfLines={1}>{biz.time}</Text>
              </View>
            </View>
            <View style={styles.bizBody}>
              <Text style={styles.bizTitle} numberOfLines={1}>{biz.title}</Text>
              <View style={styles.bizMeta}>
                <Heart size={11} color="#ef4444" fill="#ef4444" strokeWidth={0} />
                <Text style={styles.bizRating}>{biz.votes ?? 0}</Text>
                <Text style={styles.bizDot}>•</Text>
                <Text style={styles.bizCategory} numberOfLines={1}>{biz.category}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll:  { flex: 1 },
  loadingWrap: { paddingVertical: 48, alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted },
  emptyWrap:   { paddingVertical: 48, alignItems: 'center', paddingHorizontal: Spacing.xxl },
  emptyText:   { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted, textAlign: 'center' },
  errorWrap:   { paddingVertical: 40, alignItems: 'center', paddingHorizontal: Spacing.xxl, gap: 16 },
  errorText:   { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.danger, textAlign: 'center' },
  retryBtn:    { backgroundColor: '#e30613', paddingHorizontal: 24, paddingVertical: 11, borderRadius: Radius.full },
  retryText:   { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#fff' },

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
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },
  headerSub: {
    fontFamily: Typography.fontBold, fontSize: Typography.xs,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  headerTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textPrimary, padding: 0 },
  searchText: { display: 'none' },

  // ── Pills ────────────────────────────────────────────────────────────────────
  pillsSection: {
    backgroundColor: Colors.white, paddingVertical: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight, marginBottom: Spacing.xxl,
  },
  pillsOuter: { paddingHorizontal: Spacing.xxl },
  pillsGrid:  { gap: 10 },
  pillsRow:   { flexDirection: 'row', gap: 10 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.lg, paddingVertical: 8,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  pillActive:     { backgroundColor: '#1E293B', borderColor: '#1E293B' },
  pillEmoji:      { fontSize: 14 },
  pillText:       { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary },
  pillTextActive: { color: '#fff' },

  // ── Promo banner ─────────────────────────────────────────────────────────────
  bannerWrap: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xxxl },
  banner: {
    borderRadius: Radius.xxl + 4, padding: Spacing.xxl, overflow: 'hidden',
    shadowColor: '#0ea5e9', shadowOpacity: 0.2, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  bannerEmoji: { position: 'absolute', right: -8, bottom: -8, fontSize: 80, opacity: 0.2 },
  bannerBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)', alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)', marginBottom: 12,
  },
  bannerBadgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xs,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 1.5,
  },
  bannerTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: 28, color: '#fff',
    lineHeight: 34, marginBottom: 6, width: '70%',
  },
  bannerSub: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: '#bae6fd', marginBottom: Spacing.lg },
  bannerDots: { flexDirection: 'row', gap: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },

  // ── Horizontal section ────────────────────────────────────────────────────────
  hSection: { marginBottom: Spacing.xxxl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md,
  },
  sectionTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary },
  sectionSub:   { fontFamily: Typography.fontMedium, fontSize: Typography.xs, color: Colors.textMuted, marginTop: 2 },
  seeAllBtn: { backgroundColor: '#f0f9ff', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  seeAllText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#0ea5e9' },
  cardList: { paddingHorizontal: Spacing.xxl, gap: 14, paddingBottom: 4, paddingTop: 2 },

  // ── Business card ─────────────────────────────────────────────────────────────
  bizCard: {
    width: 240, backgroundColor: Colors.white, borderRadius: Radius.xxl,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  bizImageWrap: { height: 130, backgroundColor: Colors.borderLight },
  bizImage:     { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, maxWidth: 140,
  },
  badgeText: { color: '#fff', fontFamily: Typography.fontExtraBold, fontSize: 10, textTransform: 'uppercase' },
  bizHeartBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.92)',
    justifyContent: 'center', alignItems: 'center',
  },
  bizHeartBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.98)',
    borderWidth: 1,
    borderColor: '#fecdd3',
  },
  timeChip: {
    position: 'absolute', bottom: 8, right: 8,
    backgroundColor: 'rgba(0,0,0,0.60)', flexDirection: 'row', alignItems: 'center',
    gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.sm, maxWidth: 130,
  },
  timeText:    { color: '#fff', fontFamily: Typography.fontBold, fontSize: 10 },
  bizBody:     { padding: Spacing.lg },
  bizTitle:    { fontFamily: Typography.fontBold, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: 4 },
  bizMeta:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  bizRating:   { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#be123c' },
  bizDot:      { fontSize: Typography.sm, color: Colors.textMuted },
  bizCategory: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, flex: 1 },
});
