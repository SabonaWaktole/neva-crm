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
import { ReportsPage } from '../pages/ReportsPage';
import { ClientListPage } from '../pages/clients/ClientListPage';
import { ClientDetailPage } from '../pages/clients/ClientDetailPage';
import { ClientFormPage } from '../pages/clients/ClientFormPage';
import { AppointmentsPage } from '../pages/appointments/AppointmentsPage';
import { EditAppointmentPage } from '../pages/appointments/EditAppointmentPage';
import { CreateAppointmentPage } from '../pages/appointments/CreateAppointmentPage';
import { ClientSettingsPage } from '../pages/settings/ClientSettingsPage';
import { TeamSettingsPage } from '../pages/settings/team/TeamSettingsPage';
import { ProfilePage } from '../pages/settings/profile/ProfilePage';
import { AcceptInvitationPage } from '../pages/auth/AcceptInvitationPage';
import { InventoryList } from '../pages/inventory/InventoryList';
import { ProductForm } from '../pages/inventory/ProductForm/ProductForm';
import { WarehouseList } from '../pages/inventory/WarehouseList/WarehouseList';
import { CategoryList } from '../pages/inventory/CategoryList/CategoryList';
import { QuotationList } from '../pages/quotations/QuotationList';
import { QuotationDetail } from '../pages/quotations/QuotationDetail';
import { CreateQuotation } from '../pages/quotations/CreateQuotation';
import { EditQuotation } from '../pages/quotations/EditQuotation';
import { IntegrationsPage } from '../pages/IntegrationsPage';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleGuard } from './RoleGuard';
import { TenantGuard } from './TenantGuard';

import { LandingPage } from '../pages/landing/LandingPage';

// Temporary dashboard wrapper that chooses the right shell based on role
// We will refine this as we build out the AppShell properly
import { useAuthStore } from '../store/useAuthStore';

const DashboardSelector = () => {
  const { user } = useAuthStore();
  
  if (user?.role === 'BUSINESS_OWNER') {
    return <BusinessOwnerShell />;
  }
  return <StaffShell />;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
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
    path: '/invitations/accept',
    element: <AcceptInvitationPage />,
  },
  {
    path: '/login',
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
      {
        path: 'settings/team',
        element: (
          <ProtectedRoute>
            <RoleGuard allowedRoles={['BUSINESS_OWNER', 'SUPER_ADMIN']}>
              <TeamSettingsPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/integrations',
        element: (
          <ProtectedRoute>
            <RoleGuard allowedRoles={['BUSINESS_OWNER', 'SUPER_ADMIN', 'STAFF']}>
              <IntegrationsPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/profile',
        element: (
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute>
            <RoleGuard allowedRoles={['BUSINESS_OWNER', 'SUPER_ADMIN']}>
              <ReportsPage />
            </RoleGuard>
          </ProtectedRoute>
        ),
      },
      {
        path: 'clients',
        element: (
          <ProtectedRoute>
            <ClientListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'clients/new',
        element: (
          <ProtectedRoute>
            <ClientFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'clients/:clientId',
        element: (
          <ProtectedRoute>
            <ClientDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'clients/:clientId/edit',
        element: (
          <ProtectedRoute>
            <ClientFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'appointments',
        element: (
          <ProtectedRoute>
            <AppointmentsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'appointments/new',
        element: (
          <ProtectedRoute>
            <CreateAppointmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'appointments/:appointmentId/edit',
        element: (
          <ProtectedRoute>
            <EditAppointmentPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/client-management',
        element: (
          <ProtectedRoute>
            <ClientSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute>
            <InventoryList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory/new',
        element: (
          <ProtectedRoute>
            <ProductForm />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/warehouses',
        element: (
          <ProtectedRoute>
            <WarehouseList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'settings/categories',
        element: (
          <ProtectedRoute>
            <CategoryList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'quotations',
        element: (
          <ProtectedRoute>
            <QuotationList />
          </ProtectedRoute>
        ),
      },
      {
        path: 'quotations/new',
        element: (
          <ProtectedRoute>
            <CreateQuotation />
          </ProtectedRoute>
        ),
      },
      {
        path: 'quotations/:id',
        element: (
          <ProtectedRoute>
            <QuotationDetail />
          </ProtectedRoute>
        ),
      },
      {
        path: 'quotations/:id/edit',
        element: (
          <ProtectedRoute>
            <EditQuotation />
          </ProtectedRoute>
        ),
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <RoleGuard allowedRoles={['SUPER_ADMIN']}>
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
