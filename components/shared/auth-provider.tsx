"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { User, UserRole } from '@/data/types';
import { MOCK_USERS } from '@/data/mock';

interface AuthContextValue {
  currentUser: User;
  isAuthenticated: boolean;
  switchRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_USERS[0]);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const switchRole = useCallback((role: UserRole) => {
    const user = MOCK_USERS.find(u => u.role === role);
    if (user) setCurrentUser(user);
  }, []);

  const switchUser = useCallback((userId: string) => {
    const user = MOCK_USERS.find(u => u.id === userId);
    if (user) setCurrentUser(user);
  }, []);

  const login = useCallback((email: string) => {
    const user = MOCK_USERS.find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated, switchRole, switchUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}
