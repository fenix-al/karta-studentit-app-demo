import React, { useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, CheckCheck, Gift, Briefcase, Calendar,
  Tag, Heart, Trash2, BellOff,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../constants/Theme';
import { AppNotification } from '../types';
import { NOTIFICATIONS } from '../data/mockData';

interface Props {
  onBack: () => void;
}

// ── Icon resolver (string → lucide component) ─────────────────────────────────
function NotifIcon({ name, color }: { name: string; color: string }) {
  const props = { size: 20, color, strokeWidth: 2 };
  switch (name) {
    case 'Gift':     return <Gift     {...props} />;
    case 'Briefcase':return <Briefcase {...props} />;
    case 'Calendar': return <Calendar  {...props} />;
    case 'Tag':      return <Tag       {...props} />;
    case 'Heart':    return <Heart     {...props} />;
    default:         return <Gift      {...props} />;
  }
}

export default function NotificationsScreen({ onBack }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems]           = useState<AppNotification[]>(NOTIFICATIONS);
  const [filter, setFilter]         = useState<'all' | 'unread'>('all');

  const unreadCount = items.filter(n => !n.isRead).length;
  const filtered    = filter === 'all' ? items : items.filter(n => !n.isRead);

  const markAllRead = () => setItems(prev => prev.map(n => ({ ...n, isRead: true })));
  const markRead    = (id: string) => setItems(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const remove      = (id: string) => setItems(prev => prev.filter(n => n.id !== id));

  return (
    <View style={styles.root}>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Njoftimet</Text>

          <TouchableOpacity style={styles.iconBtn} onPress={markAllRead} activeOpacity={0.75}>
            <CheckCheck size={20} color="#0ea5e9" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Filter tabs ──────────────────────────────────────────────── */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, filter === 'all' && styles.filterBtnAllActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>
              Të Gjitha
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, filter === 'unread' && styles.filterBtnUnreadActive]}
            onPress={() => setFilter('unread')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterText, filter === 'unread' && styles.filterTextActive]}>
              Të Palexuara
            </Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, filter === 'unread' && styles.badgeActive]}>
                <Text style={[styles.badgeText, filter === 'unread' && styles.badgeTextActive]}>
                  {unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ── List ─────────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <BellOff size={40} color="#94a3b8" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Nuk ka njoftime</Text>
          <Text style={styles.emptyText}>
            Nuk keni asnjë njoftim të ri për momentin. Çdo përditësim do të shfaqet këtu.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => markRead(item.id)}
              activeOpacity={0.85}
            >
              {/* Unread blue dot */}
              {!item.isRead && <View style={styles.unreadDot} />}

              {/* Icon box */}
              <View style={[styles.iconBox, {
                backgroundColor: item.iconBg,
                borderColor: item.iconBorder,
              }]}>
                <NotifIcon name={item.iconName} color={item.iconColor} />
              </View>

              {/* Content */}
              <View style={styles.content}>
                <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.message} numberOfLines={3}>
                  {item.message}
                </Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>

              {/* Delete button */}
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => remove(item.id)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Trash2 size={15} color="#cbd5e1" strokeWidth={2} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.surfaceBg },

  // Header
  header: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  iconBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1, borderColor: Colors.borderLight,
    justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
  },

  // Filters
  filterRow: { flexDirection: 'row', gap: 12 },
  filterBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnAllActive:    { backgroundColor: '#1e293b', borderColor: '#1e293b' },
  filterBtnUnreadActive: { backgroundColor: '#0ea5e9', borderColor: '#0ea5e9' },
  filterText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: Colors.textMuted,
  },
  filterTextActive: { color: '#fff' },
  badge: {
    backgroundColor: '#e2e8f0',
    borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeActive:    { backgroundColor: '#fff' },
  badgeText:      { fontFamily: Typography.fontBold, fontSize: 10, color: '#475569' },
  badgeTextActive:{ color: '#0ea5e9' },

  // List
  list: { padding: Spacing.xxl, gap: 10 },

  // Cards
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
    gap: 14,
  },
  cardUnread: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    shadowColor: '#0ea5e9', shadowOpacity: 0.06,
  },
  unreadDot: {
    position: 'absolute',
    top: 14, right: 14,
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: '#0ea5e9',
    shadowColor: '#0ea5e9', shadowOpacity: 0.6, shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 }, elevation: 2,
  },
  iconBox: {
    width: 48, height: 48,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
    marginTop: 2,
  },
  content: { flex: 1, paddingRight: 20 },
  title: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.md,
    color: Colors.textSecondary,
    marginBottom: 4,
    lineHeight: 20,
  },
  titleUnread: {
    fontFamily: Typography.fontExtraBold,
    color: Colors.textPrimary,
  },
  message: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    lineHeight: 18,
    marginBottom: 6,
  },
  time: {
    fontFamily: Typography.fontBold,
    fontSize: 11,
    color: '#94a3b8',
  },
  deleteBtn: {
    position: 'absolute',
    bottom: 14, right: 14,
  },

  // Empty state
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  emptyIconWrap: {
    width: 88, height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 2, borderColor: Colors.border,
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: Typography.fontExtraBold,
    fontSize: Typography.xl,
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: Typography.fontMedium,
    fontSize: Typography.sm,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
