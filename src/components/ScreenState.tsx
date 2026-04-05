import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  AlertTriangle,
  BellOff,
  Briefcase,
  ChevronLeft,
  Home,
  Inbox,
  Rocket,
  SearchX,
} from 'lucide-react-native';

import { Colors, Radius, Spacing, Typography } from '../constants/Theme';

type ScreenStateIcon =
  | 'error'
  | 'empty'
  | 'notifications'
  | 'search'
  | 'startup'
  | 'home'
  | 'back'
  | 'briefcase';

interface Props {
  title?: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: ScreenStateIcon;
  loading?: boolean;
  compact?: boolean;
}

function StateIcon({ icon }: { icon: ScreenStateIcon }) {
  const props = { size: 34, color: '#94a3b8', strokeWidth: 1.8 };

  switch (icon) {
    case 'error':
      return <AlertTriangle {...props} />;
    case 'notifications':
      return <BellOff {...props} />;
    case 'search':
      return <SearchX {...props} />;
    case 'startup':
      return <Rocket {...props} />;
    case 'home':
      return <Home {...props} />;
    case 'back':
      return <ChevronLeft {...props} />;
    case 'briefcase':
      return <Briefcase {...props} />;
    default:
      return <Inbox {...props} />;
  }
}

export default function ScreenState({
  title,
  message,
  actionLabel,
  onAction,
  icon = 'empty',
  loading = false,
  compact = false,
}: Props) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.iconWrap, compact && styles.iconWrapCompact]}>
        {loading ? (
          <ActivityIndicator size="small" color={Colors.textMuted} />
        ) : (
          <StateIcon icon={icon} />
        )}
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
      <Text style={styles.message}>{message}</Text>

      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.button} onPress={onAction} activeOpacity={0.85}>
          <Text style={styles.buttonText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: Radius.xxl,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  wrapCompact: {
    paddingVertical: Spacing.xl,
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapCompact: {
    width: 58,
    height: 58,
    borderRadius: 29,
  },
  title: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.base,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
  },
  button: {
    marginTop: 2,
    backgroundColor: '#0f172a',
    paddingHorizontal: Spacing.xl,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  buttonText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: '#fff',
  },
});
