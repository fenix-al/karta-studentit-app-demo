import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, Alert, Modal, StyleSheet, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings, ChevronLeft, Award, MessageSquare, Send,
  Briefcase, BookOpen, History,
  CheckCircle, Clock, Gift, MapPin,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks/useFetch';
import { fetchMyApplications, fetchMyCourses, fetchMyHistory, postSuggestion } from '../services/api';
import {
  ProfileApplication,
  ProfileCourse,
  ProfileCourseApiItem,
  ProfileHistoryApiItem,
  ScanHistoryEntry,
} from '../types';

interface Props {
  bottomInset:  number;
  onBack?:      () => void;
  onSettings?:  () => void;
}

type ActivityTab = 'aplikimet' | 'kurset' | 'historiku';

const TOPICS = [
  { value: 'problem', label: 'Raporto nje problem/biznes' },
  { value: 'ide',     label: 'Sugjero nje ide te re' },
  { value: 'tjeter',  label: 'Dicka tjeter' },
];

export default function ProfileScreen({ bottomInset, onBack, onSettings }: Props) {
  const insets = useSafeAreaInsets();
  const { card } = useAuth();

  const [activeTab, setActiveTab] = useState<ActivityTab>('aplikimet');
  const [suggestion, setSuggestion] = useState('');
  const [topic, setTopic] = useState('');
  const [topicOpen, setTopicOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const topicLabel = TOPICS.find((t) => t.value === topic)?.label ?? '-- Zgjidh Teme --';

  const applications = useMemo<ProfileApplication[]>(
    () => (applicationsData ?? []).map((app) => ({
      id: app.job_id,
      title: app.title,
      company: app.company || 'Organizate / Kompani',
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
      location: course.location || 'Shkoder',
      date: formatDate(course.start_date || course.date),
      session: course.session,
      status: mapCourseStatusLabel(course.status),
      type: mapCourseType(course.status),
    })),
    [coursesData],
  );

  const scanCount = card?.total_scans ?? history.length;
  const volunteerActivities = card?.act4_activities_count ?? 0;

  const handleSubmit = async () => {
    if (!topic || !suggestion.trim()) {
      Alert.alert('Kujdes', 'Ju lutem plotesoni temen dhe mesazhin.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await postSuggestion(topic, suggestion.trim());
      Alert.alert('Faleminderit!', res.msg || 'Sugjerimi u dergua me sukses.');
      setSuggestion('');
      setTopic('');
    } catch (err: any) {
      Alert.alert('Gabim', err?.message ?? 'Nuk mund te dergohet sugjerimi per momentin.');
    } finally {
      setIsSubmitting(false);
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
        <LinearGradient
          colors={['#002855', '#001233']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.idCard}
        >
          <View style={s.blobTR} />
          <View style={s.blobBL} />

          <View style={s.idTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.idLabel}>Karta e Studentit</Text>
              <Text style={s.idName}>{card ? `${card.emeri} ${card.mbiemeri}` : '-'}</Text>
              <Text style={s.idNim}>{card?.nr_karte ?? '-'}</Text>
            </View>
            <View style={s.avatarRing}>
              <Image source={{ uri: card?.foto_url }} style={s.avatar} />
            </View>
          </View>

          <View style={s.idBottom}>
            <View>
              <Text style={s.idExpiryLabel}>Skadon me</Text>
              <Text style={s.idExpiry}>{card?.valid_until ?? '-'}</Text>
            </View>
            <View style={s.idStatusBadge}>
              <Text style={s.idStatusText}>{card?.statusi === 'active' ? 'Aktive' : 'Jo Aktive'}</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={s.statsRow}>
          <View style={s.statAmber}>
            <View style={s.statTop}>
              <Text style={s.statLabelAmber}>Skanime</Text>
              <Gift size={15} color="#f59e0b" strokeWidth={2} />
            </View>
            <Text style={s.statBigAmber}>
              {scanCount}
            </Text>
            <Text style={s.statHintAmber}>Skanime totale te kartes.</Text>
          </View>

          <LinearGradient colors={['#ecfdf5', '#f0fdfa']} style={s.statEmerald}>
            <View style={s.statTop}>
              <Text style={s.statLabelEmerald}>Vullnetar</Text>
              <Award size={15} color="#059669" strokeWidth={2} />
            </View>
            <Text style={s.statAct4Title}>Vullnetar</Text>
            <Text style={s.statAct4Sub}>Pjesemarres ne {volunteerActivities} aktivitete.</Text>
          </LinearGradient>
        </View>

        <LinearGradient colors={['#0ea5e9', '#2563eb']} style={s.voiceBorder}>
          <View style={s.voiceInner}>
            <View style={s.voiceBlob} />

            <View style={s.voiceHeader}>
              <View style={s.voiceIconWrap}>
                <MessageSquare size={20} color="#0ea5e9" strokeWidth={2} fill="#0ea5e9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.voiceTitle}>Zeri Yt (Sugjerime)</Text>
                <Text style={s.voiceSub}>Dergo nje mesazh direkt per stafin.</Text>
              </View>
            </View>

            <TouchableOpacity style={s.pickerBtn} activeOpacity={0.8} onPress={() => setTopicOpen(true)}>
              <Text style={[s.pickerBtnText, !topic && { color: Colors.textMuted }]}>{topicLabel}</Text>
              <View style={{ transform: [{ rotate: '-90deg' }] }}>
                <ChevronLeft size={15} color={Colors.textMuted} strokeWidth={2} />
              </View>
            </TouchableOpacity>

            <TextInput
              style={s.textArea}
              value={suggestion}
              onChangeText={setSuggestion}
              placeholder="Shkruaj sugjerimin tend ketu..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={s.sendBtn} activeOpacity={0.88} onPress={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Send size={14} color="#fff" strokeWidth={2} />
                  <Text style={s.sendBtnText}>Dergo Sugjerimin</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <Text style={s.sectionTitle}>Aktiviteti Im</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabPills}
          style={{ marginBottom: Spacing.lg }}
        >
          {[
            { key: 'aplikimet' as ActivityTab, label: 'Aplikimet', Icon: Briefcase },
            { key: 'kurset' as ActivityTab, label: 'Kurset Rinore', Icon: BookOpen },
            { key: 'historiku' as ActivityTab, label: 'Skanimet', Icon: History },
          ].map(({ key, label, Icon }) => (
            <TouchableOpacity
              key={key}
              style={[s.tabPill, activeTab === key && s.tabPillActive]}
              onPress={() => setActiveTab(key)}
              activeOpacity={0.8}
            >
              <Icon size={13} color={activeTab === key ? '#fff' : Colors.textMuted} strokeWidth={2} />
              <Text style={[s.tabPillText, activeTab === key && s.tabPillTextActive]}>{label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {activeTab === 'aplikimet' && (
          <TabState
            loading={applicationsLoading}
            error={applicationsError}
            empty={applications.length === 0}
            emptyText="Nuk ka aplikime te ruajtura per momentin."
          >
            {applications.map((app) => (
              <View key={app.id} style={s.listCard}>
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
              </View>
            ))}
          </TabState>
        )}

        {activeTab === 'kurset' && (
          <TabState
            loading={coursesLoading}
            error={coursesError}
            empty={courses.length === 0}
            emptyText="Nuk ka kurse te regjistruara per momentin."
          >
            {courses.map((c) => (
              <View key={c.id} style={s.listCard}>
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
              </View>
            ))}
          </TabState>
        )}

        {activeTab === 'historiku' && (
          <TabState
            loading={historyLoading}
            error={historyError}
            empty={history.length === 0}
            emptyText="Nuk ka histori skanimesh per momentin."
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
      </ScrollView>

      <Modal visible={topicOpen} transparent animationType="fade" statusBarTranslucent>
        <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setTopicOpen(false)}>
          <View style={s.pickerSheet}>
            <Text style={s.pickerSheetTitle}>Zgjidh Temen</Text>
            {TOPICS.map((t) => (
              <TouchableOpacity
                key={t.value}
                style={[s.pickerOption, topic === t.value && s.pickerOptionActive]}
                onPress={() => { setTopic(t.value); setTopicOpen(false); }}
              >
                <Text style={[s.pickerOptionText, topic === t.value && { color: '#0ea5e9' }]}>{t.label}</Text>
                {topic === t.value && <CheckCircle size={15} color="#0ea5e9" strokeWidth={2} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

function TabState({
  loading,
  error,
  empty,
  emptyText,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <View style={s.feedbackBox}>
        <ActivityIndicator size="small" color={Colors.textMuted} />
        <Text style={s.feedbackText}>Duke ngarkuar...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={s.feedbackBox}>
        <Text style={s.feedbackText}>Gabim: {error}</Text>
      </View>
    );
  }

  if (empty) {
    return (
      <View style={s.feedbackBox}>
        <Text style={s.feedbackText}>{emptyText}</Text>
      </View>
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
  return 'Ne pritje';
}

function mapCourseType(status: string): 'done' | 'active' {
  const normalized = status.trim().toLowerCase();
  return normalized === 'completed' ? 'done' : 'active';
}

function mapCourseStatusLabel(status: string): string {
  const normalized = status.trim().toLowerCase();
  if (normalized === 'completed') return 'Perfunduar';
  if (normalized === 'active') return 'Ne zhvillim';
  return 'E regjistruar';
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('sq-AL', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
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
  idCard: {
    borderRadius: Radius.xxl + 4, padding: Spacing.xxl, overflow: 'hidden',
    marginTop: Spacing.xxl, marginBottom: Spacing.lg,
    shadowColor: '#002855', shadowOpacity: 0.25, shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 }, elevation: 8,
  },
  blobTR: {
    position: 'absolute', top: -30, right: -30,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  blobBL: {
    position: 'absolute', bottom: -20, left: -20,
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: 'rgba(10,168,167,0.15)',
  },
  idTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.xxl },
  idLabel: {
    fontFamily: Typography.fontBold, fontSize: 9,
    color: '#0aa8a7', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 4,
  },
  idName: { fontFamily: Typography.fontExtraBold, fontSize: Typography.h2, color: '#fff' },
  idNim: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm,
    color: 'rgba(203,213,225,0.75)', marginTop: 4, letterSpacing: 0.5,
  },
  avatarRing: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#fff', padding: 3, flexShrink: 0,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  avatar: { width: '100%', height: '100%', borderRadius: 24 },
  idBottom: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.10)', paddingTop: Spacing.lg,
  },
  idExpiryLabel: {
    fontFamily: Typography.fontBold, fontSize: 9,
    color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 3,
  },
  idExpiry: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#fff' },
  idStatusBadge: {
    backgroundColor: 'rgba(10,168,167,0.18)', borderWidth: 1, borderColor: 'rgba(10,168,167,0.45)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.sm,
  },
  idStatusText: {
    fontFamily: Typography.fontExtraBold, fontSize: 9,
    color: '#0aa8a7', textTransform: 'uppercase', letterSpacing: 1.5,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: Spacing.xxxl },
  statAmber: {
    flex: 1, backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.lg, borderWidth: 1, borderColor: '#fef3c7',
    shadowColor: '#f59e0b', shadowOpacity: 0.07, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  statEmerald: {
    flex: 1, borderRadius: Radius.xxl, padding: Spacing.lg,
    borderWidth: 1, borderColor: '#d1fae5',
    shadowColor: '#10b981', shadowOpacity: 0.07, shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 }, elevation: 2,
  },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statLabelAmber: {
    fontFamily: Typography.fontExtraBold, fontSize: 9,
    color: '#d97706', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  statLabelEmerald: {
    fontFamily: Typography.fontExtraBold, fontSize: 9,
    color: '#059669', textTransform: 'uppercase', letterSpacing: 0.8,
  },
  statBigAmber: { fontFamily: Typography.fontExtraBold, fontSize: Typography.h2, color: Colors.textPrimary, marginBottom: 8 },
  statSmallAmber: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textMuted },
  statHintAmber: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textMuted },
  statAct4Title: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.sm,
    color: '#064e3b', lineHeight: 16, marginBottom: 4,
  },
  statAct4Sub: { fontFamily: Typography.fontMedium, fontSize: 10, color: '#047857' },
  voiceBorder: {
    borderRadius: Radius.xxl + 4, padding: 2,
    marginBottom: Spacing.xxxl,
    shadowColor: '#0ea5e9', shadowOpacity: 0.18, shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 }, elevation: 6,
  },
  voiceInner: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, overflow: 'hidden',
  },
  voiceBlob: {
    position: 'absolute', top: 0, right: 0,
    width: 80, height: 80, backgroundColor: '#f0f9ff',
    borderBottomLeftRadius: 80,
  },
  voiceHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: Spacing.lg },
  voiceIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#e0f2fe', justifyContent: 'center', alignItems: 'center',
  },
  voiceTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary },
  voiceSub: { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 1 },
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
  listCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  listTitle: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary, marginBottom: 4 },
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
  histIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  histDate: { fontFamily: Typography.fontMedium, fontSize: 9, color: Colors.textMuted, flexShrink: 0, textAlign: 'right' },
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
  feedbackBox: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 10,
  },
  feedbackText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
});
