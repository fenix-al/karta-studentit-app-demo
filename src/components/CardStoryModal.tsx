import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  PanResponder,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowRight,
  Briefcase,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  QrCode,
  Rocket,
  Star,
  X,
} from 'lucide-react-native';

import { CardItem } from '../types';

const { height: SH } = Dimensions.get('window');
const STORY_DURATION = 5000;
const SWIPE_THRESHOLD = 50;

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  ArrowRight,
  Briefcase,
  ExternalLink,
  FileText,
  Globe,
  GraduationCap,
  HandHeart,
  Heart,
  QrCode,
  Rocket,
  Star,
};

interface Props {
  visible: boolean;
  items: CardItem[];
  initialIndex: number;
  onClose: () => void;
  onAction?: (item: CardItem) => void;
}

export default function CardStoryModal({ visible, items, initialIndex, onClose, onAction }: Props) {
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const anim = useRef<Animated.CompositeAnimation | null>(null);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (visible) {
      setCurrentIndex(Math.min(Math.max(initialIndex, 0), Math.max(items.length - 1, 0)));
    }
  }, [visible, initialIndex, items.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((index) => {
      if (index >= items.length - 1) {
        onClose();
        return index;
      }
      return index + 1;
    });
  }, [items.length, onClose]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((index) => (index > 0 ? index - 1 : index));
  }, []);

  const startProgress = useCallback(() => {
    anim.current?.stop();
    progress.setValue(0);
    anim.current = Animated.timing(progress, {
      toValue: 1,
      duration: STORY_DURATION,
      useNativeDriver: false,
    });
    anim.current.start(({ finished }) => {
      if (finished) goToNext();
    });
  }, [goToNext, progress]);

  useEffect(() => {
    if (visible && items.length > 0) {
      startProgress();
    } else {
      anim.current?.stop();
      progress.setValue(0);
    }

    return () => {
      anim.current?.stop();
    };
  }, [visible, currentIndex, items.length, progress, startProgress]);

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
    [goToNext, goToPrev],
  );

  if (!items.length) return null;

  const item = items[Math.min(currentIndex, items.length - 1)];
  const ActionIcon = ICON_MAP[item.actionIconName] ?? ArrowRight;

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
        <View style={StyleSheet.absoluteFillObject}>
          <Image source={{ uri: item.img }} style={styles.bgImage} resizeMode="cover" />
          <View style={styles.bgDark} />
        </View>

        <LinearGradient
          colors={['rgba(0,0,0,0.72)', 'rgba(0,0,0,0.30)', 'transparent']}
          style={styles.topGradient}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.96)']}
          style={styles.bottomGradient}
          pointerEvents="none"
        />

        <View style={styles.tapZones} pointerEvents="box-none">
          <TouchableOpacity style={styles.tapLeft} onPress={goToPrev} activeOpacity={1} />
          <TouchableOpacity style={styles.tapRight} onPress={goToNext} activeOpacity={1} />
        </View>

        <View style={[styles.progressRow, { top: insets.top + 10 }]} pointerEvents="none">
          {items.map((_, index) => {
            let fillWidth: Animated.AnimatedInterpolation<string | number> | string;
            if (index < currentIndex) fillWidth = '100%';
            else if (index === currentIndex) {
              fillWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
            } else fillWidth = '0%';

            return (
              <View key={`${item.id}-${index}`} style={styles.progressTrack}>
                <Animated.View style={[styles.progressFill, { width: fillWidth as any }]} />
              </View>
            );
          })}
        </View>

        <View style={[styles.header, { top: insets.top + 22 }]} pointerEvents="box-none">
          <View style={styles.headerLeft}>
            <View style={styles.avatarRing}>
              <Image source={{ uri: item.img }} style={styles.avatar} resizeMode="cover" />
            </View>
            <View style={styles.headerMeta}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.headerSub} numberOfLines={1}>
                {item.type}
              </Text>
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

        <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 20 }]} pointerEvents="box-none">
          {item.discount ? (
            <View style={[styles.discountBadge, { backgroundColor: item.badgeColor }]}>
              <Text style={styles.discountText}>{item.discount}</Text>
            </View>
          ) : null}

          <Text style={styles.mainTitle}>{item.title}</Text>

          {item.fullDesc ? (
            <Text style={styles.desc} numberOfLines={3}>
              {item.fullDesc}
            </Text>
          ) : null}

          {item.meta ? <Text style={styles.metaText}>{item.meta}</Text> : null}

          <Text style={styles.counter}>
            {currentIndex + 1} / {items.length}
          </Text>

          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => onAction?.(item)}
            style={styles.ctaWrap}
          >
            <LinearGradient colors={item.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ctaBtn}>
              <ActionIcon size={20} color="#fff" strokeWidth={2.5} />
              <Text style={styles.ctaBtnText}>{item.actionText}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
    opacity: 0.65,
  },
  bgDark: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SH * 0.28,
    zIndex: 1,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SH * 0.62,
    zIndex: 1,
  },
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
  progressRow: {
    position: 'absolute',
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 4,
    zIndex: 10,
  },
  progressTrack: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 2,
  },
  header: {
    position: 'absolute',
    left: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarRing: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
    flexShrink: 0,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  headerMeta: {
    flex: 1,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  headerSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginLeft: 10,
  },
  bottomContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 22,
    zIndex: 10,
  },
  discountBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  discountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  mainTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    marginBottom: 8,
    letterSpacing: -0.4,
  },
  desc: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 12,
  },
  metaText: {
    color: 'rgba(255,255,255,0.60)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 12,
  },
  counter: {
    color: 'rgba(255,255,255,0.40)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 12,
    textAlign: 'center',
  },
  ctaWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 12,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 17,
    borderRadius: 18,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
});
