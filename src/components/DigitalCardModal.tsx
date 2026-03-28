import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, Animated,
  StyleSheet, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { X, RefreshCw } from 'lucide-react';
import QRCode from 'react-native-qrcode-svg';

import { Typography, Spacing, Radius } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const TIMER_START = 45;

export default function DigitalCardModal({ visible, onClose }: Props) {
  const insets   = useSafeAreaInsets();
  const { card } = useAuth();
  const QR_VALUE = `STUDENT:${card?.qr_token ?? card?.nr_karte ?? ''}`;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [timer, setTimer] = useState(TIMER_START);

  // ── Scanning line (loops up-down inside QR box) ───────────────────────────
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanAnim, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(scanAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  // ── Card glow pulse ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  // ── Countdown timer (resets every 45s) ───────────────────────────────────
  useEffect(() => {
    if (!visible) { setTimer(TIMER_START); return; }
    const id = setInterval(() => setTimer(t => (t <= 1 ? TIMER_START : t - 1)), 1000);
    return () => clearInterval(id);
  }, [visible]);

  const scanLineY = scanAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 196],   // 0% → 89% of the 220px QR box
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.3, 0.65],
  });

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>

      {/* ── Dark frosted glass backdrop ─────────────────────────────────── */}
      <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFillObject} />

      <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>

        {/* ── Close button ──────────────────────────────────────────────── */}
        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.8}>
          <X size={20} color="#fff" strokeWidth={2.5} />
        </TouchableOpacity>

        {/* ── Card glow halo (animated) ──────────────────────────────────── */}
        <Animated.View style={[styles.cardGlow, { opacity: glowOpacity }]} />

        {/* ── The Digital Card ──────────────────────────────────────────── */}
        <LinearGradient
          colors={['#1e293b', '#0f172a']}
          start={{ x: 0.15, y: 0 }} end={{ x: 0.85, y: 1 }}
          style={styles.card}
        >

          {/* Card header */}
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderText}>
              <Text style={styles.greenDot}>● </Text>
              KARTA E STUDENTIT
            </Text>
          </View>

          {/* QR box */}
          <View style={styles.qrBox}>
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
            <QRCode
              value={QR_VALUE}
              size={190}
              color="#0f172a"
              backgroundColor="#ffffff"
            />
          </View>

          {/* User info strip */}
          <View style={styles.userBox}>
            <Image source={{ uri: card?.foto_url }} style={styles.avatar} />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{card ? card.emeri + ' ' + card.mbiemeri : ''}</Text>
              <Text style={styles.userUni}>Universiteti "Luigj Gurakuqi"</Text>
              <Text style={styles.userId}>ID: {card?.nr_karte ?? ''}</Text>
            </View>
          </View>

        </LinearGradient>

        {/* ── Bottom info ────────────────────────────────────────────────── */}
        <View style={styles.bottomInfo}>
          <Text style={styles.readyTitle}>Gati për Skanim</Text>
          <Text style={styles.readyDesc}>
            Tregojani këtë kod biznesit për të përfituar zbritjen dhe pikët SCoins.
          </Text>
          <View style={styles.timerPill}>
            <RefreshCw size={13} color="#94a3b8" strokeWidth={2} />
            <Text style={styles.timerText}>
              Përditësohet në <Text style={styles.timerCount}>{timer}s</Text>
            </Text>
          </View>
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems:  'center',
    paddingHorizontal: Spacing.xxl,
  },

  // ── Close button ────────────────────────────────────────────────────────────
  closeBtn: {
    alignSelf:       'flex-end',
    width:           42,
    height:          42,
    borderRadius:    21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.10)',
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    28,
  },

  // ── Card glow (sits behind LinearGradient card) ──────────────────────────────
  cardGlow: {
    position:     'absolute',
    top:          80,
    left:         16,
    right:        16,
    height:       420,
    borderRadius: 40,
    backgroundColor: '#0ea5e9',
    // Multi-layered glow via shadow
    shadowColor:    '#a3e635',
    shadowOpacity:  0.8,
    shadowRadius:   40,
    shadowOffset:   { width: 0, height: 0 },
    elevation:      0,
  },

  // ── Digital card ─────────────────────────────────────────────────────────────
  card: {
    width:        '100%',
    borderRadius: 32,
    padding:      Spacing.xxxl,
    alignItems:   'center',
    borderWidth:  1,
    borderColor:  'rgba(255,255,255,0.10)',
    shadowColor:  '#000',
    shadowOpacity: 0.6,
    shadowRadius:  30,
    shadowOffset:  { width: 0, height: 16 },
    elevation:     20,
  },

  // Card header
  cardHeader: { marginBottom: Spacing.xxl, alignItems: 'center' },
  cardHeaderText: {
    fontFamily:    Typography.fontExtraBold,
    fontSize:      Typography.sm,
    color:         '#fff',
    textTransform: 'uppercase',
    letterSpacing: 2.5,
  },
  greenDot: { color: '#a3e635', fontSize: 14 },

  // QR code box
  qrBox: {
    width:           220,
    height:          220,
    backgroundColor: '#fff',
    borderRadius:    24,
    padding:         15,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing.xxl,
    overflow:        'hidden',
    shadowColor:     '#000',
    shadowOpacity:   0.2,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 6 },
    elevation:       6,
  },
  scanLine: {
    position:        'absolute',
    left:            0,
    right:           0,
    height:          3,
    backgroundColor: 'rgba(163,230,53,0.85)',
    shadowColor:     '#a3e635',
    shadowOpacity:   0.8,
    shadowRadius:    8,
    shadowOffset:    { width: 0, height: 0 },
    borderRadius:    2,
    zIndex:          10,
  },

  // User strip inside card
  userBox: {
    width:           '100%',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius:    Radius.xl,
    padding:         Spacing.lg,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing.lg,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.07)',
  },
  avatar: {
    width:        50,
    height:       50,
    borderRadius: 14,
    borderWidth:  2,
    borderColor:  '#a3e635',
  },
  userInfo: { flex: 1 },
  userName: {
    fontFamily:   Typography.fontBold,
    fontSize:     Typography.lg,
    color:        '#fff',
    marginBottom: 2,
  },
  userUni: {
    fontFamily: Typography.fontMedium,
    fontSize:   10,
    color:      '#94a3b8',
    marginBottom: 3,
  },
  userId: {
    fontFamily:   Typography.fontBold,
    fontSize:     10,
    color:        '#a3e635',
    letterSpacing: 1,
  },

  // ── Bottom info ───────────────────────────────────────────────────────────────
  bottomInfo: {
    marginTop:  Spacing.xxxl,
    alignItems: 'center',
  },
  readyTitle: {
    fontFamily:   Typography.fontBold,
    fontSize:     Typography.lg,
    color:        '#fff',
    marginBottom: 8,
  },
  readyDesc: {
    fontFamily:  Typography.fontMedium,
    fontSize:    Typography.base,
    color:       '#94a3b8',
    textAlign:   'center',
    lineHeight:  20,
    maxWidth:    280,
    marginBottom: Spacing.xl,
  },
  timerPill: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             6,
    backgroundColor: 'rgba(255,255,255,0.10)',
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:    Radius.full,
    borderWidth:     1,
    borderColor:     'rgba(255,255,255,0.08)',
  },
  timerText: {
    fontFamily: Typography.fontMedium,
    fontSize:   Typography.base,
    color:      '#cbd5e1',
  },
  timerCount: {
    fontFamily: Typography.fontBold,
    color:      '#fff',
  },
});
