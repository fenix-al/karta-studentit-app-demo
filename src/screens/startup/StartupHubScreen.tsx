import React, { useState } from 'react';
import {
  View, Text, ScrollView, FlatList,
  TouchableOpacity, Image, TextInput, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Search, Calendar, ArrowUpRight, Lightbulb, Send } from 'lucide-react';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { StartupItem } from '../../types';
import { STARTUP_CATEGORIES, STARTUP_STEPS, STARTUP_ITEMS } from '../../data/mockData';

interface Props {
  onBack:      () => void;
  onList:      (title: string) => void;
  onProfile:   (item: StartupItem) => void;
  bottomInset: number;
}

export default function StartupHubScreen({ onBack, onList, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [activeCat, setActiveCat] = useState('all');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDesc, setIdeaDesc] = useState('');
  const [ideaSent, setIdeaSent] = useState(false);

  return (
    <View style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>Ekosistemi Rinor</Text>
            <Text style={styles.headerTitle}>Startup & Ide</Text>
          </View>
        </View>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.textMuted} strokeWidth={2} />
          <Text style={styles.searchPlaceholder}>Kërko thirrje, fonde, udhëzues...</Text>
        </View>
      </View>

      {/* ── Category pills ──────────────────────────────────────────────── */}
      <View style={styles.catSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.catList}
        >
          {STARTUP_CATEGORIES.map(cat => (
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

        {/* ── Dërgo Idenë Tënde ────────────────────────────────────────── */}
        <View style={styles.ideaPad}>
          <View style={styles.ideaCard}>

            {/* Card header */}
            <View style={styles.ideaCardHeader}>
              <View style={styles.ideaIconWrap}>
                <Lightbulb size={20} color="#10b981" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ideaCardTitle}>Dërgo Idenë Tënde</Text>
                <Text style={styles.ideaCardSub}>Na trego çfarë ke në mendje — e shqyrtojmë brenda 48 orësh.</Text>
              </View>
            </View>

            {ideaSent ? (
              <View style={styles.ideaSentWrap}>
                <Text style={styles.ideaSentEmoji}>🚀</Text>
                <Text style={styles.ideaSentTitle}>Faleminderit!</Text>
                <Text style={styles.ideaSentSub}>Ideja u dërgua. Do të kontaktoheni së shpejti.</Text>
              </View>
            ) : (
              <>
                <TextInput
                  style={styles.ideaInput}
                  placeholder="Titulli i idesë..."
                  placeholderTextColor={Colors.textMuted}
                  value={ideaTitle}
                  onChangeText={setIdeaTitle}
                />
                <TextInput
                  style={[styles.ideaInput, styles.ideaTextarea]}
                  placeholder="Përshkruaje shkurt idenë tënde..."
                  placeholderTextColor={Colors.textMuted}
                  value={ideaDesc}
                  onChangeText={setIdeaDesc}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <TouchableOpacity
                  style={[styles.ideaSubmitBtn, (!ideaTitle.trim() || !ideaDesc.trim()) && styles.ideaSubmitBtnDisabled]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (ideaTitle.trim() && ideaDesc.trim()) setIdeaSent(true);
                  }}
                >
                  <Send size={16} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.ideaSubmitText}>Dërgo Idenë</Text>
                </TouchableOpacity>
              </>
            )}

          </View>
        </View>

        {/* ── Si funksionon ────────────────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <Text style={[styles.sectionTitle, styles.sectionPadH]}>
            Si funksionon (shkurt)
          </Text>
          <FlatList
            data={STARTUP_STEPS}
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

        {/* ── Thirrjet e Hapura ─────────────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <View style={[styles.sectionHeader, styles.sectionPadH]}>
            <View>
              <Text style={styles.sectionTitle}>Thirrjet e Hapura</Text>
              <Text style={styles.sectionSubtitle}>Aplikoni para afatit.</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => onList('Të gjitha Thirrjet')}
            >
              <Text style={styles.seeAllText}>Shiko të gjitha</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.itemListWrap}>
            {STARTUP_ITEMS.map(item => (
              <StartupCard
                key={item.id}
                item={item}
                onPress={() => onProfile(item)}
              />
            ))}
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Shared startup card (reused in ListScreen) ────────────────────────────────
export function StartupCard({ item, onPress }: { item: StartupItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.itemCard} onPress={onPress} activeOpacity={0.92}>

      {/* Image */}
      <View style={styles.itemImageWrap}>
        <Image source={{ uri: item.img }} style={styles.itemImage} resizeMode="cover" />
        <View style={styles.itemOverlay} />
        <View style={[styles.itemBadge, { backgroundColor: item.badgeBg, borderColor: item.badgeBorder }]}>
          <Text style={[styles.itemBadgeText, { color: item.badgeText }]}>{item.type}</Text>
        </View>
        {item.category === 'thirrje' && (
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Thirrje Aktive</Text>
          </View>
        )}
      </View>

      {/* Body */}
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDesc} numberOfLines={2}>{item.desc}</Text>

        {/* Footer */}
        <View style={styles.itemFooter}>
          <View style={styles.itemDateRow}>
            <Calendar size={12} color={item.category === 'thirrje' ? '#be123c' : Colors.textMuted} strokeWidth={2} />
            <Text style={[
              styles.itemDateText,
              item.category === 'thirrje' && { color: '#be123c' },
            ]}>
              {item.category === 'thirrje' ? `Afati: ${item.date}` : item.date}
            </Text>
          </View>
          <View style={styles.itemActionBtn}>
            <ArrowUpRight size={14} color={Colors.textSecondary} strokeWidth={2.5} />
          </View>
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
    color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
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
  sectionMb:   { marginBottom: Spacing.xxxl, marginTop: Spacing.xxl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: Colors.textPrimary, marginBottom: Spacing.lg,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm,
    color: Colors.textSecondary, marginTop: -Spacing.md,
  },
  seeAllBtn: {
    backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
  },
  seeAllText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#10b981' },

  // How it works (steps)
  hList: { paddingHorizontal: Spacing.xxl, gap: 12, paddingBottom: 4, paddingTop: 4 },
  stepCard: {
    width: 200, backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  stepBadge: {
    width: 34, height: 34, borderRadius: 10, backgroundColor: '#10b981',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md,
    shadowColor: '#10b981', shadowOpacity: 0.25, shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  stepBadgeNum: { fontFamily: Typography.fontExtraBold, fontSize: Typography.md, color: '#fff' },
  stepTitle: {
    fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary, marginBottom: 4,
  },
  stepDesc: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18,
  },

  // Startup item cards
  itemListWrap: { paddingHorizontal: Spacing.xxl, gap: 20 },
  itemCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 3,
  },
  itemImageWrap: { height: 160, backgroundColor: Colors.borderLight },
  itemImage:     { width: '100%', height: '100%' },
  itemOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  itemBadge: {
    position: 'absolute', top: 14, left: 14,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  itemBadgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 10,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  livePill: {
    position: 'absolute', top: 14, right: 14,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' },
  liveText: { fontFamily: Typography.fontBold, fontSize: 11, color: '#065f46' },

  itemBody: { padding: Spacing.xl },
  itemTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: Colors.textPrimary, marginBottom: Spacing.sm, lineHeight: 24,
  },
  itemDesc: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base,
    color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.lg,
  },
  itemFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.borderLight,
  },
  itemDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  itemDateText: {
    fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted,
  },
  itemActionBtn: {
    width: 30, height: 30, borderRadius: 10,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
  },

  // Idea submission form
  ideaPad: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xxl, paddingBottom: Spacing.lg },
  ideaCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    borderWidth: 1.5, borderColor: '#a7f3d0', padding: Spacing.xl,
    shadowColor: '#10b981', shadowOpacity: 0.08, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  ideaCardHeader: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: Spacing.lg,
  },
  ideaIconWrap: {
    width: 40, height: 40, borderRadius: 13,
    backgroundColor: '#ecfdf5', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  ideaCardTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: Colors.textPrimary, marginBottom: 3,
  },
  ideaCardSub: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm,
    color: Colors.textSecondary, lineHeight: 18,
  },
  ideaInput: {
    backgroundColor: '#f8fafc', borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: '#cbd5e1',
    paddingHorizontal: Spacing.lg, paddingVertical: 13,
    fontFamily: Typography.fontMedium, fontSize: Typography.base,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  ideaTextarea: { height: 88, paddingTop: 13 },
  ideaSubmitBtn: {
    backgroundColor: '#dc2626', borderRadius: Radius.xl,
    paddingVertical: 14, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#dc2626', shadowOpacity: 0.25, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 4,
  },
  ideaSubmitBtnDisabled: { backgroundColor: Colors.borderLight, shadowOpacity: 0 },
  ideaSubmitText: {
    fontFamily: Typography.fontBold, fontSize: Typography.md, color: '#fff',
  },
  ideaSentWrap: { alignItems: 'center', paddingVertical: Spacing.xl },
  ideaSentEmoji: { fontSize: 36, marginBottom: Spacing.md },
  ideaSentTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: Colors.textPrimary, marginBottom: Spacing.sm,
  },
  ideaSentSub: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base,
    color: Colors.textSecondary, textAlign: 'center', lineHeight: 20,
  },
});
