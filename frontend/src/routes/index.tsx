import React from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { LoginPage } from '../pages/auth/LoginPage';
import { ForgotPasswordPage } from '../pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from '../pages/auth/ResetPasswordPage';
import { StaffInvitationPage } from '../pages/auth/StaffInvitationPage';
import { OnboardingPage } from '../pages/onboarding/OnboardingPage';
import { BusinessOwnerShell } from '../pages/shell/BusinessOwnerShell';
import { StaffShell } from '../pages/shell/StaffShell';
import { SuperAdminShell } from '../pages/shell/SuperAdminShell';
import { AccountSettingsPage } from '../pages/settings/AccountSettingsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { TenantGuard } from './TenantGuard';
import { UserRole } from '../../../backend/src/auth/domain/enums/UserRole';

// Temporary dashboard wrapper that chooses the right shell based on role
// We will refine this as we build out the AppShell properly
import { useAuthStore } from '../store/useAuthStore';

const DashboardSelector = () => {
  const { user } = useAuthStore();
  
  if (user?.role === UserRole.BUSINESS_OWNER) {
    return <BusinessOwnerShell />;
  }
  return <StaffShell />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <div>Welcome to Nexus CRM. <a href="/login">Login</a> or <a href="/register-business">Register</a></div>,
  },
  {
    path: '/register-business',
    element: <OnboardingPage />,
  },
  {
    path: '/invite/:token',
    element: <StaffInvitationPage />,
  },
  {
    path: '/:tenantSlug/login',
    element: <LoginPage />,
  },
  {
    path: '/:tenantSlug/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/:tenantSlug/reset-password',
    element: <ResetPasswordPage />,
  },
  {
    path: '/:tenantSlug',
    element: <TenantGuard />,
    children: [
      {
        path: '',
        element: (
          <ProtectedRoute>
            <DashboardSelector />
          </ProtectedRoute>
        ),
      },
      {
        path: 'dashboard',
        element: (
          <ProtectedRoute>
            <DashboardSelector />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings',
        element: (
          <ProtectedRoute>
            <AccountSettingsPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={[UserRole.SUPER_ADMIN]}>
          <SuperAdminShell />
        </RoleGuard>
      </ProtectedRoute>
    ),
  },
  {
    path: '/unauthorized',
    element: <div>Unauthorized Access</div>,
  },
]);
