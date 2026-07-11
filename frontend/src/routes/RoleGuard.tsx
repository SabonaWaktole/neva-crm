import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';

type Role = 'SUPER_ADMIN' | 'BUSINESS_OWNER' | 'STAFF';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
}

export const RoleGuard = ({ children, allowedRoles }: RoleGuardProps) => {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
