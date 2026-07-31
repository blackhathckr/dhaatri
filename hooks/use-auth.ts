"use client";

import { useState, useCallback } from 'react';
import type { User, UserRole } from '@/data/types';
import { MOCK_USERS } from '@/data/mock';

const DEFAULT_USER = MOCK_USERS[0]; // Priya Sharma - citizen

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User>(DEFAULT_USER);
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

  return { currentUser, isAuthenticated, switchRole, switchUser, login, logout };
}
