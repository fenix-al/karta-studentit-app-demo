import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MessageCircle, X } from 'lucide-react';

import { Colors, Typography, Radius } from '../constants/Theme';

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(true);

  // Subtle scale animation on toggle
  const scale = useRef(new Animated.Value(1)).current;

  const toggle = () => {
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.88, duration: 80,  useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1,    duration: 120, useNativeDriver: true }),
    ]).start();
    setIsOpen(prev => !prev);
  };

  return (
    <Animated.View style={[styles.root, { transform: [{ scale }] }]}>

      {/* ── EXPANDED STATE — pill with icon + label ─────────────────── */}
      {isOpen ? (
        <View style={styles.expandedWrap}>

          {/* Small close button sits above-right of the pill */}
          <TouchableOpacity style={styles.closeBtn} onPress={toggle}>
            <X size={10} color={Colors.textSecondary} strokeWidth={3} />
          </TouchableOpacity>

          {/* Pill */}
          <View style={styles.pill}>
            <LinearGradient
              colors={['#38bdf8', '#3b82f6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.pillIcon}
            >
              <MessageCircle size={20} color="#fff" strokeWidth={2} />
            </LinearGradient>
            <Text style={styles.pillLabel}>Ndihmë?</Text>
          </View>

        </View>

      ) : (

        /* ── MINIMIZED STATE — slim tab anchored to right edge ───────── */
        <TouchableOpacity style={styles.minTab} onPress={toggle}>
          <MessageCircle size={20} color="#38bdf8" strokeWidth={2} />
        </TouchableOpacity>

      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    right:    0,
    zIndex:   40,
    alignItems: 'flex-end',
  },

  // ── Expanded ──────────────────────────────────────────────────────────────
  expandedWrap: {
    alignItems: 'flex-end',
  },
  closeBtn: {
    width:           18,
    height:          18,
    borderRadius:    9,
    backgroundColor: Colors.white,
    borderWidth:     1,
    borderColor:     Colors.border,
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    -8,
    marginRight:     5,
    zIndex:          1,
    // subtle shadow
    shadowColor:     '#000',
    shadowOpacity:   0.10,
    shadowRadius:    4,
    shadowOffset:    { width: 0, height: 2 },
    elevation:       2,
  },
  pill: {
    flexDirection:   'row',
    alignItems:      'center',
    backgroundColor: Colors.white,
    borderRadius:    Radius.full,
    paddingVertical:   6,
    paddingLeft:       6,
    paddingRight:     16,
    gap:              10,
    shadowColor:     '#000',
    shadowOpacity:   0.12,
    shadowRadius:    12,
    shadowOffset:    { width: 0, height: 4 },
    elevation:       6,
  },
  pillIcon: {
    width:        40,
    height:       40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems:     'center',
  },
  pillLabel: {
    fontFamily: Typography.fontExtraBold,
    fontSize:   Typography.base,
    color:      Colors.textPrimary,
  },

  // ── Minimized ─────────────────────────────────────────────────────────────
  minTab: {
    backgroundColor: Colors.white,
    paddingVertical:  14,
    paddingLeft:      12,
    paddingRight:      8,
    borderTopLeftRadius:    16,
    borderBottomLeftRadius: 16,
    borderWidth:      1,
    borderRightWidth: 0,
    borderColor:      Colors.border,
    justifyContent: 'center',
    alignItems:     'center',
    shadowColor:    '#000',
    shadowOpacity:  0.10,
    shadowRadius:   10,
    shadowOffset:   { width: -2, height: 4 },
    elevation:      4,
  },
});
