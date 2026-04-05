// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT — Karta e Studentit App
// Manages JWT token lifecycle + student card data.
// Wrap <App> with <AuthProvider> — consume with useAuth().
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import {
  ApiError,
  getToken,
  fetchMe,
  logout as apiLogout,
  subscribeToAuthErrors,
} from '../services/api';
import { StudentCard } from '../types';

interface AuthContextValue {
  isLoading:   boolean;
  isLoggedIn:  boolean;
  card:        StudentCard | null;
  authNotice:  string | null;
  onLoginSuccess: (card: StudentCard) => void;
  onLogout:    () => Promise<void>;
  refreshCard: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading,  setIsLoading]  = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [card,       setCard]       = useState<StudentCard | null>(null);
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  // On mount: check if a valid token is stored and fetch the student card
  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const me = await fetchMe();
          setCard(me);
          setIsLoggedIn(true);
        }
      } catch (err) {
        // Token expired or invalid — clear it silently
        if (err instanceof ApiError && err.code === 'no_card') {
          setAuthNotice('Kjo llogari nuk ka nje karte aktive per momentin.');
        }
        await apiLogout();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => subscribeToAuthErrors((message) => {
    setCard(null);
    setIsLoggedIn(false);
    setAuthNotice(message);
    setIsLoading(false);
  }), []);

  const onLoginSuccess = useCallback((studentCard: StudentCard) => {
    setCard(studentCard);
    setIsLoggedIn(true);
    setAuthNotice(null);
  }, []);

  const onLogout = useCallback(async () => {
    await apiLogout();
    setCard(null);
    setIsLoggedIn(false);
    setAuthNotice(null);
  }, []);

  const refreshCard = useCallback(async () => {
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
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isLoggedIn, card, authNotice, onLoginSuccess, onLogout, refreshCard }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
