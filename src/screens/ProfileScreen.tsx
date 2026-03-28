import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Image, Alert, Modal, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Settings, ChevronLeft, Award, MessageSquare, Send,
  Briefcase, BookOpen, History,
  CheckCircle, Clock, Gift, MapPin,
} from 'lucide-react';

import { Colors, Typography, Spacing, Radius } from '../constants/Theme';
import { APPLICATIONS, COURSE_ACTIVITIES, SCAN_HISTORY } from '../data/mockData';
import { useAuth } from '../context/AuthContext';

interface Props {
  bottomInset:  number;
  onBack?:      () => void;
  onSettings?:  () => void;
}

type ActivityTab = 'aplikimet' | 'kurset' | 'historiku';

const TOPICS = [
  { value: 'problem', label: 'Raporto një problem/biznes' },
  { value: 'ide',     label: 'Sugjero një ide të re'      },
  { value: 'tjeter',  label: 'Diçka tjetër'               },
];

export default function ProfileScreen({ bottomInset, onBack, onSettings }: Props) {
  const insets = useSafeAreaInsets();
  const { card } = useAuth();

  const [activeTab, setActiveTab] = useState<ActivityTab>('aplikimet');
  const [suggestion, setSuggestion]     = useState('');
  const [topic, setTopic]               = useState('');
  const [topicOpen, setTopicOpen]       = useState(false);

  const topicLabel = TOPICS.find(t => t.value === topic)?.label ?? '-- Zgjidh Temën --';

  const handleSubmit = () => {
    if (!topic || !suggestion.trim()) {
      Alert.alert('Kujdes', 'Ju lutem plotësoni temën dhe mesazhin.');
      return;
    }
    Alert.alert('Faleminderit!', 'Zëri juaj u dërgua me sukses tek stafi i Bashkisë.');
    setSuggestion('');
    setTopic('');
  };

  return (
    <View style={s.root}>

      {/* ── Fixed Header ─────────────────────────────────────────────────── */}
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

        {/* ── Digital ID Card ──────────────────────────────────────────── */}
        <LinearGradient
          colors={['#002855', '#001233']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={s.idCard}
        >
          <View style={s.blobTR} />
          <View style={s.blobBL} />

          {/* Top: info + avatar */}
          <View style={s.idTop}>
            <View style={{ flex: 1 }}>
              <Text style={s.idLabel}>Karta e Studentit</Text>
              <Text style={s.idName}>{card ? card.emeri + ' ' + card.mbiemeri : '—'}</Text>
              <Text style={s.idNim}>{card?.nr_karte ?? '—'}</Text>
            </View>
            <View style={s.avatarRing}>
              <Image source={{ uri: card?.foto_url }} style={s.avatar} />
            </View>
          </View>

          {/* Bottom: expiry + status */}
          <View style={s.idBottom}>
            <View>
              <Text style={s.idExpiryLabel}>Skadon më</Text>
              <Text style={s.idExpiry}>{card?.valid_until ?? '—'}</Text>
            </View>
            <View style={s.idStatusBadge}>
              <Text style={s.idStatusText}>{card?.statusi === 'active' ? 'Aktive' : 'Jo Aktive'}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── Quick Stats ──────────────────────────────────────────────── */}
        <View style={s.statsRow}>

          {/* Scans progress */}
          <View style={s.statAmber}>
            <View style={s.statTop}>
              <Text style={s.statLabelAmber}>Skanime</Text>
              <Gift size={15} color="#f59e0b" strokeWidth={2} />
            </View>
            <Text style={s.statBigAmber}>
              {0}
              <Text style={s.statSmallAmber}>/{50}</Text>
            </Text>
            <View style={s.progressTrack}>
              <View style={[
                s.progressFill,
                { width: `${(0 / 50) * 100}%` as any },
              ]} />
            </View>
          </View>

          {/* ACT4 volunteer */}
          <LinearGradient colors={['#ecfdf5', '#f0fdfa']} style={s.statEmerald}>
            <View style={s.statTop}>
              <Text style={s.statLabelEmerald}>Vullnetar</Text>
              <Award size={15} color="#059669" strokeWidth={2} />
            </View>
            <Text style={s.statAct4Title}>{'Vullnetar'}</Text>
            <Text style={s.statAct4Sub}>
              Pjesëmarrës në {0} aktivitete.
            </Text>
          </LinearGradient>

        </View>

        {/* ── Zëri Yt ──────────────────────────────────────────────────── */}
        <LinearGradient
          colors={['#0ea5e9', '#2563eb']}
          style={s.voiceBorder}
        >
          <View style={s.voiceInner}>
            <View style={s.voiceBlob} />

            <View style={s.voiceHeader}>
              <View style={s.voiceIconWrap}>
                <MessageSquare size={20} color="#0ea5e9" strokeWidth={2} fill="#0ea5e9" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.voiceTitle}>Zëri Yt (Sugjerime)</Text>
                <Text style={s.voiceSub}>Dërgo një mesazh direkt për stafin.</Text>
              </View>
            </View>

            {/* Topic picker button */}
            <TouchableOpacity style={s.pickerBtn} activeOpacity={0.8} onPress={() => setTopicOpen(true)}>
              <Text style={[s.pickerBtnText, !topic && { color: Colors.textMuted }]}>
                {topicLabel}
              </Text>
              <View style={{ transform: [{ rotate: '-90deg' }] }}>
                <ChevronLeft size={15} color={Colors.textMuted} strokeWidth={2} />
              </View>
            </TouchableOpacity>

            <TextInput
              style={s.textArea}
              value={suggestion}
              onChangeText={setSuggestion}
              placeholder="Shkruaj sugjerimin tënd këtu..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity style={s.sendBtn} activeOpacity={0.88} onPress={handleSubmit}>
              <Send size={14} color="#fff" strokeWidth={2} />
              <Text style={s.sendBtnText}>Dërgo Sugjerimin</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* ── Aktiviteti Im ────────────────────────────────────────────── */}
        <Text style={s.sectionTitle}>Aktiviteti Im</Text>

        {/* Tab pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.tabPills}
          style={{ marginBottom: Spacing.lg }}
        >
          {([
            { key: 'aplikimet' as ActivityTab, label: 'Aplikimet',     Icon: Briefcase },
            { key: 'kurset'    as ActivityTab, label: 'Kurset Rinore', Icon: BookOpen  },
            { key: 'historiku' as ActivityTab, label: 'Skanimet',      Icon: History   },
          ]).map(({ key, label, Icon }) => (
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

        {/* Aplikimet */}
        {activeTab === 'aplikimet' && APPLICATIONS.map(app => (
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
            <View style={[
              s.badge,
              app.type === 'accepted' ? s.badgeGreen :
              app.type === 'pending'  ? s.badgeAmber : s.badgeRed,
            ]}>
              {app.type === 'accepted' && <CheckCircle size={9} color="#059669" strokeWidth={2.5} />}
              {app.type === 'pending'  && <Clock       size={9} color="#92400e" strokeWidth={2.5} />}
              <Text style={[
                s.badgeText,
                app.type === 'accepted' ? { color: '#059669' } :
                app.type === 'pending'  ? { color: '#92400e' } : { color: '#be123c' },
              ]}>
                {app.status}
              </Text>
            </View>
          </View>
        ))}

        {/* Kurset */}
        {activeTab === 'kurset' && COURSE_ACTIVITIES.map(c => (
          <View key={c.id} style={s.listCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.listTitle}>{c.title}</Text>
              <View style={s.listMeta}>
                <MapPin size={10} color={Colors.textMuted} strokeWidth={2} />
                <Text style={s.listMetaText}>{c.location}</Text>
                <Text style={s.listMetaText}>Seanca: {c.session}</Text>
              </View>
            </View>
            <View style={[s.badge, c.type === 'done' ? s.badgeSlate : s.badgeSky]}>
              <Text style={[s.badgeText, c.type === 'done' ? { color: '#475569' } : { color: '#0369a1' }]}>
                {c.status}
              </Text>
            </View>
          </View>
        ))}

        {/* Historiku */}
        {activeTab === 'historiku' && SCAN_HISTORY.map(h => (
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


      </ScrollView>

      {/* ── Topic picker modal ────────────────────────────────────────────── */}
      <Modal visible={topicOpen} transparent animationType="fade" statusBarTranslucent>
        <TouchableOpacity style={s.pickerOverlay} activeOpacity={1} onPress={() => setTopicOpen(false)}>
          <View style={s.pickerSheet}>
            <Text style={s.pickerSheetTitle}>Zgjidh Temën</Text>
            {TOPICS.map(t => (
              <TouchableOpacity
                key={t.value}
                style={[s.pickerOption, topic === t.value && s.pickerOptionActive]}
                onPress={() => { setTopic(t.value); setTopicOpen(false); }}
              >
                <Text style={[s.pickerOptionText, topic === t.value && { color: '#0ea5e9' }]}>
                  {t.label}
                </Text>
                {topic === t.value && <CheckCircle size={15} color="#0ea5e9" strokeWidth={2} />}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },

  // ── Header ──────────────────────────────────────────────────────────────────
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

  // ── ID Card ──────────────────────────────────────────────────────────────────
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
  idNim:  {
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

  // ── Quick Stats ──────────────────────────────────────────────────────────────
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
  progressTrack: { height: 5, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#f59e0b', borderRadius: 3 },
  statAct4Title: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.sm,
    color: '#064e3b', lineHeight: 16, marginBottom: 4,
  },
  statAct4Sub: { fontFamily: Typography.fontMedium, fontSize: 10, color: '#047857' },

  // ── Voice / Zëri Yt ──────────────────────────────────────────────────────────
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
  voiceSub:   { fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 1 },
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

  // ── Activity tabs ────────────────────────────────────────────────────────────
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

  // List cards (shared for all 3 tabs)
  listCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.borderLight,
    marginBottom: 10,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  listTitle: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary, marginBottom: 4 },
  listMeta:  { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  listMetaText: { fontFamily: Typography.fontMedium, fontSize: 10, color: Colors.textMuted },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: Radius.full,
    borderWidth: 1, flexShrink: 0,
  },
  badgeText: { fontFamily: Typography.fontExtraBold, fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  badgeGreen:  { backgroundColor: '#d1fae5', borderColor: '#a7f3d0' },
  badgeAmber:  { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
  badgeRed:    { backgroundColor: '#fee2e2', borderColor: '#fecaca' },
  badgeSlate:  { backgroundColor: Colors.borderLight, borderColor: Colors.border },
  badgeSky:    { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' },

  histIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  histDate: { fontFamily: Typography.fontMedium, fontSize: 9, color: Colors.textMuted, flexShrink: 0, textAlign: 'right' },

  // ── Topic picker modal ────────────────────────────────────────────────────────
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
  pickerOptionActive: { /* no extra bg needed; text color handles it */ },
  pickerOptionText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md, color: Colors.textPrimary,
  },
});
