import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { registerPushToken, removePushToken } from './api';

const PUSH_DEVICE_ID_KEY = 'sk_push_device_id';
const PUSH_TOKEN_KEY = 'sk_expo_push_token';
export const PUSH_NOTIFICATIONS_ENABLED_KEY = 'sk_push_notifications_enabled';

export type PushNotificationRoute = {
  type: string;
  postId: number;
  title: string;
  message: string;
};

let notificationHandlerConfigured = false;

async function getOrCreateDeviceId(): Promise<string> {
  const existing = await AsyncStorage.getItem(PUSH_DEVICE_ID_KEY);
  if (existing) return existing;

  const created = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  await AsyncStorage.setItem(PUSH_DEVICE_ID_KEY, created);
  return created;
}

async function getStoredToken(): Promise<string | null> {
  return AsyncStorage.getItem(PUSH_TOKEN_KEY);
}

async function storeToken(token: string): Promise<void> {
  await AsyncStorage.setItem(PUSH_TOKEN_KEY, token);
}

function getProjectId(): string | undefined {
  const easProjectId = Constants.easConfig?.projectId;
  if (easProjectId) return easProjectId;

  const expoExtra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return expoExtra?.eas?.projectId;
}

async function loadNotificationsModule() {
  return import('expo-notifications');
}

function extractRouteFromNotification(notification: any): PushNotificationRoute | null {
  const content = notification?.request?.content;
  const data = content?.data ?? {};
  const type = typeof data.type === 'string' ? data.type : 'system';
  const rawPostId = data.post_id ?? data.postId ?? 0;
  const postId = Number(rawPostId) || 0;

  return {
    type,
    postId,
    title: String(content?.title ?? ''),
    message: String(content?.body ?? ''),
  };
}

export async function getPushNotificationsPreference(): Promise<boolean> {
  const stored = await AsyncStorage.getItem(PUSH_NOTIFICATIONS_ENABLED_KEY);
  return stored == null ? true : stored === 'true';
}

export async function configurePushNotificationHandler(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (isRunningInExpoGo()) return;
  if (notificationHandlerConfigured) return;

  const Notifications = await loadNotificationsModule();
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  notificationHandlerConfigured = true;
}

export async function syncPushTokenWithBackend(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (isRunningInExpoGo()) return false;

  const Notifications = await loadNotificationsModule();
  await configurePushNotificationHandler();

  const deviceId = await getOrCreateDeviceId();

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#84cc16',
    });
  }

  const permissions = await Notifications.getPermissionsAsync();
  let finalStatus = permissions.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') return false;

  const projectId = getProjectId();
  const tokenResponse = projectId
    ? await Notifications.getExpoPushTokenAsync({ projectId })
    : await Notifications.getExpoPushTokenAsync();

  const pushToken = tokenResponse.data;
  if (!pushToken) return false;

  await registerPushToken(pushToken, deviceId, Platform.OS);
  await storeToken(pushToken);
  return true;
}

export async function syncPushTokenIfEnabled(): Promise<boolean> {
  if (!(await getPushNotificationsPreference())) return false;
  return syncPushTokenWithBackend();
}

export async function unregisterPushTokenFromBackend(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (isRunningInExpoGo()) return;

  const deviceId = await getOrCreateDeviceId();
  const pushToken = await getStoredToken();
  await removePushToken(deviceId, pushToken ?? undefined);
  await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
}

export async function subscribeToPushNotificationRoutes(
  onRoute: (route: PushNotificationRoute) => void,
  onForeground?: (route: PushNotificationRoute) => void,
): Promise<() => void> {
  if (Platform.OS === 'web') return () => {};
  if (isRunningInExpoGo()) return () => {};

  const Notifications = await loadNotificationsModule();
  await configurePushNotificationHandler();

  const receivedSub = Notifications.addNotificationReceivedListener((notification: any) => {
    const route = extractRouteFromNotification(notification);
    if (route) onForeground?.(route);
  });

  const responseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
    const route = extractRouteFromNotification(response?.notification);
    if (route) onRoute(route);
  });

  const lastResponse = await Notifications.getLastNotificationResponseAsync?.();
  const initialRoute = extractRouteFromNotification(lastResponse?.notification);
  if (initialRoute) {
    onRoute(initialRoute);
    await Notifications.clearLastNotificationResponseAsync?.();
  }

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
