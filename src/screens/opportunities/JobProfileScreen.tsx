import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Share2, Heart, MapPin,
  Briefcase, Clock, DollarSign, CheckCircle, Building,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { JobItem } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { applyJob, fetchJob } from '../../services/api';
import { apiToJobItem } from './OpportunitiesHubScreen';
import ScreenState from '../../components/ScreenState';

interface Props {
  job:         JobItem;
  onBack:      () => void;
  bottomInset: number;
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function JobProfileScreen({ job, onBack, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [applying, setApplying] = useState(false);
  const { data, loading, error, reload } = useFetch(() => fetchJob(Number(job.id)) as Promise<any>, [job.id]);

  const liveJob = useMemo<JobItem>(() => {
    if (!data) return job;
    return {
      ...job,
      ...apiToJobItem(data),
      desc: data.excerpt ?? job.desc,
      content: stripHtml(data.content ?? ''),
      applied: !!data.is_applied,
      applyStatus: data.apply_status ?? null,
      canApply: !!data.can_apply,
    };
  }, [data, job]);

  async function handleApply() {
    if (!liveJob.canApply || applying) return;
    try {
      setApplying(true);
      const res = await applyJob(Number(liveJob.id));
      Alert.alert('U krye', res.msg || 'Aplikimi u dërgua me sukses.');
      reload();
    } catch (err) {
      Alert.alert('Gabim', err instanceof Error ? err.message : 'Aplikimi nuk u dërgua. Provo përsëri.');
    } finally {
      setApplying(false);
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.overlayHeader, { top: insets.top + 12 }]}>
        <TouchableOpacity style={styles.overlayBtn} onPress={onBack} activeOpacity={0.8}>
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.overlayRight}>
          <TouchableOpacity style={styles.overlayBtn}>
            <Share2 size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.overlayBtn}>
            <Heart size={18} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#e30613" /></View>
      ) : error ? (
        <View style={styles.centered}>
          <ScreenState
            icon="error"
            title="Nuk u ngarkua pozicioni"
            message={typeof error === 'object' && error !== null && 'message' in error ? (error as Error).message : String(error)}
            actionLabel="Provo përsëri"
            onAction={reload}
          />
        </View>
      ) : (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomInset + 24 }}>
          <View style={styles.hero}>
            <Image source={{ uri: liveJob.img }} style={styles.heroImage} resizeMode="cover" />
            <View style={styles.heroOverlay} />
          </View>

          <View style={styles.mainInfo}>
            <View style={[styles.badge, { backgroundColor: liveJob.badgeBg, borderColor: liveJob.badgeBorder }]}>
              <Text style={[styles.badgeText, { color: liveJob.badgeText }]}>{liveJob.type}</Text>
            </View>
            <Text style={styles.jobTitle}>{liveJob.title}</Text>
            <View style={styles.companyRow}>
              <Building size={15} color={Colors.textMuted} strokeWidth={2} />
              <Text style={styles.companyName}>{liveJob.company || 'Kompani Partnere'}</Text>
            </View>
          </View>

          <View style={styles.infoBoxPad}>
            <View style={styles.infoBox}>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: Colors.surfaceBg }]}>
                  <MapPin size={20} color={Colors.textSecondary} strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Vendndodhja</Text>
                  <Text style={styles.infoValue}>{liveJob.location}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#fffbeb' }]}>
                  <Briefcase size={20} color="#f59e0b" strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Lloji i Pozicionit</Text>
                  <Text style={styles.infoValue}>{liveJob.type}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#fff1f2' }]}>
                  <Clock size={20} color="#be123c" strokeWidth={2} />
                </View>
                <View>
                  <Text style={[styles.infoLabel, { color: '#f43f5e' }]}>Afati i Aplikimit</Text>
                  <Text style={styles.infoValue}>{liveJob.date || 'Pa afat të përcaktuar'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: '#ecfdf5' }]}>
                  <DollarSign size={20} color="#10b981" strokeWidth={2} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Paga / Shperblimi</Text>
                  <Text style={[styles.infoValue, { color: '#059669' }]}>{liveJob.salary || 'Sipas përshkrimit'}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.descPad}>
            <Text style={styles.descTitle}>Përshkrimi i Pozicionit</Text>
            <View style={styles.descCard}>
              <Text style={styles.descText}>{liveJob.content || liveJob.desc || 'Përshkrimi nuk është plotësuar ende.'}</Text>
            </View>
          </View>

          <View style={styles.applyPad}>
            <TouchableOpacity
              style={[
                styles.applyBtn,
                liveJob.applied && styles.applyBtnDone,
                !liveJob.canApply && !liveJob.applied && styles.applyBtnDisabled,
              ]}
              activeOpacity={0.88}
              disabled={!liveJob.canApply || applying}
              onPress={handleApply}
            >
              <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.applyBtnText}>
                {applying
                  ? 'Duke aplikuar...'
                  : liveJob.applied
                  ? 'Keni Aplikuar Tashme'
                  : liveJob.canApply
                  ? 'Apliko me 1 Klik'
                  : 'Vetem Studentet mund të Aplikojne'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.applyHint}>
              Profili dhe të dhënat e kartës suaj i dërgohen automatikisht kompanise.
            </Text>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  overlayHeader: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg, zIndex: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  overlayBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.85)',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 4,
  },
  overlayRight: { flexDirection: 'row', gap: 8 },

  hero: { height: 280 },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.20)' },

  mainInfo: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl, paddingBottom: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight, marginBottom: Spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, marginBottom: Spacing.md,
  },
  badgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 10,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  jobTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.h2,
    color: Colors.textPrimary, lineHeight: 30, marginBottom: Spacing.sm,
  },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  companyName: { fontFamily: Typography.fontSemiBold, fontSize: Typography.md, color: Colors.textSecondary },

  infoBoxPad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  infoBox: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  infoIcon: { width: 42, height: 42, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  infoLabel: {
    fontFamily: Typography.fontBold, fontSize: Typography.xs,
    color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2,
  },
  infoValue: { fontFamily: Typography.fontBold, fontSize: Typography.md, color: Colors.textPrimary },
  divider: { height: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.lg },

  descPad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl },
  descTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.xl,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  descCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  descText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md,
    color: Colors.textSecondary, lineHeight: 22,
  },

  applyPad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl },
  applyBtn: {
    backgroundColor: '#dc2626', borderRadius: Radius.xxl,
    paddingVertical: 16, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#dc2626', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  applyBtnDone: { backgroundColor: '#10b981', shadowColor: '#10b981' },
  applyBtnDisabled: { backgroundColor: '#94a3b8', shadowColor: '#94a3b8' },
  applyBtnText: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.lg,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
  },
  applyHint: {
    marginTop: 12, textAlign: 'center', color: Colors.textMuted,
    fontFamily: Typography.fontMedium, fontSize: Typography.sm, lineHeight: 18,
  },
});
