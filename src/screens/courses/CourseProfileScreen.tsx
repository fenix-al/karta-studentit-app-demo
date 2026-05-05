import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Calendar, MapPin, Clock, Award, Users } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { CourseItem } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { enrollCourse, fetchKurs } from '../../services/api';
import ScreenState from '../../components/ScreenState';

interface Props { course: CourseItem; onBack: () => void; bottomInset: number; }
const PLACEHOLDER = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800';

export default function CourseProfileScreen({ course, onBack, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [busy, setBusy] = useState(false);
  const { data, loading, error, reload } = useFetch(() => fetchKurs(Number(course.id)) as Promise<any>, [course.id]);
  const item = useMemo<CourseItem>(() => {
    const k = data ?? {};
    return {
      ...course,
      title: k.title ?? course.title,
      category: k.categories?.[0] ?? course.category,
      categories: k.categories ?? course.categories,
      categorySlugs: k.category_slugs ?? course.categorySlugs,
      date: k.start_date ?? course.date,
      location: k.location ?? course.location,
      duration: k.duration ?? course.duration,
      cert: k.certification_text ?? course.cert ?? 'Po, pas përfundimit',
      seats: typeof k.free_spots === 'number' && k.total_spots ? `${k.free_spots} / ${k.total_spots} vende` : (k.total_spots ? `${k.total_spots} vende` : course.seats),
      totalSpots: k.total_spots ?? course.totalSpots,
      freeSpots: typeof k.free_spots === 'number' ? k.free_spots : course.freeSpots,
      img: k.image || course.img || PLACEHOLDER,
      desc: k.description || course.desc,
      content: k.content || course.content,
      isEnrolled: !!k.is_enrolled,
      enrollStatus: k.enroll_status ?? course.enrollStatus,
      canEnroll: typeof k.can_enroll === 'boolean' ? k.can_enroll : course.canEnroll,
    };
  }, [course, data]);

  const handleEnroll = async () => {
    setBusy(true);
    try {
      const res = await enrollCourse(Number(course.id));
      Alert.alert('U krye', res.msg || 'Regjistrimi u krye me sukses.');
      await reload();
    } catch (err: any) {
      Alert.alert('Gabim', err?.message ?? 'Nuk mund të regjistroheni për momentin.');
    } finally {
      setBusy(false);
    }
  };

  const buttonLabel = item.isEnrolled
    ? 'Jeni regjistruar tashme'
    : item.canEnroll
      ? 'Regjistrohu me 1 Klik'
      : item.totalSpots && item.freeSpots === 0
        ? 'Vendet u plotesuan'
        : 'Regjistrimi nuk është i disponueshem';

  return (
    <View style={styles.root}>
      <View style={[styles.overlayHeader, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.overlayBtn} onPress={onBack} activeOpacity={0.8}>
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 24 }}>
        <View style={styles.hero}>
          <Image source={{ uri: item.img || PLACEHOLDER }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
        </View>

        <View style={styles.floatingBadgeWrap}>
          <View style={[styles.floatingBadge, { backgroundColor: item.badgeColor || '#0891b2' }]}>
            <Text style={styles.floatingBadgeText}>{item.category}</Text>
          </View>
        </View>

        {loading ? <View style={styles.centered}><ActivityIndicator size="large" color="#e30613" /></View> : null}
        {error ? (
          <View style={styles.centered}>
            <ScreenState
              icon="error"
              title="Gabim ne ngarkim"
              message={error}
              actionLabel="Provo përsëri"
              onAction={reload}
              compact
            />
          </View>
        ) : null}

        <View style={styles.mainInfo}>
          <Text style={styles.courseTitle}>{item.title}</Text>
          <View style={styles.metaBlock}>
            <View style={styles.metaRow}><View style={styles.metaIcon}><Calendar size={16} color={Colors.textSecondary} /></View><Text style={styles.metaText}>Fillon: <Text style={styles.metaBold}>{item.date || '—'}</Text></Text></View>
            <View style={styles.metaRow}><View style={styles.metaIcon}><MapPin size={16} color={Colors.textSecondary} /></View><Text style={styles.metaText}><Text style={styles.metaBold}>{item.location}</Text></Text></View>
          </View>
        </View>

        <View style={styles.highlightsPad}>
          <View style={styles.highlightsCard}>
            <InfoRow icon={<Clock size={20} color="#f59e0b" />} label="Kohezgjatja" value={item.duration || '—'} bg="#fffbeb" />
            <View style={styles.divider} />
            <InfoRow icon={<Award size={20} color="#10b981" />} label="Certifikimi" value={item.cert || 'Po, pas përfundimit'} bg="#ecfdf5" />
            <View style={styles.divider} />
            <InfoRow icon={<Users size={20} color="#0ea5e9" />} label="Vende të Lira" value={item.seats || '—'} bg="#f0f9ff" />
          </View>
        </View>

        <View style={styles.descPad}>
          <Text style={styles.descTitle}>Detajet e Kursit</Text>
          <View style={styles.descCard}>
            <Text style={styles.descText}>{stripHtml(item.content || item.desc || 'Nuk ka përshkrim për momentin.')}</Text>
          </View>
        </View>

        <View style={styles.registerPad}>
          <TouchableOpacity
            style={[styles.registerBtn, (!item.canEnroll || item.isEnrolled) && styles.registerBtnDisabled, busy && styles.registerBtnDisabled]}
            activeOpacity={0.85}
            disabled={!item.canEnroll || item.isEnrolled || busy}
            onPress={handleEnroll}
          >
            {busy ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.registerBtnText}>{buttonLabel}</Text>}
          </TouchableOpacity>
          <Text style={styles.helperText}>Regjistrimi behet automatikisht me të dhënat e kartës suaj.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return <View style={styles.highlightRow}><View style={[styles.highlightIcon, { backgroundColor: bg }]}>{icon}</View><View><Text style={styles.highlightLabel}>{label}</Text><Text style={styles.highlightValue}>{value}</Text></View></View>;
}
function stripHtml(input: string) { return input.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg }, scroll: { flex: 1 }, centered: { paddingVertical: 32, alignItems: 'center' },
  overlayHeader: { position: 'absolute', left: Spacing.lg, right: Spacing.lg, zIndex: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, overlayBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.85)', justifyContent: 'center', alignItems: 'center' },
  hero: { height: 280 }, heroImage: { width: '100%', height: '100%' }, heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.20)' },
  floatingBadgeWrap: { paddingHorizontal: Spacing.xxl, marginTop: -20, zIndex: 10 }, floatingBadge: { alignSelf: 'flex-start', paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.md, borderWidth: 2, borderColor: Colors.white }, floatingBadgeText: { color: '#fff', fontFamily: Typography.fontExtraBold, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 },
  mainInfo: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: Spacing.xl, borderBottomWidth: 1, borderBottomColor: Colors.borderLight }, courseTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.h2, color: Colors.textPrimary, lineHeight: 32, marginBottom: Spacing.lg },
  metaBlock: { gap: 12 }, metaRow: { flexDirection: 'row', alignItems: 'center', gap: 12 }, metaIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceBg, justifyContent: 'center', alignItems: 'center' }, metaText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textSecondary }, metaBold: { fontFamily: Typography.fontBold, color: Colors.textPrimary },
  highlightsPad: { padding: Spacing.xxl }, highlightsCard: { backgroundColor: Colors.white, borderRadius: Radius.xxl + 4, borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl }, highlightRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg }, highlightIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' }, highlightLabel: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted, textTransform: 'uppercase', marginBottom: 2 }, highlightValue: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary }, divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.lg },
  descPad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl }, descTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xl, color: Colors.textPrimary, marginBottom: Spacing.md }, descCard: { backgroundColor: Colors.white, borderRadius: Radius.xxl, borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl }, descText: { fontFamily: Typography.fontMedium, fontSize: Typography.md, color: Colors.textSecondary, lineHeight: 22 },
  registerPad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl }, registerBtn: { backgroundColor: '#dc2626', borderRadius: Radius.xxl, paddingVertical: 16, alignItems: 'center' }, registerBtnDisabled: { backgroundColor: '#94a3b8' }, registerBtnText: { fontFamily: Typography.fontExtraBold, fontSize: Typography.lg, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }, helperText: { fontFamily: Typography.fontMedium, fontSize: 12, color: Colors.textMuted, textAlign: 'center', marginTop: 10 },
});
