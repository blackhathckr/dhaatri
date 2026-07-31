"use client";

import type { ReactNode } from 'react';
import type { UserRole } from '@/data/types';
import { useAuthContext } from '@/components/shared/auth-provider';

interface RoleGuardProps {
  allowed: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RoleGuard({ allowed, children, fallback = null }: RoleGuardProps) {
  const { currentUser } = useAuthContext();
  if (!allowed.includes(currentUser.role)) return <>{fallback}</>;
  return <>{children}</>;
}
