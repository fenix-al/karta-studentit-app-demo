import React, { useState } from 'react';
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
import { CATEGORIES, COURSES, OPPORTUNITIES, STARTUPS, ACT4, KVR } from '../data/mockData';
import { useFetch } from '../hooks/useFetch';
import { fetchOffers, fetchKurset, fetchJobs, fetchStartups, fetchAct4, fetchKvr } from '../services/api';
import { apiBizToBusiness, kursToCard, opportunityToCard, startupToCard, act4ToCard, kvrToCard } from '../services/mappers';
import { Business, CardItem, Category } from '../types';
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { onLogout, card } = useAuth();

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);

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
  const realBusinesses    = rawOffers.map(apiBizToBusiness);
  const topRecommended    = [...realBusinesses]
    .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
    .slice(0, 10);

  const courses       = (coursesData as any)?.items?.map(kursToCard)       ?? COURSES;
  const opportunities = (jobsData as any)?.items?.map(opportunityToCard)   ?? OPPORTUNITIES;
  const startups      = (startupsData as any)?.items?.map(startupToCard)   ?? STARTUPS;
  const act4          = (act4Data as any)?.items?.map(act4ToCard)          ?? ACT4;
  const kvr           = (kvrData as any)?.items?.map(kvrToCard)            ?? KVR;
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
  const [jobsInitialList, setJobsInitialList] = useState<string | undefined>(undefined);
  const [startupsInitialList, setStartupsInitialList] = useState<string | undefined>(undefined);

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

  const openCourses = (list?: string) => {
    setCoursesInitialList(list);
    setActiveTab('kurset');
  };

  const openJobs = (list?: string) => {
    setJobsInitialList(list);
    setActiveTab('mundesit');
  };

  const openStartups = (list?: string) => {
    setStartupsInitialList(list);
    setActiveTab('startupet');
  };

  const openAct4 = () => setActiveTab('act4');
  const openKVR  = () => setActiveTab('kvr');

  // Bottom of tab bar = its own height + device safe area
  const tabBarBottom = insets.bottom;

  if (showNotifications) {
    return (
      <View style={styles.root}>
        <NotificationsScreen onBack={() => setShowNotifications(false)} />
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
              <Text style={styles.loyaltyCount}>{'—'}</Text>
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
                  <TouchableOpacity style={styles.rekoBtn} onPress={() => {}} activeOpacity={0.8}>
                    <Heart size={12} color="#0ea5e9" strokeWidth={2.5} />
                    <Text style={styles.rekoBtnText}>
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
                    <TouchableOpacity style={styles.rekoBtn} activeOpacity={0.8}
                      onPress={() => { setOffersInitialBusiness(biz); setActiveTab('perfitimet'); }}>
                      <Heart size={12} color="#0ea5e9" strokeWidth={2.5} />
                      <Text style={styles.rekoBtnText}>
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
                <Text style={styles.bentoRegBtnText}>Regjistrohu</Text>
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
        />
      )}

      {activeTab === 'mundesit' && (
        <OpportunitiesNavigator
          onExit={() => setActiveTab('home')}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
          initialList={jobsInitialList}
        />
      )}

      {activeTab === 'kvr' && (
        <KVRNavigator
          onExit={() => setActiveTab('home')}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
        />
      )}

      {activeTab === 'act4' && (
        <ActNavigator
          onExit={() => setActiveTab('home')}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
        />
      )}

      {activeTab === 'startupet' && (
        <StartupNavigator
          onExit={() => setActiveTab('home')}
          bottomInset={TAB_BAR_HEIGHT + tabBarBottom}
          initialList={startupsInitialList}
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
      <SmartModal item={activeItem} onClose={() => setActiveItem(null)} />
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
  searchPlaceholder: {
    fontFamily: Typography.fontMedium,
    fontSize:   Typography.base,
    color:      Colors.textMuted,
    flex:       1,
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
