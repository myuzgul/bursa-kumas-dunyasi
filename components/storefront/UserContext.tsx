'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone?: string;
  email_verified: boolean;
  phone_verified?: boolean;
  marketing_consent?: boolean;
  role: 'customer' | 'admin';
  unread_notifications_count: number;
  favorites_count: number;
  orders_count: number;
  created_at?: string;
}

interface UserContextType {
  user: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; redirect?: string }>;
  register: (data: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Fetch current session on mount
  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // 2. Merge Guest Favorites into User Favorites
  const mergeGuestFavorites = async () => {
    try {
      const guestFavs = localStorage.getItem('bkd_guest_favs');
      if (guestFavs) {
        const parsed = JSON.parse(guestFavs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          await fetch('/api/user/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ product_ids: parsed }),
          });
          localStorage.removeItem('bkd_guest_favs');
        }
      }
    } catch (e) {
      // Ignore
    }
  };

  // 3. Login Action
  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.message || 'Giriş yapılamadı.' };
      }

      await refreshUser();
      await mergeGuestFavorites();

      return { success: true, redirect: data.redirect || '/hesabim' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Giriş hatası.' };
    }
  };

  // 4. Register Action
  const register = async (formData: any) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Kayıt yapılamadı.' };
      }

      await refreshUser();
      await mergeGuestFavorites();

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Kayıt hatası.' };
    }
  };

  // 5. Logout Action
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    }
    setUser(null);
    router.push('/');
    router.refresh();
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useAuth must be used within a UserProvider');
  }
  return context;
}
