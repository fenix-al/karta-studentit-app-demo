import React, { useRef, useState } from 'react';
import {
  View, Text, ScrollView, FlatList, ActivityIndicator,
  TouchableOpacity, Image, TextInput, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronLeft, ArrowRight, Leaf, Users, Shield,
  Calendar, MapPin, HandHeart,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { ActActivity } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchAct4, volunteerAct4 } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800';

function apiToActActivity(a: any): ActActivity {
  return {
    id:        String(a.id),
    title:     a.title    ?? '',
    category:  a.category ?? '',
    catId:     a.cat_id   ?? '',
    badgeColor: '#0aa8a7',
    dateStr:   a.date     ?? '',
    fullDate:  a.date_raw ?? a.date ?? '',
    time:      '',
    location:  a.location ?? 'Shkodër',
    img:       a.image    || PLACEHOLDER,
    desc:      a.excerpt  ?? '',
    fullDesc:  a.excerpt  ?? '',
  };
}

const TEAL  = '#0aa8a7';
const NAVY  = '#003366';
const RED   = '#e30613';

interface Props {
  onBack:    () => void;
  onList:    (title: string, catId: string) => void;
  onProfile: (activityId: string) => void;
  bottomInset: number;
}

const INTERESTS = [
  'Aksione mbjelljeje dhe gjelbërimi',
  'Aksione pastrimi dhe kujdesi ndaj natyrës',
  'Bamirësi dhe Ndihmë Sociale',
  'Aktivitete artistike, kulturore dhe rinore',
];

export default function ActHubScreen({ onBack, onList, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const { card } = useAuth();
  const scrollRef = useRef<ScrollView>(null);

  const [selected, setSelected] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { data, loading, error, reload } = useFetch(() => fetchAct4() as Promise<any>);
  const activities: ActActivity[] = (data?.items ?? []).map(apiToActActivity);

  const toggle = (interest: string) => {
    setSelected(prev =>
      prev.includes(interest) ? prev.filter(i => i !== interest) : [...prev, interest]
    );
  };

  const handleSubmit = async () => {
    if (selected.length === 0) return;

    if (!activities.length) {
      Alert.alert('Nuk disponohet', 'Sapo te publikohet nje aktivitet i ri, mund te regjistroheni edhe nga ky formular.');
      return;
    }

    try {
      setSubmitting(true);
      await volunteerAct4(Number(activities[0].id), selected.join(', '));
      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Regjistrimi nuk u krye. Provo perseri.';
      Alert.alert('Gabim', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.root}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>Rinia në Veprim</Text>
            <Text style={styles.headerTitle}>Act4Shkodra</Text>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >

        {/* ── Hero card ─────────────────────────────────────────────────── */}
        <View style={styles.heroPad}>
          <LinearGradient
            colors={['#003366', '#001f3f']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroBlobTL} />
            <View style={styles.heroBlobBR} />
            <View style={styles.heroContent}>
              <View style={styles.heroVolBadge}>
                <Text style={styles.heroVolBadgeText}>Vullnetarizmi</Text>
              </View>
              <Text style={styles.heroTitle}>
                {'Act'}<Text style={{ color: TEAL }}>4</Text>{'Shkodra'}
              </Text>
              <Text style={styles.heroSub}>
                Aktivitete komunitare, vullnetarizëm dhe trajnime dedikuar të rinjve të qytetit. Bëhu pjesë e ndryshimit!
              </Text>
              <TouchableOpacity
                style={styles.heroBtn}
                activeOpacity={0.85}
                onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
              >
                <Text style={styles.heroBtnText}>Bëhu Vullnetar Tani</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* ── Çfarë është ACT4Shkodra? ──────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <View style={styles.sectionPadH}>
            <Text style={styles.sectionTitle}>Çfarë është ACT4Shkodra?</Text>
            <Text style={styles.sectionSubtitle}>Hapësira ku të rinjtë kontribuojnë në zhvillimin e qytetit.</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
          >
            <View style={[styles.infoCard, { borderTopColor: NAVY }]}>
              <View style={styles.infoCardTitleRow}>
                <Leaf size={15} color={NAVY} strokeWidth={2} />
                <Text style={[styles.infoCardTitle, { color: NAVY }]}>Veprim praktik</Text>
              </View>
              <Text style={styles.infoCardDesc}>Aksione konkrete për pastrim, ndërgjegjësim dhe mbështetje komunitare.</Text>
            </View>
            <View style={[styles.infoCard, { borderTopColor: TEAL }]}>
              <View style={styles.infoCardTitleRow}>
                <Users size={15} color={TEAL} strokeWidth={2} />
                <Text style={[styles.infoCardTitle, { color: NAVY }]}>Edukim & Bashkëpunim</Text>
              </View>
              <Text style={styles.infoCardDesc}>Trajnime, evente dhe bashkëpunime që forcojnë frymën e komunitetit.</Text>
            </View>
            <View style={[styles.infoCard, { borderTopColor: '#f5a623' }]}>
              <View style={styles.infoCardTitleRow}>
                <Shield size={15} color="#f5a623" strokeWidth={2} />
                <Text style={[styles.infoCardTitle, { color: NAVY }]}>Vlera & Identitet</Text>
              </View>
              <Text style={styles.infoCardDesc}>Promovojmë vlera pozitive, të drejtat e njeriut dhe mbrojtjen e mjedisit.</Text>
            </View>
          </ScrollView>
        </View>

        {/* ── Aktivitetet e Fundit ──────────────────────────────────────── */}
        <View style={[styles.sectionMb, styles.activitiesBg]}>
          <View style={[styles.sectionHeader, styles.sectionPadH]}>
            <Text style={[styles.sectionTitle, { color: NAVY }]}>Aktivitetet e Fundit</Text>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => onList('Të gjitha Aktivitetet', 'all')}
            >
              <Text style={styles.seeAllText}>Shiko të gjitha</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color="#e30613" />
            </View>
          ) : error ? (
            <View style={styles.centered}>
              <Text style={styles.errorText}>
                ⚠️ {typeof error === 'object' && error !== null && 'message' in error ? (error as Error).message : String(error)}
              </Text>
              <TouchableOpacity style={styles.retryBtn} onPress={reload}>
                <Text style={styles.retryText}>Provo Përsëri</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            >
              {activities.map(item => (
                <ActivityCard key={item.id} activity={item} onPress={() => onProfile(item.id)} />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── Forma e Vullnetarit ───────────────────────────────────────── */}
        <View style={styles.formPad}>
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Regjistrohuni si Vullnetar</Text>
            <Text style={styles.formSubtitle}>Ne do t'ju kontaktojmë kur të ketë aktivitete të reja në fushat tuaja të interesit.</Text>

            {/* Auto-fill alert */}
            <View style={styles.alertBox}>
              <Text style={styles.alertEmoji}>👋</Text>
              <Text style={styles.alertText}>
                <Text style={styles.alertBold}>Përshëndetje {card?.emeri ?? ''}!</Text>
                {' '}Të dhënat tuaja u plotësuan automatikisht nga Karta. Ju mbetet vetëm të zgjidhni fushat e interesit.
              </Text>
            </View>

            {/* Readonly inputs – 2-column grid */}
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Emri</Text>
                <TextInput
                  style={styles.inputDisabled}
                  value={card?.emeri ?? ''}
                  editable={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mbiemri</Text>
                <TextInput
                  style={styles.inputDisabled}
                  value={card?.mbiemeri ?? ''}
                  editable={false}
                />
              </View>
            </View>
            <View style={styles.inputRow}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Mosha</Text>
                <TextInput
                  style={styles.inputDisabled}
                  value={''}
                  editable={false}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Numri i Telefonit</Text>
                <TextInput
                  style={styles.inputDisabled}
                  value={card?.telefoni ?? ''}
                  editable={false}
                />
              </View>
            </View>

            {/* Interest checkboxes */}
            <Text style={styles.checkboxGroupLabel}>Ku dëshironi të angazhoheni? *</Text>
            <View style={styles.checkboxGroup}>
              {INTERESTS.map((interest, idx) => {
                const isOn = selected.includes(interest);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.checkboxRow}
                    onPress={() => toggle(interest)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.checkbox, isOn && styles.checkboxActive]}>
                      {isOn && <Text style={styles.checkboxTick}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxLabel}>{interest}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Submit button */}
            {submitted ? (
              <View style={styles.submittedBox}>
                <Text style={styles.submittedEmoji}>✅</Text>
                <Text style={styles.submittedText}>Të dhënat tuaja u regjistruan me sukses!</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.submitBtn, (selected.length === 0 || submitting) && styles.submitBtnDisabled]}
                activeOpacity={0.85}
                onPress={handleSubmit}
              >
                <HandHeart size={18} color="#fff" strokeWidth={2} />
                <Text style={styles.submitBtnText}>
                  {submitting ? 'Duke dërguar...' : 'Dërgo të Dhënat'}
                </Text>
              </TouchableOpacity>
            )}

          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ── Shared activity card ──────────────────────────────────────────────────────
export function ActivityCard({ activity, onPress }: { activity: ActActivity; onPress: () => void }) {
  const [day, mon] = activity.dateStr.split(' ');
  return (
    <TouchableOpacity style={styles.actCard} onPress={onPress} activeOpacity={0.9}>
      {/* Image */}
      <View style={styles.actImageWrap}>
        <Image source={{ uri: activity.img }} style={styles.actImage} resizeMode="cover" />
        <View style={[styles.actCatBadge, { backgroundColor: activity.badgeColor }]}>
          <Text style={styles.actCatBadgeText}>{activity.category}</Text>
        </View>
        {/* Overlapping date badge */}
        <View style={styles.actDateBadge}>
          <Text style={styles.actDateDay}>{day}</Text>
          <Text style={styles.actDateMon}>{mon}</Text>
        </View>
      </View>
      {/* Body */}
      <View style={styles.actBody}>
        <Text style={styles.actTitle} numberOfLines={2}>{activity.title}</Text>
        <Text style={styles.actDesc} numberOfLines={2}>{activity.desc}</Text>
        <View style={styles.actFooter}>
          <Text style={styles.actReadMore}>Lexo më shumë</Text>
          <ArrowRight size={12} color={TEAL} strokeWidth={2.5} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root:     { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll:   { flex: 1 },
  centered:  { paddingVertical: 40, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary },
  retryBtn:  { backgroundColor: '#e30613', paddingHorizontal: 20, paddingVertical: 10, borderRadius: Radius.full },
  retryText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#fff' },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerSub: {
    fontFamily: Typography.fontBold, fontSize: Typography.xs,
    color: '#0aa8a7', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: '#003366',
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },

  // Hero
  heroPad: { padding: Spacing.xxl },
  heroCard: {
    borderRadius: Radius.xxl + 4, padding: Spacing.xxl + 4,
    overflow: 'hidden',
    shadowColor: '#003366', shadowOpacity: 0.2, shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 }, elevation: 6,
  },
  heroBlobTL: {
    position: 'absolute', top: -40, right: -40,
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: 'rgba(10,168,167,0.15)',
  },
  heroBlobBR: {
    position: 'absolute', bottom: -30, left: -20,
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(10,168,167,0.10)',
  },
  heroContent: { alignItems: 'center' },
  heroVolBadge: {
    backgroundColor: 'rgba(10,168,167,0.20)',
    borderWidth: 1, borderColor: 'rgba(10,168,167,0.30)',
    borderRadius: Radius.full, paddingHorizontal: 14, paddingVertical: 6, marginBottom: 14,
  },
  heroVolBadgeText: {
    fontFamily: Typography.fontBold, fontSize: 11,
    color: '#20eceb', textTransform: 'uppercase', letterSpacing: 1.2,
  },
  heroTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: 28,
    color: '#fff', marginBottom: 10, textAlign: 'center',
  },
  heroSub: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm,
    color: '#bfdbfe', lineHeight: 20, textAlign: 'center',
    marginBottom: Spacing.xl, paddingHorizontal: 8,
  },
  heroBtn: {
    backgroundColor: '#0aa8a7', width: '100%',
    paddingVertical: 14, borderRadius: Radius.xl,
    alignItems: 'center',
    shadowColor: '#0aa8a7', shadowOpacity: 0.3, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  heroBtnText: {
    fontFamily: Typography.fontBold, fontSize: Typography.md, color: '#fff',
  },

  // Section helpers
  sectionPadH: { paddingHorizontal: Spacing.xxl },
  sectionMb:   { marginBottom: Spacing.xxxl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: Colors.textPrimary, marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm, color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  seeAllBtn: {
    backgroundColor: 'rgba(10,168,167,0.12)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
  },
  seeAllText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#0aa8a7' },
  hList: { paddingHorizontal: Spacing.xxl, gap: 14, paddingBottom: 4, paddingTop: 4 },

  // Info cards (Çfarë është)
  infoCard: {
    width: 220, backgroundColor: Colors.white, borderRadius: Radius.xxl,
    padding: Spacing.xl, borderWidth: 1, borderColor: Colors.borderLight,
    borderTopWidth: 4,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  infoCardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  infoCardTitle: { fontFamily: Typography.fontBold, fontSize: Typography.md },
  infoCardDesc: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm,
    color: Colors.textSecondary, lineHeight: 18,
  },

  // Activities section bg
  activitiesBg: {
    backgroundColor: '#f1f5f9',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#e2e8f0',
  },

  // Activity cards
  actCard: {
    width: 268, backgroundColor: Colors.white, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 }, elevation: 2,
    overflow: 'visible',
  },
  actImageWrap: {
    height: 152, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
    overflow: 'visible', backgroundColor: Colors.borderLight,
  },
  actImage: {
    width: '100%', height: '100%',
    borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl,
  },
  actCatBadge: {
    position: 'absolute', top: 12, left: 12,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  actCatBadgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 10,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 0.6,
  },
  actDateBadge: {
    position: 'absolute', bottom: -18, right: 14,
    backgroundColor: Colors.white, borderWidth: 2, borderColor: '#0aa8a7',
    borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5,
    alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
    zIndex: 10,
  },
  actDateDay: { fontFamily: Typography.fontExtraBold, fontSize: 15, color: '#003366', lineHeight: 17 },
  actDateMon: { fontFamily: Typography.fontBold, fontSize: 9, color: Colors.textMuted, textTransform: 'uppercase', marginTop: 1 },

  actBody: { padding: Spacing.xl, paddingTop: Spacing.xxl + 4 },
  actTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.lg,
    color: '#003366', lineHeight: 22, marginBottom: 6,
  },
  actDesc: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm,
    color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.lg,
  },
  actFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderTopWidth: 1, borderTopColor: Colors.borderLight, paddingTop: Spacing.md,
  },
  actReadMore: {
    fontFamily: Typography.fontBold, fontSize: Typography.sm, color: '#0aa8a7',
  },

  // Volunteer form
  formPad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl },
  formCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    padding: Spacing.xxl, borderWidth: 1, borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 }, elevation: 2,
  },
  formTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl,
    color: '#003366', marginBottom: 6,
  },
  formSubtitle: {
    fontFamily: Typography.fontMedium, fontSize: Typography.sm,
    color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.xl,
  },
  alertBox: {
    backgroundColor: '#e0f2f1', borderLeftWidth: 4, borderLeftColor: '#0aa8a7',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: Spacing.xl,
  },
  alertEmoji: { fontSize: 16, marginTop: 1 },
  alertText: {
    fontFamily: Typography.fontMedium, fontSize: 12,
    color: '#004d40', lineHeight: 18, flex: 1,
  },
  alertBold: { fontFamily: Typography.fontBold },

  inputRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  inputGroup: { flex: 1 },
  inputLabel: {
    fontFamily: Typography.fontBold, fontSize: 11,
    color: '#003366', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  inputDisabled: {
    backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#e2e8f0',
    borderRadius: Radius.lg, paddingHorizontal: 12, paddingVertical: 11,
    fontFamily: Typography.fontBold, fontSize: Typography.sm,
    color: Colors.textMuted, opacity: 0.9,
  },

  checkboxGroupLabel: {
    fontFamily: Typography.fontBold, fontSize: 12,
    color: '#003366', marginBottom: 10, marginTop: 4,
  },
  checkboxGroup: {
    backgroundColor: Colors.surfaceBg, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.lg, gap: 14, marginBottom: Spacing.xl,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#cbd5e1',
    backgroundColor: Colors.white,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0, marginTop: 1,
  },
  checkboxActive: { backgroundColor: '#0aa8a7', borderColor: '#0aa8a7' },
  checkboxTick: { color: '#fff', fontSize: 13, fontFamily: Typography.fontExtraBold, lineHeight: 14 },
  checkboxLabel: {
    fontFamily: Typography.fontMedium, fontSize: Typography.base,
    color: Colors.textPrimary, lineHeight: 20, flex: 1,
  },

  submitBtn: {
    backgroundColor: '#e30613', borderRadius: Radius.xl,
    paddingVertical: 15, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#e30613', shadowOpacity: 0.25, shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 }, elevation: 4,
  },
  submitBtnDisabled: { backgroundColor: Colors.borderLight, shadowOpacity: 0 },
  submitBtnText: {
    fontFamily: Typography.fontBold, fontSize: Typography.md, color: '#fff',
  },
  submittedBox: { alignItems: 'center', paddingVertical: Spacing.xl },
  submittedEmoji: { fontSize: 30, marginBottom: 8 },
  submittedText: {
    fontFamily: Typography.fontBold, fontSize: Typography.md,
    color: '#065f46', textAlign: 'center',
  },
});
