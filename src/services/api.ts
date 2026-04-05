// ─────────────────────────────────────────────────────────────────────────────
// API SERVICE — Karta e Studentit App
// Authenticated fetch wrapper around the WordPress REST API.
// All student-gated endpoints require a JWT Bearer token.
// ─────────────────────────────────────────────────────────────────────────────

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SK_API, JWT_ENDPOINT } from '../constants/config';
import {
  LiveRaffleCurrentApiResponse,
  LiveRaffleEventsApiResponse,
  LiveRaffleStateApiResponse,
  NotificationApiItem,
  ProfileAct4HistoryApiItem,
  ProfileApplicationApiItem,
  ProfileCourseApiItem,
  ProfileHistoryApiItem,
  ProfileLoyaltyRedemptionApiItem,
  ProfileRaffleEntryApiItem,
  ProfileStartupIdeaApiItem,
  StudentCard,
} from '../types';

export const TOKEN_KEY = 'sk_jwt_token';

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

const authErrorListeners = new Set<(message: string) => void>();

export function subscribeToAuthErrors(listener: (message: string) => void): () => void {
  authErrorListeners.add(listener);
  return () => authErrorListeners.delete(listener);
}

function emitAuthError(message: string) {
  authErrorListeners.forEach((listener) => listener(message));
}

function isAuthStatus(status: number) {
  return status === 401 || status === 403;
}

function isJwtErrorCode(code?: string) {
  if (!code) return false;
  return code.startsWith('jwt_') || code === 'forbidden' || code === 'rest_forbidden';
}

function friendlyApiMessage(status: number, code?: string, fallback?: string) {
  if (code === 'no_card') {
    return 'Nuk u gjet nje karte aktive per kete llogari.';
  }
  if (code === 'not_found') {
    return 'Ky element nuk eshte me i disponueshem.';
  }
  if (isAuthStatus(status) || isJwtErrorCode(code)) {
    return 'Sesioni ka skaduar. Ju lutem hyni perseri.';
  }
  if (status === 404) {
    return 'Permbajtja nuk u gjet.';
  }
  return fallback || `HTTP ${status}`;
}

// ── Platform-safe storage (SecureStore on native, AsyncStorage on web) ─────────

async function storeToken(value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(TOKEN_KEY, value);
  } else {
    await SecureStore.setItemAsync(TOKEN_KEY, value);
  }
}

export async function getToken(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(TOKEN_KEY);
  }
  return SecureStore.getItemAsync(TOKEN_KEY);
}

async function removeToken(): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } else {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Public fetch — no auth header (avoids JWT plugin rejecting valid public calls)
async function publicFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${SK_API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    try {
      const body = await res.json();
      message = friendlyApiMessage(res.status, body?.code, body?.message || message);
      code = body?.code;
    } catch (_) {
      message = friendlyApiMessage(res.status, undefined, message);
    }
    throw new ApiError(message, res.status, code);
  }
  return res.json() as Promise<T>;
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(`${SK_API}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    try {
      const body = await res.json();
      message = friendlyApiMessage(res.status, body?.code, body?.message || message);
      code = body?.code;
    } catch (_) {}

    if (isAuthStatus(res.status) || isJwtErrorCode(code)) {
      await removeToken();
      emitAuthError('Sesioni juaj ka skaduar. Ju lutem hyni perseri.');
    }

    throw new ApiError(message, res.status, code);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export interface LoginResponse {
  token:            string;
  user_display_name:string;
  user_email:       string;
  user_nicename:    string;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(JWT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!res.ok) {
    let message = 'Kredencialet janë të gabuara.';
    try {
      const body = await res.json();
      if (body?.message) message = body.message;
    } catch (_) {}
    throw new Error(message);
  }

  const data: LoginResponse = await res.json();
  await storeToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  await removeToken();
}

// ── Student card ──────────────────────────────────────────────────────────────

export async function fetchMe(): Promise<StudentCard> {
  return apiFetch<StudentCard>('/me');
}

// ── Points ────────────────────────────────────────────────────────────────────

export interface PointsTransaction {
  points:        number;
  business_name: string;
  date:          string;
  type:          'earn' | 'spend';
}

export interface PointsResponse {
  balance:      number;
  transactions: PointsTransaction[];
}

export async function fetchPoints(): Promise<PointsResponse> {
  return apiFetch<PointsResponse>('/points');
}

// ── Loyalty ───────────────────────────────────────────────────────────────────

export interface LoyaltyApiReward {
  uid:        string;
  title:      string;
  threshold:  number;
  one_time:   boolean;
  unlocked:   boolean;
  redeemed:   boolean;
  progress:   number;
}

export interface LoyaltyApiBusiness {
  business_post_id: number;
  business_name:    string;
  logo:             string | null;
  scan_count:       number;
  rewards:          LoyaltyApiReward[];
}

export async function fetchLoyalty(): Promise<LoyaltyApiBusiness[]> {
  return apiFetch<LoyaltyApiBusiness[]>('/loyalty');
}

export async function redeemLoyaltyReward(
  businessPostId: number,
  rewardUid: string,
): Promise<{ success: boolean; msg: string }> {
  return apiFetch('/loyalty/redeem', {
    method: 'POST',
    body: JSON.stringify({ business_post_id: businessPostId, reward_uid: rewardUid }),
  });
}

export interface RaffleApiItem {
  id:          number;
  title:       string;
  excerpt:     string;
  image:       string | null;
  points_cost: number;
  end_date:    string | null;
  has_entered: boolean;
  can_afford:  boolean;
}

export async function fetchRaffles(): Promise<RaffleApiItem[]> {
  return apiFetch<RaffleApiItem[]>('/raffles');
}

export async function enterRaffle(
  raffleId: number,
): Promise<{ success: boolean; msg: string; new_balance: number }> {
  return apiFetch('/raffles/enter', {
    method: 'POST',
    body: JSON.stringify({ raffle_id: raffleId }),
  });
}

// ── Offers / Businesses ───────────────────────────────────────────────────────

export async function fetchCurrentLiveRaffle(): Promise<LiveRaffleCurrentApiResponse> {
  return apiFetch<LiveRaffleCurrentApiResponse>('/live-raffles/current');
}

export async function fetchLiveRaffleState(sessionId: number): Promise<LiveRaffleStateApiResponse> {
  return apiFetch<LiveRaffleStateApiResponse>(`/live-raffles/${sessionId}/state`);
}

export async function fetchLiveRaffleEvents(
  sessionId: number,
  limit = 30,
): Promise<LiveRaffleEventsApiResponse> {
  return apiFetch<LiveRaffleEventsApiResponse>(`/live-raffles/${sessionId}/events?limit=${limit}`);
}

export async function joinLiveRaffle(
  sessionId: number,
): Promise<{ success: boolean }> {
  return apiFetch(`/live-raffles/${sessionId}/join`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function pickLiveRaffleBox(
  sessionId: number,
  roundNo: number,
  boxNumber: number,
): Promise<{ success: boolean; round_no: number; box_number: number; picked_at: string }> {
  return apiFetch(`/live-raffles/${sessionId}/pick`, {
    method: 'POST',
    body: JSON.stringify({
      round_no: roundNo,
      box_number: boxNumber,
    }),
  });
}

export async function fetchOffers(params?: {
  category?: string;
  search?:   string;
  lat?:      number;
  lng?:      number;
}) {
  const qs = params
    ? new URLSearchParams(
        Object.fromEntries(
          Object.entries(params)
            .filter(([, v]) => v != null)
            .map(([k, v]) => [k, String(v)])
        )
      ).toString()
    : '';
  return apiFetch(`/businesses${qs ? `?${qs}` : ''}`);
}

export async function fetchOffer(id: number) {
  // Use apiFetch (sends JWT if logged in) so the API can return has_recommended
  return apiFetch(`/businesses/${id}`);
}

export async function recommendBusiness(id: string): Promise<{ recommended: boolean; votes: number }> {
  return apiFetch(`/businesses/${id}/recommend`, { method: 'POST' });
}

export async function fetchBusinessCategories(): Promise<Array<{ id: number; slug: string; name: string; count: number }>> {
  return publicFetch('/business-categories');
}

// ── Kurset (Courses) ──────────────────────────────────────────────────────────

export async function fetchKurset(params?: { category?: string; search?: string }) {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params ?? {}).filter(([, v]) => v != null && v !== '')) as Record<string, string>
  ).toString();
  return apiFetch(`/kurset${qs ? `?${qs}` : ''}`);
}

export async function fetchKurs(id: number) {
  return apiFetch(`/kurset/${id}`);
}

export async function fetchKursCategories(): Promise<Array<{ id: number; slug: string; name: string; count: number }>> {
  return publicFetch('/kurs-categories');
}

export async function enrollCourse(courseId: number): Promise<{ success: boolean; msg: string }> {
  return apiFetch('/kurset/enroll', {
    method: 'POST',
    body: JSON.stringify({ course_id: courseId }),
  });
}

// ── KVR ───────────────────────────────────────────────────────────────────────

export async function fetchKvr(params?: { category?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return publicFetch(`/kvr${qs ? `?${qs}` : ''}`);
}

export async function fetchKvrSingle(id: number) {
  return publicFetch(`/kvr/${id}`);
}

// ── ACT4Shkodra ───────────────────────────────────────────────────────────────

export async function fetchKvrCategories(): Promise<Array<{ id: number; slug: string; name: string; count: number }>> {
  return publicFetch('/kvr-categories');
}

export async function fetchAct4(params?: { category?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return publicFetch(`/act4${qs ? `?${qs}` : ''}`);
}

export async function fetchAct4Single(id: number) {
  return publicFetch(`/act4/${id}`);
}

export async function volunteerAct4(
  activityId: number,
  interests?: string,
): Promise<{ success: boolean; msg: string }> {
  return apiFetch('/act4/volunteer', {
    method: 'POST',
    body: JSON.stringify({
      activity_id: activityId,
      interests: interests ?? '',
    }),
  });
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export async function fetchJobs(params?: { type?: string; search?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return apiFetch(`/opportunities${qs ? `?${qs}` : ''}`);
}

export async function fetchJobCategories(): Promise<Array<{ id: number; slug: string; name: string; count: number }>> {
  return publicFetch('/opportunity-categories');
}

export async function fetchJob(id: number) {
  return apiFetch(`/opportunities/${id}`);
}

export async function applyJob(jobId: number): Promise<{ success: boolean; msg: string }> {
  return apiFetch('/opportunities/apply', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId }),
  });
}

// ── Startups ──────────────────────────────────────────────────────────────────

export async function fetchStartups(params?: { type?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return publicFetch(`/startup${qs ? `?${qs}` : ''}`);
}

export async function fetchStartupSingle(id: number) {
  return publicFetch(`/startup/${id}`);
}

export async function submitStartupIdea(
  ideaTitle: string,
  ideaDesc: string,
  helpNeeded: string,
): Promise<{ success: boolean; msg: string }> {
  return apiFetch('/startup/idea', {
    method: 'POST',
    body: JSON.stringify({
      idea_title: ideaTitle,
      idea_desc: ideaDesc,
      help_needed: helpNeeded,
    }),
  });
}

// ── Me: history, applications, suggestion ─────────────────────────────────────

export async function fetchMyHistory(): Promise<ProfileHistoryApiItem[]> {
  return apiFetch<ProfileHistoryApiItem[]>('/me/history');
}

export async function fetchMyApplications(): Promise<ProfileApplicationApiItem[]> {
  return apiFetch<ProfileApplicationApiItem[]>('/me/applications');
}

export async function fetchMyCourses(): Promise<ProfileCourseApiItem[]> {
  return apiFetch<ProfileCourseApiItem[]>('/me/courses');
}

export async function fetchMyStartupIdeas(): Promise<ProfileStartupIdeaApiItem[]> {
  return apiFetch<ProfileStartupIdeaApiItem[]>('/me/startup-ideas');
}

export async function fetchMyAct4History(): Promise<ProfileAct4HistoryApiItem[]> {
  return apiFetch<ProfileAct4HistoryApiItem[]>('/me/act4-history');
}

export async function fetchMyRaffles(): Promise<ProfileRaffleEntryApiItem[]> {
  return apiFetch<ProfileRaffleEntryApiItem[]>('/me/raffles');
}

export async function fetchMyLoyaltyRedemptions(): Promise<ProfileLoyaltyRedemptionApiItem[]> {
  return apiFetch<ProfileLoyaltyRedemptionApiItem[]>('/me/loyalty-redemptions');
}

export async function fetchMyNotifications(): Promise<{ items: NotificationApiItem[]; unread_count: number }> {
  return apiFetch<{ items: NotificationApiItem[]; unread_count: number }>('/me/notifications');
}

export async function markNotificationRead(notificationId: number): Promise<{ success: boolean }> {
  return apiFetch('/me/notifications/read', {
    method: 'POST',
    body: JSON.stringify({ notification_id: notificationId }),
  });
}

export async function markAllNotificationsRead(): Promise<{ success: boolean }> {
  return apiFetch('/me/notifications/read-all', {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

export async function deleteNotification(notificationId: number): Promise<{ success: boolean }> {
  return apiFetch('/me/notifications/delete', {
    method: 'POST',
    body: JSON.stringify({ notification_id: notificationId }),
  });
}

export async function registerPushToken(
  pushToken: string,
  deviceId: string,
  platform: string,
): Promise<{ success: boolean }> {
  return apiFetch('/me/push-token', {
    method: 'POST',
    body: JSON.stringify({
      push_token: pushToken,
      device_id: deviceId,
      platform,
    }),
  });
}

export async function removePushToken(
  deviceId: string,
  pushToken?: string,
): Promise<{ success: boolean }> {
  return apiFetch('/me/push-token/remove', {
    method: 'POST',
    body: JSON.stringify({
      device_id: deviceId,
      push_token: pushToken ?? '',
    }),
  });
}

export async function postSuggestion(
  topic: string,
  message: string,
): Promise<{ success: boolean; msg: string }> {
  return apiFetch('/me/suggestion', {
    method: 'POST',
    body: JSON.stringify({ topic, message }),
  });
}
