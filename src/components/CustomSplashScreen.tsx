import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type CustomSplashScreenProps = {
  onAnimationComplete?: () => void;
};

const LOGO_SOURCE = require('../../assets/app-logo.png');
const MUNICIPALITY_SOURCE = require('../../assets/bashkia-shkoder.png');

export default function CustomSplashScreen({
  onAnimationComplete,
}: CustomSplashScreenProps) {
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(20)).current;
  const logoScale = useRef(new Animated.Value(0.94)).current;

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;

  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerTranslateY = useRef(new Animated.Value(10)).current;

  const progress = useRef(new Animated.Value(0)).current;
  const completionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progressBarWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return Math.min(Math.max(screenWidth * 0.36, 132), 180);
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 240,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(logoTranslateY, {
        toValue: 0,
        damping: 12,
        mass: 0.9,
        stiffness: 170,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        damping: 11,
        mass: 0.9,
        stiffness: 160,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 320,
        delay: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 320,
        delay: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.parallel([
      Animated.timing(footerOpacity, {
        toValue: 1,
        duration: 320,
        delay: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(footerTranslateY, {
        toValue: 0,
        duration: 320,
        delay: 1200,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: 2200,
      delay: 800,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: false,
    }).start();

    completionTimeout.current = setTimeout(() => {
      onAnimationComplete?.();
    }, 3500);

    return () => {
      logoOpacity.stopAnimation();
      logoTranslateY.stopAnimation();
      logoScale.stopAnimation();
      contentOpacity.stopAnimation();
      contentTranslateY.stopAnimation();
      footerOpacity.stopAnimation();
      footerTranslateY.stopAnimation();
      progress.stopAnimation();

      if (completionTimeout.current) {
        clearTimeout(completionTimeout.current);
      }
    };
  }, [
    contentOpacity,
    contentTranslateY,
    footerOpacity,
    footerTranslateY,
    logoOpacity,
    logoScale,
    logoTranslateY,
    onAnimationComplete,
    progress,
  ]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, progressBarWidth],
  });

  return (
    <View style={styles.container}>
      <View style={styles.centerContent}>
        <Animated.View
          style={[
            styles.logoShell,
            {
              opacity: logoOpacity,
              transform: [
                { translateY: logoTranslateY },
                { scale: logoScale },
              ],
            },
          ]}
        >
          <Image
            source={LOGO_SOURCE}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.textBlock,
            {
              opacity: contentOpacity,
              transform: [{ translateY: contentTranslateY }],
            },
          ]}
        >
          <Text style={styles.title}>KARTA E STUDENTIT</Text>
          <Text style={styles.subtitle}>SHKODËR</Text>

          <View style={[styles.progressTrack, { width: progressBarWidth }]}>
            <Animated.View style={[styles.progressFillWrap, { width: progressWidth }]}>
              <LinearGradient
                colors={['#0f766e', '#0aa8a7']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.progressFill}
              />
            </Animated.View>
          </View>
        </Animated.View>
      </View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: footerOpacity,
            transform: [{ translateY: footerTranslateY }],
          },
        ]}
      >
        <Text style={styles.footerLabel}>MENAXHUAR NGA</Text>
        <View style={styles.footerBrandRow}>
          <Image
            source={MUNICIPALITY_SOURCE}
            style={styles.footerLogo}
            resizeMode="contain"
          />
          <Text style={styles.footerText}>Bashkia Shkodër</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FC',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 96,
  },
  logoShell: {
    width: 132,
    height: 132,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    marginBottom: 28,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  textBlock: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins_800ExtraBold',
    fontSize: 25,
    lineHeight: 30,
    color: '#003366',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 2,
    fontFamily: 'Poppins_700Bold',
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 3.2,
    color: '#e30613',
    textAlign: 'center',
  },
  progressTrack: {
    height: 6,
    marginTop: 30,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  progressFillWrap: {
    height: '100%',
    overflow: 'hidden',
    borderRadius: 999,
  },
  progressFill: {
    flex: 1,
    borderRadius: 999,
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 38,
    alignItems: 'center',
  },
  footerLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 10,
    letterSpacing: 2.2,
    color: '#94A3B8',
    marginBottom: 10,
  },
  footerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  footerLogo: {
    width: 24,
    height: 30,
  },
  footerText: {
    fontFamily: 'Poppins_700Bold',
    fontSize: 15,
    color: '#003366',
  },
});
