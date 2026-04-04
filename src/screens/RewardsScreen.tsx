import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Modal, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ChevronLeft, RefreshCw, Gift, Ticket, Trophy, Crown, ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { enterRaffle, fetchLoyalty, fetchPoints, fetchRaffles, LoyaltyApiBusiness, LoyaltyApiReward, RaffleApiItem, redeemLoyaltyReward } from '../services/api';

interface Props { bottomInset: number; onBack?: () => void; }
type ModalItem = { kind: 'raffle'; raffle: RaffleApiItem } | { kind: 'reward'; business: LoyaltyApiBusiness; reward: LoyaltyApiReward };
const FALLBACK_RAFFLE_IMAGE = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';

export default function RewardsScreen({ bottomInset, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const { card, refreshCard } = useAuth();
  const [selected, setSelected] = useState<ModalItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const points = useFetch(() => fetchPoints());
  const loyalty = useFetch(() => fetchLoyalty());
  const raffles = useFetch(() => fetchRaffles());

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

  const refreshAll = async () => {
    await Promise.all([points.reload(), loyalty.reload(), raffles.reload(), refreshCard()]);
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
        <TouchableOpacity style={s.iconBtn} onPress={refreshAll} activeOpacity={0.8}>
          <RefreshCw size={16} color={Colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: Spacing.sm, paddingBottom: bottomInset + 24 }}>
        <View style={s.pad}>
          <LinearGradient colors={['#0f172a', '#1e293b']} style={s.hero}>
            <Text style={s.heroLabel}>Bilanci aktual</Text>
            <Text style={s.heroPoints}>{formatPoints(currentBalance)} pike</Text>
            <Text style={s.heroSub}>
              {claimable.length > 0 ? `${claimable.length} shperblime gati per terheqje` : 'Skano te bizneset partnere per te zhbllokuar dhurata.'}
            </Text>
            <View style={s.heroStats}>
              <View style={s.heroBox}><Gift size={14} color="#facc15" /><Text style={s.heroBoxNum}>{claimable.length}</Text><Text style={s.heroBoxText}>Gati</Text></View>
              <View style={s.heroBox}><Ticket size={14} color="#38bdf8" /><Text style={s.heroBoxNum}>{openRaffles.length}</Text><Text style={s.heroBoxText}>Shorte</Text></View>
            </View>
          </LinearGradient>
        </View>

        {error ? <SectionPad><MessageBox text={error} button="Provo perseri" onPress={refreshAll} /></SectionPad> : null}
        {loading ? <SectionPad><MessageBox text="Duke ngarkuar dhuratat..." loading /></SectionPad> : null}

        {!loading && !error ? (
          <>
            <Section title="Per t'u terhequr tani" meta={`${claimable.length} aktive`} />
            <SectionPad>
              {claimable.length ? claimable.map(({ business, reward }) => (
                <TouchableOpacity key={`${business.business_post_id}-${reward.uid}`} style={s.claimCard} activeOpacity={0.9} onPress={() => setSelected({ kind: 'reward', business, reward })}>
                  <View style={s.claimMedia}>{business.logo ? <Image source={{ uri: business.logo }} style={s.claimLogo} /> : <Gift size={22} color="#c2410c" />}</View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.claimTitle}>{reward.title}</Text>
                    <Text style={s.claimSub}>{business.business_name}</Text>
                    <Text style={s.claimMeta}>Zhbllokuar me {business.scan_count} skanime</Text>
                  </View>
                  <View style={s.claimPill}><Text style={s.claimPillText}>Terhiq</Text></View>
                </TouchableOpacity>
              )) : <Empty text="Nuk ke ende shperblime direkte te zhbllokuara." />}
            </SectionPad>

            <Section title="Shortet e hapura" meta={`${openRaffles.length} aktive`} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.hlist}>
              {openRaffles.length ? openRaffles.map((raffle) => (
                <TouchableOpacity key={raffle.id} style={s.raffleCard} activeOpacity={0.92} onPress={() => setSelected({ kind: 'raffle', raffle })}>
                  <View style={s.raffleMedia}>
                    <Image source={{ uri: raffle.image || FALLBACK_RAFFLE_IMAGE }} style={s.raffleImg} />
                    <View style={s.raffleOverlay} />
                    <View style={[s.badge, raffle.has_entered && s.badgeDone]}><Text style={s.badgeText}>{raffle.has_entered ? 'I regjistruar' : formatRaffleDate(raffle.end_date)}</Text></View>
                    <Text style={s.raffleTitle}>{raffle.title}</Text>
                  </View>
                  <View style={s.raffleBottom}>
                    <View><Text style={s.raffleCost}>{formatPoints(raffle.points_cost)}</Text><Text style={s.raffleCostLabel}>pike</Text></View>
                    <Text style={[s.raffleAction, (!raffle.can_afford || raffle.has_entered) && s.raffleActionMuted]}>
                      {raffle.has_entered ? 'Ne short' : raffle.can_afford ? 'Merr pjese' : 'Pike te pamj.'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )) : <View style={s.inlineEmpty}><Empty text="Nuk ka shorte aktive per momentin." /></View>}
            </ScrollView>

            <Section title="Progresi ne biznese" meta={`${progressBusinesses.length} biznese`} />
            <SectionPad>
              {progressBusinesses.length ? progressBusinesses.map((business) => (
                <View key={business.business_post_id} style={s.progressBusiness}>
                  <View style={s.progressHead}>
                    <View style={s.progressLogo}>{business.logo ? <Image source={{ uri: business.logo }} style={s.claimLogo} /> : <Crown size={18} color="#065f46" />}</View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.progressName}>{business.business_name}</Text>
                      <Text style={s.progressScans}>{business.scan_count} skanime totale</Text>
                    </View>
                    <View style={s.loyalPill}><Text style={s.loyalPillText}>Loyalty</Text></View>
                  </View>
                  {business.rewards.map((reward) => (
                    <View key={reward.uid} style={s.progressCard}>
                      <View style={s.progressRow}>
                        <View style={s.progressRowLeft}>
                          {reward.redeemed ? <Gift size={14} color="#059669" /> : reward.unlocked ? <Gift size={14} color="#c2410c" /> : <Trophy size={14} color="#94a3b8" />}
                          <Text style={s.progressTitle}>{reward.title}</Text>
                        </View>
                        <Text style={s.progressThreshold}>{reward.threshold} skanime</Text>
                      </View>
                      <View style={s.track}><View style={[s.fill, { width: `${Math.max(8, reward.progress)}%` as any, backgroundColor: reward.redeemed ? '#10b981' : reward.unlocked ? '#f59e0b' : '#94a3b8' }]} /></View>
                      <View style={s.progressMetaRow}>
                        <Text style={s.progressMeta}>{business.scan_count}/{reward.threshold}</Text>
                        <Text style={s.progressState}>{reward.redeemed ? 'E terhequr' : reward.unlocked ? (reward.one_time ? 'Gati per terheqje' : 'E zhbllokuar') : `Edhe ${Math.max(0, reward.threshold - business.scan_count)} skanime`}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )) : <Empty text="Nuk ka ende progres lojaliteti." />}
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
              )) : <Empty text="Nuk ka ende levizje pikesh." />}
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
function Empty({ text }: { text: string }) { return <View style={s.empty}><Text style={s.emptyText}>{text}</Text></View>; }

function MessageBox({ text, button, onPress, loading }: { text: string; button?: string; onPress?: () => void; loading?: boolean }) {
  return (
    <View style={s.message}>
      {loading ? <ActivityIndicator size="small" color={Colors.textMuted} /> : null}
      <Text style={s.messageText}>{text}</Text>
      {button && onPress ? <TouchableOpacity style={s.retry} onPress={onPress}><Text style={s.retryText}>{button}</Text></TouchableOpacity> : null}
    </View>
  );
}

function RewardsModal({ item, loading, onClose, onConfirm }: { item: ModalItem | null; loading: boolean; onClose: () => void; onConfirm: () => void }) {
  if (!item) return null;
  const raffle = item.kind === 'raffle' ? item.raffle : null;
  const disabled = item.kind === 'raffle' ? (!raffle!.can_afford || raffle!.has_entered) : false;
  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFillObject} />
      <View style={m.root}>
        <View style={m.card}>
          <TouchableOpacity style={m.close} onPress={onClose} disabled={loading}><X size={18} color="#fff" /></TouchableOpacity>
          <View style={m.media}>
            {item.kind === 'raffle'
              ? <Image source={{ uri: raffle!.image || FALLBACK_RAFFLE_IMAGE }} style={m.mediaImg} />
              : <LinearGradient colors={['#fff7ed', '#ffedd5']} style={m.rewardMedia}><Gift size={42} color="#c2410c" /></LinearGradient>}
          </View>
          <View style={m.content}>
            <Text style={m.badge}>{item.kind === 'raffle' ? formatRaffleDate(raffle!.end_date) : item.business.business_name}</Text>
            <Text style={m.title}>{item.kind === 'raffle' ? raffle!.title : item.reward.title}</Text>
            <Text style={m.desc}>{item.kind === 'raffle' ? (raffle!.excerpt || 'Merr pjese ne kete short duke shpenzuar pike.') : `Ky shperblim mund te terhiqet tani nga ${item.business.business_name}.`}</Text>
            <View style={m.costBox}><Text style={m.costLabel}>{item.kind === 'raffle' ? 'Kostoja' : 'Pragu'}</Text><Text style={m.cost}>{formatPoints(item.kind === 'raffle' ? raffle!.points_cost : item.reward.threshold)}</Text></View>
            <TouchableOpacity style={[m.btn, disabled && m.btnDisabled]} disabled={disabled || loading} onPress={onConfirm}>
              {loading ? <ActivityIndicator size="small" color="#fff" /> : <Gift size={16} color="#fff" />}
              <Text style={m.btnText}>{item.kind === 'raffle' ? (raffle!.has_entered ? 'Je regjistruar tashme' : raffle!.can_afford ? 'Konfirmo pjesemarrjen' : 'Nuk ke pike te mjaftueshme') : 'Konfirmo terheqjen'}</Text>
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
  root: { flex: 1, backgroundColor: Colors.surfaceBg }, scroll: { flex: 1 }, pad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xxxl },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.lg, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 }, iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  headerSub: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 }, headerTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary },
  hero: { borderRadius: Radius.xxl + 6, padding: Spacing.xl, shadowColor: '#0f172a', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  heroLabel: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }, heroPoints: { fontFamily: Typography.fontExtraBold, fontSize: 34, color: '#fff', lineHeight: 38 }, heroSub: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: '#cbd5e1', marginTop: 6, lineHeight: 18 },
  heroStats: { flexDirection: 'row', gap: 10, marginTop: Spacing.lg }, heroBox: { width: 90, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: Radius.xl, paddingVertical: 10, alignItems: 'center' }, heroBoxNum: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: '#fff', marginTop: 4 }, heroBoxText: { fontFamily: Typography.fontBold, fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', marginTop: 2 },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md }, sectionTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary }, sectionMeta: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#0ea5e9' },
  message: { backgroundColor: Colors.white, borderRadius: Radius.xl, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight, alignItems: 'center', gap: 10 }, messageText: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textMuted, textAlign: 'center' }, retry: { backgroundColor: '#0f172a', paddingHorizontal: Spacing.xl, paddingVertical: 10, borderRadius: Radius.lg }, retryText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#fff' },
  claimCard: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.white, borderRadius: Radius.xxl, padding: Spacing.lg, borderWidth: 1, borderColor: '#fed7aa', marginBottom: 12 }, claimMedia: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#fff7ed', borderWidth: 1, borderColor: '#ffedd5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, claimLogo: { width: '100%', height: '100%' }, claimTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: 2 }, claimSub: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#c2410c', marginBottom: 2 }, claimMeta: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textMuted }, claimPill: { backgroundColor: '#0f172a', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 8 }, claimPillText: { fontFamily: Typography.fontBold, fontSize: 10, color: '#fff', textTransform: 'uppercase' },
  hlist: { paddingHorizontal: Spacing.xxl, gap: 14, paddingBottom: Spacing.md }, inlineEmpty: { width: 280 }, raffleCard: { width: 272, backgroundColor: Colors.white, borderRadius: Radius.xxl + 2, overflow: 'hidden', borderWidth: 1, borderColor: Colors.borderLight, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }, raffleMedia: { height: 160, backgroundColor: Colors.borderLight }, raffleImg: { width: '100%', height: '100%' }, raffleOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,6,23,0.36)' }, badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, backgroundColor: 'rgba(255,255,255,0.18)' }, badgeDone: { backgroundColor: 'rgba(16,185,129,0.95)' }, badgeText: { color: '#fff', fontFamily: Typography.fontExtraBold, fontSize: 10, textTransform: 'uppercase' }, raffleTitle: { position: 'absolute', bottom: 12, left: 12, right: 12, fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: '#fff', lineHeight: 21 }, raffleBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg }, raffleCost: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: '#92400e' }, raffleCostLabel: { fontFamily: Typography.fontBold, fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase' }, raffleAction: { fontFamily: Typography.fontBold, fontSize: 10, color: '#0369a1', textTransform: 'uppercase' }, raffleActionMuted: { color: Colors.textMuted },
  progressBusiness: { backgroundColor: Colors.white, borderRadius: Radius.xxl + 4, borderWidth: 1, borderColor: '#d1fae5', padding: Spacing.xl, marginBottom: Spacing.lg }, progressHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: Spacing.lg }, progressLogo: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, progressName: { fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: Colors.textPrimary, marginBottom: 2 }, progressScans: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase' }, loyalPill: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full }, loyalPillText: { fontFamily: Typography.fontBold, fontSize: 9, color: '#166534', textTransform: 'uppercase' },
  progressCard: { backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight, marginBottom: 10 }, progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12 }, progressRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }, progressTitle: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary, flexShrink: 1 }, progressThreshold: { fontFamily: Typography.fontBold, fontSize: 10, color: Colors.textMuted }, track: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }, fill: { height: '100%', borderRadius: 3 }, progressMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 }, progressMeta: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted }, progressState: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textSecondary, textAlign: 'right', flex: 1 },
  txRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: Colors.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.lg, marginBottom: 10 }, txIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }, txEarn: { backgroundColor: '#dcfce7' }, txSpend: { backgroundColor: '#fee2e2' }, txTitle: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary, marginBottom: 2 }, txDate: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textMuted }, txPoints: { fontFamily: Typography.fontExtraBold, fontSize: Typography.md }, txPointsEarn: { color: '#166534' }, txPointsSpend: { color: '#991b1b' },
  empty: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xxl, padding: Spacing.xxl, alignItems: 'center' }, emptyText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
});

const m = StyleSheet.create({
  root: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl }, card: { width: '100%', backgroundColor: Colors.white, borderRadius: 32, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 30, shadowOffset: { width: 0, height: 12 }, elevation: 16 },
  close: { position: 'absolute', top: 14, right: 14, zIndex: 20, width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' },
  media: { height: 190 }, mediaImg: { width: '100%', height: '100%' }, rewardMedia: { height: '100%', justifyContent: 'center', alignItems: 'center' },
  content: { padding: Spacing.xxl }, badge: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'uppercase', textAlign: 'center', marginBottom: 10 }, title: { fontFamily: Typography.fontExtraBold, fontSize: 22, color: Colors.textPrimary, textAlign: 'center', lineHeight: 28, marginBottom: 10 }, desc: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.xl },
  costBox: { backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.lg, marginBottom: Spacing.xl }, costLabel: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted, marginBottom: 4, textAlign: 'center' }, cost: { fontFamily: Typography.fontExtraBold, fontSize: 26, color: '#f59e0b', textAlign: 'center' },
  btn: { backgroundColor: '#0f172a', borderRadius: Radius.xl, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 }, btnDisabled: { opacity: 0.5 }, btnText: { fontFamily: Typography.fontBold, fontSize: Typography.lg, color: '#fff' },
});
