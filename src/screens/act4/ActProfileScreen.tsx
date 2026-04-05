import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Share2, Heart, Calendar, MapPin, HandHeart, CheckCircle,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { ActActivity } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchAct4Single, volunteerAct4 } from '../../services/api';
import ScreenState from '../../components/ScreenState';

interface Props {
  activityId: string;
  onBack: () => void;
  bottomInset: number;
}

const FOOTER_H = 110;
const PLACEHOLDER = 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function ActProfileScreen({ activityId, onBack, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [joined, setJoined] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { data, loading, error, reload } = useFetch(() => fetchAct4Single(Number(activityId)) as Promise<any>, [activityId]);

  const activity: ActActivity | null = useMemo(() => {
    if (!data) return null;

    const textContent = stripHtml(data.content ?? '');

    return {
      id: String(data.id),
      title: data.title ?? '',
      category: data.category ?? '',
      catId: data.cat_id ?? '',
      badgeColor: '#0aa8a7',
      dateStr: data.date ?? '',
      fullDate: data.date_raw ?? data.date ?? '',
      time: '',
      location: data.location ?? 'Shkoder',
      img: data.image || PLACEHOLDER,
      desc: textContent || '',
      fullDesc: textContent || '',
      content: data.content ?? '',
    };
  }, [data]);

  const handleVolunteer = async () => {
    if (!activity || joined || submitting) return;

    try {
      setSubmitting(true);
      await volunteerAct4(Number(activity.id), activity.title);
      setJoined(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Regjistrimi nuk u krye. Provo perseri.';
      Alert.alert('Gabim', message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color="#0aa8a7" />
      </View>
    );
  }

  if (error || !activity) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top + 24 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
          <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <ScreenState
          icon="error"
          title="Aktiviteti nuk u ngarkua"
          message="Provo perseri per te pare detajet e aktivitetit."
          actionLabel="Provo perseri"
          onAction={reload}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
          <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Share2 size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Heart size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + FOOTER_H + 16 }}
      >
        <View style={styles.heroPad}>
          <View style={styles.heroWrap}>
            <Image source={{ uri: activity.img }} style={styles.heroImage} resizeMode="cover" />
            <View style={[styles.catBadge, { backgroundColor: activity.badgeColor }]}>
              <Text style={styles.catBadgeText}>{activity.category}</Text>
            </View>
          </View>
        </View>

        <View style={styles.titlePad}>
          <Text style={styles.title}>{activity.title}</Text>
        </View>

        <View style={styles.infoBoxPad}>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#f0f9ff' }]}>
                <Calendar size={20} color="#0ea5e9" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Data & Ora</Text>
                <Text style={styles.infoValue}>{activity.fullDate}{activity.time ? ` • ${activity.time}` : ''}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#fff1f2' }]}>
                <MapPin size={20} color="#f43f5e" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Vendndodhja</Text>
                <Text style={styles.infoValue}>{activity.location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.descPad}>
          <Text style={styles.descTitle}>Rreth Aktivitetit</Text>
          <View style={styles.descCard}>
            <Text style={styles.descText}>{activity.fullDesc}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.stickyFooter, { paddingBottom: bottomInset + 16 }]}>
        <TouchableOpacity
          style={[styles.joinBtn, joined && styles.joinBtnDone]}
          activeOpacity={0.88}
          onPress={handleVolunteer}
        >
          {joined
            ? <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
            : <HandHeart size={20} color="#fff" strokeWidth={2} />}
          <Text style={styles.joinBtnText}>
            {joined ? 'Je Regjistruar ne Aktivitet' : (submitting ? 'Duke u regjistruar...' : 'Merr Pjese si Vullnetar')}
          </Text>
        </TouchableOpacity>
        <Text style={styles.footerNote}>
          Skanoni Karten kur te paraqiteni per te marre Pike Vullnetarizmi.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxl, gap: 16 },
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 3, zIndex: 10,
  },
  headerRight: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg, borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },

  heroPad: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  heroWrap: {
    height: 224, borderRadius: Radius.xxl + 4,
    overflow: 'hidden', borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.borderLight,
  },
  heroImage: { width: '100%', height: '100%' },
  catBadge: {
    position: 'absolute', top: 14, left: 14,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10,
  },
  catBadgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 11,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 0.8,
  },

  titlePad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  title: {
    fontFamily: Typography.fontExtraBold, fontSize: 22,
    color: '#003366', lineHeight: 30,
  },

  infoBoxPad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  infoBox: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  infoIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  infoLabel: {
    fontFamily: Typography.fontBold, fontSize: Typography.xs,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  infoValue: {
    fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary,
  },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.lg },

  descPad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl },
  descTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  descCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  descText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md,
    color: Colors.textSecondary, lineHeight: 24,
  },

  stickyFooter: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: Spacing.xxl,
    paddingTop: 16,
    borderTopWidth: 1, borderTopColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 16,
    shadowOffset: { width: 0, height: -6 }, elevation: 10,
  },
  joinBtn: {
    backgroundColor: '#0aa8a7', borderRadius: Radius.xxl,
    paddingVertical: 15, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#0aa8a7', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 }, elevation: 5,
  },
  joinBtnDone: { backgroundColor: '#10b981', shadowColor: '#10b981' },
  joinBtnText: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.lg,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  footerNote: {
    fontFamily: Typography.fontMedium, fontSize: 10,
    color: Colors.textMuted, textAlign: 'center', marginTop: 8,
  },
});
