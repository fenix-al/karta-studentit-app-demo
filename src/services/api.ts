// ─────────────────────────────────────────────────────────────────────────────
// API SERVICE — Karta e Studentit App
// Authenticated fetch wrapper around the WordPress REST API.
// All student-gated endpoints require a JWT Bearer token.
// ─────────────────────────────────────────────────────────────────────────────

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SK_API, JWT_ENDPOINT } from '../constants/config';
import { StudentCard } from '../types';

export const TOKEN_KEY = 'sk_jwt_token';

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
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
    try {
      const body = await res.json();
      message = body?.message || message;
    } catch (_) {}
    throw new Error(message);
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

export interface PointsResponse {
  total:   number;
  entries: Array<{
    id:            number;
    business_name: string;
    points_earned: number;
    created_at:    string;
  }>;
}

export async function fetchPoints(): Promise<PointsResponse> {
  return apiFetch<PointsResponse>('/points');
}

// ── Loyalty ───────────────────────────────────────────────────────────────────

export async function fetchLoyalty() {
  return apiFetch('/loyalty');
}

// ── Offers / Businesses ───────────────────────────────────────────────────────

export async function fetchOffers(params?: { category?: string; search?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return publicFetch(`/businesses${qs ? `?${qs}` : ''}`);
}

export async function fetchOffer(id: number) {
  return publicFetch(`/businesses/${id}`);
}

export async function fetchBusinessCategories(): Promise<Array<{ id: number; slug: string; name: string; count: number }>> {
  return publicFetch('/business-categories');
}

// ── Kurset (Courses) ──────────────────────────────────────────────────────────

export async function fetchKurset(params?: { category?: string; search?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return publicFetch(`/kurset${qs ? `?${qs}` : ''}`);
}

export async function fetchKurs(id: number) {
  return publicFetch(`/kurset/${id}`);
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

export async function fetchAct4(params?: { category?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return publicFetch(`/act4${qs ? `?${qs}` : ''}`);
}

export async function fetchAct4Single(id: number) {
  return publicFetch(`/act4/${id}`);
}

export async function volunteerAct4(activityId: number): Promise<{ success: boolean; message: string }> {
  return apiFetch('/act4/volunteer', {
    method: 'POST',
    body: JSON.stringify({ activity_id: activityId }),
  });
}

// ── Jobs ──────────────────────────────────────────────────────────────────────

export async function fetchJobs(params?: { category?: string; search?: string }) {
  const qs = new URLSearchParams(params as Record<string, string>).toString();
  return publicFetch(`/opportunities${qs ? `?${qs}` : ''}`);
}

export async function applyJob(jobId: number): Promise<{ success: boolean; message: string }> {
  return apiFetch('/opportunities/apply', {
    method: 'POST',
    body: JSON.stringify({ job_id: jobId }),
  });
}

// ── Startups ──────────────────────────────────────────────────────────────────

export async function fetchStartups() {
  return publicFetch('/startup');
}

// ── Me: history, applications, suggestion ─────────────────────────────────────

export async function fetchMyHistory() {
  return apiFetch('/me/history');
}

export async function fetchMyApplications() {
  return apiFetch('/me/applications');
}

export async function postSuggestion(text: string): Promise<{ success: boolean }> {
  return apiFetch('/me/suggestion', {
    method: 'POST',
    body: JSON.stringify({ message: text }),
  });
}
