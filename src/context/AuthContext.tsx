// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT — Karta e Studentit App
// Manages JWT token lifecycle + identity for both student and business users.
// Wrap <App> with <AuthProvider> — consume with useAuth().
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import {
  ApiError,
  detectUserRole,
  fetchBizMe,
  fetchMe,
  getToken,
  logout as apiLogout,
  subscribeToAuthErrors,
  UserRole,
} from '../services/api';
import { BizProfile, StudentCard } from '../types';

interface AuthContextValue {
  isLoading:   boolean;
  isLoggedIn:  boolean;
  role:        UserRole | null;      // 'student' | 'business' | null
  card:        StudentCard | null;   // populated when role === 'student'
  bizProfile:  BizProfile | null;   // populated when role === 'business'
  authNotice:  string | null;
  onStudentLoginSuccess: (card: StudentCard) => void;
  onBizLoginSuccess:     (biz: BizProfile) => void;
  onLogout:    () => Promise<void>;
  refreshCard: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading,  setIsLoading]  = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [role,       setRole]       = useState<UserRole | null>(null);
  const [card,       setCard]       = useState<StudentCard | null>(null);
  const [bizProfile, setBizProfile] = useState<BizProfile | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // On mount: check stored token and detect role without side effects
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const result = await detectUserRole();
          if (result?.role === 'student') {
            setCard(result.studentCard);
            setRole('student');
            setIsLoggedIn(true);
          } else if (result?.role === 'business') {
            setBizProfile(result.bizProfile);
            setRole('business');
            setIsLoggedIn(true);
          } else if (result?.role === 'no_card') {
            setAuthNotice('Kjo llogari nuk ka nje karte aktive per momentin.');
            await apiLogout();
          } else {
            // null = token invalid, network error, or unrecognised role
            await apiLogout();
          }
        }
      } catch (_) {
        await apiLogout();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Global auth error listener — triggered by apiFetch when token expires mid-session
  useEffect(() => subscribeToAuthErrors((message) => {
    setCard(null);
    setBizProfile(null);
    setRole(null);
    setIsLoggedIn(false);
    setAuthNotice(message);
    setIsLoading(false);
  }), []);

  const onStudentLoginSuccess = useCallback((studentCard: StudentCard) => {
    setCard(studentCard);
    setRole('student');
    setIsLoggedIn(true);
    setAuthNotice(null);
  }, []);

  const onBizLoginSuccess = useCallback((biz: BizProfile) => {
    setBizProfile(biz);
    setRole('business');
    setIsLoggedIn(true);
    setAuthNotice(null);
  }, []);

  const onLogout = useCallback(async () => {
    await apiLogout();
    setCard(null);
    setBizProfile(null);
    setRole(null);
    setIsLoggedIn(false);
    setAuthNotice(null);
  }, []);

  const refreshCard = useCallback(async () => {
    if (role === 'business') {
      try {
        const biz = await fetchBizMe();
        setBizProfile(biz);
        setAuthNotice(null);
      } catch (_) {
        // apiFetch handles expired token via emitAuthError → subscribeToAuthErrors
      }
      return;
    }
    // Student path — unchanged from original
    try {
      const me = await fetchMe();
      setCard(me);
      setAuthNotice(null);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'no_card') {
        setCard(null);
        setIsLoggedIn(false);
        setAuthNotice('Kjo llogari nuk ka nje karte aktive per momentin.');
        await apiLogout();
      }
    }
  }, [role]);

  return (
    <AuthContext.Provider value={{
      isLoading, isLoggedIn, role, card, bizProfile, authNotice,
      onStudentLoginSuccess, onBizLoginSuccess, onLogout, refreshCard,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
