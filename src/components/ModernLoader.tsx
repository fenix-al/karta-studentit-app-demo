import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles } from 'lucide-react-native';

import { Colors, Radius, Spacing, Typography } from '../constants/Theme';

interface Props {
  title?: string;
  subtitle?: string;
  fullscreen?: boolean;
}

export default function ModernLoader({
  title = 'Po ngarkohet...',
  subtitle = 'Ju lutem prisni nje moment.',
  fullscreen = false,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const dot1 = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });
  const dot2 = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 0.95, 0.45] });
  const dot3 = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.45] });
  const cardScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });

  return (
    <View style={[styles.wrap, fullscreen && styles.fullscreen]}>
      <Animated.View style={[styles.cardWrap, { transform: [{ scale: cardScale }] }]}>
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.iconBox}>
            <Sparkles size={18} color={Colors.brandGreenDeep} strokeWidth={2.2} />
          </View>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.dots}>
            <Animated.View style={[styles.dot, { opacity: dot1 }]} />
            <Animated.View style={[styles.dot, { opacity: dot2 }]} />
            <Animated.View style={[styles.dot, { opacity: dot3 }]} />
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
  },
  fullscreen: {
    flex: 1,
    paddingVertical: 0,
    paddingHorizontal: Spacing.xxl,
  },
  cardWrap: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    minWidth: 220,
    maxWidth: 280,
    width: '100%',
    alignItems: 'center',
    borderRadius: Radius.xl,
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: Colors.brandGreenBg,
    borderWidth: 1,
    borderColor: Colors.brandGreenBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.lg,
    color: Colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.brandGreenDark,
  },
});
