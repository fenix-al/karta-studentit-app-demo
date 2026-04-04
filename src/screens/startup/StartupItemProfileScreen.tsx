import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Linking, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, Share2, Heart, Calendar,
  Users, FileText, CheckCircle, Rocket,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { StartupItem } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchStartupSingle } from '../../services/api';

interface Props {
  itemId: string;
  onBack: () => void;
  bottomInset: number;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800';

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export default function StartupItemProfileScreen({ itemId, onBack, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const [applied, setApplied] = useState(false);
  const { data, loading, error, reload } = useFetch(() => fetchStartupSingle(Number(itemId)) as Promise<any>, [itemId]);

  const item: StartupItem | null = useMemo(() => {
    if (!data) return null;

    const isCall = !!data.is_call;
    const description = stripHtml(data.content ?? '') || data.title || '';

    return {
      id: String(data.id),
      title: data.title ?? '',
      type: data.type_label ?? 'Startup',
      category: isCall ? 'thirrje' : 'udhezues',
      badgeBg: isCall ? '#fdf4ff' : '#eff6ff',
      badgeText: isCall ? '#7e22ce' : '#1d4ed8',
      badgeBorder: isCall ? '#e9d5ff' : '#bfdbfe',
      date: data.deadline || data.date || '',
      img: data.image || PLACEHOLDER,
      desc: description,
      fullDesc: description,
      criteria: [],
      actionText: isCall ? 'Apliko Tani' : 'Shiko Materialin',
      content: data.content ?? '',
      isCall,
      applyLink: data.apply_link ?? null,
      materials: (data.materials ?? []).map((material: any) => ({
        id: String(material.id),
        title: material.title ?? '',
        desc: material.excerpt ?? '',
      })),
    };
  }, [data]);

  const handlePrimaryAction = async () => {
    if (!item) return;

    if (item.category === 'thirrje') {
      if (!item.applyLink) {
        Alert.alert('Linku mungon', 'Kjo thirrje nuk ka ende nje link aplikimi.');
        return;
      }

      try {
        const supported = await Linking.canOpenURL(item.applyLink);
        if (!supported) {
          Alert.alert('Link i pavlefshem', 'Nuk mund te hapet linku i aplikimit.');
          return;
        }

        await Linking.openURL(item.applyLink);
        setApplied(true);
      } catch {
        Alert.alert('Hapja deshtoi', 'Nuk mund te hapej linku i aplikimit.');
      }
      return;
    }

    if (item.applyLink) {
      try {
        await Linking.openURL(item.applyLink);
      } catch {
        Alert.alert('Hapja deshtoi', 'Nuk mund te hapej materiali.');
      }
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={[styles.root, styles.centered, { paddingTop: insets.top + 24 }]}>
        <TouchableOpacity style={styles.overlayBtn} onPress={onBack} activeOpacity={0.8}>
          <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.errorText}>Startup-i nuk u ngarkua.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={reload} activeOpacity={0.85}>
          <Text style={styles.retryBtnText}>Provo perseri</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isThirrje = item.category === 'thirrje';

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

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >
        <View style={styles.hero}>
          <Image source={{ uri: item.img }} style={styles.heroImage} resizeMode="cover" />
          <View style={styles.heroOverlay} />
        </View>

        <View style={styles.mainInfo}>
          <View style={[styles.badge, { backgroundColor: item.badgeBg, borderColor: item.badgeBorder }]}>
            <Text style={[styles.badgeText, { color: item.badgeText }]}>{item.type}</Text>
          </View>
          {isThirrje && (
            <View style={styles.livePill}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Thirrje Aktive</Text>
            </View>
          )}
          <Text style={styles.itemTitle}>{item.title}</Text>
        </View>

        <View style={styles.infoBoxPad}>
          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: isThirrje ? '#fff1f2' : Colors.surfaceBg }]}>
                <Calendar size={20} color={isThirrje ? '#be123c' : Colors.textSecondary} strokeWidth={2} />
              </View>
              <View>
                <Text style={[styles.infoLabel, isThirrje && { color: '#f43f5e' }]}>
                  {isThirrje ? 'Afati i Aplikimit' : 'Disponueshmeria'}
                </Text>
                <Text style={styles.infoValue}>{item.date}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#ecfdf5' }]}>
                <Rocket size={20} color="#10b981" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Kategoria</Text>
                <Text style={styles.infoValue}>
                  {item.category === 'thirrje' ? 'Thirrje e Hapur' : 'Material Udhezues'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: '#f0f9ff' }]}>
                <FileText size={20} color="#0ea5e9" strokeWidth={2} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Lloji</Text>
                <Text style={styles.infoValue}>{item.type}</Text>
              </View>
            </View>

            {isThirrje && (
              <>
                <View style={styles.divider} />
                <View style={styles.infoRow}>
                  <View style={[styles.infoIcon, { backgroundColor: '#fffbeb' }]}>
                    <Users size={20} color="#f59e0b" strokeWidth={2} />
                  </View>
                  <View>
                    <Text style={styles.infoLabel}>Aplikimet</Text>
                    <Text style={styles.infoValue}>Hapur per te gjithe studentet</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <View style={styles.descPad}>
          <Text style={styles.descTitle}>Pershkrimi</Text>
          <View style={styles.descCard}>
            <Text style={styles.descText}>{item.fullDesc}</Text>
            {!!item.materials?.length && (
              <>
                <Text style={styles.criteriaTitle}>Materiale te lidhura</Text>
                {item.materials.map((material) => (
                  <View key={material.id} style={styles.criteriaRow}>
                    <View style={styles.criteriaDot} />
                    <Text style={styles.criteriaText}>{material.title}</Text>
                  </View>
                ))}
              </>
            )}
          </View>
        </View>

        {isThirrje && (
          <View style={styles.applyPad}>
            <TouchableOpacity
              style={[styles.applyBtn, applied && styles.applyBtnDone]}
              activeOpacity={0.88}
              onPress={handlePrimaryAction}
            >
              <CheckCircle size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.applyBtnText}>
                {applied ? 'Aplikimi u Hap!' : item.actionText}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },
  centered: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xxl, gap: 16 },
  errorText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#10b981',
    borderRadius: Radius.xl,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  retryBtnText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#fff' },

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
  heroOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },

  mainInfo: {
    backgroundColor: Colors.white, paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl, paddingBottom: Spacing.xl,
    borderBottomWidth: 1, borderBottomColor: Colors.borderLight, marginBottom: Spacing.lg,
  },
  badge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: 10, borderWidth: 1, marginBottom: Spacing.sm,
  },
  badgeText: {
    fontFamily: Typography.fontExtraBold, fontSize: 10,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  livePill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: '#ecfdf5', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5, marginBottom: Spacing.md,
  },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10b981' },
  liveText: { fontFamily: Typography.fontBold, fontSize: 12, color: '#065f46' },
  itemTitle: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.h2,
    color: Colors.textPrimary, lineHeight: 30,
  },

  infoBoxPad: { paddingHorizontal: Spacing.xxl, marginBottom: Spacing.lg },
  infoBox: {
    backgroundColor: Colors.white, borderRadius: Radius.xxl + 4,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.xl,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 8,
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
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  descText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md,
    color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.lg,
  },
  criteriaTitle: {
    fontFamily: Typography.fontBold, fontSize: Typography.lg,
    color: Colors.textPrimary, marginBottom: Spacing.md,
  },
  criteriaRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  criteriaDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: '#10b981', marginTop: 7, flexShrink: 0,
  },
  criteriaText: {
    fontFamily: Typography.fontMedium, fontSize: Typography.md,
    color: Colors.textSecondary, lineHeight: 22, flex: 1,
  },

  applyPad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl },
  applyBtn: {
    backgroundColor: '#10b981', borderRadius: Radius.xxl,
    paddingVertical: 16, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 8,
    shadowColor: '#10b981', shadowOpacity: 0.25, shadowRadius: 12,
    shadowOffset: { width: 0, height: 5 }, elevation: 6,
  },
  applyBtnDone: { backgroundColor: '#0ea5e9', shadowColor: '#0ea5e9' },
  applyBtnText: {
    fontFamily: Typography.fontExtraBold, fontSize: Typography.lg,
    color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5,
  },
});
