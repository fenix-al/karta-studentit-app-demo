import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Image,
  TouchableOpacity,
  Animated,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  X, QrCode, Briefcase, Rocket, Globe,
  Heart, FileText, Star, ArrowRight, ExternalLink,
} from 'lucide-react';

import { CardItem } from '../types';
import { Colors, Typography, Radius } from '../constants/Theme';

// ── Icon resolver — maps actionIconName string → lucide component ─────────────
const ICON_MAP: Record<string, React.ComponentType<any>> = {
  QrCode, Briefcase, Rocket, Globe, Heart, FileText, Star, ArrowRight, ExternalLink,
};

const { width: SW, height: SH } = Dimensions.get('window');

interface Props {
  item: CardItem | null;
  onClose: () => void;
}

export default function SmartModal({ item, onClose }: Props) {
  const insets   = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const anim     = useRef<Animated.CompositeAnimation | null>(null);

  // Run progress bar whenever a new item opens
  useEffect(() => {
    if (item) {
      progress.setValue(0);
      anim.current = Animated.timing(progress, {
        toValue:         1,
        duration:        6000,
        useNativeDriver: false, // width % — cannot use native driver
      });
      anim.current.start();
    } else {
      anim.current?.stop();
      progress.setValue(0);
    }
  }, [item]);

  if (!item) return null;

  const progressWidth = progress.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0%', '100%'],
  });

  const ActionIcon = ICON_MAP[item.actionIconName] ?? ArrowRight;

  return (
    <Modal
      visible={!!item}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.root}>

        {/* ── Full-screen image ─────────────────────────────────────────── */}
        <Image
          source={{ uri: item.img }}
          style={StyleSheet.absoluteFillObject}
          resizeMode="cover"
        />

        {/* ── Dark gradient overlay (bottom-up) ────────────────────────── */}
        <LinearGradient
          colors={['transparent', 'rgba(15,19,29,0.75)', '#0B0F19']}
          locations={[0.25, 0.60, 1]}
          style={StyleSheet.absoluteFillObject}
        />

        {/* ── Progress bar ─────────────────────────────────────────────── */}
        <View style={[styles.progressTrack, { top: insets.top + 12 }]}>
          <View style={styles.progressBg}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
        </View>

        {/* ── Top-left: avatar + type label ────────────────────────────── */}
        <View style={[styles.topLeft, { top: insets.top + 28 }]}>
          <View style={styles.thumbCircle}>
            <Image source={{ uri: item.img }} style={styles.thumbImg} />
          </View>
          <Text style={styles.typeLabel}>{item.type.toUpperCase()}</Text>
        </View>

        {/* ── Close button ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.closeBtn, { top: insets.top + 24 }]}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={20} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* ── Bottom content ───────────────────────────────────────────── */}
        <View style={[styles.bottomContent, { paddingBottom: insets.bottom + 32 }]}>

          {/* Solid colored badge */}
          <View style={[styles.discountBadge, { backgroundColor: item.badgeColor }]}>
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>

          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.desc}>{item.fullDesc}</Text>

          {/* Dynamic CTA button */}
          <TouchableOpacity style={styles.ctaWrap} activeOpacity={0.85}>
            <LinearGradient
              colors={item.btnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaBtn}
            >
              <Text style={styles.ctaText}>{item.actionText}</Text>
              <ActionIcon size={20} color="#fff" strokeWidth={2.5} />
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

  // Progress bar
  progressTrack: {
    position:   'absolute',
    left:       16,
    right:      16,
    zIndex:     20,
  },
  progressBg: {
    height:       4,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: Radius.full,
    overflow:     'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: '#fff',
    borderRadius:    Radius.full,
  },

  // Top-left header
  topLeft: {
    position:   'absolute',
    left:       20,
    zIndex:     20,
    flexDirection:  'row',
    alignItems:     'center',
    gap:            10,
  },
  thumbCircle: {
    width:        36,
    height:       36,
    borderRadius: 18,
    borderWidth:  2,
    borderColor:  'rgba(255,255,255,0.5)',
    overflow:     'hidden',
    backgroundColor: '#1e293b',
  },
  thumbImg: {
    width:  '100%',
    height: '100%',
  },
  typeLabel: {
    color:          '#fff',
    fontFamily:     Typography.fontBold,
    fontSize:       Typography.sm,
    letterSpacing:  1,
  },

  // Close button
  closeBtn: {
    position:        'absolute',
    right:           16,
    zIndex:          20,
    width:           38,
    height:          38,
    borderRadius:    19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent:  'center',
    alignItems:      'center',
  },

  // Bottom content
  bottomContent: {
    position:   'absolute',
    bottom:     0,
    left:       0,
    right:      0,
    paddingHorizontal: 24,
    alignItems: 'center',
    zIndex:     20,
  },
  discountBadge: {
    paddingHorizontal: 20,
    paddingVertical:   8,
    borderRadius:      Radius.full,
    marginBottom:      16,
  },
  discountText: {
    color:          '#fff',
    fontFamily:     Typography.fontExtraBold,
    fontSize:       Typography.xs,
    letterSpacing:  2,
    textTransform:  'uppercase',
  },
  title: {
    color:          '#fff',
    fontFamily:     Typography.fontExtraBold,
    fontSize:       28,
    textAlign:      'center',
    marginBottom:   12,
    lineHeight:     34,
  },
  desc: {
    color:          'rgba(203,213,225,1)', // slate-300
    fontFamily:     Typography.fontMedium,
    fontSize:       Typography.md,
    textAlign:      'center',
    marginBottom:   28,
    lineHeight:     22,
    maxWidth:       SW * 0.9,
  },
  ctaWrap: {
    width: '100%',
  },
  ctaBtn: {
    width:          '100%',
    paddingVertical: 16,
    borderRadius:   Radius.xl,
    flexDirection:  'row',
    justifyContent: 'center',
    alignItems:     'center',
    gap:            10,
  },
  ctaText: {
    color:      '#fff',
    fontFamily: Typography.fontExtraBold,
    fontSize:   Typography.lg,
  },
});
