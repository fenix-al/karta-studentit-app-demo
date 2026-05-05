import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  Image, ImageBackground, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, PlayCircle, Trophy, Lightbulb, Leaf, Users,
  Calendar, ArrowRight,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../../constants/Theme';
import { KvrActivity } from '../../types';
import { useFetch } from '../../hooks/useFetch';
import { fetchKvr, fetchKvrCategories } from '../../services/api';
import ScreenState from '../../components/ScreenState';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1543269865-cbf427effbad?w=800';
const NAVY = '#003366';
const RED = '#e30613';

type KvrCategory = {
  id: number;
  slug: string;
  name: string;
  count: number;
};

function apiToKvrActivity(k: any): KvrActivity {
  return {
    id: String(k.id),
    title: k.title ?? '',
    category: k.category ?? '',
    catId: k.cat_id ?? '',
    date: k.date ?? '',
    img: k.image || PLACEHOLDER,
    desc: k.excerpt ?? '',
    fullDesc: k.content ?? k.excerpt ?? '',
    location: k.location ?? 'Bashkia Shkodër',
  };
}

function groupStyle(slug: string) {
  const key = slug.toLowerCase();
  if (key.includes('eduk') || key.includes('arsim')) {
    return { icon: 'Lightbulb', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' };
  }
  if (key.includes('mjedis') || key.includes('green')) {
    return { icon: 'Leaf', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' };
  }
  if (key.includes('sport') || key.includes('kultur')) {
    return { icon: 'Trophy', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' };
  }
  return { icon: 'Users', color: '#0284c7', bg: '#eff6ff', border: '#bfdbfe' };
}

function GroupIcon({ name, color, size = 22 }: { name: string; color: string; size?: number }) {
  const props = { size, color, strokeWidth: 2 };
  switch (name) {
    case 'Trophy': return <Trophy {...props} />;
    case 'Lightbulb': return <Lightbulb {...props} />;
    case 'Leaf': return <Leaf {...props} />;
    default: return <Users {...props} />;
  }
}

interface Props {
  onBack: () => void;
  onList: (title: string, catId: string) => void;
  onProfile: (activityId: string) => void;
  bottomInset: number;
}

export default function KVRHubScreen({ onBack, onList, onProfile, bottomInset }: Props) {
  const insets = useSafeAreaInsets();

  const {
    data: feedData,
    loading: feedLoading,
    error: feedError,
    reload: reloadFeed,
  } = useFetch(() => fetchKvr() as Promise<any>);

  const {
    data: categoryData,
    loading: categoryLoading,
    error: categoryError,
    reload: reloadCategories,
  } = useFetch(() => fetchKvrCategories());

  const activities: KvrActivity[] = (feedData?.items ?? []).map(apiToKvrActivity);
  const categories: KvrCategory[] = categoryData ?? [];

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={20} color={Colors.textSecondary} strokeWidth={2.5} />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerSub}>Zeri i Rinisë</Text>
            <Text style={styles.headerTitle}>KVR Shkodër</Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomInset + 24 }}
      >
        <View style={styles.introPad}>
          <Text style={styles.introTitle}>Keshilli Vendor i Rinisë</Text>
          <Text style={styles.introDesc}>
            KVR është një organ keshillimor pranë Kryetarit të Bashkisë dhe perfaqeson zerin e të rinjve ne nivel lokal.
          </Text>

          <TouchableOpacity activeOpacity={0.9} style={styles.videoWrap}>
            <ImageBackground
              source={{ uri: 'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=800&q=80' }}
              style={styles.videoBg}
              imageStyle={styles.videoBgImage}
            >
              <View style={styles.videoOverlay} />
              <View style={styles.playBtn}>
                <PlayCircle size={36} color="#fff" strokeWidth={1.5} />
              </View>
              <View style={styles.videoMeta}>
                <View style={styles.videoDuration}>
                  <Text style={styles.videoDurationText}>KVR</Text>
                </View>
                <Text style={styles.videoLabel}>AKTIVITETE DHE LAJME</Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionMb}>
          <View style={styles.sectionPadH}>
            <Text style={styles.sectionTitle}>Kategoritë e KVR</Text>
            <Text style={styles.sectionSubtitle}>Zgjidh një teme dhe shiko artikujt perkates.</Text>
          </View>

          {categoryLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={RED} />
            </View>
          ) : categoryError ? (
            <View style={styles.centered}>
              <ScreenState
                icon="error"
                title="Gabim ne ngarkim"
                message="Kategoritë e KVR nuk u ngarkuan dot."
                actionLabel="Provo përsëri"
                onAction={reloadCategories}
              />
            </View>
          ) : categories.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            >
              {categories.map((category) => {
                const style = groupStyle(category.slug);
                return (
                  <TouchableOpacity
                    key={category.slug}
                    style={styles.groupCard}
                    onPress={() => onList(category.name, category.slug)}
                    activeOpacity={0.88}
                  >
                    <View style={[styles.groupIconWrap, { backgroundColor: style.bg, borderColor: style.border }]}>
                      <GroupIcon name={style.icon} color={style.color} />
                    </View>
                    <Text style={styles.groupName}>{category.name}</Text>
                    <Text style={styles.groupDesc} numberOfLines={3}>
                      {category.count} postime të publikuara në këtë kategori.
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          ) : (
            <View style={styles.centered}>
              <ScreenState
                icon="empty"
                title="Nuk ka kategori"
                message="Nuk ka kategori të publikuara për momentin."
                actionLabel="Kthehu ne Home"
                onAction={onBack}
              />
            </View>
          )}
        </View>

        <View style={styles.sectionMb}>
          <View style={[styles.sectionHeader, styles.sectionPadH]}>
            <View>
              <Text style={styles.sectionTitle}>Aktivitetet e KVR</Text>
              <Text style={styles.sectionSubtitle}>Ndiqni iniciativat dhe takimet me të fundit.</Text>
            </View>
            <TouchableOpacity
              style={styles.seeAllBtn}
              onPress={() => onList('Të gjitha Aktivitetet', 'all')}
            >
              <Text style={styles.seeAllText}>Të gjitha</Text>
            </TouchableOpacity>
          </View>

          {feedLoading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={RED} />
            </View>
          ) : feedError ? (
            <View style={styles.centered}>
              <ScreenState
                icon="error"
                title="Gabim ne ngarkim"
                message="Postimet e KVR nuk u ngarkuan dot."
                actionLabel="Provo përsëri"
                onAction={reloadFeed}
              />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
            >
              {activities.length ? (
                activities.map((item) => (
                  <KVRActivityCard key={item.id} activity={item} onPress={() => onProfile(item.id)} />
                ))
              ) : (
                <View style={styles.inlineState}>
                  <ScreenState
                    icon="empty"
                    title="Nuk ka postime"
                    message="Kur të publikohen lajme të reja të KVR, do të shfaqen këtu."
                    actionLabel="Kthehu ne Home"
                    onAction={onBack}
                    compact
                  />
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

export function KVRActivityCard({
  activity,
  onPress,
  fullWidth = false,
}: {
  activity: KvrActivity;
  onPress: () => void;
  fullWidth?: boolean;
}) {
  return (
    <TouchableOpacity style={[styles.actCard, fullWidth && styles.actCardFull]} onPress={onPress} activeOpacity={0.9}>
      <View style={styles.actImageWrap}>
        <Image source={{ uri: activity.img }} style={styles.actImage} resizeMode="cover" />
        <View style={styles.actKvrBadge}>
          <Text style={styles.actKvrBadgeText}>KVR</Text>
        </View>
      </View>
      <View style={styles.actBody}>
        <Text style={styles.actTitle} numberOfLines={2}>{activity.title}</Text>
        <Text style={styles.actDesc} numberOfLines={2}>{activity.desc}</Text>
        <View style={styles.actFooter}>
          <View style={styles.actDateRow}>
            <Calendar size={12} color={Colors.textMuted} strokeWidth={2} />
            <Text style={styles.actDate}>{activity.date}</Text>
          </View>
          <View style={styles.actReadMoreRow}>
            <Text style={styles.actReadMore}>Lexo me shumë</Text>
            <ArrowRight size={12} color={NAVY} strokeWidth={2.5} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },
  scroll: { flex: 1 },
  centered: { paddingVertical: 40, justifyContent: 'center', alignItems: 'center', gap: 12 },
  inlineState: { width: 280 },

  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  headerSub: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.xs,
    color: RED,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  headerTitle: { fontFamily: Typography.fontExtraBold, fontSize: Typography.xxl, color: NAVY },
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

  introPad: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    marginBottom: Spacing.xxl,
  },
  introTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: 22,
    color: NAVY,
    marginBottom: 8,
    lineHeight: 28,
  },
  introDesc: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  videoWrap: {
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  videoBg: { width: '100%', height: 192, justifyContent: 'center', alignItems: 'center' },
  videoBgImage: { borderRadius: Radius.xxl },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.32)',
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(227,6,19,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: RED,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  videoMeta: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    right: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  videoDuration: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  videoDurationText: { fontFamily: Typography.fontBold, fontSize: 11, color: '#fff' },
  videoLabel: {
    fontFamily: Typography.fontExtraBold,
    fontSize: 16,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  sectionPadH: { paddingHorizontal: Spacing.xxl },
  sectionMb: { marginBottom: Spacing.xxxl },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xxl,
    color: NAVY,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  seeAllBtn: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  seeAllText: { fontFamily: Typography.fontBold, fontSize: Typography.base, color: '#0284c7' },
  hList: { paddingHorizontal: Spacing.xxl, gap: 14, paddingBottom: 4, paddingTop: 4 },

  groupCard: {
    width: 210,
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  groupIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: Spacing.lg,
  },
  groupName: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: NAVY,
    marginBottom: 6,
    lineHeight: 20,
  },
  groupDesc: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  actCard: {
    width: 252,
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: 'hidden',
  },
  actCardFull: { width: '100%' },
  actImageWrap: { height: 140, backgroundColor: Colors.borderLight },
  actImage: { width: '100%', height: '100%' },
  actKvrBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: NAVY,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  actKvrBadgeText: {
    fontFamily: Typography.fontExtraBold,
    fontSize: 10,
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  actBody: { padding: Spacing.lg },
  actTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.lg,
    color: NAVY,
    lineHeight: 21,
    marginBottom: 6,
  },
  actDesc: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  actFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  actDateRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  actDate: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: Colors.textMuted },
  actReadMoreRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  actReadMore: { fontFamily: Typography.fontBold, fontSize: Typography.xs, color: NAVY },
});
