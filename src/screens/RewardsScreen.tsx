import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Modal, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronLeft, RefreshCw, Gift, Ticket, Trophy, Crown, ArrowDownCircle, ArrowUpCircle, Radio, X, Filter } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { enterRaffle, fetchCurrentLiveRaffle, fetchLoyalty, fetchPoints, fetchRaffles, LoyaltyApiBusiness, LoyaltyApiReward, RaffleApiItem, redeemLoyaltyReward } from '../services/api';
import ScreenState from '../components/ScreenState';

interface Props {
  bottomInset: number;
  onBack?: () => void;
  onOpenLiveRaffle?: (sessionId: number) => void;
  initialRaffleId?: number;
  initialRewardTarget?: { businessPostId: number; rewardUid: string };
  onConsumeInitialSelection?: () => void;
}
type ModalItem = { kind: 'raffle'; raffle: RaffleApiItem } | { kind: 'reward'; business: LoyaltyApiBusiness; reward: LoyaltyApiReward };
const FALLBACK_RAFFLE_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';

export default function RewardsScreen({ bottomInset, onBack, onOpenLiveRaffle, initialRaffleId, initialRewardTarget, onConsumeInitialSelection }: Props) {
  const insets = useSafeAreaInsets();
  const { card, refreshCard } = useAuth();
  const [selected, setSelected] = useState<ModalItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [maxPoints, setMaxPoints] = useState(500);

  const points = useFetch(() => fetchPoints());
  const loyalty = useFetch(() => fetchLoyalty());
  const raffles = useFetch(() => fetchRaffles());
  const liveRaffle = useFetch(() => fetchCurrentLiveRaffle());

  const claimable = useMemo(
    () => (loyalty.data ?? []).flatMap((b) => b.rewards.filter((r) => r.one_time && r.unlocked && !r.redeemed).map((r) => ({ business: b, reward: r }))),
    [loyalty.data],
  );
  const currentBalance = card?.points ?? points.data?.balance ?? 0;
  const transactions = (points.data?.transactions ?? []).slice(0, 5);
  const progressBusinesses = loyalty.data ?? [];
  const openRaffles = raffles.data ?? [];
  const loading = points.loading || loyalty.loading || raffles.loading;
  const error = points.error || loyalty.error || raffles.error;
  const currentLiveSession = liveRaffle.data?.session ?? null;
  const filteredRaffles = useMemo(
    () => openRaffles.filter((raffle) => Number(raffle.points_cost ?? 0) <= maxPoints),
    [maxPoints, openRaffles],
  );
  const filteredClaimable = useMemo(
    () => claimable.filter(({ reward }) => Number(reward.threshold ?? 0) <= maxPoints),
    [claimable, maxPoints],
  );

  const consumeInitialSelection = React.useCallback(() => {
    onConsumeInitialSelection?.();
  }, [onConsumeInitialSelection]);

  React.useEffect(() => {
    if (selected || loading) return;

    if (initialRaffleId) {
      const raffle = openRaffles.find((item) => item.id === initialRaffleId);
      if (raffle) {
        setSelected({ kind: 'raffle', raffle });
        consumeInitialSelection();
        return;
      }
    }

    if (initialRewardTarget) {
      const business = (loyalty.data ?? []).find(
        (item) => item.business_post_id === initialRewardTarget.businessPostId,
      );
      const reward = business?.rewards.find((item) => item.uid === initialRewardTarget.rewardUid);
      if (business && reward) {
        setSelected({ kind: 'reward', business, reward });
        consumeInitialSelection();
        return;
      }
    }

    if (initialRaffleId || initialRewardTarget) {
      consumeInitialSelection();
    }
  }, [consumeInitialSelection, initialRaffleId, initialRewardTarget, loyalty.data, loading, openRaffles, selected]);

  const refreshAll = async () => {
    await Promise.all([points.reload(), loyalty.reload(), raffles.reload(), liveRaffle.reload(), refreshCard()]);
  };

  const onConfirm = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      if (selected.kind === 'raffle') {
        const res = await enterRaffle(selected.raffle.id);
        Alert.alert('U krye', res.msg || 'U regjistruat ne short.');
      } else {
        const res = await redeemLoyaltyReward(selected.business.business_post_id, selected.reward.uid);
        Alert.alert('U krye', res.msg || 'Shperblimi u terhoq me sukses.');
      }
      setSelected(null);
      await refreshAll();
    } catch (err: any) {
      Alert.alert('Gabim', err?.message ?? 'Veprimi nuk mund te kryhet per momentin.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity style={s.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerSub}>Pike Dhe Dhurata</Text>
            <Text style={s.headerTitle}>Rewards</Text>
          </View>
        </View>
        <View style={s.headerActions}>
          <View style={s.pointsChip}>
            <Text style={s.pointsChipText}>{formatPoints(currentBalance)}</Text>
            <Text style={s.pointsChipCoin}>🟡</Text>
          </View>
          <TouchableOpacity style={s.iconBtn} onPress={refreshAll} activeOpacity={0.8}>
            <RefreshCw size={16} color={Colors.textPrimary} strokeWidth={2.2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: bottomInset + 24 }}>
        <View style={s.pad}>
          <View style={s.hero}>
            <View style={s.sliderGlow} />
            <View style={s.heroHead}>
              <View>
                <View style={s.filterLabelRow}>
                  <Filter size={14} color="#0ea5e9" strokeWidth={2.3} />
                  <Text style={s.heroTitle}>Filtro Dhuratat</Text>
                </View>
                <Text style={s.heroSub}>Zgjidh sa pike deshiron te shpenzosh</Text>
              </View>
              <View style={s.maxBox}>
                <Text style={s.maxBoxValue}>{maxPoints}</Text>
                <Text style={s.maxBoxLabel}>Pike Max</Text>
              </View>
            </View>
            <View style={s.sliderWrap}>
              <Slider
                minimumValue={10}
                maximumValue={500}
                step={10}
                value={maxPoints}
                onValueChange={setMaxPoints}
                minimumTrackTintColor={Colors.brandGreen}
                maximumTrackTintColor="#e2e8f0"
                thumbTintColor={Colors.brandGreen}
              />
              <View style={s.sliderMarks}>
                <Text style={s.sliderMarkText}>10 🟡</Text>
                <Text style={s.sliderMarkText}>500 🟡</Text>
              </View>
            </View>
          </View>
        </View>

        {error ? <SectionPad><MessageBox text={error} button="Provo perseri" onPress={refreshAll} /></SectionPad> : null}
        {loading ? <SectionPad><MessageBox text="Duke ngarkuar dhuratat..." loading /></SectionPad> : null}

        {!loading && !error ? (
          <>
            <Section title="Shortet e hapura" meta={`${filteredRaffles.length} aktive`} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hlist}>
              {filteredRaffles.length ? filteredRaffles.map((raffle) => (
                <TouchableOpacity key={raffle.id} style={s.raffleCard} activeOpacity={0.92} onPress={() => setSelected({ kind: 'raffle', raffle })}>
                  <View style={s.raffleMedia}>
                    <Image source={{ uri: raffle.image || FALLBACK_RAFFLE_IMAGE }} style={s.raffleImg} />
                    <View style={s.raffleOverlay} />
                    <View style={[s.badge, getRaffleBadge(raffle).style]}><Text style={s.badgeText}>{getRaffleBadge(raffle).label}</Text></View>
                    <Text style={s.raffleTitle}>{raffle.title}</Text>
                  </View>
                  <View style={s.raffleBottom}>
                    <View style={s.raffleCostChip}><Text style={s.raffleCost}>{formatPoints(raffle.points_cost)}</Text><Text style={s.raffleCoin}>🟡</Text></View>
                    <View style={[s.raffleActionPill, (!raffle.can_afford || raffle.has_entered) && s.raffleActionPillMuted]}>
                      <Text style={[s.raffleAction, (!raffle.can_afford || raffle.has_entered) && s.raffleActionMuted]}>
                        {raffle.has_entered ? 'Ne short' : raffle.can_afford ? 'Merr pjese' : 'Pike te pamj.'}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )) : <View style={s.inlineEmpty}><FeatureEmpty kind="raffle" text="Nuk ka shorte aktive per momentin." actionLabel="Kthehu ne Home" onPress={onBack} /></View>}
            </ScrollView>

            <Section title="Terhiq Tani" meta={`${filteredClaimable.length} aktive`} />
            <SectionPad>
              {filteredClaimable.length ? filteredClaimable.map(({ business, reward }) => (
                <TouchableOpacity key={`${business.business_post_id}-${reward.uid}`} style={s.claimCard} activeOpacity={0.9} onPress={() => setSelected({ kind: 'reward', business, reward })}>
                  <View style={s.claimMedia}>{business.logo ? <Image source={{ uri: business.logo }} style={s.claimLogo} /> : <Gift size={22} color="#c2410c" />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.claimTitle}>{reward.title}</Text>
                    <Text style={s.claimSub}>{business.business_name}</Text>
                    <Text style={s.claimMeta}>Zhbllokuar me {business.scan_count} skanime</Text>
                  </View>
                  <View style={s.claimCostBox}>
                    <Text style={s.claimCostValue}>{formatPoints(reward.threshold)}</Text>
                    <Text style={s.claimCostCoin}>🟡</Text>
                  </View>
                </TouchableOpacity>
              )) : <FeatureEmpty kind="reward" text="Nuk ka dhurata direkte per kete numer pikesh." />}
            </SectionPad>

            {currentLiveSession ? (
              <>
                <Section title="Shorti Live" meta={currentLiveSession.status.toUpperCase()} />
                <SectionPad>
                  <TouchableOpacity style={s.liveCard} activeOpacity={0.92} onPress={() => onOpenLiveRaffle?.(currentLiveSession.id)}>
                    <View style={s.liveShell}>
                      <View style={s.liveAccent} />
                      <LinearGradient colors={['#0f172a', '#082f49']} style={s.liveGradient}>
                        <View style={s.liveBadge}>
                          <Radio size={12} color="#38bdf8" />
                          <Text style={s.liveBadgeText}>{currentLiveSession.status === 'live' ? 'LIVE TANI' : currentLiveSession.status === 'countdown' ? 'COUNTDOWN' : currentLiveSession.status.toUpperCase()}</Text>
                        </View>
                        <Text style={s.liveTitle}>{currentLiveSession.raffle_title}</Text>
                        <Text style={s.liveDesc}>{currentLiveSession.raffle_excerpt || 'Hape shortin live, bashkohu dhe zgjidh kutine tende.'}</Text>
                        <View style={s.liveFooter}>
                          <View style={s.liveRoundPill}>
                            <Text style={s.liveFooterText}>Raundi {currentLiveSession.current_round}</Text>
                          </View>
                          <Text style={s.liveFooterLink}>Hape live raffle</Text>
                        </View>
                      </LinearGradient>
                    </View>
                  </TouchableOpacity>
                </SectionPad>
              </>
            ) : null}

            <Section title="Statusi yt VIP" meta={`${progressBusinesses.length} biznese`} />
            <SectionPad>
              {progressBusinesses.length ? progressBusinesses.map((business) => (
                <View key={business.business_post_id} style={s.progressBusiness}>
                  <View style={s.progressCorner} />
                  <View style={s.progressHead}>
                    <View style={s.progressLogo}>{business.logo ? <Image source={{ uri: business.logo }} style={s.claimLogo} /> : <Crown size={18} color="#065f46" />}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.progressName}>{business.business_name}</Text>
                      <Text style={s.progressScans}>{business.scan_count} skanime totale</Text>
                    </View>
                    <View style={s.loyalPill}><Text style={s.loyalPillText}>VIP</Text></View>
                  </View>
                  {business.rewards.map((reward) => (
                    <View key={reward.uid} style={[s.progressCard, reward.unlocked && s.progressCardUnlocked]}>
                      <View style={s.progressRow}>
                        <View style={s.progressRowLeft}>
                          {reward.redeemed ? <Gift size={14} color="#059669" /> : reward.unlocked ? <Ticket size={14} color="#059669" /> : <Trophy size={14} color="#94a3b8" />}
                          <Text style={[s.progressTitle, reward.unlocked && s.progressTitleUnlocked]}>{reward.title}</Text>
                        </View>
                        {reward.unlocked ? <View style={s.progressWonPill}><Text style={s.progressWonText}>E fitove</Text></View> : null}
                      </View>
                      <View style={s.track}><View style={[s.fill, { width: `${Math.max(8, reward.progress)}%` as any, backgroundColor: reward.redeemed ? '#10b981' : reward.unlocked ? '#10b981' : '#fbbf24' }]} /></View>
                      <View style={s.progressMetaRow}>
                        <Text style={s.progressMeta}>{business.scan_count}/{reward.threshold}</Text>
                        <Text style={s.progressState}>{reward.redeemed ? 'E terhequr' : reward.unlocked ? 'Gati per terheqje' : `Mungojne ${Math.max(0, reward.threshold - business.scan_count)} skanime`}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )) : <Empty text="Nuk ka ende progres lojaliteti." actionLabel="Kthehu ne Home" onPress={onBack} />}
            </SectionPad>

            <Section title="Levizjet e fundit" meta={`${transactions.length} te fundit`} />
            <SectionPad>
              {transactions.length ? transactions.map((tx, i) => (
                <View key={`${tx.date}-${i}`} style={s.txRow}>
                  <View style={[s.txIcon, tx.type === 'earn' ? s.txEarn : s.txSpend]}>
                    {tx.type === 'earn' ? <ArrowDownCircle size={18} color="#166534" /> : <ArrowUpCircle size={18} color="#991b1b" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.txTitle}>{tx.business_name}</Text>
                    <Text style={s.txDate}>{formatDate(tx.date)}</Text>
                  </View>
                  <Text style={[s.txPoints, tx.type === 'earn' ? s.txPointsEarn : s.txPointsSpend]}>
                    {tx.type === 'earn' ? '+' : ''}{formatPoints(tx.points)}
                  </Text>
                </View>
              )) : <Empty text="Nuk ka ende levizje pikesh." actionLabel="Kthehu ne Home" onPress={onBack} />}
            </SectionPad>
          </>
        ) : null}
      </ScrollView>

      <RewardsModal item={selected} loading={submitting} onClose={() => setSelected(null)} onConfirm={onConfirm} />
    </View>
  );
}

function Section({ title, meta }: { title: string; meta: string }) {
  return <View style={s.section}><Text style={s.sectionTitle}>{title}</Text><Text style={s.sectionMeta}>{meta}</Text></View>;
}
function SectionPad({ children }: { children: React.ReactNode }) { return <View style={s.pad}>{children}</View>; }
function Empty({ text, actionLabel, onPress }: { text: string; actionLabel?: string; onPress?: () => void }) {
  return (
    <ScreenState
      icon="empty"
      message={text}
      actionLabel={actionLabel}
      onAction={onPress}
      compact
    />
  );
}

function FeatureEmpty({
  kind,
  text,
  actionLabel,
  onPress,
}: {
  kind: 'raffle' | 'reward';
  text: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  return (
    <View style={s.emptyCard}>
      <View style={s.emptyIconWrap}>
        {kind === 'raffle'
          ? <Ticket size={24} color="#4d7c0f" strokeWidth={2.1} />
          : <Gift size={24} color="#4d7c0f" strokeWidth={2.1} />}
      </View>
      <Text style={s.emptyTitle}>{kind === 'raffle' ? 'Asnje short aktiv' : 'Asnje dhurate direkte'}</Text>
      <Text style={s.emptyText}>{text}</Text>
      {actionLabel && onPress ? (
        <TouchableOpacity style={s.emptyAction} onPress={onPress} activeOpacity={0.85}>
          <Text style={s.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function MessageBox({ text, button, onPress, loading }: { text: string; button?: string; onPress?: () => void; loading?: boolean }) {
  return (
    <ScreenState
      icon={loading ? 'empty' : 'error'}
      message={text}
      actionLabel={button}
      onAction={onPress}
      loading={loading}
      compact
    />
  );
}

function getRaffleBadge(raffle: RaffleApiItem) {
  if (raffle.has_entered) {
    return { label: 'I regjistruar', style: s.badgeDone };
  }
  if (!raffle.can_afford) {
    return { label: 'Pike te pamj.', style: s.badgeMuted };
  }
  const end = raffle.end_date ? new Date(raffle.end_date) : null;
  if (!end || Number.isNaN(end.getTime())) {
    return { label: 'Short aktiv', style: s.badgeActive };
  }
  const now = new Date();
  const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 1) {
    return { label: 'Mbyllet sot', style: s.badgeUrgent };
  }
  if (diffDays <= 3) {
    return { label: `Mbyllet ne ${diffDays} dite`, style: s.badgeSoon };
  }
  return { label: formatRaffleDate(raffle.end_date), style: s.badgeActive };
}

function RewardsModal({ item, loading, onClose, onConfirm }: { item: ModalItem | null; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!item) return null;
  const raffle = item.kind === 'raffle' ? item.raffle : null;
  const disabled = item.kind === 'raffle'
    ? (!raffle!.can_afford || raffle!.has_entered)
    : !!item.reward.redeemed;
  const badgeLabel = item.kind === 'raffle' ? formatRaffleDate(raffle!.end_date) : item.business.business_name;
  const title = item.kind === 'raffle' ? raffle!.title : item.reward.title;
  const desc = item.kind === 'raffle'
    ? (raffle!.excerpt || 'Merr pjese ne kete short duke shpenzuar pike.')
    : `Ky shperblim mund te terhiqet tani nga ${item.business.business_name}.`;
  const cost = formatPoints(item.kind === 'raffle' ? raffle!.points_cost : item.reward.threshold);
  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={m.root}>
        <View style={m.card}>
          <TouchableOpacity style={m.close} onPress={onClose} disabled={loading}><X size={18} color="#fff" /></TouchableOpacity>
          <View style={m.media}>
            {item.kind === 'raffle'
              ? <>
                  <Image source={{ uri: raffle!.image || FALLBACK_RAFFLE_IMAGE }} style={m.mediaImg} />
                  <View style={m.mediaOverlay} />
                </>
              : <LinearGradient colors={['#fff7ed', '#ffedd5']} style={m.rewardMedia}><Gift size={54} color="#c2410c" /></LinearGradient>}
          </View>
          <View style={m.content}>
            <View style={m.contentCard}>
              <Text style={m.badge}>{badgeLabel}</Text>
              <Text style={m.title}>{title}</Text>
              <Text style={m.desc}>{desc}</Text>
              <View style={m.costBox}>
                <Text style={m.costLabel}>{item.kind === 'raffle' ? 'Kostoja:' : 'Pragu:'}</Text>
                <View style={m.costRow}>
                  <Text style={m.cost}>{cost}</Text>
                  <Text style={m.costCoin}>🟡</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={[m.btn, disabled && m.btnDisabled]} disabled={disabled || loading} onPress={onConfirm}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Gift size={16} color="#fff" />}
              <Text style={m.btnText}>
                {item.kind === 'raffle'
                  ? (raffle!.has_entered ? 'Je regjistruar tashme' : raffle!.can_afford ? 'Konfirmo pjesemarrjen' : 'Nuk ke pike te mjaftueshme')
                  : item.reward.redeemed
                    ? 'Shperblimi eshte terhequr'
                    : 'Konfirmo terheqjen'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function formatPoints(value: number) { return Number(value ?? 0).toLocaleString('sq-AL', { maximumFractionDigits: 1 }); }
function formatDate(value: string) { const d = new Date(value); return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('sq-AL', { day: '2-digit', month: 'short', year: 'numeric' }); }
function formatRaffleDate(value: string | null) { const d = value ? new Date(value) : null; return !d || Number.isNaN(d.getTime()) ? 'Short aktiv' : `Deri me ${d.toLocaleDateString('sq-AL', { day: '2-digit', month: 'short' })}`; }

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg }, scroll: { flex: 1 }, pad: { paddingHorizontal: Spacing.xxl, marginBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 }, headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 }, iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  headerSub: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }, headerTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary },
  pointsChip: { backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.xl, borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', alignItems: 'center', gap: 4 },
  pointsChipText: { fontFamily: Typography.fontExtraBold, fontSize: Typography.md, color: '#b45309' },
  pointsChipCoin: { fontSize: 13 },
  hero: { backgroundColor: Colors.white, borderRadius: Radius.xxl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.border, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 3, overflow: 'hidden' },
  sliderGlow: { position: 'absolute', top: -18, right: -14, width: 96, height: 96, borderRadius: 48, backgroundColor: '#f0f9ff' },
  heroHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xl },
  filterLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  heroTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary },
  heroSub: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18, maxWidth: 190 },
  maxBox: { minWidth: 70, paddingHorizontal: 12, paddingVertical: 10, borderRadius: Radius.xl, backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  maxBoxValue: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary, marginBottom: 2 },
  maxBoxLabel: { fontFamily: Typography.fontBold, fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase' },
  sliderWrap: { paddingTop: 2 },
  sliderMarks: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  sliderMarkText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, marginBottom: 14, marginTop: 2 }, sectionTitle: { fontFamily: Typography.fontExtraBold, fontSize: 18, color: Colors.textPrimary, lineHeight: 22 }, sectionMeta: { fontFamily: Typography.fontBold, fontSize: 12, color: '#0ea5e9' },
  message: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center', gap: 10 }, messageText: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' }, retry: { backgroundColor: '#0f172a', paddingHorizontal: Spacing.xl, paddingVertical: 10, borderRadius: Radius.lg }, retryText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#fff' },
  claimCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.white, borderRadius: 20, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }, claimMedia: { width: 58, height: 58, borderRadius: 16, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#ffedd5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, claimLogo: { width: '100%', height: '100%' }, claimTitle: { fontFamily: Typography.fontExtraBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 2, lineHeight: 19 }, claimSub: { fontFamily: Typography.fontBold, fontSize: 11, color: Colors.textSecondary, marginBottom: 2 }, claimMeta: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textMuted }, claimCostBox: { minWidth: 62, backgroundColor: '#fef3c7', borderRadius: Radius.xl, borderWidth: 1, borderColor: '#fde68a', paddingHorizontal: 10, paddingVertical: 8, alignItems: 'center' }, claimCostValue: { fontFamily: Typography.fontExtraBold, fontSize: Typography.md, color: '#b45309', lineHeight: 16 }, claimCostCoin: { fontSize: 10, marginTop: 2 },
  liveCard: { borderRadius: Radius.xxl + 4, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  liveShell: { backgroundColor: Colors.white, borderRadius: Radius.xxl + 4, borderWidth: 1, borderColor: Colors.borderLight, overflow: 'hidden' },
  liveAccent: { position: 'absolute', top: 0, right: 0, width: 88, height: 88, backgroundColor: '#ecfdf5', borderBottomLeftRadius: 88, zIndex: 1 },
  liveGradient: { margin: 10, borderRadius: Radius.xxl, padding: Spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  liveBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.10)', borderWidth: 1, borderColor: 'rgba(125,211,252,0.26)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, marginBottom: 14 },
  liveBadgeText: { fontFamily: Typography.fontExtraBold, fontSize: 10, color: '#e0f2fe', textTransform: 'uppercase', letterSpacing: 0.6 },
  liveTitle: { fontFamily: Typography.fontExtraBold, fontSize: 24, color: '#fff', marginBottom: 8, lineHeight: 28 },
  liveDesc: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: '#cbd5e1', lineHeight: 20 },
  liveFooter: { marginTop: Spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  liveRoundPill: { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(148,163,184,0.28)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full },
  liveFooterText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#7dd3fc' },
  liveFooterLink: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#fff' },
  hlist: { paddingHorizontal: Spacing.xxl, gap: 14, paddingBottom: Spacing.md }, inlineEmpty: { width: 280 }, raffleCard: { width: 260, backgroundColor: Colors.white, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }, raffleMedia: { height: 150, backgroundColor: Colors.borderLight }, raffleImg: { width: '100%', height: '100%' }, raffleOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.42)' }, badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 }, badgeActive: { backgroundColor: 'rgba(14,165,233,0.95)' }, badgeSoon: { backgroundColor: 'rgba(245,158,11,0.96)' }, badgeUrgent: { backgroundColor: 'rgba(239,68,68,0.96)' }, badgeDone: { backgroundColor: 'rgba(16,185,129,0.95)' }, badgeMuted: { backgroundColor: 'rgba(148,163,184,0.95)' }, badgeText: { color: '#fff', fontFamily: Typography.fontExtraBold, fontSize: 10, textTransform: 'uppercase' }, raffleTitle: { position: 'absolute', bottom: 12, left: 12, right: 12, fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: '#fff', lineHeight: 21 }, raffleBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg }, raffleCostChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fef3c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.xl, borderWidth: 1, borderColor: '#fde68a' }, raffleCost: { fontFamily: Typography.fontExtraBold, fontSize: Typography.md, color: '#b45309' }, raffleCoin: { fontSize: 11 }, raffleActionPill: { backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 9, borderRadius: Radius.xl }, raffleActionPillMuted: { backgroundColor: '#e2e8f0' }, raffleAction: { fontFamily: Typography.fontBold, fontSize: 10, color: '#fff', textTransform: 'uppercase' }, raffleActionMuted: { color: Colors.textMuted },
  progressBusiness: { backgroundColor: Colors.white, borderRadius: 24, borderWidth: 2, borderColor: '#d1fae5', padding: Spacing.xl, marginBottom: 12, overflow: 'hidden' }, progressCorner: { position: 'absolute', top: 0, right: 0, width: 80, height: 80, backgroundColor: '#ecfdf5', borderBottomLeftRadius: 80 }, progressHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }, progressLogo: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, progressName: { fontFamily: Typography.fontExtraBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 2, lineHeight: 19 }, progressScans: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase' }, loyalPill: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.lg }, loyalPillText: { fontFamily: Typography.fontBold, fontSize: 9, color: '#166534', textTransform: 'uppercase' },
  progressCard: { backgroundColor: Colors.surfaceBg, borderRadius: Radius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 8 }, progressCardUnlocked: { backgroundColor: 'rgba(236,253,245,0.75)', borderColor: '#a7f3d0' }, progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12 }, progressRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }, progressTitle: { fontFamily: Typography.fontBold, fontSize: 13, color: Colors.textPrimary, flexShrink: 1 }, progressTitleUnlocked: { color: '#065f46' }, progressWonPill: { backgroundColor: '#bbf7d0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.md }, progressWonText: { fontFamily: Typography.fontExtraBold, fontSize: 10, color: '#065f46', textTransform: 'uppercase' }, track: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }, fill: { height: '100%', borderRadius: 3 }, progressMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, progressMeta: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted }, progressState: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textSecondary, textAlign: 'right', flex: 1 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.lg, marginBottom: 10 }, txIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, txEarn: { backgroundColor: '#dcfce7' }, txSpend: { backgroundColor: '#fee2e2' }, txTitle: { fontFamily: Typography.fontBold, fontSize: 15, color: Colors.textPrimary, marginBottom: 2, lineHeight: 19 }, txDate: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textMuted }, txPoints: { fontFamily: Typography.fontExtraBold, fontSize: Typography.md }, txPointsEarn: { color: '#166534' }, txPointsSpend: { color: '#991b1b' },
  emptyCard: { backgroundColor: Colors.white, borderRadius: 32, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#f7fee7', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: Colors.textPrimary, textAlign: 'center', marginBottom: 6 },
  emptyText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyAction: { marginTop: 14, backgroundColor: '#f7fee7', borderWidth: 1, borderColor: '#d9f99d', paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full },
  emptyActionText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.brandGreenDeep },
});

const m = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  card: { width: '100%', backgroundColor: Colors.white, borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.28, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 16 },
  close: { position: 'absolute', top: 14, right: 14, zIndex: 20, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  media: { height: 220, backgroundColor: '#f1f5f9' },
  mediaImg: { width: '100%', height: '100%' },
  mediaOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.18)' },
  rewardMedia: { height: '100%', justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.xl, paddingTop: 0, marginTop: -18 },
  contentCard: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  badge: { alignSelf: 'center', backgroundColor: '#fef3c7', color: '#92400e', paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, overflow: 'hidden', fontFamily: Typography.fontBold, fontSize: Typography.xs, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 },
  title: { fontFamily: Typography.fontExtraBold, fontSize: 22, color: Colors.textPrimary, textAlign: 'center', lineHeight: 28, marginBottom: 10 },
  desc: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  costBox: { backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight, borderRadius: Radius.xl, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, marginBottom: Spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  costLabel: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cost: { fontFamily: Typography.fontExtraBold, fontSize: 26, color: '#f59e0b', textAlign: 'center' },
  costCoin: { fontSize: 18 },
  btn: { backgroundColor: '#0f172a', borderRadius: 16, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 4 },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: Typography.fontBold, fontSize: Typography.lg, color: '#fff' },
});
