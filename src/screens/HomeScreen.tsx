import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
} from 'react-native';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  Bell, Search, Star, Home, Gift, QrCode,
  Tag, User, ArrowRight, Globe, Briefcase, Rocket,
  GraduationCap, HandHeart, Landmark, FileText, Heart,
  MessageCircle, LogOut, X, MapPin, Navigation,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius, Gradients } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/mockData';
import { useFetch } from '../hooks/useFetch';
import { fetchOffers, fetchKurset, fetchJobs, fetchStartups, fetchAct4, fetchKvr, recommendBusiness } from '../services/api';
import { apiBizToBusiness, kursToCard, opportunityToCard, startupToCard, act4ToCard, kvrToCard } from '../services/mappers';
import { AppNotification, Business, CardItem, Category, CourseItem, JobItem } from '../types';
import SmartModal from '../components/SmartModal';
import StoryModal from '../components/StoryModal';
import FloatingChat from '../components/FloatingChat';
import OffersNavigator from './offers/OffersNavigator';
import CoursesNavigator from './courses/CoursesNavigator';
import OpportunitiesNavigator from './opportunities/OpportunitiesNavigator';
import StartupNavigator from './startup/StartupNavigator';
import ActNavigator from './act4/ActNavigator';
import KVRNavigator from './kvr/KVRNavigator';
import DigitalCardModal from '../components/DigitalCardModal';
import RewardsScreen from './RewardsScreen';
import ProfileScreen from './ProfileScreen';
import NotificationsScreen from './NotificationsScreen';
import SettingsScreen from './SettingsScreen';

// ── TAB BAR HEIGHT constant (used for ScrollView bottom padding) ──────────────
const TAB_BAR_HEIGHT = 72;
const COURSE_PLACEHOLDER = 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800';

function apiToCourseItem(k: any): CourseItem {
  return {
    id: String(k.id),
    title: k.title ?? '',
    category: k.categories?.[0] ?? 'Kurs',
    categories: k.categories ?? [],
    categorySlugs: k.category_slugs ?? [],
    badgeColor: '#0891b2',
    date: k.start_date ?? '',
    location: k.location ?? 'Shkoder',
    duration: k.duration ?? '-',
    cert: k.certification_text ?? 'Po, pas perfundimit',
    seats:
      typeof k.free_spots === 'number' && k.total_spots
        ? `${k.free_spots} / ${k.total_spots} vende`
        : (k.total_spots ? `${k.total_spots} vende` : ''),
    totalSpots: k.total_spots ?? 0,
    freeSpots: typeof k.free_spots === 'number' ? k.free_spots : null,
    img: k.image || COURSE_PLACEHOLDER,
    desc: k.excerpt ?? '',
    isEnrolled: !!k.is_enrolled,
    enrollStatus: k.enroll_status ?? null,
    canEnroll: !!k.can_enroll,
    content: k.content ?? '',
  };
}

function apiToJobItem(o: any): JobItem {
  const typeSlug = o.type_slugs?.[0] ?? 'all';
  const type = (o.types?.[0] ?? 'Mundesi').toUpperCase();
  let badgeBg = '#e0f2fe';
  let badgeText = '#0369a1';
  let badgeBorder = '#bae6fd';

  if (typeSlug.includes('prakt')) {
    badgeBg = '#f3e8ff'; badgeText = '#7e22ce'; badgeBorder = '#e9d5ff';
  } else if (typeSlug.includes('part')) {
    badgeBg = '#fef9c3'; badgeText = '#854d0e'; badgeBorder = '#fde047';
  } else if (typeSlug.includes('full')) {
    badgeBg = '#dcfce7'; badgeText = '#166534'; badgeBorder = '#86efac';
  } else if (typeSlug.includes('vull')) {
    badgeBg = '#fff1f2'; badgeText = '#be123c'; badgeBorder = '#fecdd3';
  }

  return {
    id: String(o.id),
    title: o.title ?? '',
    company: o.company ?? '',
    type,
    typeSlug,
    typeSlugs: o.type_slugs ?? [],
    badgeBg,
    badgeText,
    badgeBorder,
    date: o.deadline || o.date || '',
    location: o.location || 'Shkoder',
    salary: o.salary ?? '',
    duration: '',
    img: o.image || 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800',
    desc: o.excerpt ?? '',
    applied: !!o.is_applied,
    applyStatus: o.apply_status ?? null,
    canApply: !!o.can_apply,
    content: o.content ?? '',
  };
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { onLogout, card } = useAuth();

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [homeSearch, setHomeSearch] = useState('');

  const { data: offersData, loading: offersLoading, reload: refetchOffers } = useFetch(
    () => fetchOffers(userCoords ? { lat: userCoords.lat, lng: userCoords.lng } : undefined),
    [userCoords],
  );
  const { data: coursesData }  = useFetch(() => fetchKurset());
  const { data: jobsData }     = useFetch(() => fetchJobs());
  const { data: startupsData } = useFetch(() => fetchStartups());
  const { data: act4Data }     = useFetch(() => fetchAct4());
  const { data: kvrData }      = useFetch(() => fetchKvr());

  const rawOffers: any[]  = (offersData as any)?.items ?? [];

  // voteOverrides: id → { votes, recommended } — patched optimistically on inline vote
  const [voteOverrides, setVoteOverrides] = useState<Record<string, { votes: number; recommended: boolean }>>({});

  const realBusinesses = rawOffers.map(apiBizToBusiness).map(biz => {
    const ov = voteOverrides[biz.id];
    return ov ? { ...biz, votes: ov.votes, has_recommended: ov.recommended } : biz;
  });

  const topRecommended    = [...realBusinesses]
    .filter(biz => (biz.votes ?? 0) > 0)
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 10);

  async function handleInlineVote(biz: Business) {
    const current = voteOverrides[biz.id] ?? { votes: biz.votes ?? 0, recommended: biz.has_recommended ?? false };
    const wasRec  = current.recommended;
    // Optimistic update
    setVoteOverrides(prev => ({
      ...prev,
      [biz.id]: { votes: current.votes + (wasRec ? -1 : 1), recommended: !wasRec },
    }));
    try {
      const res = await recommendBusiness(biz.id);
      setVoteOverrides(prev => ({
        ...prev,
        [biz.id]: { votes: res.votes, recommended: res.recommended },
      }));
    } catch {
      // Revert on failure
      setVoteOverrides(prev => ({ ...prev, [biz.id]: current }));
    }
  }

  const courses       = (coursesData as any)?.items?.map(kursToCard)       ?? [];
  const opportunities = (jobsData as any)?.items?.map(opportunityToCard)   ?? [];
  const startups      = (startupsData as any)?.items?.map(startupToCard)   ?? [];
  const act4          = (act4Data as any)?.items?.map(act4ToCard)          ?? [];
  const kvr           = (kvrData as any)?.items?.map(kvrToCard)            ?? [];
  const courseItems: CourseItem[] = ((coursesData as any)?.items ?? []).map(apiToCourseItem);
  const jobItems: JobItem[] = (((jobsData as any)?.items ?? []) as any[]).map(apiToJobItem);
  const [isUserMenuOpen, setIsUserMenuOpen]       = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings]           = useState(false);
  const [activeItem, setActiveItem] = useState<CardItem | null>(null);
  const [storyVisible, setStoryVisible] = useState(false);
  const [storyIndex,   setStoryIndex]   = useState(0);
  const [cardVisible, setCardVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'perfitimet' | 'dhurata' | 'profil' | 'kurset' | 'mundesit' | 'startupet' | 'act4' | 'kvr'>('home');
  const [offersInitialList,     setOffersInitialList]     = useState<string | undefined>(undefined);
  const [offersInitialBusiness, setOffersInitialBusiness] = useState<Business | undefined>(undefined);
  const [coursesInitialList, setCoursesInitialList] = useState<string | undefined>(undefined);
  const [coursesInitialCourse, setCoursesInitialCourse] = useState<CourseItem | undefined>(undefined);
  const [jobsInitialList, setJobsInitialList] = useState<string | undefined>(undefined);
  const [jobsInitialTypeSlug, setJobsInitialTypeSlug] = useState<string | undefined>(undefined);
  const [jobsInitialJob, setJobsInitialJob] = useState<JobItem | undefined>(undefined);
  const [startupsInitialList, setStartupsInitialList] = useState<string | undefined>(undefined);
  const [startupsInitialItemId, setStartupsInitialItemId] = useState<string | undefined>(undefined);
  const [kvrInitialList, setKvrInitialList] = useState<{ title: string; catId: string } | undefined>(undefined);
  const [kvrInitialArticleId, setKvrInitialArticleId] = useState<string | undefined>(undefined);
  const [act4InitialActivityId, setAct4InitialActivityId] = useState<string | undefined>(undefined);

  const handleFindNearMe = async () => {
    if (userCoords) {
      // Already active — tapping again resets to default sort
      setUserCoords(null);
      return;
    }
    setLocLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Vendndodhja e bllokuar',
          'Lejo qasjen te vendndodhja në Cilësimet e telefonit për të gjetur ofertat afër teje.',
          [{ text: 'OK' }],
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      Alert.alert('Gabim', 'Nuk mund të merrej vendndodhja. Provo përsëri.');
    } finally {
      setLocLoading(false);
    }
  };

  const openOffers = (list?: string) => {
    setOffersInitialList(list);
    setActiveTab('perfitimet');
  };

  const openOfferProfile = (business: Business) => {
    setActiveItem(null);
    setOffersInitialList(undefined);
    setOffersInitialBusiness(business);
    setActiveTab('perfitimet');
  };

  const openCourses = (list?: string) => {
    setCoursesInitialList(list);
    setCoursesInitialCourse(undefined);
    setActiveTab('kurset');
  };

  const openCourseProfile = (courseId: string) => {
    const selectedCourse = courseItems.find((course) => course.id === courseId);
    if (!selectedCourse) {
      openCourses('Te gjitha Kurset');
      return;
    }
    setActiveItem(null);
    setCoursesInitialList(undefined);
    setCoursesInitialCourse(selectedCourse);
    setActiveTab('kurset');
  };

  const openJobs = (list?: string) => {
    setJobsInitialList(list);
    setJobsInitialTypeSlug(undefined);
    setJobsInitialJob(undefined);
    setActiveTab('mundesit');
  };

  const openJobProfile = (jobId: string) => {
    const selectedJob = (((jobsData as any)?.items ?? []) as any[]).map(apiToJobItem).find((job) => job.id === jobId);
    if (!selectedJob) {
      openJobs('Te gjitha Mundesite');
      return;
    }
    setActiveItem(null);
    setJobsInitialList(undefined);
    setJobsInitialTypeSlug(undefined);
    setJobsInitialJob(selectedJob);
    setActiveTab('mundesit');
  };

  const openStartups = (list?: string) => {
    setStartupsInitialList(list);
    setStartupsInitialItemId(undefined);
    setActiveTab('startupet');
  };
  const openStartupProfile = (startupId: string) => {
    const exists = (((startupsData as any)?.items ?? []) as any[]).some((startup) => String(startup.id) === startupId);
    if (!exists) {
      openStartups();
      return;
    }
    setActiveItem(null);
    setStartupsInitialList(undefined);
    setStartupsInitialItemId(startupId);
    setActiveTab('startupet');
  };

  const openAct4 = () => {
    setAct4InitialActivityId(undefined);
    setActiveTab('act4');
  };
  const openAct4Profile = (activityId: string) => {
    const exists = (((act4Data as any)?.items ?? []) as any[]).some((activity) => String(activity.id) === activityId);
    if (!exists) {
      openAct4();
      return;
    }
    setActiveItem(null);
    setAct4InitialActivityId(activityId);
    setActiveTab('act4');
  };
  const openKVR = (list?: { title: string; catId: string }) => {
    setKvrInitialList(list);
    setKvrInitialArticleId(undefined);
    setActiveTab('kvr');
  };

  const openKvrArticle = (articleId: string) => {
    const exists = (((kvrData as any)?.items ?? []) as any[]).some((article) => String(article.id) === articleId);
    if (!exists) {
      openKVR();
      return;
    }
    setActiveItem(null);
    setKvrInitialList(undefined);
    setKvrInitialArticleId(articleId);
    setActiveTab('kvr');
  };

  const handleOpenNotification = (notification: AppNotification) => {
    const targetId = notification.postId ? String(notification.postId) : '';

    setShowNotifications(false);

    switch (notification.type) {
      case 'offer': {
        const business = realBusinesses.find((item) => item.id === targetId);
        if (business) {
          openOfferProfile(business);
        } else {
          openOffers('Te Gjitha Ofertat');
        }
        return;
      }
      case 'course':
        if (targetId) openCourseProfile(targetId);
        else openCourses('Te Gjitha Kurset');
        return;
      case 'job':
        if (targetId) openJobProfile(targetId);
        else openJobs('Te Gjitha Mundesite');
        return;
      case 'startup':
        if (targetId) openStartupProfile(targetId);
        else openStartups();
        return;
      case 'act4':
        if (targetId) openAct4Profile(targetId);
        else openAct4();
        return;
      case 'kvr':
        if (targetId) openKvrArticle(targetId);
        else openKVR();
        return;
      case 'raffle':
      case 'points':
        setActiveTab('dhurata');
        return;
      default:
        return;
    }
  };

  const homeSearchResults = useMemo(() => {
    const query = homeSearch.trim().toLowerCase();
    if (!query) return [];

    const results: Array<{ key: string; title: string; subtitle: string; onPress: () => void }> = [];

    realBusinesses.forEach((business) => {
      if (
        business.title.toLowerCase().includes(query) ||
        business.category.toLowerCase().includes(query) ||
        business.discount.toLowerCase().includes(query) ||
        business.desc.toLowerCase().includes(query) ||
        business.address.toLowerCase().includes(query)
      ) {
        results.push({
          key: `biz-${business.id}`,
          title: business.title,
          subtitle: `Përfitime • ${business.category}${business.discount ? ` • ${business.discount}` : ''}`,
          onPress: () => {
            setHomeSearch('');
            openOfferProfile(business);
          },
        });
      }
    });

    courseItems.forEach((course) => {
      if (
        course.title.toLowerCase().includes(query) ||
        course.category.toLowerCase().includes(query) ||
        course.location.toLowerCase().includes(query) ||
        course.desc.toLowerCase().includes(query)
      ) {
        results.push({
          key: `course-${course.id}`,
          title: course.title,
          subtitle: `Kurse • ${course.location}${course.date ? ` • ${course.date}` : ''}`,
          onPress: () => {
            setHomeSearch('');
            openCourseProfile(course.id);
          },
        });
      }
    });

    jobItems.forEach((job) => {
      if (
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query) ||
        job.desc.toLowerCase().includes(query) ||
        job.type.toLowerCase().includes(query)
      ) {
        results.push({
          key: `job-${job.id}`,
          title: job.title,
          subtitle: `Mundësi • ${job.company || job.type}${job.location ? ` • ${job.location}` : ''}`,
          onPress: () => {
            setHomeSearch('');
            openJobProfile(job.id);
          },
        });
      }
    });

    startups.forEach((item: CardItem) => {
      if (
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query) ||
        item.fullDesc.toLowerCase().includes(query) ||
        item.meta.toLowerCase().includes(query)
      ) {
        results.push({
          key: `startup-${item.id}`,
          title: item.title,
          subtitle: `Startup • ${item.type}${item.meta ? ` • ${item.meta}` : ''}`,
          onPress: () => {
            setHomeSearch('');
            openStartupProfile(item.id);
          },
        });
      }
    });

    act4.forEach((item: CardItem) => {
      if (
        item.title.toLowerCase().includes(query) ||
        item.discount.toLowerCase().includes(query) ||
        item.fullDesc.toLowerCase().includes(query) ||
        item.meta.toLowerCase().includes(query)
      ) {
        results.push({
          key: `act4-${item.id}`,
          title: item.title,
          subtitle: `ACT4 • ${item.meta || item.discount}`,
          onPress: () => {
            setHomeSearch('');
            openAct4Profile(item.id);
          },
        });
      }
    });

    kvr.forEach((item: CardItem) => {
      if (
        item.title.toLowerCase().includes(query) ||
        item.discount.toLowerCase().includes(query) ||
        item.fullDesc.toLowerCase().includes(query) ||
        item.meta.toLowerCase().includes(query)
      ) {
        results.push({
          key: `kvr-${item.id}`,
          title: item.title,
          subtitle: `KVR • ${item.meta || item.discount}`,
          onPress: () => {
            setHomeSearch('');
            openKvrArticle(item.id);
          },
        });
      }
    });

    return results.slice(0, 12);
  }, [homeSearch, realBusinesses, courseItems, jobItems, startups, act4, kvr]);

  // Bottom of tab bar = its own height + device safe area
  const tabBarBottom = insets.bottom;

  if (showNotifications) {
    return (
      <View style={styles.root}>
        <NotificationsScreen
          onBack={() => setShowNotifications(false)}
          onOpenNotification={handleOpenNotification}
        />
      </View>
    );
  }

  if (showSettings) {
    return (
      <View style={styles.root}>
        <SettingsScreen onBack={() => setShowSettings(false)} bottomInset={TAB_BAR_HEIGHT + insets.bottom} onLogout={onLogout} />
      </View>
    );
  }

  return (
    <View style={styles.root}>

      {activeTab === 'home' && <>

      {/* ════════════════════════════════════════════════════════════════
          FIXED HEADER  (respects iOS notch / Android status bar)
      ════════════════════════════════════════════════════════════════ */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>

        {/* Left: avatar + greeting */}
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setIsUserMenuOpen(true)} activeOpacity={0.8}>
            <Image source={{ uri: card?.foto_url }} style={styles.avatar} />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>Mirëmëngjes!</Text>
            <Text style={styles.userName}>{card ? card.emeri + ' ' + card.mbiemeri : ''}</Text>
          </View>
        </View>

        {/* Right: notification bell */}
        <TouchableOpacity style={styles.bellBtn} onPress={() => setShowNotifications(true)}>
          <Bell size={20} color={Colors.textPrimary} strokeWidth={2} />
          <View style={styles.notifDot} />
        </TouchableOpacity>

      </View>

      {/* Search bar — below header, still fixed */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={15} color={Colors.textMuted} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Kërko oferta, kurse, startup..."
            placeholderTextColor={Colors.textMuted}
            value={homeSearch}
            onChangeText={setHomeSearch}
            autoCorrect={false}
          />
          <Text style={styles.searchPlaceholder}>Kërko oferta, kurse...</Text>
        </View>
      </View>

      {/* ════════════════════════════════════════════════════════════════
          SCROLLABLE CONTENT
      ════════════════════════════════════════════════════════════════ */}
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: TAB_BAR_HEIGHT + tabBarBottom + 24 }}
      >
        {homeSearch.trim() ? (
          <View style={styles.sectionPad}>
            <View style={styles.searchResultsCard}>
              <Text style={styles.searchResultsTitle}>Rezultatet e kërkimit</Text>
              {homeSearchResults.length > 0 ? (
                homeSearchResults.map((result) => (
                  <TouchableOpacity key={result.key} style={styles.searchResultRow} activeOpacity={0.8} onPress={result.onPress}>
                    <View style={styles.searchResultIcon}>
                      <Search size={14} color={Colors.brandGreenDeep} strokeWidth={2} />
                    </View>
                    <View style={styles.searchResultBody}>
                      <Text style={styles.searchResultTitle}>{result.title}</Text>
                      <Text style={styles.searchResultSubtitle}>{result.subtitle}</Text>
                    </View>
                    <ArrowRight size={16} color={Colors.textMuted} strokeWidth={2.2} />
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.searchEmpty}>Nuk u gjet asnjë rezultat për këtë kërkim.</Text>
              )}
            </View>
          </View>
        ) : null}

        {/* ── SCoins Balance Card ──────────────────────────────────────── */}
        <View style={styles.sectionPad}>
          <View style={styles.scoinsCard}>

            {/* Left: balance info */}
            <View style={styles.scoinsLeft}>
              <View style={styles.scoinsLabelWrap}>
                <Text style={styles.scoinsLabel}>BALANCA JUAJ</Text>
              </View>
              <Text style={styles.scoinsBalance}>{(card?.points ?? 0).toLocaleString()} 🟡</Text>
              <Text style={styles.scoinsSubtitle}>SCoins të grumbulluara</Text>
              <TouchableOpacity style={styles.spendBtn} activeOpacity={0.8} onPress={() => setActiveTab('dhurata')}>
                <Text style={styles.spendBtnText}>Shpenzo Pikët</Text>
                <ArrowRight size={11} color={Colors.brandGreenDeep} strokeWidth={3} />
              </TouchableOpacity>
            </View>

            {/* Right: loyalty badge */}
            <View style={styles.loyaltyBadge}>
              <LinearGradient colors={Gradients.gold} style={styles.loyaltyIconWrap}>
                <Star size={22} color="#fff" fill="#fff" strokeWidth={0} />
              </LinearGradient>
              <Text style={styles.loyaltyCount}>{card?.loyal_businesses_count || '—'}</Text>
              <Text style={styles.loyaltyText}>{'KLIENT\nBESNIK'}</Text>
            </View>

          </View>
        </View>

        {/* ── Categories ───────────────────────────────────────────────── */}
        <View style={styles.sectionMb}>
          <FlatList
            data={CATEGORIES}
            horizontal
            keyExtractor={(_, i) => i.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
            renderItem={({ item }: { item: Category }) => (
              <TouchableOpacity
                style={styles.catItem}
                activeOpacity={0.75}
                onPress={
                  item.name === 'Zbritje' ? () => openOffers('Kategoria: Zbritje') :
                  item.name === 'Kurse'   ? () => openCourses() :
                  item.name === 'Punë'    ? () => openJobs() :
                  item.name === 'Startup'   ? () => openStartups() :
                  item.name === 'Vullnetar' ? () => openAct4() :
                  item.name === 'KVR'      ? () => openKVR() :
                  undefined
                }
              >
                <View style={[styles.catIcon, { backgroundColor: item.bgColor }]}>
                  <Text style={[styles.catEmoji, item.isText && styles.catSymbol]}>
                    {item.icon}
                  </Text>
                </View>
                <Text style={styles.catName}>{item.name}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* ── Oferta pranë teje (Businesses) ───────────────────────────── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Oferta pranë teje</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={handleFindNearMe}
              activeOpacity={0.8}
              style={[styles.nearMePill, userCoords ? styles.nearMePillActive : null]}
            >
              {locLoading ? (
                <ActivityIndicator size={11} color={userCoords ? '#fff' : Colors.brandGreenText} />
              ) : (
                <Navigation size={11} color={userCoords ? '#fff' : Colors.brandGreenText} strokeWidth={2.5} />
              )}
              <Text style={[styles.nearMeText, userCoords ? styles.nearMeTextActive : null]}>
                {locLoading ? 'Duke kërkuar...' : userCoords ? 'Pranë Teje ✓' : 'Gjej Afër Meje'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openOffers()}>
              <Text style={styles.seeAll}>Shiko të gjitha</Text>
            </TouchableOpacity>
          </View>
        </View>
        {offersLoading ? (
          <View style={styles.offerLoader}>
            <ActivityIndicator size="small" color={Colors.textMuted} />
          </View>
        ) : (
          <FlatList
            data={realBusinesses}
            horizontal
            keyExtractor={biz => biz.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hList}
            renderItem={({ item: biz, index }) => (
              <TouchableOpacity
                style={styles.bizCard}
                onPress={() => { setStoryIndex(index); setStoryVisible(true); }}
                activeOpacity={0.92}
              >
                {/* Image */}
                <View style={styles.bizImageWrap}>
                  <Image source={{ uri: biz.img }} style={styles.bizImage} resizeMode="cover" />
                  {/* Top-left badge */}
                  <View style={[styles.bizBadge, { backgroundColor: biz.badgeColor }]}>
                    <Text style={styles.bizBadgeText}>{biz.discount}</Text>
                  </View>
                  {/* Bottom-right votes chip — only shown when votes > 0 */}
                  {biz.votes > 0 && (
                    <View style={styles.ratingChip}>
                      <Heart size={10} color="#ef4444" fill="#ef4444" strokeWidth={0} />
                      <Text style={styles.ratingText}>{biz.votes}</Text>
                    </View>
                  )}
                </View>
                {/* Body */}
                <View style={styles.bizBody}>
                  {/* Title — single line with ellipsis */}
                  <Text style={styles.bizTitle} numberOfLines={1} ellipsizeMode="tail">
                    {biz.title}
                  </Text>

                  {/* Category chip */}
                  <View style={styles.bizCategoryChip}>
                    <Text style={styles.bizCategoryText}>{biz.category}</Text>
                  </View>

                  {/* Address row with pin icon */}
                  <View style={styles.bizAddressRow}>
                    <MapPin size={11} color="#f43f5e" strokeWidth={2.5} />
                    <Text style={styles.bizMeta} numberOfLines={1} ellipsizeMode="tail">
                      {biz.address || '—'}
                    </Text>
                  </View>

                  {/* Distance (location mode only) */}
                  {formatDistance(biz.distance) ? (
                    <View style={styles.distanceRow}>
                      <MapPin size={11} color={Colors.brandGreenText} strokeWidth={2.5} />
                      <Text style={styles.distanceText}>{formatDistance(biz.distance)}</Text>
                    </View>
                  ) : null}

                  {/* Rekomando — pinned to bottom via marginTop: 'auto' */}
                  <TouchableOpacity
                    style={[styles.rekoBtn, biz.has_recommended && styles.rekoBtnActive]}
                    onPress={() => handleInlineVote(biz)}
                    activeOpacity={0.8}
                  >
                    <Heart size={12} color={biz.has_recommended ? '#fff' : '#0ea5e9'} fill={biz.has_recommended ? '#fff' : 'none'} strokeWidth={2.5} />
                    <Text style={[styles.rekoBtnText, biz.has_recommended && styles.rekoBtnTextActive]}>
                      {biz.votes > 0 ? `${biz.votes} Rekomandime` : 'Rekomando'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {/* ── Më të rekomanduarat ──────────────────────────────────────── */}
        {topRecommended.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Më të rekomanduarat</Text>
              <TouchableOpacity onPress={() => openOffers()}>
                <Text style={styles.seeAll}>Shiko të gjitha</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={topRecommended}
              horizontal
              keyExtractor={biz => `top-${biz.id}`}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hList}
              renderItem={({ item: biz }) => (
                <TouchableOpacity
                  style={styles.bizCard}
                  onPress={() => { setOffersInitialBusiness(biz); setActiveTab('perfitimet'); }}
                  activeOpacity={0.92}
                >
                  <View style={styles.bizImageWrap}>
                    <Image source={{ uri: biz.img }} style={styles.bizImage} resizeMode="cover" />
                    <View style={[styles.bizBadge, { backgroundColor: biz.badgeColor }]}>
                      <Text style={styles.bizBadgeText}>{biz.discount}</Text>
                    </View>
                    {biz.votes > 0 && (
                      <View style={styles.ratingChip}>
                        <Heart size={10} color="#ef4444" fill="#ef4444" strokeWidth={0} />
                        <Text style={styles.ratingText}>{biz.votes}</Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.bizBody}>
                    <Text style={styles.bizTitle} numberOfLines={1} ellipsizeMode="tail">
                      {biz.title}
                    </Text>
                    <View style={styles.bizCategoryChip}>
                      <Text style={styles.bizCategoryText}>{biz.category}</Text>
                    </View>
                    <View style={styles.bizAddressRow}>
                      <MapPin size={11} color="#f43f5e" strokeWidth={2.5} />
                      <Text style={styles.bizMeta} numberOfLines={1} ellipsizeMode="tail">
                        {biz.address || '—'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.rekoBtn, biz.has_recommended && styles.rekoBtnActive]}
                      onPress={() => handleInlineVote(biz)}
                      activeOpacity={0.8}
                    >
                      <Heart size={12} color={biz.has_recommended ? '#fff' : '#0ea5e9'} fill={biz.has_recommended ? '#fff' : 'none'} strokeWidth={2.5} />
                      <Text style={[styles.rekoBtnText, biz.has_recommended && styles.rekoBtnTextActive]}>
                        {biz.votes > 0 ? `${biz.votes} Rekomandime` : 'Rekomando'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              )}
            />
          </>
        )}

        {/* ── Kurse & Trajnime (Bento Box) ─────────────────────────────── */}
        <SectionHeader title="Kurse & Trajnime" onSeeAll={() => openCourses('Të gjitha Kurset')} />
        <View style={styles.sectionPad}>
          <View style={styles.bentoRow}>

            {/* LEFT — tall card */}
            {courses[0] && (
            <TouchableOpacity
              style={[styles.bentoLeft, { backgroundColor: '#F0F9FF', borderColor: '#E0F2FE' }]}
              onPress={() => setActiveItem(courses[0])}
              activeOpacity={0.9}
            >
              <View style={styles.bentoIconCircle}>
                <Globe size={24} color="#0ea5e9" strokeWidth={2} />
              </View>
              <Text style={[styles.bentoTitleLg, { color: '#0c4a6e' }]}>{courses[0].title}</Text>
              <Text style={[styles.bentoMeta, { color: '#075985', flex: 1 }]}>{courses[0].meta}</Text>
              <View style={styles.bentoRegBtn}>
                <Text style={styles.bentoRegBtnText}>{courses[0].actionText}</Text>
              </View>
            </TouchableOpacity>
            )}

            {/* RIGHT — two stacked small cards */}
            <View style={styles.bentoRight}>

              {courses[1] && (
              <TouchableOpacity
                style={[styles.bentoSmall, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}
                onPress={() => setActiveItem(courses[1])}
                activeOpacity={0.9}
              >
                <View style={styles.bentoSmallRow}>
                  <View style={styles.bentoIconCircleSmall}>
                    <Briefcase size={18} color="#f97316" strokeWidth={2} />
                  </View>
                  <Text style={[styles.bentoTitleSm, { color: '#7c2d12' }]} numberOfLines={2}>
                    {courses[1].title}
                  </Text>
                </View>
                <Text style={[styles.bentoMetaSm, { color: '#c2410c' }]}>{courses[1].meta}</Text>
              </TouchableOpacity>
              )}

              {courses[2] && (
              <TouchableOpacity
                style={[styles.bentoSmall, { backgroundColor: '#F5F3FF', borderColor: '#EDE9FE' }]}
                onPress={() => setActiveItem(courses[2])}
                activeOpacity={0.9}
              >
                <View style={styles.bentoSmallRow}>
                  <View style={styles.bentoIconCircleSmall}>
                    <Rocket size={18} color="#a855f7" strokeWidth={2} />
                  </View>
                  <Text style={[styles.bentoTitleSm, { color: '#4c1d95' }]} numberOfLines={2}>
                    {courses[2].title}
                  </Text>
                </View>
                <Text style={[styles.bentoMetaSm, { color: '#7e22ce' }]}>{courses[2].meta}</Text>
              </TouchableOpacity>
              )}

            </View>
          </View>
        </View>

        {/* ── Mundësi Pune (Opportunities) ─────────────────────────────── */}
        <SectionHeader title="Mundësi Pune" onSeeAll={() => openJobs()} />
        <FlatList
          data={opportunities}
          horizontal
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          renderItem={({ item }) => <GenericCard item={item} onPress={() => setActiveItem(item)} />}
        />

        {/* ── Startup & Ide ─────────────────────────────────────────────── */}
        <SectionHeader title="Startup & Ide" onSeeAll={() => openStartups()} />
        <FlatList
          data={startups}
          horizontal
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          renderItem={({ item }) => <GenericCard item={item} onPress={() => setActiveItem(item)} />}
        />

        {/* ── ACT4Shkodra ──────────────────────────────────────────────── */}
        <SectionHeader title="ACT4Shkodra" onSeeAll={() => openAct4()} />
        <FlatList
          data={act4}
          horizontal
          keyExtractor={item => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.hList}
          renderItem={({ item }) => <GenericCard item={item} onPress={() => setActiveItem(item)} />}
        />

        {/* ── KVR Lajme (vertical stack — horizontal card row) ─────── */}
        <SectionHeader title="KVR — Zëri i Rinisë" onSeeAll={() => openKVR()} />
        <View style={styles.kvrList}>
          {kvr.map((item: CardItem) => (
            <TouchableOpacity
              key={item.id}
              style={styles.kvrCard}
              onPress={() => setActiveItem(item)}
              activeOpacity={0.92}
            >
              <View style={styles.kvrImageWrap}>
                <Image source={{ uri: item.img }} style={styles.kvrImage} resizeMode="cover" />
              </View>
              <View style={styles.kvrBody}>
                <Text style={[styles.kvrType, { color: item.badgeColor }]}>{item.discount}</Text>
                <Text style={styles.kvrTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.kvrMeta}>{item.meta}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════
          FLOATING CHAT STICKER — above tab bar
      ════════════════════════════════════════════════════════════════ */}
      <View
        style={[
          styles.chatWrapper,
          { bottom: TAB_BAR_HEIGHT + tabBarBottom + 80 },
        ]}
      >
        <FloatingChat />
      </View>

      </>}

      {activeTab === 'perfitimet' && (
        <OffersNavigator
          onExit={() => { setActiveTab('home'); setOffersInitialBusiness(undefined); refetchOffers(); }}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
          initialList={offersInitialList}
          initialBusiness={offersInitialBusiness}
        />
      )}

      {activeTab === 'kurset' && (
        <CoursesNavigator
          onExit={() => setActiveTab('home')}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
          initialList={coursesInitialList}
          initialCourse={coursesInitialCourse}
        />
      )}

      {activeTab === 'mundesit' && (
        <OpportunitiesNavigator
          onExit={() => setActiveTab('home')}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
          initialList={jobsInitialList}
          initialTypeSlug={jobsInitialTypeSlug}
          initialJob={jobsInitialJob}
        />
      )}

      {activeTab === 'kvr' && (
        <KVRNavigator
          onExit={() => setActiveTab('home')}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
          initialList={kvrInitialList}
          initialActivityId={kvrInitialArticleId}
        />
      )}

      {activeTab === 'act4' && (
        <ActNavigator
          onExit={() => setActiveTab('home')}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
          initialActivityId={act4InitialActivityId}
        />
      )}

      {activeTab === 'startupet' && (
        <StartupNavigator
          onExit={() => setActiveTab('home')}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
          initialList={startupsInitialList}
          initialItemId={startupsInitialItemId}
        />
      )}

      {activeTab === 'dhurata' && (
        <RewardsScreen bottomInset={TAB_BAR_HEIGHT + tabBarBottom} onBack={() => setActiveTab('home')} />
      )}

      {activeTab === 'profil' && (
        <ProfileScreen
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
          onBack={() => setActiveTab('home')}
          onSettings={() => setShowSettings(true)}
        />
      )}

      {/* ════════════════════════════════════════════════════════════════
          CUSTOM BOTTOM TAB BAR
      ════════════════════════════════════════════════════════════════ */}
      <View style={[styles.tabBarOuter, { paddingBottom: tabBarBottom || 16 }]}>
        <BlurView intensity={80} tint="light" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />

        {/* Home */}
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('home')}>
          <Home size={24} color={activeTab === 'home' ? Colors.tabActive : Colors.tabInactive} strokeWidth={activeTab === 'home' ? 2.5 : 2} />
          <Text style={[styles.tabLabel, { color: activeTab === 'home' ? Colors.tabActive : Colors.tabInactive, fontFamily: activeTab === 'home' ? Typography.fontBold : Typography.fontMedium }]}>Kreu</Text>
        </TouchableOpacity>

        {/* Përfitimet */}
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('perfitimet')}>
          <Tag size={24} color={activeTab === 'perfitimet' ? Colors.tabActive : Colors.tabInactive} strokeWidth={activeTab === 'perfitimet' ? 2.5 : 2} />
          <Text style={[styles.tabLabel, { color: activeTab === 'perfitimet' ? Colors.tabActive : Colors.tabInactive, fontFamily: activeTab === 'perfitimet' ? Typography.fontBold : Typography.fontMedium }]}>Përfito</Text>
        </TouchableOpacity>

        {/* Center FAB — QR code, breaks out of tab bar */}
        <TouchableOpacity style={styles.fabWrapper} activeOpacity={0.85} onPress={() => setCardVisible(v => !v)}>
          <View style={[styles.fab, { borderColor: Colors.surfaceBg }]}>
            <QrCode size={28} color={Colors.brandGreenDeep} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Dhurata */}
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('dhurata')}>
          <Gift size={24} color={activeTab === 'dhurata' ? Colors.tabActive : Colors.tabInactive} strokeWidth={activeTab === 'dhurata' ? 2.5 : 2} />
          <Text style={[styles.tabLabel, { color: activeTab === 'dhurata' ? Colors.tabActive : Colors.tabInactive, fontFamily: activeTab === 'dhurata' ? Typography.fontBold : Typography.fontMedium }]}>Dhurata</Text>
        </TouchableOpacity>

        {/* Profile */}
        <TouchableOpacity style={styles.tabItem} onPress={() => setActiveTab('profil')}>
          <User size={24} color={activeTab === 'profil' ? Colors.tabActive : Colors.tabInactive} strokeWidth={activeTab === 'profil' ? 2.5 : 2} />
          <Text style={[styles.tabLabel, { color: activeTab === 'profil' ? Colors.tabActive : Colors.tabInactive, fontFamily: activeTab === 'profil' ? Typography.fontBold : Typography.fontMedium }]}>Profili</Text>
        </TouchableOpacity>

      </View>

      {/* ════════════════════════════════════════════════════════════════
          SMART MODAL — full screen story overlay
      ════════════════════════════════════════════════════════════════ */}
      <SmartModal
        item={activeItem}
        onClose={() => setActiveItem(null)}
        onAction={(item) => {
          if (item.type === 'kurs') {
            openCourseProfile(item.id);
          }
          if (item.type !== 'kurs' && (((jobsData as any)?.items ?? []) as any[]).some((job) => String(job.id) === item.id)) {
            openJobProfile(item.id);
          }
          if ((((kvrData as any)?.items ?? []) as any[]).some((article) => String(article.id) === item.id)) {
            openKvrArticle(item.id);
          }
          if ((((act4Data as any)?.items ?? []) as any[]).some((activity) => String(activity.id) === item.id)) {
            openAct4Profile(item.id);
          }
          if ((((startupsData as any)?.items ?? []) as any[]).some((startup) => String(startup.id) === item.id)) {
            openStartupProfile(item.id);
          }
        }}
      />
      <StoryModal visible={storyVisible} stories={realBusinesses} initialIndex={storyIndex} onClose={() => setStoryVisible(false)} onViewProfile={(biz) => { setOffersInitialBusiness(biz); setActiveTab('perfitimet'); }} />
      <DigitalCardModal visible={cardVisible} onClose={() => setCardVisible(false)} />

      {/* ════════════════════════════════════════════════════════════════
          SUPER MENU — Avatar bottom sheet
      ════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={isUserMenuOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setIsUserMenuOpen(false)}
      >
        {/* Backdrop */}
        <TouchableOpacity
          style={menuStyles.backdrop}
          activeOpacity={1}
          onPress={() => setIsUserMenuOpen(false)}
        />

        {/* Sheet */}
        <View style={[menuStyles.sheet, { paddingBottom: (insets.bottom || 16) + 8 }]}>

          {/* Pull pill */}
          <View style={menuStyles.pill} />

          {/* Header */}
          <View style={menuStyles.menuHeader}>
            <View style={menuStyles.menuHeaderLeft}>
              <Image source={{ uri: card?.foto_url }} style={menuStyles.menuAvatar} />
              <View>
                <Text style={menuStyles.menuName}>{card ? card.emeri + ' ' + card.mbiemeri : ''}</Text>
                <Text style={menuStyles.menuNim}>Karta: {card?.nr_karte ?? ''}</Text>
              </View>
            </View>
            <TouchableOpacity style={menuStyles.closeBtn} onPress={() => setIsUserMenuOpen(false)}>
              <X size={18} color="#64748b" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Grid title */}
          <Text style={menuStyles.gridTitle}>Shërbimet & Veprimet</Text>

          {/* 4-column action grid */}
          <View style={menuStyles.grid}>
            {[
              { icon: <GraduationCap size={24} color="#3b82f6" strokeWidth={2} />, bg: '#eff6ff', label: 'Kurse',        onPress: () => { setIsUserMenuOpen(false); openCourses(); } },
              { icon: <Briefcase     size={24} color="#a855f7" strokeWidth={2} />, bg: '#faf5ff', label: 'Punë',         onPress: () => { setIsUserMenuOpen(false); openJobs(); } },
              { icon: <Rocket        size={24} color="#10b981" strokeWidth={2} />, bg: '#ecfdf5', label: 'Startup',      onPress: () => { setIsUserMenuOpen(false); openStartups(); } },
              { icon: <HandHeart     size={24} color="#f97316" strokeWidth={2} />, bg: '#fff7ed', label: 'Vullnetar',   onPress: () => { setIsUserMenuOpen(false); openAct4(); } },
              { icon: <Landmark      size={24} color="#475569" strokeWidth={2} />, bg: '#f1f5f9', label: 'KVR',          onPress: () => { setIsUserMenuOpen(false); openKVR(); } },
              { icon: <Gift          size={24} color="#f59e0b" strokeWidth={2} />, bg: '#fffbeb', label: 'Dhuratat',    onPress: () => { setIsUserMenuOpen(false); setActiveTab('dhurata'); } },
              { icon: <FileText      size={24} color="#6366f1" strokeWidth={2} />, bg: '#eef2ff', label: 'Aplikimet',   onPress: () => { setIsUserMenuOpen(false); setActiveTab('profil'); } },
              { icon: <Heart         size={24} color="#f43f5e" strokeWidth={2} />, bg: '#fff1f2', label: 'Të Ruajtura', onPress: () => setIsUserMenuOpen(false) },
              { icon: <MessageCircle size={24} color="#0ea5e9" strokeWidth={2} />, bg: '#f0f9ff', label: 'Suporti',     onPress: () => setIsUserMenuOpen(false) },
              { icon: <User          size={24} color="#334155" strokeWidth={2} />, bg: '#f8fafc', label: 'Profili Im',  onPress: () => { setIsUserMenuOpen(false); setActiveTab('profil'); } },
              { icon: <LogOut        size={24} color="#ef4444" strokeWidth={2} />, bg: '#fef2f2', label: 'Dil',          onPress: () => setIsUserMenuOpen(false) },
            ].map(({ icon, bg, label, onPress }) => (
              <TouchableOpacity key={label} style={menuStyles.actionItem} onPress={onPress} activeOpacity={0.75}>
                <View style={[menuStyles.actionIcon, { backgroundColor: bg }]}>{icon}</View>
                <Text style={menuStyles.actionLabel}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Promo banner */}
          <TouchableOpacity activeOpacity={0.9} onPress={() => { setIsUserMenuOpen(false); setCardVisible(true); }}>
            <LinearGradient
              colors={['#0ea5e9', '#2563eb']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={menuStyles.promoBanner}
            >
              <View>
                <Text style={menuStyles.promoTitle}>Karta Ime Dixhitale</Text>
                <Text style={menuStyles.promoSub}>E vlefshme deri më 2029</Text>
              </View>
              <View style={menuStyles.promoBtn}>
                <Text style={menuStyles.promoBtnText}>Shfaq</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>

        </View>
      </Modal>

    </View>
  );
}

// ── Distance formatter ────────────────────────────────────────────────────────
function formatDistance(km: number | null | undefined): string | null {
  if (km == null) return null;
  if (km < 1) return `${Math.round(km * 1000)}m larg`;
  return `${km.toFixed(1)}km larg`;
}

// ── Small reusable components ─────────────────────────────────────────────────

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onSeeAll}>
        <Text style={styles.seeAll}>Shiko të gjitha</Text>
      </TouchableOpacity>
    </View>
  );
}

function GenericCard({ item, onPress }: { item: CardItem; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.bizCard} onPress={onPress} activeOpacity={0.92}>
      <View style={styles.bizImageWrap}>
        <Image source={{ uri: item.img }} style={styles.bizImage} resizeMode="cover" />
        <View style={[styles.bizBadge, { backgroundColor: item.badgeColor }]}>
          <Text style={styles.bizBadgeText}>{item.discount}</Text>
        </View>
      </View>
      <View style={styles.bizBody}>
        <Text style={styles.bizTitle}>{item.title}</Text>
        <Text style={styles.bizMeta}>{item.meta}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.surfaceBg,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal: Spacing.xxl,
    paddingBottom:    Spacing.lg,
    backgroundColor:  Colors.surfaceBg,
    zIndex:           10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           12,
  },
  avatar: {
    width:        48,
    height:       48,
    borderRadius: 24,
    borderWidth:  1,
    borderColor:  Colors.border,
  },
  greeting: {
    fontFamily:    Typography.fontSemiBold,
    fontSize:      Typography.xs,
    color:         Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom:  2,
  },
  userName: {
    fontFamily: Typography.fontExtraBold,
    fontSize:   Typography.xl,
    color:      Colors.textPrimary,
  },
  bellBtn: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.white,
    justifyContent:  'center',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.border,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  notifDot: {
    position:        'absolute',
    top:             9,
    right:           9,
    width:           8,
    height:          8,
    borderRadius:    4,
    backgroundColor: Colors.danger,
    borderWidth:     2,
    borderColor:     Colors.white,
  },

  // ── Search ───────────────────────────────────────────────────────────────────
  searchWrap: {
    paddingHorizontal: Spacing.xxl,
    paddingBottom:     Spacing.md,
    backgroundColor:   Colors.surfaceBg,
    zIndex:            10,
  },
  searchBar: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
    backgroundColor: Colors.white,
    borderRadius:    Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingVertical:   14,
    borderWidth:     1,
    borderColor:     Colors.border,
    shadowColor:     '#000',
    shadowOpacity:   0.04,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       1,
  },
  searchInput: {
    flex:       1,
    fontFamily: Typography.fontMedium,
    fontSize:   Typography.base,
    color:      Colors.textPrimary,
    padding:    0,
  },
  searchPlaceholder: {
    display: 'none',
  },
  searchResultsCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchResultsTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  searchResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  searchResultIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.brandGreenBg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchResultBody: {
    flex: 1,
  },
  searchResultTitle: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.base,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  searchResultSubtitle: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textSecondary,
  },
  searchEmpty: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  // ── Scroll ───────────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  sectionPad: {
    paddingHorizontal: Spacing.xxl,
    marginBottom:      Spacing.xxxl,
  },
  sectionMb: {
    marginBottom: Spacing.xxxl,
  },

  // ── SCoins card ──────────────────────────────────────────────────────────────
  scoinsCard: {
    backgroundColor: Colors.brandGreenBg,
    borderRadius:    Radius.xxl + 4,
    padding:         Spacing.xxl,
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    borderWidth:     1,
    borderColor:     Colors.brandGreenBorder,
    shadowColor:     Colors.brandGreen,
    shadowOpacity:   0.15,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       4,
  },
  scoinsLeft: {
    flex: 1,
  },
  scoinsLabelWrap: {
    backgroundColor: 'rgba(255,255,255,0.55)',
    alignSelf:       'flex-start',
    paddingHorizontal: 8,
    paddingVertical:   4,
    borderRadius:    6,
    marginBottom:    8,
  },
  scoinsLabel: {
    fontFamily:    Typography.fontBold,
    fontSize:      Typography.xs,
    color:         Colors.brandGreenText,
    letterSpacing: 0.8,
  },
  scoinsBalance: {
    fontFamily: Typography.fontExtraBold,
    fontSize:   30,
    color:      Colors.brandGreenDeep,
    marginBottom: 4,
  },
  scoinsSubtitle: {
    fontFamily: Typography.fontSemiBold,
    fontSize:   Typography.base,
    color:      Colors.brandGreenText,
    opacity:    0.85,
  },
  spendBtn: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             4,
    backgroundColor: 'rgba(255,255,255,0.70)',
    alignSelf:       'flex-start',
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:    Radius.md,
    marginTop:       14,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.60)',
  },
  spendBtnText: {
    fontFamily: Typography.fontExtraBold,
    fontSize:   Typography.xs,
    color:      Colors.brandGreenDeep,
  },
  // Loyalty badge (glassmorphism card on right of scoins)
  loyaltyBadge: {
    backgroundColor: 'rgba(255,255,255,0.60)',
    borderRadius:    Radius.xxl - 2,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.70)',
    padding:         14,
    alignItems:      'center',
    justifyContent:  'center',
    marginLeft:      12,
  },
  loyaltyIconWrap: {
    width:        48,
    height:       48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems:     'center',
    borderWidth:    2,
    borderColor:    '#fff',
    marginBottom:   8,
  },
  loyaltyCount: {
    fontFamily: Typography.fontExtraBold,
    fontSize:   Typography.lg,
    color:      Colors.brandGreenDeep,
  },
  loyaltyText: {
    fontFamily:  Typography.fontBold,
    fontSize:    9,
    color:       Colors.brandGreenText,
    textAlign:   'center',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    lineHeight:  13,
  },

  // ── Categories ───────────────────────────────────────────────────────────────
  categoriesList: {
    paddingHorizontal: Spacing.xxl,
    gap:               16,
  },
  catItem: {
    alignItems: 'center',
    gap:        8,
  },
  catIcon: {
    width:        68,
    height:       68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems:     'center',
    borderWidth:    1,
    borderColor:    'rgba(255,255,255,0.6)',
  },
  catEmoji: {
    fontSize: 28,
  },
  catSymbol: {
    fontFamily: Typography.fontExtraBold,
    fontSize:   24,
    color:      Colors.textPrimary,
  },
  catName: {
    fontFamily: Typography.fontBold,
    fontSize:   Typography.xs,
    color:      Colors.textPrimary,
  },

  // ── "Gjej Afër Meje" location pill ──────────────────────────────────────────
  nearMePill: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               5,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      20,
    borderWidth:       1,
    borderColor:       Colors.brandGreenBorder,
    backgroundColor:   Colors.brandGreenBg,
  },
  nearMePillActive: {
    backgroundColor: Colors.brandGreen,
    borderColor:     Colors.brandGreen,
  },
  nearMeText: {
    fontFamily: Typography.fontBold,
    fontSize:   11,
    color:      Colors.brandGreenText,
  },
  nearMeTextActive: {
    color: '#fff',
  },

  // ── Section header ───────────────────────────────────────────────────────────
  sectionHeader: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'flex-end',
    paddingHorizontal: Spacing.xxl,
    marginBottom:     Spacing.lg,
  },
  sectionTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize:   Typography.xxl,
    color:      Colors.textPrimary,
  },
  seeAll: {
    fontFamily: Typography.fontBold,
    fontSize:   Typography.md,
    color:      '#0ea5e9',
  },

  // ── Business / Generic card ──────────────────────────────────────────────────
  hList: {
    paddingHorizontal: Spacing.xxl,
    gap:               16,
    paddingBottom:     Spacing.xxl,
    paddingTop:        4,
  },
  offerLoader: {
    height: 180, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  bizCard: {
    width:           280,
    backgroundColor: Colors.white,
    borderRadius:    Radius.xxl,
    overflow:        'hidden',
    borderWidth:     1,
    borderColor:     Colors.borderLight,
    shadowColor:     '#000',
    shadowOpacity:   0.06,
    shadowRadius:    16,
    shadowOffset:    { width: 0, height: 6 },
    elevation:       3,
  },
  bizImageWrap: {
    height:          192,
    backgroundColor: Colors.borderLight,
  },
  bizImage: {
    width:  '100%',
    height: '100%',
  },
  bizBadge: {
    position:        'absolute',
    top:             14,
    left:            14,
    paddingHorizontal: 10,
    paddingVertical:   6,
    borderRadius:    Radius.md,
  },
  bizBadgeText: {
    color:         '#fff',
    fontFamily:    Typography.fontExtraBold,
    fontSize:      10,
    textTransform: 'uppercase',
  },
  ratingChip: {
    position:        'absolute',
    bottom:          10,
    right:           10,
    backgroundColor: 'rgba(0,0,0,0.60)',
    flexDirection:   'row',
    alignItems:      'center',
    gap:             5,
    paddingHorizontal: 9,
    paddingVertical:   6,
    borderRadius:    Radius.sm + 2,
  },
  ratingText: {
    color:      '#fff',
    fontFamily: Typography.fontBold,
    fontSize:   11,
  },
  bizBody: {
    padding:        20,
    flex:           1,
    flexDirection:  'column',
  },
  bizTitle: {
    fontFamily:   Typography.fontBold,
    fontSize:     Typography.xl,
    color:        Colors.textPrimary,
    marginBottom: 8,
  },
  bizCategoryChip: {
    alignSelf:         'flex-start',
    backgroundColor:   Colors.brandGreenBg,
    borderRadius:      6,
    paddingHorizontal: 8,
    paddingVertical:   3,
    marginBottom:      8,
  },
  bizCategoryText: {
    fontFamily:    Typography.fontBold,
    fontSize:      10,
    color:         Colors.brandGreenText,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bizAddressRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginBottom:  8,
  },
  bizMeta: {
    fontFamily: Typography.fontMedium,
    fontSize:   Typography.xs,
    color:      Colors.textSecondary,
    flex:       1,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           4,
    marginTop:     5,
  },
  distanceText: {
    fontFamily: Typography.fontBold,
    fontSize:   Typography.xs,
    color:      Colors.brandGreenText,
  },
  rekoBtn: {
    marginTop:      'auto',
    backgroundColor:'#f0f9ff',
    paddingVertical: 8,
    borderRadius:   8,
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    gap:            5,
  },
  rekoBtnText: {
    fontFamily: Typography.fontBold,
    fontSize:   12,
    color:      '#0ea5e9',
  },
  rekoBtnActive: {
    backgroundColor: '#0ea5e9',
  },
  rekoBtnTextActive: {
    color: '#fff',
  },

  // ── Bento Box ─────────────────────────────────────────────────────────────────
  bentoRow: {
    flexDirection: 'row',
    gap:           12,
  },
  bentoLeft: {
    flex:         1,
    borderRadius: Radius.xxl,
    padding:      Spacing.xl,
    borderWidth:  1,
    minHeight:    290,
  },
  bentoRight: {
    flex: 1,
    gap:  12,
  },
  bentoIconCircle: {
    width:           48,
    height:          48,
    borderRadius:    24,
    backgroundColor: Colors.white,
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    14,
    shadowColor:     '#000',
    shadowOpacity:   0.06,
    shadowRadius:    6,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  bentoTitleLg: {
    fontFamily:   Typography.fontBold,
    fontSize:     Typography.xl,
    marginBottom: 8,
    lineHeight:   24,
  },
  bentoMeta: {
    fontFamily:   Typography.fontMedium,
    fontSize:     Typography.xs,
    marginBottom: 16,
    lineHeight:   18,
  },
  bentoRegBtn: {
    backgroundColor: '#0ea5e9',
    borderRadius:    Radius.md,
    paddingVertical: 10,
    alignItems:      'center',
    marginTop:       'auto',
  },
  bentoRegBtnText: {
    color:      '#fff',
    fontFamily: Typography.fontBold,
    fontSize:   Typography.base,
  },
  bentoSmall: {
    flex:         1,
    borderRadius: Radius.xxl,
    padding:      Spacing.lg,
    borderWidth:  1,
    minHeight:    130,
    justifyContent: 'center',
  },
  bentoSmallRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    marginBottom:  6,
  },
  bentoIconCircleSmall: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: Colors.white,
    justifyContent:  'center',
    alignItems:      'center',
    flexShrink:      0,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    4,
    shadowOffset:    { width: 0, height: 1 },
    elevation:       1,
  },
  bentoTitleSm: {
    fontFamily: Typography.fontBold,
    fontSize:   Typography.md,
    flex:       1,
    lineHeight: 20,
  },
  bentoMetaSm: {
    fontFamily:  Typography.fontMedium,
    fontSize:    10,
    marginLeft:  50,
    lineHeight:  15,
    marginTop:   -4,
  },

  // ── KVR vertical list ────────────────────────────────────────────────────────
  kvrList: {
    paddingHorizontal: Spacing.xxl,
    gap:               12,
  },
  kvrCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             14,
    backgroundColor: Colors.white,
    borderRadius:    Radius.xxl,
    padding:         12,
    borderWidth:     1,
    borderColor:     Colors.borderLight,
    shadowColor:     '#000',
    shadowOpacity:   0.05,
    shadowRadius:    10,
    shadowOffset:    { width: 0, height: 3 },
    elevation:       2,
  },
  kvrImageWrap: {
    width:        80,
    height:       80,
    borderRadius: 14,
    overflow:     'hidden',
    flexShrink:   0,
    borderWidth:  1,
    borderColor:  Colors.borderLight,
  },
  kvrImage: {
    width:  '100%',
    height: '100%',
  },
  kvrBody: {
    flex:           1,
    justifyContent: 'center',
  },
  kvrType: {
    fontFamily:    Typography.fontExtraBold,
    fontSize:      10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom:  4,
  },
  kvrTitle: {
    fontFamily:   Typography.fontBold,
    fontSize:     Typography.base,
    color:        Colors.textPrimary,
    lineHeight:   20,
    marginBottom: 4,
  },
  kvrMeta: {
    fontFamily: Typography.fontMedium,
    fontSize:   11,
    color:      Colors.textSecondary,
  },

  // ── Chat wrapper ─────────────────────────────────────────────────────────────
  chatWrapper: {
    position: 'absolute',
    right:    0,
    zIndex:   40,
  },

  // ── Tab Bar ───────────────────────────────────────────────────────────────────
  tabBarOuter: {
    flexDirection:    'row',
    justifyContent:   'space-between',
    alignItems:       'center',
    paddingHorizontal: Spacing.xxl,
    paddingTop:        12,
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
    backgroundColor:   'rgba(255,255,255,0.92)',
    shadowColor:       '#000',
    shadowOpacity:     0.05,
    shadowRadius:      20,
    shadowOffset:      { width: 0, height: -6 },
    elevation:         12,
  },
  tabItem: {
    flex:          1,
    alignItems:    'center',
    justifyContent:'center',
    gap:           4,
    paddingBottom: 4,
  },
  tabLabel: {
    fontFamily: Typography.fontSemiBold,
    fontSize:   Typography.xs,
  },
  fabWrapper: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    marginTop:      -30,   // breaks out above the tab bar top border
  },
  fab: {
    width:           64,
    height:          64,
    borderRadius:    32,
    backgroundColor: Colors.brandGreen,
    justifyContent:  'center',
    alignItems:      'center',
    borderWidth:     4,
    borderColor:     Colors.surfaceBg,
    shadowColor:     Colors.brandGreen,
    shadowOpacity:   0.45,
    shadowRadius:    14,
    shadowOffset:    { width: 0, height: 6 },
    elevation:       10,
  },
});

// ── Super Menu styles ─────────────────────────────────────────────────────────
const menuStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -6 },
    elevation: 20,
  },
  pill: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 24,
  },

  // Header
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  menuHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuAvatar: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: '#e2e8f0',
  },
  menuName: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: '#0f172a',
    marginBottom: 2,
  },
  menuNim: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: '#0ea5e9',
  },
  closeBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#f1f5f9',
    borderWidth: 1, borderColor: '#e2e8f0',
    justifyContent: 'center', alignItems: 'center',
  },

  // Grid
  gridTitle: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: '#0f172a',
    marginBottom: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    rowGap: 20,
  },
  actionItem: {
    width: '25%',
    alignItems: 'center',
    gap: 8,
  },
  actionIcon: {
    width: 60, height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  actionLabel: {
    fontFamily: Typography.fontBold,
    fontSize: 11,
    color: '#475569',
    textAlign: 'center',
  },

  // Promo banner
  promoBanner: {
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  promoTitle: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: '#fff',
  },
  promoSub: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.xs,
    color: '#bae6fd',
    marginTop: 2,
  },
  promoBtn: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  promoBtnText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: '#0284c7',
  },
});
