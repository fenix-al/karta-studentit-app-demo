import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft, CheckCheck, Gift, Briefcase, Calendar,
  Tag, Heart, Trash2, BellOff, Megaphone, Trophy, Bell,
} from 'lucide-react-native';

import { Colors, Typography, Spacing, Radius } from '../constants/Theme';
import { AppNotification, NotificationApiItem } from '../types';
import { useFetch } from '../hooks/useFetch';
import {
  deleteNotification,
  fetchMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../services/api';
import ListSkeleton from '../components/ListSkeleton';

interface Props {
  onBack: () => void;
  onOpenNotification?: (notification: AppNotification) => void;
}

const PAGE_SIZE = 50;

function notificationAppearance(type: AppNotification['type']) {
  switch (type) {
    case 'offer':
      return { iconName: 'Tag', iconColor: '#0284c7', iconBg: '#e0f2fe', iconBorder: '#bae6fd' };
    case 'job':
      return { iconName: 'Briefcase', iconColor: '#7c3aed', iconBg: '#f3e8ff', iconBorder: '#ddd6fe' };
    case 'course':
      return { iconName: 'Calendar', iconColor: '#16a34a', iconBg: '#dcfce7', iconBorder: '#bbf7d0' };
    case 'act4':
      return { iconName: 'Heart', iconColor: '#ea580c', iconBg: '#ffedd5', iconBorder: '#fed7aa' };
    case 'startup':
      return { iconName: 'Megaphone', iconColor: '#db2777', iconBg: '#fce7f3', iconBorder: '#fbcfe8' };
    case 'kvr':
      return { iconName: 'Bell', iconColor: '#0f766e', iconBg: '#ccfbf1', iconBorder: '#99f6e4' };
    case 'raffle':
    case 'live_raffle':
      return { iconName: 'Gift', iconColor: '#ca8a04', iconBg: '#fef9c3', iconBorder: '#fde68a' };
    case 'points':
      return { iconName: 'Trophy', iconColor: '#ca8a04', iconBg: '#fef9c3', iconBorder: '#fde68a' };
    case 'support_ticket':
      return { iconName: 'Bell', iconColor: '#dc2626', iconBg: '#fee2e2', iconBorder: '#fecaca' };
    default:
      return { iconName: 'Gift', iconColor: '#475569', iconBg: '#f1f5f9', iconBorder: '#e2e8f0' };
  }
}

function NotifIcon({ name, color }: { name: string; color: string }) {
  const props = { size: 20, color, strokeWidth: 2 };
  switch (name) {
    case 'Gift':      return <Gift {...props} />;
    case 'Briefcase': return <Briefcase {...props} />;
    case 'Calendar':  return <Calendar {...props} />;
    case 'Tag':       return <Tag {...props} />;
    case 'Heart':     return <Heart {...props} />;
    case 'Megaphone': return <Megaphone {...props} />;
    case 'Trophy':    return <Trophy {...props} />;
    case 'Bell':      return <Bell {...props} />;
    default:          return <Gift {...props} />;
  }
}

function formatNotificationTime(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return '';

  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMin < 1) return 'Tani';
  if (diffMin < 60) return `${diffMin} min më parë`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} orë më parë`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ditë më parë`;

  return date.toLocaleDateString('sq-AL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function mapNotification(item: NotificationApiItem): AppNotification {
  const appearance = notificationAppearance(item.type);

  return {
    id: String(item.id),
    type: item.type,
    postId: item.post_id,
    title: item.title,
    message: item.message,
    time: formatNotificationTime(item.created_at),
    isRead: item.is_read,
    ...appearance,
  };
}

export default function NotificationsScreen({ onBack, onOpenNotification }: Props) {
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [items, setItems] = useState<AppNotification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [serverUnreadCount, setServerUnreadCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  const { data, loading, error, reload } = useFetch(() => fetchMyNotifications({ page: 1, perPage: PAGE_SIZE }));

  useEffect(() => {
    setItems((data?.items ?? []).map(mapNotification));
    setPage(data?.page ?? 1);
    setTotalPages(data?.total_pages ?? 1);
    setServerUnreadCount(data?.unread_count ?? 0);
  }, [data]);

  const unreadCount = serverUnreadCount;
  const filtered = useMemo(
    () => (filter === 'all' ? items : items.filter((n) => !n.isRead)),
    [filter, items],
  );

  async function handleLoadMore() {
    if (loading || loadingMore || page >= totalPages) return;

    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const next = await fetchMyNotifications({ page: nextPage, perPage: PAGE_SIZE });
      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.id));
        const nextItems = next.items.map(mapNotification).filter((item) => !seen.has(item.id));
        return [...prev, ...nextItems];
      });
      setPage(next.page);
      setTotalPages(next.total_pages);
      setServerUnreadCount(next.unread_count);
    } catch {
      Alert.alert('Gabim', 'Njoftimet e tjera nuk u ngarkuan dot. Provo përsëri.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleMarkAllRead() {
    if (serverUnreadCount === 0) return;

    setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setServerUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setItems((data?.items ?? []).map(mapNotification));
      setServerUnreadCount(data?.unread_count ?? 0);
      Alert.alert('Gabim', 'Njoftimet nuk u përditësuan dot. Provo përsëri.');
    }
  }

  async function handleMarkRead(id: string) {
    const target = items.find((item) => item.id === id);
    if (!target) return;

    if (target.isRead) {
      onOpenNotification?.(target);
      return;
    }

    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)));
    setServerUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await markNotificationRead(Number(id));
    } catch {
      setItems((data?.items ?? []).map(mapNotification));
      setServerUnreadCount(data?.unread_count ?? 0);
      Alert.alert('Gabim', 'Njoftimi nuk u shënua dot si i lexuar. Provo përsëri.');
    }
    onOpenNotification?.(target);
  }

  async function handleDelete(id: string) {
    const previousItems = items;
    const previousUnreadCount = serverUnreadCount;
    const deletedItem = items.find((item) => item.id === id);
    setItems((prev) => prev.filter((item) => item.id !== id));
    if (deletedItem && !deletedItem.isRead) {
      setServerUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await deleteNotification(Number(id));
    } catch {
      setItems(previousItems);
      setServerUnreadCount(previousUnreadCount);
      Alert.alert('Gabim', 'Njoftimi nuk u fshi dot. Provo përsëri.');
    }
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.iconBtn} onPress={onBack} activeOpacity={0.75}>
            <ChevronLeft size={22} color={Colors.textPrimary} strokeWidth={2.5} />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>Njoftimet</Text>

          <TouchableOpacity style={styles.iconBtn} onPress={handleMarkAllRead} activeOpacity={0.75}>
            <CheckCheck size={20} color="#0ea5e9" strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

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

      {loading ? (
        <ListSkeleton count={5} variant="compact" />
      ) : error ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <BellOff size={40} color="#94a3b8" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Gabim në ngarkim</Text>
          <Text style={styles.emptyText}>
            {error}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>Provo përsëri</Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <BellOff size={40} color="#94a3b8" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>Nuk ka njoftime</Text>
          <Text style={styles.emptyText}>
            Nuk keni asnjë njoftim të ri për momentin. Çdo përditësim i ri nga WordPress do të shfaqet këtu.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.35}
          ListFooterComponent={loadingMore ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color={Colors.textMuted} />
            </View>
          ) : null}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, !item.isRead && styles.cardUnread]}
              onPress={() => handleMarkRead(item.id)}
              activeOpacity={0.85}
            >
              {!item.isRead && <View style={styles.unreadDot} />}

              <View style={[styles.iconBox, {
                backgroundColor: item.iconBg,
                borderColor: item.iconBorder,
              }]}
              >
                <NotifIcon name={item.iconName} color={item.iconColor} />
              </View>

              <View style={styles.content}>
                <Text style={[styles.title, !item.isRead && styles.titleUnread]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={styles.message} numberOfLines={3}>
                  {item.message}
                </Text>
                <Text style={styles.time}>{item.time}</Text>
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(item.id)}
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
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontFamily: Typography.fontMedium, fontSize: Typography.base, color: Colors.textMuted },

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
  filterRow: { flexDirection: 'row', gap: 12 },
  filterBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surfaceBg,
    borderWidth: 1, borderColor: Colors.border,
  },
  filterBtnAllActive: { backgroundColor: '#1e293b', borderColor: '#1e293b' },
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
  badgeActive: { backgroundColor: '#fff' },
  badgeText: { fontFamily: Typography.fontBold, fontSize: 10, color: '#475569' },
  badgeTextActive: { color: '#0ea5e9' },

  list: { padding: Spacing.xxl, gap: 10 },
  footerLoader: { paddingVertical: Spacing.lg, alignItems: 'center' },
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
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  retryText: {
    fontFamily: Typography.fontBold,
    fontSize: Typography.sm,
    color: '#fff',
  },
});
