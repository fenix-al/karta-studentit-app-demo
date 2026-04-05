import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft,
  CircleDot,
  Clock3,
  DoorOpen,
  Radio,
  RefreshCw,
  Trophy,
  Users,
  Star,
} from 'lucide-react-native';

import { Colors, Radius, Spacing, Typography } from '../constants/Theme';
import ScreenState from '../components/ScreenState';
import {
  fetchCurrentLiveRaffle,
  fetchLiveRaffleEvents,
  fetchLiveRaffleState,
  joinLiveRaffle,
  pickLiveRaffleBox,
} from '../services/api';
import {
  LiveRaffleCurrentApiResponse,
  LiveRaffleEventApiItem,
  LiveRaffleStateApiResponse,
} from '../types';

interface Props {
  bottomInset: number;
  onBack?: () => void;
}

type LiveData = {
  current: LiveRaffleCurrentApiResponse;
  state: LiveRaffleStateApiResponse | null;
  events: LiveRaffleEventApiItem[];
};

const DEFAULT_DATA: LiveData = {
  current: { session: null },
  state: null,
  events: [],
};

export default function LiveRaffleScreen({ bottomInset, onBack }: Props) {
  const insets = useSafeAreaInsets();
  const mountedRef = useRef(true);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const serverOffsetRef = useRef(0);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const [data, setData] = useState<LiveData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clockTick, setClockTick] = useState(Date.now());

  const session = data.current.session;
  const state = data.state?.state ?? null;
  const currentUser = state?.current_user ?? null;

  const serverNowMs = useMemo(() => clockTick + serverOffsetRef.current, [clockTick]);

  const canJoin = !!session && !currentUser?.is_joined && !['finished', 'cancelled'].includes(session.status);
  const canPick = !!session && !!state && !!currentUser?.is_joined && !!currentUser.is_active && !currentUser.pick_submitted && ['countdown', 'live'].includes(session.status);
  const isWinner = !!session && session.status === 'finished' && !!currentUser?.is_joined && !!currentUser.is_active;
  const isEliminated = !!currentUser?.is_joined && !currentUser.is_active;

  const heroTone = useMemo(() => {
    if (!session) return { colors: ['#0f172a', '#1e293b'] as const, label: 'Asnje sesion', accent: '#94a3b8' };
    if (isWinner) return { colors: ['#713f12', '#f59e0b'] as const, label: 'Fitues', accent: '#fde68a' };
    if (isEliminated) return { colors: ['#4c0519', '#be123c'] as const, label: 'Eliminuar', accent: '#fecdd3' };

    switch (session.status) {
      case 'countdown':
        return { colors: ['#0c4a6e', '#0f172a'] as const, label: 'Countdown', accent: '#7dd3fc' };
      case 'live':
        return { colors: ['#064e3b', '#0f172a'] as const, label: 'Live tani', accent: '#86efac' };
      case 'reveal':
        return { colors: ['#581c87', '#0f172a'] as const, label: 'Reveal', accent: '#d8b4fe' };
      case 'finished':
        return { colors: ['#334155', '#0f172a'] as const, label: 'I mbyllur', accent: '#cbd5e1' };
      default:
        return { colors: ['#0f172a', '#1e293b'] as const, label: session.status, accent: '#cbd5e1' };
    }
  }, [isEliminated, isWinner, session]);

  const phaseInfo = useMemo(() => getPhaseInfo(session, serverNowMs), [session, serverNowMs]);
  const phaseCounter = useMemo(() => formatCountdown(phaseInfo.ms), [phaseInfo.ms]);

  const pollDelay = useMemo(() => {
    if (!session) return 8000;
    switch (session.status) {
      case 'reveal':
        return 1400;
      case 'countdown':
      case 'live':
        return 2200;
      case 'scheduled':
        return 7000;
      case 'finished':
        return 12000;
      default:
        return 5000;
    }
  }, [session]);

  const load = React.useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);

    try {
      const current = await fetchCurrentLiveRaffle();

      if (!current.session) {
        if (!mountedRef.current) return;
        setData({ current, state: null, events: [] });
        setError(null);
        return;
      }

      const [stateRes, eventsRes] = await Promise.all([
        fetchLiveRaffleState(current.session.id),
        fetchLiveRaffleEvents(current.session.id, 24),
      ]);

      if (!mountedRef.current) return;

      const serverTime = new Date(stateRes.state.server_time.replace(' ', 'T')).getTime();
      if (!Number.isNaN(serverTime)) {
        serverOffsetRef.current = serverTime - Date.now();
      }

      setData({
        current,
        state: stateRes,
        events: eventsRes.items,
      });
      setError(null);
    } catch (err: any) {
      if (!mountedRef.current) return;
      if (!silent) {
        setError(err?.message ?? 'Live raffle nuk u ngarkua dot.');
      }
    } finally {
      if (!mountedRef.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    load();

    return () => {
      mountedRef.current = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [load]);

  useEffect(() => {
    const interval = setInterval(() => setClockTick(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(() => {
      load(true);
    }, pollDelay);

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [load, pollDelay, session?.id, session?.status, state?.round_no]);

  useEffect(() => {
    pulseAnim.setValue(0);
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, session?.status]);

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, session?.status === 'reveal' ? 1.12 : 1.06],
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await load(true);
  };

  const handleJoin = async () => {
    if (!session) return;
    setActionLoading(true);

    const optimisticServerTime = state?.server_time ?? new Date().toISOString().slice(0, 19).replace('T', ' ');
    setData((prev) => {
      if (!prev.state) return prev;
      return {
        ...prev,
        state: {
          ...prev.state,
          state: {
            ...prev.state.state,
            players_online: prev.state.state.players_online + 1,
            current_user: {
              is_joined: true,
              is_active: true,
              eliminated_reason: '',
              display_name: prev.state.state.current_user?.display_name ?? '',
              last_seen_at: optimisticServerTime,
              pick_submitted: false,
              picked_box: null,
              pick_is_correct: null,
            },
          },
        },
      };
    });

    try {
      await joinLiveRaffle(session.id);
      await load(true);
    } catch (err: any) {
      await load(true);
      Alert.alert('Gabim', err?.message ?? 'Nuk u bashkuat dot ne short.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePick = async (boxNumber: number) => {
    if (!session || !state) return;
    setActionLoading(true);

    setData((prev) => {
      if (!prev.state?.state.current_user) return prev;
      return {
        ...prev,
        state: {
          ...prev.state,
          state: {
            ...prev.state.state,
            picked_count: prev.state.state.picked_count + 1,
            remaining_count: Math.max(0, prev.state.state.remaining_count - 1),
            current_user: {
              ...prev.state.state.current_user,
              pick_submitted: true,
              picked_box: boxNumber,
            },
          },
        },
      };
    });

    try {
      await pickLiveRaffleBox(session.id, state.round_no, boxNumber);
      await load(true);
    } catch (err: any) {
      await load(true);
      Alert.alert('Gabim', err?.message ?? 'Kutia nuk u ruajt dot.');
    } finally {
      setActionLoading(false);
    }
  };

  const totalBoxes = state?.boxes_count ?? session?.boxes_count ?? 0;

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity style={s.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerSub}>Shorti ne kohe reale</Text>
            <Text style={s.headerTitle}>Live Raffle</Text>
          </View>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => load(true)} activeOpacity={0.8}>
          <RefreshCw size={16} color={Colors.textPrimary} strokeWidth={2.2} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.centered}>
          <ActivityIndicator size="large" color={Colors.brandGreenDark} />
        </View>
      ) : error ? (
        <View style={s.stateWrap}>
          <ScreenState icon="error" message={error} actionLabel="Provo perseri" onAction={() => load()} compact />
        </View>
      ) : !session ? (
        <View style={s.stateWrap}>
          <ScreenState icon="empty" message="Nuk ka nje short live aktiv per momentin." actionLabel="Rifresko" onAction={() => load()} compact />
        </View>
      ) : (
        <ScrollView
          style={s.scroll}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
          contentContainerStyle={{ paddingBottom: bottomInset + 26 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.pad}>
            <LinearGradient colors={heroTone.colors} style={s.hero}>
              <Animated.View style={[s.heroPulse, { transform: [{ scale: pulseScale }], opacity: session.status === 'finished' ? 0.18 : 0.34 }]} />

              <View style={s.heroTop}>
                <View style={[s.statusBadge, { borderColor: heroTone.accent }]}>
                  <CircleDot size={12} color={heroTone.accent} />
                  <Text style={[s.statusBadgeText, { color: heroTone.accent }]}>{heroTone.label}</Text>
                </View>
                <View style={s.liveMetaPill}>
                  <Clock3 size={13} color="#dbeafe" />
                  <Text style={s.liveMetaText}>{phaseInfo.label}</Text>
                </View>
              </View>

              <Text style={s.heroTitle}>{session.raffle_title}</Text>
              <Text style={s.heroDesc}>
                {session.raffle_excerpt || 'Bashkohu ne short, zgjidh kutine tende dhe ndiq rezultatin live.'}
              </Text>

              <View style={s.heroCounter}>
                {session.status === 'finished' && state?.winning_box ? (
                  <>
                    <Text style={s.heroCounterValue}>#{state.winning_box}</Text>
                    <Text style={s.heroCounterLabel}>Kutia fituese e shortit</Text>
                  </>
                ) : phaseCounter !== '00:00' ? (
                  <>
                    <Text style={s.heroCounterValue}>{phaseCounter}</Text>
                    <Text style={s.heroCounterLabel}>{phaseInfo.helper}</Text>
                  </>
                ) : null}
              </View>

              <View style={s.heroStats}>
                <StatPill icon={<Users size={15} color="#38bdf8" />} value={String(state?.players_active ?? 0)} label="Aktive" />
                <StatPill icon={<DoorOpen size={15} color="#facc15" />} value={String(state?.picked_count ?? 0)} label="Pick-e" />
                <StatPill icon={<Trophy size={15} color="#f59e0b" />} value={state?.winning_box ? `#${state.winning_box}` : '-'} label="Kutia fituese" />
              </View>
            </LinearGradient>
          </View>

          {isWinner ? (
            <View style={s.pad}>
              <LinearGradient colors={['#78350f', '#f59e0b']} style={s.winnerCard}>
                <Star size={34} color="#fef9c3" fill="#fef9c3" />
                <Text style={s.winnerTitle}>Urime! Je Fitues!</Text>
                <Text style={s.winnerSub}>
                  Kutia #{state?.winning_box ?? '?'} ishte fituese.{'\n'}Kontakto organizatorin per cmimin tend.
                </Text>
              </LinearGradient>
            </View>
          ) : null}

          <Section title="Statusi yt" meta={currentUser?.is_joined ? 'Sinkronizuar live' : 'Hyr ne loje'} />
          <View style={s.pad}>
            <View style={[s.card, isWinner && s.cardWinner, isEliminated && s.cardEliminated]}>
              <View style={s.cardHeader}>
                <View style={s.cardLead}>
                  <View style={[s.stateDot, isWinner ? s.dotWinner : isEliminated ? s.dotOut : s.dotLive]} />
                  <Text style={s.cardTitle}>
                    {isWinner
                      ? 'Je fitues i ketij live raffle.'
                      : isEliminated
                        ? 'Je eliminuar nga loja.'
                        : currentUser?.is_joined
                          ? currentUser.pick_submitted
                            ? `Kutia jote per kete raund: #${currentUser.picked_box}`
                            : 'Je ne loje. Zgjidh nje kuti kur raundi te jete live.'
                          : 'Bashkohu ne short qe te marresh pjese ne raundin aktual.'}
                  </Text>
                </View>
                <View style={s.statePill}>
                  <Text style={s.statePillText}>
                    {currentUser?.is_joined
                      ? currentUser.is_active
                        ? 'Aktiv'
                        : labelElimination(currentUser.eliminated_reason)
                      : 'Jo ne loje'}
                  </Text>
                </View>
              </View>

              <Text style={s.cardSub}>
                {phaseInfo.secondary}
              </Text>

              {!currentUser?.is_joined ? (
                <TouchableOpacity style={s.primaryBtn} disabled={!canJoin || actionLoading} onPress={handleJoin} activeOpacity={0.88}>
                  {actionLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.primaryBtnText}>Join Live Raffle</Text>}
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          <Section
            title={['reveal', 'finished'].includes(session.status) ? 'Rezultati' : canPick ? 'Zgjidh kutine' : 'Kutite'}
            meta={`Raundi ${state?.round_no ?? session.current_round}`}
          />
          <View style={s.pad}>
            {canPick ? (
              <View style={s.pickCta}>
                <CircleDot size={14} color="#0ea5e9" />
                <Text style={s.pickCtaText}>Prek nje kuti per te bere zgjedhjen tende!</Text>
              </View>
            ) : null}
            <View style={s.progressCard}>
              <View style={s.progressHead}>
                <Text style={s.progressTitle}>Readiness</Text>
                <Text style={s.progressValue}>
                  {(state?.picked_count ?? 0)}/{Math.max(1, state?.players_active ?? 0)}
                </Text>
              </View>
              <View style={s.track}>
                <View
                  style={[
                    s.fill,
                    {
                      width: `${Math.min(100, Math.round(((state?.picked_count ?? 0) / Math.max(1, state?.players_active ?? 1)) * 100))}%`,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={s.boxGrid}>
              {Array.from({ length: totalBoxes }, (_, index) => {
                const boxNumber = index + 1;
                const isPicked = currentUser?.picked_box === boxNumber;
                const isWinning = state?.winning_box === boxNumber;

                return (
                  <TouchableOpacity
                    key={boxNumber}
                    style={[
                      s.boxWrap,
                      isPicked && s.boxWrapPicked,
                      isWinning && s.boxWrapWinning,
                      !canPick && !isWinning && !isPicked && s.boxWrapMuted,
                    ]}
                    disabled={!canPick || actionLoading}
                    activeOpacity={0.9}
                    onPress={() => handlePick(boxNumber)}
                  >
                    <LinearGradient
                      colors={
                        isWinning
                          ? ['#fef3c7', '#f59e0b']
                          : isPicked
                            ? ['#dbeafe', '#3b82f6']
                            : canPick
                              ? ['#f0fdf4', '#dcfce7']
                              : ['#f8fafc', '#e2e8f0']
                      }
                      style={s.box}
                    >
                      {isWinning ? (
                        <Star size={20} color="#78350f" fill="#f59e0b" style={{ marginBottom: 4 }} />
                      ) : null}
                      <Text style={[s.boxNum, isWinning && s.boxNumWinning, isPicked && s.boxNumPicked]}>{boxNumber}</Text>
                      <Text style={[s.boxLabel, isWinning && s.boxNumWinning, isPicked && s.boxLabelPicked]}>
                        {isWinning ? 'Fitues' : isPicked ? 'Tani' : canPick ? 'Tap' : '—'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Section title="Loja tani" meta={`Server ${formatDateTime(state?.server_time)}`} />
          <View style={s.pad}>
            <View style={s.infoCard}>
              <InfoRow label="Statusi" value={heroTone.label} />
              <InfoRow label="Pjesemarres" value={`${state?.players_total ?? 0}`} />
              <InfoRow label="Online" value={`${state?.players_online ?? 0}`} />
              <InfoRow label="Pa zgjedhje" value={`${state?.remaining_count ?? 0}`} />
              <InfoRow label="Kutite" value={`${state?.boxes_count ?? session.boxes_count}`} />
            </View>
          </View>

          <Section title="Eventet e fundit" meta={`${data.events.length} events`} />
          <View style={s.pad}>
            <View style={s.card}>
              {data.events.length ? data.events.map((item) => (
                <View key={item.id} style={s.eventRow}>
                  <View style={s.eventDotWrap}>
                    <Radio size={14} color="#38bdf8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.eventTitle}>{labelEvent(item)}</Text>
                    <Text style={s.eventTime}>{formatDateTime(item.created_at)}</Text>
                  </View>
                </View>
              )) : <Text style={s.emptyText}>Nuk ka evente ende.</Text>}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function Section({ title, meta }: { title: string; meta?: string }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {meta ? <Text style={s.sectionMeta}>{meta}</Text> : null}
    </View>
  );
}

function StatPill({ icon, value, label }: { icon: React.ReactNode; value: string; label: string }) {
  return (
    <View style={s.heroStat}>
      {icon}
      <Text style={s.heroStatValue}>{value}</Text>
      <Text style={s.heroStatLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.infoRow}>
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

function getPhaseInfo(session: LiveData['current']['session'], serverNowMs: number) {
  if (!session) {
    return { label: 'Pa sesion', helper: 'Ne pritje te shortit live', secondary: 'Rifresko per te pare kur hapet sesioni.', ms: 0 };
  }

  const startsAt = toMs(session.starts_at);
  const countdownAt = toMs(session.countdown_starts_at);
  const revealAt = toMs(session.reveal_at);

  switch (session.status) {
    case 'scheduled': {
      const nextMs = startsAt ? Math.max(0, startsAt - serverNowMs) : 0;
      return {
        label: 'Fillon pas',
        helper: startsAt ? 'Koha deri sa sesioni te hyje live' : 'Sesioni eshte planifikuar',
        secondary: startsAt ? `Nisja e planifikuar: ${formatDateTime(session.starts_at)}` : 'Sesioni pret nisjen nga admin.',
        ms: nextMs,
      };
    }
    case 'countdown': {
      const nextMs = startsAt ? Math.max(0, startsAt - serverNowMs) : 0;
      return {
        label: 'Live pas',
        helper: 'Numrimi mbrapsht drejt raundit aktiv',
        secondary: countdownAt ? `Countdown u hap ne ${formatDateTime(session.countdown_starts_at)}` : 'Countdown aktiv.',
        ms: nextMs,
      };
    }
    case 'live':
      return {
        label: 'Raundi live',
        helper: 'Koha e lojes ecen lokalisht pa pritur request-in tjeter',
        secondary: startsAt ? `Loja hyri live ne ${formatDateTime(session.starts_at)}` : 'Loja eshte live.',
        ms: startsAt ? Math.max(0, serverNowMs - startsAt) : 0,
      };
    case 'reveal':
      return {
        label: 'Reveal aktiv',
        helper: 'Rezultati po shfaqet tani',
        secondary: revealAt ? `Reveal nisi ne ${formatDateTime(session.reveal_at)}` : 'Kutia fituese po shfaqet.',
        ms: revealAt ? Math.max(0, serverNowMs - revealAt) : 0,
      };
    case 'finished':
      return {
        label: 'Sesion i mbyllur',
        helper: 'Rezultati final u ruajt',
        secondary: session.finished_at ? `Mbyllur ne ${formatDateTime(session.finished_at)}` : 'Shorti perfundoi.',
        ms: 0,
      };
    default:
      return {
        label: session.status,
        helper: 'Status i sesionit live',
        secondary: 'Gjendja e sesionit eshte sinkronizuar nga serveri.',
        ms: 0,
      };
  }
}

function toMs(value?: string | null) {
  if (!value) return 0;
  const date = new Date(value.replace(' ', 'T')).getTime();
  return Number.isNaN(date) ? 0 : date;
}

function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  return `${pad(minutes)}:${pad(seconds)}`;
}

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value.replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('sq-AL', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function labelElimination(reason?: string) {
  switch (reason) {
    case 'timeout':
      return 'Timeout';
    case 'wrong_pick':
      return 'Kuti jo fituese';
    default:
      return 'Jashte lojes';
  }
}

function labelEvent(item: LiveRaffleEventApiItem) {
  const round = typeof item.payload?.round_no === 'number' ? ` · Raundi ${item.payload.round_no}` : '';
  const box = typeof item.payload?.winning_box === 'number' ? ` · Kutia #${item.payload.winning_box}` : '';
  const name = typeof item.payload?.display_name === 'string' ? ` · ${item.payload.display_name}` : '';

  switch (item.event_type) {
    case 'scheduled':
      return 'Sesioni live u krijua';
    case 'countdown_started':
      return 'Countdown u nis';
    case 'live_started':
      return 'Loja hyri live';
    case 'player_joined':
      return `Studenti u bashkua${name}`;
    case 'pick_received':
      return `U ruajt nje zgjedhje${round}${name}`;
    case 'reveal_started':
      return `Reveal u hap${round}${box}`;
    case 'round_finished':
      return `Raundi perfundoi${round}${box}`;
    case 'winner_declared':
      return `Fituesi u shpall${name}${box}`;
    case 'finished':
      return `Sesioni u mbyll${box}`;
    default:
      return item.event_type;
  }
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stateWrap: { flex: 1, paddingHorizontal: Spacing.xxl, justifyContent: 'center' },
  pad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.xxxl },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSub: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xxl,
    color: Colors.textPrimary,
  },
  hero: {
    borderRadius: Radius.xxl + 8,
    padding: Spacing.xl,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  heroPulse: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#ffffff',
  },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  statusBadgeText: { fontFamily: Typography.fontExtraBold, fontSize: Typography.sm, textTransform: 'uppercase', letterSpacing: 0.4 },
  liveMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  liveMetaText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#dbeafe' },
  heroTitle: { fontFamily: Typography.fontExtraBold, fontSize: 30, color: '#fff', lineHeight: 34, marginBottom: 8 },
  heroDesc: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: '#d6e4f3', lineHeight: 21 },
  heroCounter: { marginTop: Spacing.xl, marginBottom: Spacing.lg },
  heroCounterValue: { fontFamily: Typography.fontExtraBold, fontSize: 40, color: '#fff', lineHeight: 44, letterSpacing: 0.8 },
  heroCounterLabel: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#cbd5e1', marginTop: 4 },
  heroStats: { flexDirection: 'row', gap: 10 },
  heroStat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radius.xl,
    paddingVertical: 12,
    alignItems: 'center',
  },
  heroStatValue: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: '#fff', marginTop: 5 },
  heroStatLabel: { fontFamily: Typography.fontBold, fontSize: 9, color: '#cbd5e1', textTransform: 'uppercase', marginTop: 2, textAlign: 'center' },
  section: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', paddingHorizontal: Spacing.xxl, marginBottom: Spacing.md },
  sectionTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: Colors.textPrimary },
  sectionMeta: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#0ea5e9' },
  card: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xxl + 4,
    padding: Spacing.xl,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 8 },
  cardLead: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  stateDot: { width: 12, height: 12, borderRadius: 6, marginTop: 5 },
  dotLive: { backgroundColor: '#38bdf8' },
  dotOut: { backgroundColor: '#ef4444' },
  dotWinner: { backgroundColor: '#f59e0b' },
  statePill: { backgroundColor: '#eff6ff', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 6 },
  statePillText: { fontFamily: Typography.fontBold, fontSize: 10, color: '#0369a1', textTransform: 'uppercase' },
  cardTitle: { flex: 1, fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: Colors.textPrimary, lineHeight: 22 },
  cardSub: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 20 },
  primaryBtn: {
    marginTop: Spacing.lg,
    backgroundColor: '#0f172a',
    borderRadius: Radius.xl,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontFamily: Typography.fontBold, fontSize: Typography.lg, color: '#fff' },
  progressCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressTitle: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary },
  progressValue: { fontFamily: Typography.fontExtraBold, fontSize: Typography.base, color: '#0ea5e9' },
  track: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 999, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 999, backgroundColor: '#38bdf8' },
  boxGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  boxWrap: { width: '30%', minWidth: 94, aspectRatio: 1 },
  boxWrapPicked: { transform: [{ translateY: -2 }] },
  boxWrapWinning: { transform: [{ translateY: -4 }] },
  boxWrapMuted: { opacity: 0.94 },
  box: {
    flex: 1,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: '#dbe4f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxNum: { fontFamily: Typography.fontExtraBold, fontSize: 30, color: Colors.textPrimary, marginBottom: 4 },
  boxNumWinning: { color: '#78350f' },
  boxLabel: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textSecondary, textTransform: 'uppercase' },
  infoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  infoLabel: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textSecondary },
  infoValue: { fontFamily: Typography.fontExtraBold, fontSize: Typography.base, color: Colors.textPrimary },
  eventRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  eventDotWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventTitle: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 20 },
  eventTime: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textMuted, marginTop: 3 },
  emptyText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted, textAlign: 'center' },
  winnerCard: {
    borderRadius: Radius.xxl + 8,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: 10,
    shadowColor: '#92400e',
    shadowOpacity: 0.22,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  winnerTitle: { fontFamily: Typography.fontExtraBold, fontSize: 26, color: '#fef9c3', textAlign: 'center' },
  winnerSub: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#fde68a', textAlign: 'center', lineHeight: 22 },
  cardWinner: { borderColor: '#f59e0b', borderWidth: 2, backgroundColor: '#fffbeb' },
  cardEliminated: { borderColor: '#f87171', borderWidth: 2, backgroundColor: '#fff1f2' },
  pickCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eff6ff',
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  pickCtaText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#0369a1', flex: 1 },
  boxNumPicked: { color: '#1d4ed8' },
  boxLabelPicked: { color: '#2563eb' },
});
