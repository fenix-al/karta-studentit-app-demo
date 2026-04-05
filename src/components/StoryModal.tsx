import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import {
  Modal, View, Text, Image, TouchableOpacity,
  Animated, StyleSheet, Dimensions, StatusBar, PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, ArrowRight, MapPin, Phone } from 'lucide-react-native';
import { Business } from '../types';
const { width: SW, height: SH } = Dimensions.get('window');
const STORY_DURATION = 5000;
const SWIPE_THRESHOLD = 50;

interface Props {
  visible:          boolean;
  stories:          Business[];
  initialIndex:     number;
  onClose:          () => void;
  onViewProfile?:   (business: Business) => void;
}

export default function StoryModal({ visible, stories, initialIndex, onClose, onViewProfile }: Props) {
  const insets   = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const anim     = useRef<Animated.CompositeAnimation | null>(null);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Sync currentIndex when the modal opens or initialIndex changes
  useEffect(() => {
    if (visible) setCurrentIndex(initialIndex);
  }, [visible, initialIndex]);

  // ── Start progress bar for current story ──────────────────────────────────
  const startProgress = useCallback(() => {
    anim.current?.stop();
    progress.setValue(0);
    anim.current = Animated.timing(progress, {
      toValue:         1,
      duration:        STORY_DURATION,
      useNativeDriver: false,   // width is a layout prop — cannot use native driver
    });
    anim.current.start(({ finished }) => {
      if (finished) goToNext();
    });
  }, [currentIndex, stories.length]);

  useEffect(() => {
    if (visible && stories.length > 0) {
      startProgress();
    } else {
      anim.current?.stop();
      progress.setValue(0);
    }
    return () => { anim.current?.stop(); };
  }, [visible, currentIndex, stories.length]);

  // ── Navigation ─────────────────────────────────────────────────────────────
  function goToNext() {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(i => i + 1);
    } else {
      onClose();
    }
  }

  function goToPrev() {
    if (currentIndex > 0) {
      setCurrentIndex(i => i - 1);
    }
    // already at first story — do nothing
  }

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) =>
          Math.abs(gestureState.dx) > 12 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy),
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx <= -SWIPE_THRESHOLD) {
            goToNext();
            return;
          }
          if (gestureState.dx >= SWIPE_THRESHOLD) {
            goToPrev();
          }
        },
      }),
    [currentIndex, stories.length],
  );

  // ── Guard — nothing to render ──────────────────────────────────────────────
  if (!stories.length) return null;

  const story    = stories[Math.min(currentIndex, stories.length - 1)];
  const imgUri   = story.img  || '';
  const logoUri  = story.img  || '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.root} {...panResponder.panHandlers}>

        {/* ── Background image ────────────────────────────────────────── */}
        <View style={StyleSheet.absoluteFillObject}>
          <Image
            source={{ uri: imgUri }}
            style={styles.bgImage}
            resizeMode="cover"
          />
          <View style={styles.bgDark} />
        </View>

        {/* ── Top gradient (scrim for progress + header) ───────────────── */}
        <LinearGradient
          colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.30)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />

        {/* ── Bottom gradient (scrim for text + button) ───────────────── */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.96)']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        {/* ── Tap zones (left = prev, right = next) — behind UI chrome ── */}
        <View style={styles.tapZones} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.tapLeft}
            onPress={goToPrev}
            activeOpacity={1}
          />
          <TouchableOpacity
            style={styles.tapRight}
            onPress={goToNext}
            activeOpacity={1}
          />
        </View>

        {/* ── Progress bars ──────────────────────────────────────────────
            Rendered ABOVE tap zones via zIndex
        ─────────────────────────────────────────────────────────────── */}
        <View
          style={[styles.progressRow, { top: insets.top + 10 }]}
          pointerEvents="none"
        >
          {stories.map((_, i) => {
            let fillWidth: Animated.AnimatedInterpolation<string | number> | string;
            if (i < currentIndex)       fillWidth = '100%';
            else if (i === currentIndex) fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
            else                         fillWidth = '0%';

            return (
              <View key={i} style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: fillWidth as any }]} />
              </View>
            );
          })}
        </View>

        {/* ── Header row ─────────────────────────────────────────────────
            zIndex above tap zones
        ─────────────────────────────────────────────────────────────── */}
        <View style={[styles.header, { top: insets.top + 22 }]} pointerEvents="box-none">
          <View style={styles.headerLeft}>
            <View style={styles.avatarRing}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.avatar} resizeMode="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarFallback]}>
                  <Text style={styles.avatarInitial}>{story.title.charAt(0)}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.headerTitle} numberOfLines={1}>{story.title}</Text>
              {story.category ? (
                <Text style={styles.headerSub} numberOfLines={1}>{story.category}</Text>
              ) : null}
            </View>
          </View>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.8}
            hitSlop={{ top: 14, right: 14, bottom: 14, left: 14 }}
          >
            <X size={20} color="#fff" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Bottom content — zIndex above tap zones ─────────────────── */}
        <View
          style={[styles.bottomContent, { paddingBottom: insets.bottom + 20 }]}
          pointerEvents="box-none"
        >
          {/* Discount badge */}
          {story.discount ? (
            <View style={[styles.discountBadge, { backgroundColor: story.badgeColor }]}>
              <Text style={styles.discountText}>{story.discount}</Text>
            </View>
          ) : null}

          {/* Main title */}
          <Text style={styles.mainTitle}>{story.title}</Text>

          {/* Description */}
          {story.desc ? (
            <Text style={styles.desc} numberOfLines={3}>{story.desc}</Text>
          ) : null}

          {/* Meta: address + phone */}
          {(story.address || story.phone) ? (
            <View style={styles.metaRow}>
              {story.address ? (
                <View style={styles.metaItem}>
                  <MapPin size={13} color="rgba(255,255,255,0.55)" strokeWidth={2} />
                  <Text style={styles.metaText} numberOfLines={1}>{story.address}</Text>
                </View>
              ) : null}
              {story.phone ? (
                <View style={styles.metaItem}>
                  <Phone size={13} color="rgba(255,255,255,0.55)" strokeWidth={2} />
                  <Text style={styles.metaText}>{story.phone}</Text>
                </View>
              ) : null}
            </View>
          ) : null}

          {/* Counter pill */}
          <Text style={styles.counter}>{currentIndex + 1} / {stories.length}</Text>

          {/* CTA */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              const biz = stories[currentIndex];
              onClose();
              if (biz) onViewProfile?.(biz);
            }}
            style={styles.ctaWrap}
          >
            <LinearGradient
              colors={['#10b981', '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              <ArrowRight size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.ctaBtnText}>Shiko Ofertën</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: '#000',
  },

  // Background
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width:  SW,
    height: SH,
    opacity: 0.65,
  },
  bgDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  // Gradients
  topGradient: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: SH * 0.28,
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: SH * 0.62,
    zIndex: 1,
  },

  // Tap zones
  tapZones: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    zIndex: 2,
  },
  tapLeft: {
    width: '30%',
    height: '100%',
  },
  tapRight: {
    width: '70%',
    height: '100%',
  },

  // Progress bars
  progressRow: {
    position:      'absolute',
    left:          12,
    right:         12,
    flexDirection: 'row',
    gap:           4,
    zIndex:        10,
  },
  progressTrack: {
    flex:            1,
    height:          3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius:    2,
    overflow:        'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: '#fff',
    borderRadius:    2,
  },

  // Header
  header: {
    position:       'absolute',
    left:           14,
    right:          14,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    zIndex:         10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
    flex:          1,
  },
  avatarRing: {
    width:        42,
    height:       42,
    borderRadius: 21,
    borderWidth:  2,
    borderColor:  '#fff',
    overflow:     'hidden',
    flexShrink:   0,
  },
  avatar: {
    width:  '100%',
    height: '100%',
  },
  avatarFallback: {
    backgroundColor: '#1e293b',
    justifyContent:  'center',
    alignItems:      'center',
  },
  avatarInitial: {
    color:      '#fff',
    fontSize:   17,
    fontWeight: '800',
  },
  headerMeta: {
    flex: 1,
  },
  headerTitle: {
    color:      '#fff',
    fontSize:   15,
    fontWeight: '700',
  },
  headerSub: {
    color:     'rgba(255,255,255,0.65)',
    fontSize:  12,
    marginTop: 1,
  },
  closeBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.2)',
    justifyContent:  'center',
    alignItems:      'center',
    flexShrink:      0,
    marginLeft:      10,
  },

  // Bottom content
  bottomContent: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    paddingHorizontal: 22,
    zIndex:            10,
  },
  discountBadge: {
    alignSelf:        'flex-start',
    paddingHorizontal: 12,
    paddingVertical:   5,
    borderRadius:      8,
    marginBottom:      10,
  },
  discountText: {
    color:         '#fff',
    fontSize:      11,
    fontWeight:    '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mainTitle: {
    color:        '#fff',
    fontSize:     28,
    fontWeight:   '900',
    lineHeight:   34,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  desc: {
    color:        'rgba(255,255,255,0.70)',
    fontSize:     14,
    fontWeight:   '500',
    lineHeight:   20,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           14,
    marginBottom:  12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  metaText: {
    color:      'rgba(255,255,255,0.60)',
    fontSize:   13,
    fontWeight: '500',
  },
  counter: {
    color:        'rgba(255,255,255,0.40)',
    fontSize:     11,
    fontWeight:   '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    textAlign:    'center',
  },
  ctaWrap: {
    borderRadius: 18,
    overflow:     'hidden',
    shadowColor:  '#10b981',
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation:    12,
  },
  ctaBtn: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            10,
    paddingVertical: 17,
    borderRadius:   18,
  },
  ctaBtnText: {
    color:        '#fff',
    fontSize:     17,
    fontWeight:   '900',
    letterSpacing: 0.2,
  },
});
