import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, StyleSheet, ActivityIndicator, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Share2, Calendar, MapPin } from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { useFetch } from '../../hooks/useFetch';
import { fetchKvrSingle } from '../../services/api';

const NAVY = '#003366';
const PLACEHOLDER = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800';

function htmlToText(value: string) {
  return value
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

interface Props {
  activityId: string;
  onBack: () => void;
  bottomInset: number;
}

export default function KVRProfileScreen({ activityId, onBack, bottomInset }: Props) {
  const insets = useSafeAreaInsets();
  const { data, loading, error, reload } = useFetch(
    () => fetchKvrSingle(Number(activityId)) as Promise<any>,
    [activityId],
  );

  const handleShare = async () => {
    if (!data) return;
    try {
      await Share.share({
        title: data.title,
        message: data.url ? `${data.title}\n${data.url}` : data.title,
        url: data.url,
      });
    } catch {}
  };

  const articleText = htmlToText(data?.content ?? '');

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
          <ChevronLeft size={20} color={Colors.textPrimary} strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare} activeOpacity={0.75}>
          <Share2 size={18} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#e30613" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.emptyTitle}>Nuk u ngarkua artikulli</Text>
          <Text style={styles.emptyText}>Provo perseri per te pare lajmin e KVR.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>Provo Perseri</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
        >
          <View style={styles.titlePad}>
            {!!data?.category && (
              <View style={styles.catBadge}>
                <Text style={styles.catBadgeText}>{data.category}</Text>
              </View>
            )}
            <Text style={styles.title}>{data?.title ?? ''}</Text>
            <View style={styles.metaRow}>
              {!!data?.date && (
                <View style={styles.metaItem}>
                  <Calendar size={14} color={Colors.textMuted} strokeWidth={2} />
                  <Text style={styles.metaText}>{data.date}</Text>
                </View>
              )}
              {!!data?.date && !!data?.location && <View style={styles.metaDot} />}
              {!!data?.location && (
                <View style={styles.metaItem}>
                  <MapPin size={14} color={Colors.textMuted} strokeWidth={2} />
                  <Text style={styles.metaText}>{data.location}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.heroPad}>
            <View style={styles.heroWrap}>
              <Image source={{ uri: data?.image || PLACEHOLDER }} style={styles.heroImage} resizeMode="cover" />
            </View>
          </View>

          <View style={styles.articlePad}>
            <View style={styles.articleCard}>
              <Text style={styles.articleText}>
                {articleText || data?.excerpt || 'Ky artikull nuk ka pershkrim shtese.'}
              </Text>

              {!!data?.url && (
                <TouchableOpacity style={styles.shareCta} onPress={handleShare} activeOpacity={0.85}>
                  <Share2 size={16} color="#0284c7" strokeWidth={2.2} />
                  <Text style={styles.shareCtaText}>Shperndaje Artikullin</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xxl, gap: 12 },
  emptyTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.md,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: '#e30613',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.full,
    marginTop: 4,
  },
  retryText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.base,
    color: '#fff',
  },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 10,
  },
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

  titlePad: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  catBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e0f2fe',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: Spacing.lg,
  },
  catBadgeText: {
    fontFamily: Typography.fontExtraBold,
    fontSize: 10,
    color: '#0284c7',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  title: {
    fontFamily: Typography.fontExtraBold,
    fontSize: 22,
    color: NAVY,
    lineHeight: 30,
    marginBottom: Spacing.lg,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: Typography.fontBold, fontSize: Typography.sm, color: Colors.textMuted },
  metaDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.borderLight },

  heroPad: { paddingHorizontal: Spacing.xxl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  heroWrap: {
    height: 220,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heroImage: { width: '100%', height: '100%' },

  articlePad: { paddingHorizontal: Spacing.xxl, paddingBottom: Spacing.xxl },
  articleCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.xxl,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  articleText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  shareCta: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bae6fd',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  shareCtaText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.base,
    color: '#0284c7',
  },
});
