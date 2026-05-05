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
  BizCampaign,
  BizProfile,
  BizScanResponse,
  BizTopStudent,
  LiveRaffleCurrentApiResponse,
  LiveRaffleLaunchUrlResponse,
  NotificationApiItem,
  ProfileAct4HistoryApiItem,
  ProfileApplicationApiItem,
  ProfileCourseApiItem,
  ProfileHistoryApiItem,
  ProfileLoyaltyRedemptionApiItem,
  ProfileRaffleEntryApiItem,
  ProfileStartupIdeaApiItem,
  SupportTicketApiItem,
  StudentCard,
} from '../types';

export const TOKEN_KEY = 'sk_jwt_token';
const REMEMBERED_LOGIN_KEY = 'sk_remembered_login';

export class ApiError extends Error {
  status: number;
  code?: string;
  details?: any;

  constructor(message: string, status: number, code?: string, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
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
  if (code === 'scan_cooldown_active') {
    return fallback || 'Ky student eshte skanuar se fundi nga ky biznes.';
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

async function storeSecureValue(key: string, value: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getSecureValue(key: string): Promise<string | null> {
  if (Platform.OS === 'web') {
    return AsyncStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function removeSecureValue(key: string): Promise<void> {
  if (Platform.OS === 'web') {
    await AsyncStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function authHeadersWithoutContentType(): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Public fetch — no auth header (avoids JWT plugin rejecting valid public calls)
async function publicFetch<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${SK_API}${path}`, {
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      let code: string | undefined;
      let details: any;
      try {
        const body = await res.json();
        details = body;
        message = friendlyApiMessage(res.status, body?.code, body?.message || message);
        code = body?.code;
      } catch (_) {
        message = friendlyApiMessage(res.status, undefined, message);
      }
      throw new ApiError(message, res.status, code, details);
    }

    return res.json() as Promise<T>;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError('Serveri vonoi shume. Provo perseri pas pak.', 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Nuk u arrit lidhja me serverin.', 0, 'network_error', error);
  } finally {
    clearTimeout(timeout);
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = await authHeaders();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const res = await fetch(`${SK_API}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
      signal: controller.signal,
    });

    if (!res.ok) {
      let message = `HTTP ${res.status}`;
      let code: string | undefined;
      let details: any;
      try {
        const body = await res.json();
        details = body;
        message = friendlyApiMessage(res.status, body?.code, body?.message || message);
        code = body?.code;
      } catch (_) {}

      if (isAuthStatus(res.status) || isJwtErrorCode(code)) {
        await removeToken();
        emitAuthError('Sesioni juaj ka skaduar. Ju lutem hyni perseri.');
      }

      throw new ApiError(message, res.status, code, details);
    }

    return res.json() as Promise<T>;
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      throw new ApiError('Serveri vonoi shume. Provo perseri pas pak.', 408);
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Nuk u arrit lidhja me serverin.', 0, 'network_error', error);
  } finally {
    clearTimeout(timeout);
  }
}

async function apiUpload<T>(path: string, body: FormData): Promise<T> {
  const headers = await authHeadersWithoutContentType();
  const res = await fetch(`${SK_API}${path}`, {
    method: 'POST',
    body,
    headers,
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    let details: any;
    try {
      const payload = await res.json();
      details = payload;
      message = friendlyApiMessage(res.status, payload?.code, payload?.message || message);
      code = payload?.code;
    } catch (_) {}

    if (isAuthStatus(res.status) || isJwtErrorCode(code)) {
      await removeToken();
      emitAuthError('Sesioni juaj ka skaduar. Ju lutem hyni perseri.');
    }

    throw new ApiError(message, res.status, code, details);
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

export interface RememberedLogin {
  username: string;
  email?: string | null;
  displayName?: string | null;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  let res: Response;
  try {
    res = await fetch(JWT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
  } catch (_) {
    throw new Error('Nuk u arrit serveri. Provo perseri.');
  }

  if (!res.ok) {
    let code: string | undefined;
    let message = 'Fjalekalim gabim';
    try {
      const body = await res.json();
      code = body?.code;
      if (body?.message && !isAuthStatus(res.status)) message = body.message;
    } catch (_) {}
    if (isAuthStatus(res.status) || code === 'incorrect_password' || code === 'invalid_username') {
      throw new Error('Fjalekalim gabim');
    }
    throw new Error(message);
  }

  const data: LoginResponse = await res.json();
  await storeToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  await removeToken();
}

export async function getRememberedLogin(): Promise<RememberedLogin | null> {
  const raw = await getSecureValue(REMEMBERED_LOGIN_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<RememberedLogin>;
    if (!parsed.username) return null;

    const remembered = {
      username: parsed.username,
      email: parsed.email ?? null,
      displayName: parsed.displayName ?? null,
    };
    await storeSecureValue(REMEMBERED_LOGIN_KEY, JSON.stringify(remembered));
    return remembered;
  } catch (_) {
    return null;
  }
}

export async function saveRememberedLogin(loginData: RememberedLogin): Promise<void> {
  await storeSecureValue(REMEMBERED_LOGIN_KEY, JSON.stringify(loginData));
}

export async function clearRememberedLogin(): Promise<void> {
  await removeSecureValue(REMEMBERED_LOGIN_KEY);
}

// ── Student card ──────────────────────────────────────────────────────────────

export async function fetchMe(): Promise<StudentCard> {
  return apiFetch<StudentCard>('/me');
}

// ── Role detection ────────────────────────────────────────────────────────────
// Used during login and app startup to determine which home screen to show.
// Does NOT use apiFetch — intentionally bypasses the removeToken side effect.
// A 403 from /sk/v1/me means "wrong role, not bad token" when /biz/me succeeds.

export type UserRole = 'student' | 'business';

export type RoleDetectionResult =
  | { role: 'student';  studentCard: StudentCard }
  | { role: 'business'; bizProfile:  BizProfile  }
  | { role: 'no_card' }   // valid student token, but no card linked yet
  | null;                 // missing token, network failure, or unknown role

export async function detectUserRole(): Promise<RoleDetectionResult> {
  const token = await getToken();
  if (!token) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Try student endpoint first
  try {
    const res = await fetch(`${SK_API}/me`, { headers });
    if (res.ok) {
      const data = await res.json() as StudentCard;
      return { role: 'student', studentCard: data };
    }
    if (res.status === 404) {
      try {
        const body = await res.json();
        if (body?.code === 'no_card') return { role: 'no_card' };
      } catch (_) {}
    }
    // 403 = valid token but wrong role — fall through to try business
    // Any other non-403 status = unexpected; abort
    if (res.status !== 403) return null;
  } catch (_) {
    return null; // network failure
  }

  // Try business endpoint (only when student returned 403)
  try {
    const res = await fetch(`${SK_API}/biz/me`, { headers });
    if (res.ok) {
      const data = await res.json() as BizProfile;
      return { role: 'business', bizProfile: data };
    }
  } catch (_) {}

  return null;
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

export async function fetchLiveRaffleLaunchUrl(sessionId: number): Promise<LiveRaffleLaunchUrlResponse> {
  return apiFetch<LiveRaffleLaunchUrlResponse>(`/live-raffles/player-launch-url?session_id=${sessionId}`);
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

export interface AppPromotionApiItem {
  id: number;
  title: string;
  subtitle?: string;
  badge?: string;
  cta_text?: string;
  media_type: 'image' | 'video';
  image_url?: string | null;
  video_url?: string | null;
  poster_url?: string | null;
  target_url?: string;
  linked_business_id?: number;
  linked_business_title?: string;
  sort_order?: number;
}

export async function fetchAppPromotions(): Promise<{ items: AppPromotionApiItem[] }> {
  return publicFetch('/app-promotions');
}

export interface PrivacyPolicyApiResponse {
  title: string;
  intro: string;
  content_html?: string;
  content_text: string;
  url?: string;
}

export async function fetchPrivacyPolicy(): Promise<PrivacyPolicyApiResponse> {
  return publicFetch('/privacy-policy');
}

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

export interface NotificationsResponse {
  items: NotificationApiItem[];
  unread_count: number;
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export async function fetchMyNotifications(params?: { page?: number; perPage?: number }): Promise<NotificationsResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.perPage) query.set('per_page', String(params.perPage));

  return apiFetch<NotificationsResponse>(`/me/notifications${query.toString() ? `?${query.toString()}` : ''}`);
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

export interface UploadSupportAttachmentResult {
  success: boolean;
  attachment_id: number;
  attachment_url: string;
  mime_type: string;
}

export interface CreateSupportTicketResult {
  success: boolean;
  msg: string;
  ticket: SupportTicketApiItem;
}

export interface ReplySupportTicketResult {
  success: boolean;
  msg: string;
  ticket: SupportTicketApiItem;
}

export interface MarkSupportTicketsReadResult {
  success: boolean;
  marked_at: string;
}

export async function uploadSupportAttachment(
  asset: { uri: string; name?: string; mimeType?: string },
): Promise<UploadSupportAttachmentResult> {
  const formData = new FormData();
  formData.append('file', {
    uri: asset.uri,
    name: asset.name || 'support-photo.jpg',
    type: asset.mimeType || 'image/jpeg',
  } as any);

  return apiUpload('/me/support-tickets/attachment', formData);
}

export async function createSupportTicket(input: {
  category: string;
  subject: string;
  message: string;
  attachment_id?: number;
  attachment_url?: string;
}): Promise<CreateSupportTicketResult> {
  return apiFetch('/me/support-tickets', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function requestAccountDeletion(message?: string): Promise<CreateSupportTicketResult> {
  const profile = await fetchMe();
  const details = [
    'Kerkese per fshirjen e llogarise dhe te dhenave personale nga aplikacioni Karta e Studentit Shkoder.',
    '',
    `Student: ${profile.emeri} ${profile.mbiemeri}`,
    `Email: ${profile.email || '-'}`,
    `NIM: ${profile.nim || '-'}`,
    `Nr. karte: ${profile.nr_karte || '-'}`,
    '',
    'Shenim i perdoruesit:',
    message?.trim() || 'Pa shenim shtese.',
  ].join('\n');

  return createSupportTicket({
    category: 'account_deletion',
    subject: 'Kerkese per fshirje llogarie',
    message: details,
  });
}

export async function fetchMySupportTickets(): Promise<SupportTicketApiItem[]> {
  return apiFetch<SupportTicketApiItem[]>('/me/support-tickets');
}

export async function replySupportTicket(
  ticketId: number,
  input: {
    message: string;
    attachment_id?: number;
    attachment_url?: string;
  },
): Promise<ReplySupportTicketResult> {
  return apiFetch(`/me/support-tickets/${ticketId}/messages`, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function markSupportTicketsRead(ticketId?: number): Promise<MarkSupportTicketsReadResult> {
  return apiFetch('/me/support-tickets/read', {
    method: 'POST',
    body: JSON.stringify(ticketId ? { ticket_id: ticketId } : {}),
  });
}

// ── Business Panel ────────────────────────────────────────────────────────────
// All endpoints require a JWT token issued to a user with the
// `business_partner` WordPress role. Calling these with a student token
// returns 403. Calling without a token returns 401.

export async function fetchBizMe(): Promise<BizProfile> {
  return apiFetch<BizProfile>('/biz/me');
}

export async function fetchBizTopStudents(): Promise<BizTopStudent[]> {
  return apiFetch<BizTopStudent[]>('/biz/top-students');
}

export async function fetchBizCampaigns(): Promise<BizCampaign[]> {
  return apiFetch<BizCampaign[]>('/biz/campaigns');
}

export async function postBizCampaign(
  titulli:    string,
  lloji:      string,
  pershkrimi: string,
): Promise<{ success: boolean; id: number; msg: string }> {
  return apiFetch('/biz/campaigns', {
    method: 'POST',
    body: JSON.stringify({ titulli, lloji, pershkrimi }),
  });
}

export async function postBizScan(token: string): Promise<BizScanResponse> {
  return apiFetch<BizScanResponse>('/scan', {
    method: 'POST',
    body: JSON.stringify({ token }),
  });
}
