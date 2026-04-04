import AsyncStorage from '@react-native-async-storage/async-storage';
import { isRunningInExpoGo } from 'expo';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { registerPushToken, removePushToken } from './api';

const PUSH_DEVICE_ID_KEY = 'sk_push_device_id';
const PUSH_TOKEN_KEY = 'sk_expo_push_token';

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

export async function syncPushTokenWithBackend(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (isRunningInExpoGo()) return false;

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

export async function unregisterPushTokenFromBackend(): Promise<void> {
  if (Platform.OS === 'web') return;
  if (isRunningInExpoGo()) return;

  const deviceId = await getOrCreateDeviceId();
  const pushToken = await getStoredToken();
  await removePushToken(deviceId, pushToken ?? undefined);
}
