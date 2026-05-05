import React, { useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Animated,
  Easing,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ExternalLink, ShieldCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BRANDING } from '../constants/branding';
import { Colors, Radius, Typography } from '../constants/Theme';
import { useAuth } from '../context/AuthContext';

const PRIVACY_STORAGE_PREFIX = 'sk_app_privacy_seen_v1';

function buildStorageKey(cardId?: number | null) {
  return `${PRIVACY_STORAGE_PREFIX}:${cardId ?? 'student'}`;
}

interface Props {
  onOpenPolicy?: () => void;
}

export default function AppPrivacyBottomSheet({ onOpenPolicy }: Props) {
  const insets = useSafeAreaInsets();
  const { card, isLoggedIn, role } = useAuth();
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(460)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const storageKey = useMemo(() => buildStorageKey(card?.id ?? null), [card?.id]);

  useEffect(() => {
    let alive = true;

    if (!isLoggedIn || role !== 'student' || !card?.id) {
      setVisible(false);
      return () => {
        alive = false;
      };
    }

    (async () => {
      try {
        const seen = await AsyncStorage.getItem(storageKey);
        if (!seen && alive) setVisible(true);
      } catch {
        if (alive) setVisible(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [card?.id, isLoggedIn, role, storageKey]);

  useEffect(() => {
    if (!visible) {
      translateY.setValue(460);
      backdropOpacity.setValue(0);
      return;
    }

    Animated.parallel([
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [backdropOpacity, translateY, visible]);

  const handleAcknowledge = async () => {
    try {
      await AsyncStorage.setItem(storageKey, '1');
    } finally {
      setVisible(false);
    }
  };

  const handleOpenPolicy = async () => {
    try {
      await AsyncStorage.setItem(storageKey, '1');
    } finally {
      setVisible(false);
      onOpenPolicy?.();
    }
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={handleAcknowledge}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFillObject} />
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleAcknowledge} />
      </Animated.View>

      <View style={styles.modalRoot} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 22,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <View style={styles.titleRow}>
                <ShieldCheck size={18} color="#10b981" strokeWidth={2.2} />
                <Text style={styles.title}>Privatësia Jote</Text>
              </View>
              <Text style={styles.kicker}>KUSHTET E PERDORIMIT</Text>
            </View>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryLogoWrap}>
                <Image source={BRANDING.assets.municipalityLogo} style={styles.summaryLogo} resizeMode="contain" />
              </View>

              <Text style={styles.summaryText}>
                Mirësevini! Ky aplikacion administrohet nga <Text style={styles.strong}>Bashkia Shkodër</Text>. Të
                dhënat tuaja përdoren vetëm për funksionimin e Kartës së Studentit, për shërbime dhe zbritje të
                personalizuara, dhe ruhen me standarde të larta sigurie.
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.92} onPress={handleAcknowledge}>
              <LinearGradient
                colors={['#059669', '#047857']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryButtonFill}
              >
                <Text style={styles.primaryButtonText}>Kuptova & Vazhdo</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.9} onPress={handleOpenPolicy}>
              <Text style={styles.secondaryButtonText}>Lexo Politiken e Plote</Text>
              <ExternalLink size={16} color={Colors.textSecondary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 14,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: -8 },
    elevation: 22,
    maxHeight: '82%',
  },
  handle: {
    width: 48,
    height: 6,
    borderRadius: Radius.full,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },
  headerCopy: {
    flex: 1,
    paddingTop: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
  },
  kicker: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.xs,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  summaryLogoWrap: {
    width: 54,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    flexShrink: 0,
  },
  summaryLogo: {
    width: '100%',
    height: '100%',
  },
  summaryText: {
    flex: 1,
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    lineHeight: 21,
    color: Colors.textSecondary,
  },
  strong: {
    fontFamily: Typography.fontBold,
    color: Colors.textPrimary,
  },
  actions: {
    gap: 10,
  },
  primaryButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  primaryButtonFill: {
    minHeight: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: Colors.white,
  },
  secondaryButton: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: Colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.base,
    color: Colors.textSecondary,
  },
});
