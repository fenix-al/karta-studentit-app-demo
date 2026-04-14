import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Colors, Radius, Spacing } from '../constants/Theme';

type Props = {
  count?: number;
  variant?: 'card' | 'compact';
  contentPadding?: number;
};

export default function ListSkeleton({ count = 4, variant = 'card', contentPadding = Spacing.xxl }: Props) {
  return (
    <View style={[styles.wrap, { padding: contentPadding }]}>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={`skeleton-${index}`}
          style={[styles.card, variant === 'compact' && styles.compactCard]}
        >
          {variant === 'card' ? <View style={styles.media} /> : null}
          <View style={styles.body}>
            <View style={[styles.line, styles.lineTitle]} />
            <View style={[styles.line, styles.lineMedium]} />
            <View style={[styles.line, styles.lineShort]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.lg },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xxl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  compactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 96,
  },
  media: { height: 150, backgroundColor: '#e2e8f0' },
  body: { flex: 1, padding: Spacing.lg, gap: 10 },
  line: { height: 12, borderRadius: 6, backgroundColor: '#e2e8f0' },
  lineTitle: { width: '72%', height: 16 },
  lineMedium: { width: '52%' },
  lineShort: { width: '34%' },
});
