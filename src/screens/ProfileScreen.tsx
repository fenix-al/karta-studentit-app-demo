import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, Alert, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import {
  Settings, ChevronLeft, Award, MessageSquare, Send,
  Briefcase, BookOpen, History, Rocket, Heart,
  CheckCircle, Clock, Gift, MapPin, QrCode,
  User, Lock, LogOut, ChevronRight, GraduationCap,
} from 'lucide-react-native';

import { BRANDING } from '../constants/branding';
import { Colors, Typography, Spacing, Radius } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import {
  fetchMyAct4History,
  fetchMyApplications,
  fetchMyCourses,
  fetchMyHistory,
  fetchMyLoyaltyRedemptions,
  fetchMyRaffles,
  fetchMySupportTickets,
  fetchMyStartupIdeas,
  markSupportTicketsRead,
  replySupportTicket,
} from '../services/api';
import {
  ProfileAct4HistoryApiItem,
  ProfileApplication,
  ProfileCourse,
  ProfileCourseApiItem,
  ProfileHistoryApiItem,
  ProfileLoyaltyRedemptionApiItem,
  ProfileRaffleEntryApiItem,
  ProfileStartupIdeaApiItem,
  ScanHistoryEntry,
  SupportTicketApiItem,
} from '../types';
import ScreenState from '../components/ScreenState';

interface Props {
  bottomInset:  number;
  onBack?:      () => void;
  onSettings?:  () => void;
  onOpenApplication?: (jobId: string) => void;
  onOpenCourse?: (courseId: string) => void;
  onOpenStartupIdea?: () => void;
  onOpenAct4History?: (activityId: string) => void;
  onOpenRaffleEntry?: (raffleId: number) => void;
  onOpenLoyaltyRedemption?: (businessPostId: number, rewardUid: string) => void;
}

type ActivityTab =
  | 'mesazhet'
  | 'aplikimet'
  | 'kurset'
  | 'historiku'
  | 'startup'
  | 'act4'
  | 'raffles'
  | 'loyalty';

type BadgeTone = 'green' | 'amber' | 'red' | 'slate' | 'sky';

export default function ProfileScreen({
  bottomInset,
  onBack,
  onSettings,
  onOpenApplication,
  onOpenCourse,
  onOpenStartupIdea,
  onOpenAct4History,
  onOpenRaffleEntry,
  onOpenLoyaltyRedemption,
}: Props) {
  const insets = useSafeAreaInsets();
  const { card, onLogout } = useAuth();

  const [activeTab, setActiveTab] = useState<ActivityTab>('aplikimet');
  const [ticketReplies, setTicketReplies] = useState<Record<number, string>>({});
  const [submittingTicketId, setSubmittingTicketId] = useState<number | null>(null);
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  // ── 3D flip card animation ───────────────────────────────────────────────────
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [cardFlipped, setCardFlipped] = useState(false);

  const handleFlipCard = () => {
    Animated.spring(flipAnim, {
      toValue: cardFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
    setCardFlipped(prev => !prev);
  };

  const frontRotateY = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotateY  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  // Opacity hides the wrong face on Android (backfaceVisibility: hidden is unreliable)
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [1, 1, 0, 0] });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0, 0.49, 0.5, 1], outputRange: [0, 0, 1, 1] });

  const {
    data: supportTicketsData,
    loading: supportTicketsLoading,
    error: supportTicketsError,
    reload: reloadSupportTickets,
  } = useFetch(() => fetchMySupportTickets());

  const {
    data: applicationsData,
    loading: applicationsLoading,
    error: applicationsError,
  } = useFetch(() => fetchMyApplications());

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError,
  } = useFetch(() => fetchMyHistory());

  const {
    data: coursesData,
    loading: coursesLoading,
    error: coursesError,
  } = useFetch(() => fetchMyCourses());

  const {
    data: startupIdeasData,
    loading: startupIdeasLoading,
    error: startupIdeasError,
  } = useFetch(() => fetchMyStartupIdeas());

  const {
    data: act4HistoryData,
    loading: act4HistoryLoading,
    error: act4HistoryError,
  } = useFetch(() => fetchMyAct4History());

  const {
    data: rafflesData,
    loading: rafflesLoading,
    error: rafflesError,
  } = useFetch(() => fetchMyRaffles());

  const {
    data: loyaltyRedemptionsData,
    loading: loyaltyRedemptionsLoading,
    error: loyaltyRedemptionsError,
  } = useFetch(() => fetchMyLoyaltyRedemptions());

  const supportTickets = useMemo(
    () => (supportTicketsData ?? []).map((item: SupportTicketApiItem) => {
      const messages = (item.messages ?? []).map((msg) => ({
        id: msg.id,
        senderType: msg.sender_type,
        senderName: msg.sender_name,
        message: msg.message,
        attachmentUrl: msg.attachment_url,
        createdAt: formatDate(msg.created_at),
      }));
      const lastMessage = messages[messages.length - 1];

      return {
        id: item.id,
        categoryLabel: item.category_label,
        subject: item.subject,
        message: item.message,
        status: item.status_label,
        statusRaw: item.status,
        reply: item.admin_reply,
        attachmentUrl: item.attachment_url,
        createdAt: formatDate(item.created_at),
        replyAt: item.admin_reply_at ? formatDate(item.admin_reply_at) : null,
        unreadCount: item.unread_count ?? 0,
        hasUnread: Boolean(item.has_unread),
        hasStaffReply: (item.messages ?? []).some((msg) => msg.sender_type === 'staff'),
        preview: (lastMessage?.message || item.message || '').trim(),
        messages,
      };
    }),
    [supportTicketsData],
  );

  const supportUnreadCount = useMemo(
    () => supportTickets.reduce((sum, ticket) => sum + (ticket.unreadCount || 0), 0),
    [supportTickets],
  );

  const applications = useMemo<ProfileApplication[]>(
    () => (applicationsData ?? []).map((app) => ({
      id: app.job_id,
      title: app.title,
      company: app.company || 'Organizatë / Kompani',
      date: formatDate(app.date),
      status: mapApplicationStatusLabel(app.status),
      type: mapApplicationType(app.status),
    })),
    [applicationsData],
  );

  const history = useMemo<ScanHistoryEntry[]>(
    () => (historyData ?? []).map((item: ProfileHistoryApiItem, index) => ({
      id: index + 1,
      action: 'Karta u verifikua me sukses',
      place: item.business,
      date: formatDate(item.date),
      icon: item.logo ? '🏪' : '✅',
    })),
    [historyData],
  );

  const courses = useMemo<ProfileCourse[]>(
    () => (coursesData ?? []).map((course: ProfileCourseApiItem) => ({
      id: course.course_id,
      title: course.title,
      location: course.location || 'Shkodër',
      date: formatDate(course.start_date || course.date),
      session: course.session,
      status: mapCourseStatusLabel(course.status),
      type: mapCourseType(course.status),
    })),
    [coursesData],
  );

  const startupIdeas = useMemo(
    () => (startupIdeasData ?? []).map((idea: ProfileStartupIdeaApiItem) => ({
      id: idea.idea_id,
      title: idea.title,
      helpNeeded: idea.help_needed || 'Ide startup',
      description: idea.description,
      date: formatDate(idea.created_at),
      status: mapStartupStatusLabel(idea.status),
      tone: mapStartupStatusTone(idea.status) as BadgeTone,
    })),
    [startupIdeasData],
  );

  const act4History = useMemo(
    () => (act4HistoryData ?? []).map((item: ProfileAct4HistoryApiItem) => ({
      id: item.id,
      activityId: item.activity_id,
      title: item.title,
      date: formatDate(item.date),
      status: item.status === 'attended' ? 'Pjesëmarrëse' : 'E regjistruar',
      tone: (item.status === 'attended' ? 'green' : 'sky') as BadgeTone,
    })),
    [act4HistoryData],
  );

  const raffleEntries = useMemo(
    () => (rafflesData ?? []).map((entry: ProfileRaffleEntryApiItem) => ({
      id: entry.entry_id,
      raffleId: entry.raffle_id,
      title: entry.title,
      date: formatDate(entry.entry_date),
      cost: entry.points_cost,
      status: entry.status === 'closed' ? 'I mbyllur' : 'Aktiv',
      tone: (entry.status === 'closed' ? 'slate' : 'amber') as BadgeTone,
    })),
    [rafflesData],
  );

  const loyaltyRedemptions = useMemo(
    () => (loyaltyRedemptionsData ?? []).map((item: ProfileLoyaltyRedemptionApiItem) => ({
      id: item.redemption_id,
      businessPostId: item.business_post_id,
      rewardUid: item.reward_uid,
      business: item.business_name,
      reward: item.reward_title,
      date: formatDate(item.redeemed_at),
    })),
    [loyaltyRedemptionsData],
  );

  const scanCount = card?.total_scans ?? history.length;
  const pointsCount = card?.points ?? 0;
  const qrHash  = card?.student_hash ?? card?.qr_token ?? '';
  const qrValue = qrHash ? `https://kartaestudentitshkoder.al/karta/${qrHash}` : '';
  const volunteerActivities = card?.act4_activities_count ?? 0;

  const handleSupportReply = async (ticketId: number) => {
    const message = (ticketReplies[ticketId] || '').trim();
    if (!message) {
      Alert.alert('Kujdes', 'Shkruaj një mesazh para se ta dërgosh.');
      return;
    }

    setSubmittingTicketId(ticketId);
    try {
      const res = await replySupportTicket(ticketId, { message });
      setTicketReplies((prev) => ({ ...prev, [ticketId]: '' }));
      await reloadSupportTickets();
      Alert.alert('U krye', res.msg || 'Mesazhi u dërgua me sukses.');
    } catch (err: any) {
      Alert.alert('Gabim', err?.message ?? 'Nuk mund të dërgohet mesazhi për momentin.');
    } finally {
      setSubmittingTicketId(null);
    }
  };

  useEffect(() => {
    if (activeTab !== 'mesazhet' || supportUnreadCount <= 0) return;

    let cancelled = false;

    (async () => {
      try {
        await markSupportTicketsRead();
        if (!cancelled) {
          await reloadSupportTickets();
        }
      } catch {
        // no-op
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeTab, supportUnreadCount, reloadSupportTickets]);

  return (
    <View style={s.root}>
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity style={s.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={s.headerSub}>Llogaria Ime</Text>
            <Text style={s.headerTitle}>Profili</Text>
          </View>
        </View>
        <TouchableOpacity style={s.iconBtn} activeOpacity={0.75} onPress={onSettings}>
          <Settings size={20} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.xxl, paddingBottom: bottomInset + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* ══ FROST EDITION — 3D FLIP CARD ══════════════════════════════════ */}
        <TouchableOpacity style={s.cardWrapper} onPress={handleFlipCard} activeOpacity={1}>

          {/* ════ FRONT FACE ════════════════════════════════════════════════════ */}
          <Animated.View style={[s.cardFace, { opacity: frontOpacity, transform: [{ rotateY: frontRotateY }] }]}>

            {/* Soft pastel orbs — rendered FIRST so BlurView frosts them */}
            <View style={s.frostOrbA} />
            <View style={s.frostOrbB} />

            {/* Frost layer — blurs the app background + orbs behind the card */}
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />

            {/* Dark navy header gradient (absolute, behind content) */}
            <LinearGradient
              colors={['#041c48', '#0c2d6b']}
              start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
              style={s.cardHeaderGrad}
            />
            {/* Red accent strip */}
            <LinearGradient
              colors={['#e30613', '#ff4757']}
              start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
              style={s.cardAccentBand}
            />

            {/* ── Card content ── */}
            <View style={s.cardContent}>

              {/* ROW 1 — Logos (inside the 76px header zone) */}
              <View style={s.cardTopRow}>
                <View style={s.brandLeft}>
                  <Image source={BRANDING.assets.kessNegativeWhite} style={s.kessLogo} resizeMode="contain" />
                </View>
                <View style={s.brandRight}>
                  <Image source={BRANDING.assets.bashkiaHorizontalWhite} style={s.bashkiaLogo} resizeMode="contain" />
                </View>
              </View>

              {/* ROW 2 — Student info + photo */}
              <View style={s.studentRow}>
                <View style={s.studentInfo}>
                  <Text style={s.studentLabel}>Studenti</Text>
                  <Text style={s.studentName} numberOfLines={1}>
                    {card?.emeri ?? '-'}
                    {card ? <Text style={s.studentSurname}>{' ' + card.mbiemeri}</Text> : null}
                  </Text>
                  <View style={s.idChip}>
                    <GraduationCap size={12} color="#94a3b8" strokeWidth={2.2} />
                    <Text style={s.idChipText}>{card?.nr_karte ?? card?.nim ?? '-'}</Text>
                  </View>
                </View>

                {/* Photo: real image or light initials placeholder */}
                <View style={s.photoFrame}>
                  {card?.foto_url ? (
                    <Image source={{ uri: card.foto_url }} style={s.photo} />
                  ) : (
                    <View style={s.photoPlaceholder}>
                      <Text style={s.photoInitials}>
                        {card ? `${card.emeri[0]}${card.mbiemeri[0]}` : '?'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* ROW 3 — Skadon / Viti Akademik / Statusi */}
              <View style={s.bottomBar}>
                <View>
                  <Text style={s.barLabel}>Skadon</Text>
                  <Text style={s.barValue}>{card?.valid_until ? formatDate(card.valid_until) : '-'}</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={s.barLabel}>Viti Akademik</Text>
                  <Text style={s.barValue}>{card?.cikli ?? '-'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={s.barLabel}>Statusi</Text>
                  <View style={[
                    s.statusBadge,
                    card?.statusi === 'active' ? s.statusActive
                      : card?.statusi === 'pending' ? s.statusPending
                      : s.statusInactive,
                  ]}>
                    {card?.statusi === 'active' && <View style={s.statusDot} />}
                    <Text style={[
                      s.statusText,
                      card?.statusi === 'active' ? s.statusTextActive
                        : card?.statusi === 'pending' ? s.statusTextPending
                        : s.statusTextInactive,
                    ]}>
                      {card?.statusi === 'active' ? 'AKTIVE'
                        : card?.statusi === 'pending' ? 'NË PRITJE'
                        : 'JO AKTIVE'}
                    </Text>
                  </View>
                </View>
              </View>

            </View>
          </Animated.View>

          {/* ════ BACK FACE — absoluteFill inherits the front-face height ══════ */}
          <Animated.View style={[StyleSheet.absoluteFill, s.cardFaceBack, { opacity: backOpacity, transform: [{ rotateY: backRotateY }] }]}>

            {/* Soft orb for depth */}
            <View style={s.frostOrbA} />
            {/* Frost layer */}
            <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
            {/* Bottom tri-color accent */}
            <LinearGradient
              colors={['#041c48', '#e30613', '#041c48']}
              start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
              style={s.cardBottomAccent}
            />

            <View style={s.cardContentBack}>
              {/* Header */}
              <View style={{ alignItems: 'center' }}>
                <Text style={s.backHeaderText}>Universiteti "Luigj Gurakuqi" — Shkodër</Text>
                <View style={s.backDivider} />
              </View>

              {/* Data + QR */}
              <View style={s.backRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={s.backBarLabel}>Fakulteti</Text>
                    <Text style={s.backBarValue}>{card?.fakulteti ?? '-'}</Text>
                  </View>
                  <View style={{ marginBottom: 10 }}>
                    <Text style={s.backBarLabel}>Dega / Programi</Text>
                    <Text style={s.backBarValue} numberOfLines={1}>{card?.programi ?? '-'}</Text>
                  </View>
                  <View>
                    <Text style={s.backBarLabel}>Nr. Matrikullimi</Text>
                    <Text style={s.backBarValue}>{card?.nr_karte ?? card?.nim ?? '-'}</Text>
                  </View>
                </View>
                <View style={s.qrWrap}>
                  {qrValue ? (
                    <QRCode value={qrValue} size={76} color="#0f172a" backgroundColor="#ffffff" />
                  ) : (
                    <ActivityIndicator size="small" color="#0f172a" />
                  )}
                  <Text style={s.qrLabel}>SKANO PËR{'\n'}VERIFIKIM</Text>
                </View>
              </View>

              <Text style={s.backFooter}>
                Kjo kartë është dokument identifikimi digjital i lëshuar nga Bashkia Shkodër.
              </Text>
            </View>
          </Animated.View>

        </TouchableOpacity>

        <View style={s.flipHint}>
          <Text style={s.flipHintText}>Kliko kartën për ta kthyer</Text>
        </View>

        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <View style={s.statTop}>
              <View style={s.statIconBadgeAmber}>
                <Gift size={13} color="#f59e0b" strokeWidth={2} />
              </View>
              <Text style={s.statLabelAmber}>Pikë</Text>
            </View>
            <Text style={s.statBig}>{pointsCount}</Text>
          </View>

          <View style={s.statCard}>
            <View style={s.statTop}>
              <View style={s.statIconBadgeSky}>
                <QrCode size={13} color="#0ea5e9" strokeWidth={2} />
              </View>
              <Text style={s.statLabelSky}>Skanime</Text>
            </View>
            <Text style={s.statBig}>{scanCount}</Text>
          </View>

          <View style={s.statCard}>
            <View style={s.statTop}>
              <View style={s.statIconBadgeEmerald}>
                <Heart size={13} color="#10b981" strokeWidth={2} />
              </View>
              <Text style={s.statLabelEmerald}>Vullnetar</Text>
            </View>
            <Text style={s.statBig}>{volunteerActivities}</Text>
          </View>
        </View>

        <Text style={s.sectionTitle}>Aktiviteti Im</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabPills}
          style={{ marginBottom: Spacing.lg }}
        >
          {[ 
            { key: 'mesazhet' as ActivityTab, label: 'Mesazhet', Icon: MessageSquare },
            { key: 'aplikimet' as ActivityTab, label: 'Aplikimet', Icon: Briefcase },
            { key: 'kurset' as ActivityTab, label: 'Kurset Rinore', Icon: BookOpen },
            { key: 'historiku' as ActivityTab, label: 'Skanimet', Icon: History },
            { key: 'startup' as ActivityTab, label: 'Startup Ideas', Icon: Rocket },
            { key: 'act4' as ActivityTab, label: 'ACT4', Icon: Heart },
            { key: 'raffles' as ActivityTab, label: 'Shortet', Icon: Gift },
            { key: 'loyalty' as ActivityTab, label: 'Shpërblimet', Icon: Award },
          ].map(({ key, label, Icon }) => (
            <TouchableOpacity
              key={key}
              style={[s.tabPill, activeTab === key && s.tabPillActive]}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.8}
            >
              <Icon size={13} color={activeTab === key ? '#fff' : Colors.textMuted} strokeWidth={2} />
              <Text style={[s.tabPillText, activeTab === key && s.tabPillTextActive]}>{label}</Text>
              {key === 'mesazhet' && supportUnreadCount > 0 ? (
                <View style={[s.unreadBadge, activeTab === key && s.unreadBadgeActive]}>
                  <Text style={[s.unreadBadgeText, activeTab === key && s.unreadBadgeTextActive]}>
                    {supportUnreadCount > 99 ? '99+' : supportUnreadCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === 'mesazhet' && (
          <TabState
            loading={supportTicketsLoading}
            error={supportTicketsError}
            empty={supportTickets.length === 0}
            emptyText="Nuk ka mesazhe supporti për momentin."
          >
            {supportTickets.map((ticket) => (
              <View key={ticket.id} style={s.listCardColumn}>
                <TouchableOpacity
                  style={s.listCardHeader}
                  activeOpacity={0.82}
                  onPress={() => setExpandedTicketId((prev) => (prev === ticket.id ? null : ticket.id))}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.listTitle}>{ticket.subject}</Text>
                    <Text style={s.listSubText}>{ticket.categoryLabel} | {ticket.createdAt}</Text>
                    {ticket.preview ? (
                      <Text style={s.ticketPreviewText} numberOfLines={1}>
                        {ticket.preview}
                      </Text>
                    ) : null}
                  </View>
                  <View
                    style={[
                      s.badge,
                      ticket.statusRaw === 'closed'
                        ? s.badgeSlate
                        : ticket.statusRaw === 'in_progress'
                          ? s.badgeAmber
                          : s.badgeSky,
                    ]}
                  >
                    <Text
                      style={[
                        s.badgeText,
                        ticket.statusRaw === 'closed'
                          ? { color: '#475569' }
                          : ticket.statusRaw === 'in_progress'
                            ? { color: '#92400e' }
                            : { color: '#0369a1' },
                      ]}
                    >
                      {ticket.status}
                    </Text>
                  </View>
                  {ticket.hasUnread ? (
                    <View style={s.ticketUnreadDot}>
                      <Text style={s.ticketUnreadDotText}>{ticket.unreadCount}</Text>
                    </View>
                  ) : null}
                  <View style={s.ticketChevronWrap}>
                    <ChevronRight
                      size={16}
                      color={Colors.textMuted}
                      strokeWidth={2.4}
                      style={{
                        transform: [{ rotate: expandedTicketId === ticket.id ? '90deg' : '0deg' }],
                      }}
                    />
                  </View>
                </TouchableOpacity>

                {expandedTicketId === ticket.id ? (
                  <>
                    <View style={s.threadList}>
                      {ticket.messages.map((messageItem) => (
                        <View
                          key={`${ticket.id}-${messageItem.id}-${messageItem.createdAt}`}
                          style={[
                            s.threadBubble,
                            messageItem.senderType === 'staff' ? s.threadBubbleStaff : s.threadBubbleStudent,
                          ]}
                        >
                          <Text
                            style={[
                              s.threadSender,
                              messageItem.senderType === 'staff' ? s.threadSenderStaff : s.threadSenderStudent,
                            ]}
                          >
                            {messageItem.senderName}
                          </Text>
                          {messageItem.message ? <Text style={s.threadText}>{messageItem.message}</Text> : null}
                          {messageItem.attachmentUrl ? (
                            <Image source={{ uri: messageItem.attachmentUrl }} style={s.supportImage} />
                          ) : null}
                          <Text style={s.replyDate}>{messageItem.createdAt}</Text>
                        </View>
                      ))}
                    </View>

                    {!ticket.hasStaffReply ? (
                      <View style={s.replyPending}>
                        <Clock size={13} color="#92400e" strokeWidth={2} />
                        <Text style={s.replyPendingText}>Në pritje të përgjigjes së stafit.</Text>
                      </View>
                    ) : null}

                    <View style={s.replyComposer}>
                      <TextInput
                        style={s.replyInput}
                        value={ticketReplies[ticket.id] || ''}
                        onChangeText={(value) => setTicketReplies((prev) => ({ ...prev, [ticket.id]: value }))}
                        placeholder="Shkruaj një përgjigje..."
                        placeholderTextColor={Colors.textMuted}
                        multiline
                        textAlignVertical="top"
                      />
                      <TouchableOpacity
                        style={[
                          s.replySendBtn,
                          (!(ticketReplies[ticket.id] || '').trim() || submittingTicketId === ticket.id) && s.replySendBtnDisabled,
                        ]}
                        activeOpacity={0.88}
                        onPress={() => handleSupportReply(ticket.id)}
                        disabled={!(ticketReplies[ticket.id] || '').trim() || submittingTicketId === ticket.id}
                      >
                        {submittingTicketId === ticket.id ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Send size={14} color="#fff" strokeWidth={2} />
                            <Text style={s.replySendText}>Dërgo</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </View>
            ))}
          </TabState>
        )}

        {activeTab === 'aplikimet' && (
          <TabState
            loading={applicationsLoading}
            error={applicationsError}
            empty={applications.length === 0}
            emptyText="Nuk ka aplikime të ruajtura për momentin."
          >
            {applications.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={s.listCard}
                activeOpacity={0.85}
                onPress={() => onOpenApplication?.(String(app.id))}
                disabled={!onOpenApplication}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.listTitle}>{app.title}</Text>
                  <View style={s.listMeta}>
                    <Briefcase size={10} color={Colors.textMuted} strokeWidth={2} />
                    <Text style={s.listMetaText}>{app.company}</Text>
                    <Clock size={10} color={Colors.textMuted} strokeWidth={2} />
                    <Text style={s.listMetaText}>{app.date}</Text>
                  </View>
                </View>
                <View
                  style={[
                    s.badge,
                    app.type === 'accepted' ? s.badgeGreen :
                    app.type === 'pending' ? s.badgeAmber : s.badgeRed,
                  ]}
                >
                  {app.type === 'accepted' && <CheckCircle size={9} color="#059669" strokeWidth={2.5} />}
                  {app.type === 'pending' && <Clock size={9} color="#92400e" strokeWidth={2.5} />}
                  <Text
                    style={[
                      s.badgeText,
                      app.type === 'accepted' ? { color: '#059669' } :
                      app.type === 'pending' ? { color: '#92400e' } : { color: '#be123c' },
                    ]}
                  >
                    {app.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </TabState>
        )}

        {activeTab === 'kurset' && (
          <TabState
            loading={coursesLoading}
            error={coursesError}
            empty={courses.length === 0}
            emptyText="Nuk ka kurse të regjistruara për momentin."
          >
            {courses.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={s.listCard}
                activeOpacity={0.85}
                onPress={() => onOpenCourse?.(String(c.id))}
                disabled={!onOpenCourse}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.listTitle}>{c.title}</Text>
                  <View style={s.listMeta}>
                    <MapPin size={10} color={Colors.textMuted} strokeWidth={2} />
                    <Text style={s.listMetaText}>{c.location}</Text>
                    <Text style={s.listMetaText}>Seanca: {c.session}</Text>
                    <Clock size={10} color={Colors.textMuted} strokeWidth={2} />
                    <Text style={s.listMetaText}>{c.date}</Text>
                  </View>
                </View>
                <View style={[s.badge, c.type === 'done' ? s.badgeSlate : s.badgeSky]}>
                  <Text style={[s.badgeText, c.type === 'done' ? { color: '#475569' } : { color: '#0369a1' }]}>
                    {c.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </TabState>
        )}

        {activeTab === 'historiku' && (
          <TabState
            loading={historyLoading}
            error={historyError}
            empty={history.length === 0}
            emptyText="Nuk ka histori skanimesh për momentin."
          >
            {history.map((h) => (
              <View key={h.id} style={[s.listCard, { gap: Spacing.lg }]}>
                <View style={s.histIcon}>
                  <Text style={{ fontSize: 18 }}>{h.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.listTitle}>{h.place}</Text>
                  <Text style={s.listMetaText}>{h.action}</Text>
                </View>
                <Text style={s.histDate}>{h.date}</Text>
              </View>
            ))}
          </TabState>
        )}

        {activeTab === 'startup' && (
          <TabState
            loading={startupIdeasLoading}
            error={startupIdeasError}
            empty={startupIdeas.length === 0}
            emptyText="Nuk ka ide startup të ruajtura për momentin."
            emptyActionLabel="Shko te Startup"
            onEmptyAction={onOpenStartupIdea}
          >
            {startupIdeas.map((idea) => (
              <TouchableOpacity
                key={idea.id}
                style={s.listCardColumn}
                activeOpacity={0.85}
                onPress={() => onOpenStartupIdea?.()}
                disabled={!onOpenStartupIdea}
              >
                <View style={s.listCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.listTitle}>{idea.title}</Text>
                    <Text style={s.listSubText}>{idea.helpNeeded}</Text>
                  </View>
                  <View style={[s.badge, badgeToneStyle(idea.tone).container]}>
                    <Text style={[s.badgeText, badgeToneStyle(idea.tone).text]}>{idea.status}</Text>
                  </View>
                </View>
                <Text style={s.listBodyText} numberOfLines={3}>{idea.description}</Text>
                <Text style={s.histDateInline}>{idea.date}</Text>
              </TouchableOpacity>
            ))}
          </TabState>
        )}

        {activeTab === 'act4' && (
          <TabState
            loading={act4HistoryLoading}
            error={act4HistoryError}
            empty={act4History.length === 0}
            emptyText="Nuk ka histori ACT4 për momentin."
            emptyActionLabel="Kthehu në Home"
            onEmptyAction={onBack}
          >
            {act4History.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.listCard}
                activeOpacity={0.85}
                onPress={() => item.activityId > 0 && onOpenAct4History?.(String(item.activityId))}
                disabled={!onOpenAct4History || item.activityId <= 0}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.listTitle}>{item.title}</Text>
                  <Text style={s.listMetaText}>{item.date}</Text>
                </View>
                <View style={[s.badge, badgeToneStyle(item.tone).container]}>
                  <Text style={[s.badgeText, badgeToneStyle(item.tone).text]}>{item.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </TabState>
        )}

        {activeTab === 'raffles' && (
          <TabState
            loading={rafflesLoading}
            error={rafflesError}
            empty={raffleEntries.length === 0}
            emptyText="Nuk ka pjesëmarrje në shorte për momentin."
            emptyActionLabel="Kthehu në Home"
            onEmptyAction={onBack}
          >
            {raffleEntries.map((entry) => (
              <TouchableOpacity
                key={entry.id}
                style={s.listCard}
                activeOpacity={0.85}
                onPress={() => onOpenRaffleEntry?.(entry.raffleId)}
                disabled={!onOpenRaffleEntry}
              >
                <View style={{ flex: 1 }}>
                  <Text style={s.listTitle}>{entry.title}</Text>
                  <View style={s.listMeta}>
                    <Gift size={10} color={Colors.textMuted} strokeWidth={2} />
                    <Text style={s.listMetaText}>{entry.cost} pikë</Text>
                    <Clock size={10} color={Colors.textMuted} strokeWidth={2} />
                    <Text style={s.listMetaText}>{entry.date}</Text>
                  </View>
                </View>
                <View style={[s.badge, badgeToneStyle(entry.tone).container]}>
                  <Text style={[s.badgeText, badgeToneStyle(entry.tone).text]}>{entry.status}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </TabState>
        )}

        {activeTab === 'loyalty' && (
          <TabState
            loading={loyaltyRedemptionsLoading}
            error={loyaltyRedemptionsError}
            empty={loyaltyRedemptions.length === 0}
            emptyText="Nuk ka tërheqje shpërblimesh loyalty për momentin."
            emptyActionLabel="Kthehu në Home"
            onEmptyAction={onBack}
          >
            {loyaltyRedemptions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={s.listCardColumn}
                activeOpacity={0.85}
                onPress={() => onOpenLoyaltyRedemption?.(item.businessPostId, item.rewardUid)}
                disabled={!onOpenLoyaltyRedemption}
              >
                <View style={s.listCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={s.listTitle}>{item.reward}</Text>
                    <Text style={s.listSubText}>{item.business}</Text>
                  </View>
                  <View style={[s.badge, s.badgeGreen]}>
                    <Text style={[s.badgeText, { color: '#059669' }]}>Tërhequr</Text>
                  </View>
                </View>
                <Text style={s.histDateInline}>{item.date}</Text>
              </TouchableOpacity>
            ))}
          </TabState>
        )}

        <Text style={s.sectionTitle}>Llogaria</Text>

        <View style={s.accountCard}>
          <TouchableOpacity style={s.accountRow} activeOpacity={0.8} onPress={onSettings}>
            <View style={s.accountLeft}>
              <View style={s.accountIconBlue}>
                <User size={16} color="#3b82f6" strokeWidth={2} />
              </View>
              <Text style={s.accountText}>Të dhënat personale</Text>
            </View>
            <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity style={[s.accountRow, s.accountRowDivider]} activeOpacity={0.8} onPress={onSettings}>
            <View style={s.accountLeft}>
              <View style={s.accountIconAmber}>
                <Lock size={16} color="#f59e0b" strokeWidth={2} />
              </View>
              <Text style={s.accountText}>Siguria & Fjalëkalimi</Text>
            </View>
            <ChevronRight size={16} color="#cbd5e1" strokeWidth={2.5} />
          </TouchableOpacity>

          <TouchableOpacity style={s.accountRow} activeOpacity={0.8} onPress={onLogout}>
            <View style={s.accountLeft}>
              <View style={s.accountIconRose}>
                <LogOut size={16} color="#f43f5e" strokeWidth={2} />
              </View>
              <Text style={s.accountLogoutText}>Dil nga llogaria</Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={s.footerText}>Karta e Studentit {BRANDING.footerVersion}</Text>
      </ScrollView>

    </View>
  );
}

function TabState({
  loading,
  error,
  empty,
  emptyText,
  emptyActionLabel,
  onEmptyAction,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <ScreenState
        icon="empty"
        message="Duke ngarkuar..."
        loading
        compact
      />
    );
  }

  if (error) {
    return (
      <ScreenState
        icon="error"
        title="Gabim në ngarkim"
        message={error}
        compact
      />
    );
  }

  if (empty) {
    return (
      <ScreenState
        icon="empty"
        message={emptyText}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        compact
      />
    );
  }

  return <>{children}</>;
}

function mapApplicationType(status: string): 'accepted' | 'pending' | 'rejected' {
  const normalized = status.trim().toLowerCase();
  if (['accepted', 'approved', 'success', 'pranuar'].includes(normalized)) return 'accepted';
  if (['rejected', 'refused', 'declined', 'refuzuar'].includes(normalized)) return 'rejected';
  return 'pending';
}

function mapApplicationStatusLabel(status: string): string {
  const type = mapApplicationType(status);
  if (type === 'accepted') return 'Pranuar';
  if (type === 'rejected') return 'Refuzuar';
  return 'Në pritje';
}

function mapCourseType(status: string): 'done' | 'active' {
  const normalized = status.trim().toLowerCase();
  return normalized === 'completed' ? 'done' : 'active';
}

function mapCourseStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'completed') return 'Përfunduar';
  if (normalized === 'active') return 'Në zhvillim';
  return 'E regjistruar';
}

function mapStartupStatusTone(status: string): 'green' | 'amber' | 'slate' {
  const normalized = status.trim().toLowerCase();
  if (['kontaktuar', 'contacted', 'approved', 'accepted'].includes(normalized)) return 'green';
  if (['pending', 'ne pritje'].includes(normalized)) return 'amber';
  return 'slate';
}

function mapStartupStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (['kontaktuar', 'contacted'].includes(normalized)) return 'Kontaktuar';
  if (['approved', 'accepted'].includes(normalized)) return 'Pranuar';
  if (['rejected', 'refused', 'declined'].includes(normalized)) return 'Refuzuar';
  return 'Në pritje';
}

function badgeToneStyle(tone: BadgeTone) {
  switch (tone) {
    case 'green':
      return { container: s.badgeGreen, text: { color: '#059669' } };
    case 'amber':
      return { container: s.badgeAmber, text: { color: '#92400e' } };
    case 'red':
      return { container: s.badgeRed, text: { color: '#be123c' } };
    case 'sky':
      return { container: s.badgeSky, text: { color: '#0369a1' } };
    default:
      return { container: s.badgeSlate, text: { color: '#475569' } };
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}


const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f0f4f8' },
  scroll: { flex: 1 },
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
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 1,
  },
  headerTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary },
  // ══ FROST EDITION CARD — completely fresh styles ══════════════════════════════

  // Outer wrapper: gives drop shadow; height driven by front face content
  cardWrapper: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
    borderRadius: 24,
    shadowColor: '#0f172a',
    shadowOpacity: 0.12,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 16 },
    elevation: 10,
  },

  // FRONT FACE — white frosted glass; normal flow so it sizes to content
  cardFace: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.80)',
  },

  // BACK FACE — same glass; absolutely fills front-face bounds
  cardFaceBack: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.80)',
  },

  // Soft pastel orbs rendered BEFORE BlurView so the frost diffuses them
  frostOrbA: {
    position: 'absolute', top: -50, left: -50,
    width: 220, height: 220, borderRadius: 110,
    backgroundColor: 'rgba(129,140,248,0.22)',
  },
  frostOrbB: {
    position: 'absolute', bottom: -50, right: -50,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(244,114,182,0.18)',
  },

  // Absolute decorative bands (sit above BlurView, behind content)
  cardHeaderGrad: {
    position: 'absolute', left: 0, right: 0, top: 0, height: 76,
  },
  cardAccentBand: {
    position: 'absolute', left: 0, right: 0, top: 76, height: 4,
  },
  cardBottomAccent: {
    position: 'absolute', left: 0, right: 0, bottom: 0, height: 6,
  },

  // Card content padding
  cardContent: {
    padding: 20,
    flexDirection: 'column',
  },

  // ROW 1 — Logo row (76px tall, aligns with header gradient behind it)
  cardTopRow: {
    height: 76,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  brandLeft: { flexDirection: 'row', alignItems: 'center' },
  brandRight: { flexDirection: 'row', alignItems: 'center' },
  kessLogo: { width: 126, height: 42, transform: [{ translateY: -18 }] },
  bashkiaLogo: { width: 118, height: 38, transform: [{ translateY: -18 }] },

  // ROW 2 — Student info + photo
  studentRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', gap: 16, marginTop: 20,
  },
  studentInfo: { flex: 1 },
  studentLabel: {
    fontFamily: Typography.fontExtraBold, fontSize: 10,
    color: '#64748b', textTransform: 'uppercase',
    letterSpacing: 2.4, marginBottom: 4,
  },
  studentName: {
    fontFamily: Typography.fontExtraBold, fontSize: 26,
    color: '#1e293b', lineHeight: 28, marginBottom: 10, letterSpacing: -0.5,
  },
  studentSurname: { color: '#475569' },
  idChip: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.70)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.90)',
    borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6,
  },
  idChipText: { fontFamily: Typography.fontBold, fontSize: 11, color: '#334155' },
  photoFrame: {
    width: 78, height: 78, borderRadius: 20, overflow: 'hidden', flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderWidth: 3, borderColor: '#ffffff',
  },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#f1f5f9',
  },
  photoInitials: {
    fontFamily: Typography.fontExtraBold, fontSize: 24, color: '#94a3b8',
  },

  // ROW 3 — Bottom status bar
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderWidth: 1, borderColor: '#ffffff',
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12,
    marginTop: 16,
  },
  barLabel: {
    fontFamily: Typography.fontExtraBold, fontSize: 9,
    color: '#64748b', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 3,
  },
  barValue: {
    fontFamily: Typography.fontBold, fontSize: 13, color: '#0f172a',
  },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: Radius.full, borderWidth: 1,
  },
  statusActive:   { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' },
  statusPending:  { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  statusInactive: { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
  statusDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  statusText:     { fontFamily: Typography.fontExtraBold, fontSize: 10, letterSpacing: 0.8 },
  statusTextActive:   { color: '#059669' },
  statusTextPending:  { color: '#b45309' },
  statusTextInactive: { color: '#64748b' },

  // BACK FACE content wrapper
  cardContentBack: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    padding: 24, flexDirection: 'column', justifyContent: 'space-between',
  },
  backHeaderText: {
    fontFamily: Typography.fontBold, fontSize: 10,
    color: '#64748b', textTransform: 'uppercase',
    letterSpacing: 2.5, textAlign: 'center',
  },
  backDivider: {
    width: '100%', height: 1,
    backgroundColor: 'rgba(148,163,184,0.35)', marginTop: 8,
  },
  backRow: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8,
  },
  backBarLabel: {
    fontFamily: Typography.fontExtraBold, fontSize: 9,
    color: '#94a3b8', textTransform: 'uppercase',
    letterSpacing: 1.5, marginBottom: 3,
  },
  backBarValue: {
    fontFamily: Typography.fontBold, fontSize: 13, color: '#1e293b',
  },
  qrWrap: {
    alignItems: 'center', gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  qrLabel: {
    fontFamily: Typography.fontBold, fontSize: 7, color: '#94a3b8',
    letterSpacing: 1.5, textTransform: 'uppercase', textAlign: 'center',
  },
  backFooter: {
    fontFamily: Typography.fontMedium, fontSize: 8,
    color: '#94a3b8', textAlign: 'center', lineHeight: 12, paddingHorizontal: 4,
  },

  // Flip hint
  flipHint:     { alignItems: 'center', marginBottom: Spacing.lg },
  flipHintText: { fontFamily: Typography.fontMedium, fontSize: Typography.xs, color: Colors.textMuted },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: Spacing.xxxl,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    alignItems: 'center',
  },
  statTop: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statIconBadgeAmber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBadgeSky: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconBadgeEmerald: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabelAmber: {
    fontFamily: Typography.fontExtraBold, fontSize: 9,
    color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.8,
    textAlign: 'center',
  },
  statLabelSky: {
    fontFamily: Typography.fontExtraBold, fontSize: 9,
    color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: 0.8,
    textAlign: 'center',
  },
  statLabelEmerald: {
    fontFamily: Typography.fontExtraBold, fontSize: 9,
    color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.8,
    textAlign: 'center',
  },
  statBig: {
    fontFamily: Typography.fontExtraBold,
    fontSize: 22,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  supportComposerCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#dbeafe',
    marginBottom: 10,
    shadowColor: '#0ea5e9',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  supportComposerHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  supportComposerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0f2fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportComposerTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
  },
  supportComposerSub: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingVertical: 13,
    marginBottom: 10,
  },
  pickerBtnText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textPrimary, flex: 1 },
  textArea: {
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.border,
    borderRadius: Radius.lg, paddingHorizontal: Spacing.lg, paddingTop: 13, paddingBottom: 13,
    fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textPrimary,
    minHeight: 96, marginBottom: 12,
  },
  sendBtn: {
    backgroundColor: '#0f172a', borderRadius: Radius.lg, paddingVertical: 14,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 }, elevation: 3,
  },
  sendBtnText: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: '#fff' },
  sectionTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: Colors.textPrimary, marginBottom: Spacing.lg,
  },
  tabPills: { gap: 8, paddingBottom: 4 },
  tabPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.lg, paddingVertical: 10,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
  },
  tabPillActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  tabPillText: {
    fontFamily: Typography.fontBold, fontSize: Typography.sm,
    color: Colors.textMuted, whiteSpace: 'nowrap',
  } as any,
  tabPillTextActive: { color: '#fff' },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadgeActive: {
    backgroundColor: '#fff',
  },
  unreadBadgeText: {
    fontFamily: Typography.fontExtraBold,
    fontSize: 10,
    color: '#fff',
  },
  unreadBadgeTextActive: {
    color: '#0f172a',
  },
  listCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  listCardColumn: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  listCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  listTitle: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary, marginBottom: 4 },
  listSubText: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary },
  listBodyText: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textMuted, lineHeight: 20 },
  threadList: {
    gap: 10,
  },
  threadBubble: {
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
  },
  threadBubbleStudent: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  threadBubbleStaff: {
    backgroundColor: '#eff6ff',
    borderColor: '#bfdbfe',
  },
  threadSender: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    marginBottom: 6,
  },
  threadSenderStudent: {
    color: Colors.textSecondary,
  },
  threadSenderStaff: {
    color: '#1d4ed8',
  },
  threadText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  supportImage: {
    width: '100%',
    height: 160,
    borderRadius: Radius.lg,
    marginTop: 12,
    marginBottom: 12,
  },
  replyBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  replyLabel: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: '#1d4ed8',
    marginBottom: 6,
  },
  replyText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  replyDate: {
    fontFamily: Typography.fontMedium,
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 8,
  },
  replyPending: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.lg,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  replyPendingText: {
    flex: 1,
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: '#92400e',
  },
  replyComposer: {
    marginTop: 12,
    gap: 10,
  },
  replyInput: {
    minHeight: 92,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceBg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textPrimary,
  },
  replySendBtn: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  replySendBtnDisabled: {
    backgroundColor: '#94a3b8',
  },
  replySendText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: '#fff',
  },
  listMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  listMetaText: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textMuted },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: Radius.full,
    borderWidth: 1, flexShrink: 0,
  },
  badgeText: { fontFamily: Typography.fontExtraBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeGreen: { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' },
  badgeAmber: { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  badgeRed: { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  badgeSlate: { backgroundColor: Colors.borderLight, borderColor: Colors.border },
  badgeSky: { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' },
  ticketUnreadDot: {
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: Radius.full,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  ticketUnreadDotText: {
    fontFamily: Typography.fontExtraBold,
    fontSize: 10,
    color: '#fff',
  },
  ticketPreviewText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    marginTop: 2,
    marginRight: 8,
  },
  ticketChevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  histIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  histDate: { fontFamily: Typography.fontMedium, fontSize: 9, color: Colors.textMuted, flexShrink: 0, textAlign: 'right' },
  histDateInline: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textMuted, marginTop: 10 },
  accountCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    overflow: 'hidden',
    marginTop: 2,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  accountRow: {
    minHeight: 64,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accountRowDivider: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  accountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  accountIconBlue: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconAmber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fffbeb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountIconRose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: '#334155',
  },
  accountLogoutText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: '#e11d48',
  },
  footerText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  pickerOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: Spacing.xxl, paddingBottom: 40,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
    shadowOffset: { width: 0, height: -6 }, elevation: 12,
  },
  pickerSheetTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: Colors.textPrimary, marginBottom: Spacing.xl, textAlign: 'center',
  },
  pickerOption: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  pickerOptionActive: {},
  pickerOptionText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md, color: Colors.textPrimary,
  },
});
