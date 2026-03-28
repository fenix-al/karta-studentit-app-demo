// ─────────────────────────────────────────────────────────────────────────────
// AUTH CONTEXT — Karta e Studentit App
// Manages JWT token lifecycle + student card data.
// Wrap <App> with <AuthProvider> — consume with useAuth().
// ─────────────────────────────────────────────────────────────────────────────

import React, {
  createContext, useContext, useEffect, useState, useCallback,
} from 'react';
import { getToken, fetchMe, logout as apiLogout } from '../services/api';
import { StudentCard } from '../types';

interface AuthContextValue {
  isLoading:   boolean;
  isLoggedIn:  boolean;
  card:        StudentCard | null;
  onLoginSuccess: (card: StudentCard) => void;
  onLogout:    () => Promise<void>;
  refreshCard: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading,  setIsLoading]  = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [card,       setCard]       = useState<StudentCard | null>(null);

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
      } catch (_) {
        // Token expired or invalid — clear it silently
        await apiLogout();
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const onLoginSuccess = useCallback((studentCard: StudentCard) => {
    setCard(studentCard);
    setIsLoggedIn(true);
  }, []);

  const onLogout = useCallback(async () => {
    await apiLogout();
    setCard(null);
    setIsLoggedIn(false);
  }, []);

  const refreshCard = useCallback(async () => {
    try {
      const me = await fetchMe();
      setCard(me);
    } catch (_) {}
  }, []);

  return (
    <AuthContext.Provider value={{ isLoading, isLoggedIn, card, onLoginSuccess, onLogout, refreshCard }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
