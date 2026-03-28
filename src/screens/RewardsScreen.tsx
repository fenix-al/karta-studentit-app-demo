import React, { useState } from 'react';
import {
  View, Text, ScrollView, FlatList, TouchableOpacity,
  Image, Modal, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Slider from '@react-native-community/slider';
import { X, Ticket, Trophy, Crown, ChevronRight, Gift, Filter, ChevronLeft } from 'lucide-react';

import { Colors, Typography, Spacing, Radius } from '../constants/Theme';
import { Raffle, DirectReward } from '../types';
import { RAFFLES, DIRECT_REWARDS, VIP_STATUS } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

interface Props {
  bottomInset: number;
  onBack?: () => void;
}

type GiftItem = (Raffle & { type: 'raffle' }) | (DirectReward & { type: 'reward' });

export default function RewardsScreen({ bottomInset, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { card } = useAuth();
  const [maxPoints, setMaxPoints]     = useState(500);
  const [selected, setSelected]       = useState<GiftItem | null>(null);
  const [showAllRaffles, setShowAllRaffles] = useState(false);

  const filteredRaffles = RAFFLES.filter(r => r.cost <= maxPoints);
  const filteredRewards = DIRECT_REWARDS.filter(d => d.cost <= maxPoints);

  if (showAllRaffles) {
    return (
      <View style={styles.root}>
        {/* ── All Raffles header ─────────────────────────────────────────── */}
        <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setShowAllRaffles(false)} activeOpacity={0.75}>
              <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
            </TouchableOpacity>
            <View>
              <Text style={styles.headerSub}>Dhuratat</Text>
              <Text style={styles.headerTitle}>Shortet e Hapura</Text>
            </View>
          </View>
          <View style={styles.balancePill}>
            <Text style={styles.balancePillNum}>{card?.points ?? 0}</Text>
            <Text style={styles.balancePillEmoji}>🟡</Text>
          </View>
        </View>

        <FlatList
          data={RAFFLES}
          keyExtractor={r => r.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: Spacing.xxl, gap: 16, paddingBottom: bottomInset + 24 }}
          renderItem={({ item: raffle }) => (
            <TouchableOpacity
              style={styles.raffleCardFull}
              activeOpacity={0.92}
              onPress={() => setSelected({ ...raffle, type: 'raffle' })}
            >
              <View style={styles.raffleImageWrapFull}>
                <Image source={{ uri: raffle.image }} style={styles.raffleImage} resizeMode="cover" />
                <View style={styles.raffleOverlay} />
                <View style={[styles.raffleBadge, { backgroundColor: raffle.badgeColor }]}>
                  <Text style={styles.raffleBadgeText}>{raffle.timeLeft}</Text>
                </View>
                <Text style={styles.raffleTitleFull} numberOfLines={2}>{raffle.title}</Text>
              </View>
              <View style={styles.raffleFooter}>
                <View style={styles.raffleCost}>
                  <Text style={styles.raffleCostNum}>{raffle.cost}</Text>
                  <Text style={styles.raffleCostEmoji}>🟡</Text>
                </View>
                <TouchableOpacity
                  style={styles.raffleJoinBtn}
                  activeOpacity={0.85}
                  onPress={() => setSelected({ ...raffle, type: 'raffle' })}
                >
                  <Text style={styles.raffleJoinText}>Merr Pjesë</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />

        <GiftModal item={selected} onClose={() => setSelected(null)} />
      </View>
    );
  }

  return (
    <View style={styles.root}>

      {/* ── Fixed header ────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>Shpenzo Pikët</Text>
            <Text style={styles.headerTitle}>Dhuratat</Text>
          </View>
        </View>
        <View style={styles.balancePill}>
          <Text style={styles.balancePillNum}>{card?.points ?? 0}</Text>
          <Text style={styles.balancePillEmoji}>🟡</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >

        {/* ── Slider filter card ──────────────────────────────────────── */}
        <View style={styles.sectionPad}>
          <LinearGradient
            colors={['#ffffff', '#f8fafc']}
            style={styles.sliderCard}
          >
            {/* Decorative blob */}
            <View style={styles.sliderBlob} />

            <View style={styles.sliderTop}>
              <View style={{ flex: 1 }}>
                <View style={styles.sliderTitleRow}>
                  <Filter size={15} color="#0ea5e9" strokeWidth={2.5} />
                  <Text style={styles.sliderTitle}>Filtro Dhuratat</Text>
                </View>
                <Text style={styles.sliderSub}>Zgjidh sa pikë dëshiron të shpenzosh</Text>
              </View>
              <View style={styles.sliderBadge}>
                <Text style={styles.sliderBadgeNum}>{maxPoints}</Text>
                <Text style={styles.sliderBadgeLabel}>Pikë MAX</Text>
              </View>
            </View>

            <Slider
              style={styles.slider}
              minimumValue={10}
              maximumValue={500}
              step={10}
              value={maxPoints}
              onValueChange={v => setMaxPoints(Math.round(v))}
              minimumTrackTintColor="#a3e635"
              maximumTrackTintColor="#e2e8f0"
              thumbTintColor="#a3e635"
            />
            <View style={styles.sliderLabels}>
              <Text style={styles.sliderLabelText}>10 🟡</Text>
              <Text style={styles.sliderLabelText}>500 🟡</Text>
            </View>
          </LinearGradient>
        </View>

        {/* ── Shortet e Hapura ────────────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎟️  Shortet e Hapura</Text>
            <TouchableOpacity onPress={() => setShowAllRaffles(true)}>
              <Text style={styles.seeAll}>Shiko të gjitha</Text>
            </TouchableOpacity>
          </View>
          {filteredRaffles.length > 0 ? (
            <FlatList
              data={filteredRaffles}
              horizontal
              keyExtractor={r => r.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item: raffle }) => (
                <TouchableOpacity
                  style={styles.raffleCard}
                  activeOpacity={0.92}
                  onPress={() => setSelected({ ...raffle, type: 'raffle' })}
                >
                  <View style={styles.raffleImageWrap}>
                    <Image source={{ uri: raffle.image }} style={styles.raffleImage} resizeMode="cover" />
                    <View style={styles.raffleOverlay} />
                    <View style={[styles.raffleBadge, { backgroundColor: raffle.badgeColor }]}>
                      <Text style={styles.raffleBadgeText}>{raffle.timeLeft}</Text>
                    </View>
                    <Text style={styles.raffleTitle} numberOfLines={2}>{raffle.title}</Text>
                  </View>
                  <View style={styles.raffleFooter}>
                    <View style={styles.raffleCost}>
                      <Text style={styles.raffleCostNum}>{raffle.cost}</Text>
                      <Text style={styles.raffleCostEmoji}>🟡</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.raffleJoinBtn}
                      activeOpacity={0.85}
                      onPress={() => setSelected({ ...raffle, type: 'raffle' })}
                    >
                      <Text style={styles.raffleJoinText}>Merr Pjesë</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.sectionPad}>
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Nuk ka shorte për këtë numër pikësh.</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Tërhiq Tani ─────────────────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🎁  Tërhiq Tani</Text>
          </View>
          {filteredRewards.length > 0 ? (
            <View style={styles.sectionPad}>
              {filteredRewards.map(reward => (
                <TouchableOpacity
                  key={reward.id}
                  style={styles.rewardRow}
                  activeOpacity={0.88}
                  onPress={() => setSelected({ ...reward, type: 'reward' })}
                >
                  <View style={[styles.rewardIconBox, { backgroundColor: reward.bgColor }]}>
                    <Text style={styles.rewardIcon}>{reward.icon}</Text>
                  </View>
                  <View style={styles.rewardInfo}>
                    <Text style={styles.rewardTitle}>{reward.title}</Text>
                    <Text style={styles.rewardBusiness}>{reward.business}</Text>
                  </View>
                  <View style={styles.rewardCost}>
                    <Text style={styles.rewardCostNum}>{reward.cost}</Text>
                    <Text style={styles.rewardCostEmoji}>🟡</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.sectionPad}>
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>Nuk ka dhurata direkte për këtë numër pikësh.</Text>
              </View>
            </View>
          )}
        </View>

        {/* ── Statusi VIP ─────────────────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌟  Statusi YT VIP</Text>
          </View>
          <View style={styles.sectionPad}>
            {VIP_STATUS.map(vip => (
              <View key={vip.id} style={styles.vipCard}>
                <View style={styles.vipDecor} />
                <View style={styles.vipHeader}>
                  <Image source={{ uri: vip.logo }} style={styles.vipLogo} resizeMode="cover" />
                  <View style={styles.vipInfo}>
                    <Text style={styles.vipName}>{vip.business}</Text>
                    <Text style={styles.vipScans}>{vip.totalScans} Skanime Totale</Text>
                  </View>
                  <View style={styles.vipBadge}>
                    <Crown size={12} color="#065f46" strokeWidth={2} />
                    <Text style={styles.vipBadgeText}>VIP</Text>
                  </View>
                </View>

                {vip.rewards.map((reward, i) => {
                  const pct = Math.min(100, (reward.current / reward.required) * 100);
                  return (
                    <View key={i} style={[styles.rewardProgress, reward.unlocked && styles.rewardProgressUnlocked]}>
                      <View style={styles.rewardProgressTop}>
                        <View style={styles.rewardProgressLeft}>
                          {reward.unlocked
                            ? <Ticket size={15} color="#059669" strokeWidth={2} />
                            : <Trophy  size={15} color="#94a3b8" strokeWidth={2} />
                          }
                          <Text style={[styles.rewardProgressTitle, reward.unlocked && styles.rewardProgressTitleUnlocked]}>
                            {reward.title}
                          </Text>
                        </View>
                        {reward.unlocked && (
                          <View style={styles.unlockedBadge}>
                            <Text style={styles.unlockedBadgeText}>E Fitove!</Text>
                          </View>
                        )}
                      </View>

                      {/* Progress bar */}
                      <View style={styles.progressTrack}>
                        <View style={[
                          styles.progressFill,
                          { width: `${pct}%` as any, backgroundColor: reward.unlocked ? '#10b981' : '#f59e0b' },
                        ]} />
                      </View>

                      <View style={styles.progressMeta}>
                        <Text style={styles.progressCount}>{reward.current}/{reward.required}</Text>
                        {reward.unlocked ? (
                          <TouchableOpacity style={styles.claimBtn}>
                            <Text style={styles.claimBtnText}>Tërhiq</Text>
                            <ChevronRight size={12} color="#059669" strokeWidth={2.5} />
                          </TouchableOpacity>
                        ) : (
                          <Text style={styles.progressRemaining}>
                            Mungojnë {reward.required - reward.current} skanime
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── Gift confirmation modal ──────────────────────────────────────── */}
      <GiftModal item={selected} onClose={() => setSelected(null)} />

    </View>
  );
}

// ─── Gift Modal ───────────────────────────────────────────────────────────────
function GiftModal({ item, onClose }: { item: GiftItem | null; onClose: () => void }) {
  if (!item) return null;
  const isRaffle = item.type === 'raffle';

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={modal.root}>
        <View style={modal.card}>

          {/* X close */}
          <TouchableOpacity style={modal.closeBtn} onPress={onClose}>
            <X size={18} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>

          {/* Header area */}
          {isRaffle ? (
            <View style={modal.heroWrap}>
              <Image source={{ uri: (item as Raffle).image }} style={modal.heroImage} resizeMode="cover" />
              <View style={modal.heroOverlay} />
            </View>
          ) : (
            <View style={[modal.iconHeader, { backgroundColor: (item as DirectReward).bgColor }]}>
              <Text style={modal.iconHeaderEmoji}>{(item as DirectReward).icon}</Text>
            </View>
          )}

          {/* Content */}
          <View style={modal.content}>
            <View style={modal.topBadge}>
              <Text style={modal.topBadgeText}>
                {isRaffle ? (item as Raffle).timeLeft : (item as DirectReward).business}
              </Text>
            </View>
            <Text style={modal.itemTitle}>{item.title}</Text>
            <Text style={modal.itemDesc}>{item.desc}</Text>

            <View style={modal.costRow}>
              <Text style={modal.costLabel}>Kostoja:</Text>
              <View style={modal.costRight}>
                <Text style={modal.costNum}>{item.cost}</Text>
                <Text style={modal.costEmoji}>🟡</Text>
              </View>
            </View>

            <TouchableOpacity style={modal.confirmBtn} activeOpacity={0.88} onPress={onClose}>
              <Gift size={18} color="#fff" strokeWidth={2} />
              <Text style={modal.confirmBtnText}>Konfirmo & Tërhiq</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerSub: {
    fontFamily: Typography.fontBold, fontSize: Typography.xs,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  headerTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary },
  balancePill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.xl,
  },
  balancePillNum:   { fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: '#92400e' },
  balancePillEmoji: { fontSize: 14 },

  // Slider card (hero, first element below header)
  sectionPad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xxxl },
  sectionMb:  { marginBottom: Spacing.xxxl },
  sliderCard: {
    borderRadius: Radius.xxl + 4, padding: Spacing.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.border,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  sliderBlob: {
    position: 'absolute', top: -24, right: -24,
    width: 96, height: 96, borderRadius: 48,
    backgroundColor: '#f0f9ff',
  },
  sliderTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 4 },
  sliderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  sliderTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary },
  sliderSub:   { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary },
  sliderBadge: {
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.lg,
    alignItems: 'center', flexShrink: 0,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  sliderBadgeNum:   { fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: Colors.textPrimary, lineHeight: 20 },
  sliderBadgeLabel: { fontFamily: Typography.fontBold, fontSize: 8, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  slider:           { width: '100%', height: 40 },
  sliderLabels:     { flexDirection: 'row', justifyContent: 'space-between', marginTop: -6 },
  sliderLabelText:  { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted },

  // Section header
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  sectionTitle:  { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary },
  seeAll:        { fontFamily: Typography.fontBold, fontSize: Typography.md, color: '#0ea5e9' },

  // Raffle cards (horizontal)
  hList: { paddingHorizontal: Spacing.xxl, gap: 14, paddingBottom: 4, paddingTop: 2 },
  raffleCardFull: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 }, elevation: 3,
  },
  raffleImageWrapFull: { height: 200, backgroundColor: Colors.borderLight },
  raffleTitleFull: {
    position: 'absolute', bottom: 14, left: 14, right: 14,
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: '#fff', lineHeight: 24,
  },
  raffleCard: {
    width: 260, backgroundColor: Colors.white, borderRadius: Radius.xxl,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  raffleImageWrap: { height: 144, backgroundColor: Colors.borderLight },
  raffleImage:     { width: '100%', height: '100%' },
  raffleOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  raffleBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm,
  },
  raffleBadgeText: { color: '#fff', fontFamily: Typography.fontExtraBold, fontSize: 10, textTransform: 'uppercase' },
  raffleTitle: {
    position: 'absolute', bottom: 12, left: 12, right: 12,
    fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: '#fff', lineHeight: 20,
  },
  raffleFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg,
  },
  raffleCost: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md,
  },
  raffleCostNum:   { fontFamily: Typography.fontExtraBold, fontSize: Typography.base, color: '#92400e' },
  raffleCostEmoji: { fontSize: 12 },
  raffleJoinBtn: {
    backgroundColor: '#0f172a', paddingHorizontal: Spacing.lg, paddingVertical: 9, borderRadius: Radius.md,
  },
  raffleJoinText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#fff' },

  // Direct reward rows
  rewardRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.lg,
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: 12, borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  rewardIconBox:  { width: 56, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  rewardIcon:     { fontSize: 26 },
  rewardInfo:     { flex: 1 },
  rewardTitle:    { fontFamily: Typography.fontBold, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: 2 },
  rewardBusiness: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary },
  rewardCost: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.md,
    alignItems: 'center', flexShrink: 0,
  },
  rewardCostNum:   { fontFamily: Typography.fontExtraBold, fontSize: Typography.md, color: '#92400e' },
  rewardCostEmoji: { fontSize: 10 },

  // Empty state
  emptyBox: {
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xxl, padding: Spacing.xxl, alignItems: 'center',
  },
  emptyText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary },

  // VIP card
  vipCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    borderWidth: 2, borderColor: '#d1fae5',
    padding: Spacing.xl, marginBottom: Spacing.xl, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  vipDecor: {
    position: 'absolute', top: 0, right: 0,
    width: 80, height: 80, backgroundColor: '#ecfdf5',
    borderBottomLeftRadius: 100,
  },
  vipHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.xl },
  vipLogo: {
    width: 56, height: 56, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.borderLight,
  },
  vipInfo:   { flex: 1 },
  vipName:   { fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: 2 },
  vipScans:  { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  vipBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#d1fae5', borderWidth: 1, borderColor: '#a7f3d0',
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: Radius.sm,
  },
  vipBadgeText: { fontFamily: Typography.fontExtraBold, fontSize: 10, color: '#065f46', textTransform: 'uppercase' },

  // Reward progress items inside VIP card
  rewardProgress: {
    backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 12,
  },
  rewardProgressUnlocked: { backgroundColor: 'rgba(236,253,245,0.6)', borderColor: '#a7f3d0' },
  rewardProgressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  rewardProgressLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rewardProgressTitle: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textSecondary },
  rewardProgressTitleUnlocked: { color: '#065f46' },
  unlockedBadge: { backgroundColor: '#a7f3d0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.sm },
  unlockedBadgeText: { fontFamily: Typography.fontExtraBold, fontSize: 9, color: '#065f46', textTransform: 'uppercase' },
  progressTrack: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill:  { height: '100%', borderRadius: 3 },
  progressMeta:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressCount: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted },
  progressRemaining: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textMuted },
  claimBtn:      { flexDirection: 'row', alignItems: 'center', gap: 2 },
  claimBtnText:  { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#059669', textTransform: 'uppercase' },
});

const modal = StyleSheet.create({
  root: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%', backgroundColor: Colors.white,
    borderRadius: 32, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 }, elevation: 16,
  },
  closeBtn: {
    position: 'absolute', top: 14, right: 14, zIndex: 20,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center',
  },
  heroWrap:    { height: 220 },
  heroImage:   { width: '100%', height: '100%' },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  iconHeader:  { height: 160, justifyContent: 'center', alignItems: 'center' },
  iconHeaderEmoji: { fontSize: 72 },
  content: { padding: Spacing.xxl },
  topBadge: {
    backgroundColor: '#fef3c7', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 5, alignSelf: 'center', marginBottom: 12,
  },
  topBadgeText: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5 },
  itemTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: 22,
    color: Colors.textPrimary, textAlign: 'center', lineHeight: 28, marginBottom: 10,
  },
  itemDesc: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base,
    color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl,
  },
  costRow: {
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.xl, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl,
  },
  costLabel: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textSecondary },
  costRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  costNum:   { fontFamily: Typography.fontExtraBold, fontSize: 26, color: '#f59e0b' },
  costEmoji: { fontSize: 22 },
  confirmBtn: {
    backgroundColor: '#0f172a', borderRadius: Radius.xl, paddingVertical: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  confirmBtnText: { fontFamily: Typography.fontBold, fontSize: Typography.lg, color: '#fff' },
});
