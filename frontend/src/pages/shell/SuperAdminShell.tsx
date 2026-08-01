import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { getUserDisplayName } from '../../utils/userUtils';
import { AppLayout } from '../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../components/layout/Sidebar/Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { useLogout } from '../../hooks/useLogout';
import { useNavigation } from '../../hooks/useNavigation';
import { SuperAdminDashboard } from '../dashboard/SuperAdminDashboard';
import { TenantsPage } from '../admin/TenantsPage';
import { PeoplePage } from '../admin/PeoplePage';

export const SuperAdminShell = () => {
  const navigate = useNavigate();
  useParams();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const location = useLocation();

  const navItemsWithActiveState = useNavigation(user, location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login'); // Super Admin login is at root
  };

  const userName = getUserDisplayName(user);

  return (
    <AppLayout
      userName={userName}
      onLogout={handleLogout}
      onSettingsClick={() => navigate('/settings')}
      sidebar={
        <Sidebar 
          orgName="Neva CRM Platform" 
          orgTier="Global Administration" 
          navItems={navItemsWithActiveState}
          /*
            No :tenantSlug segment, unlike StaffShell and BusinessOwnerShell —
            correctly, because a platform-level role has no tenant context. The
            shell is mounted at /admin, so ids resolve to /admin/<id> and stay
            inside it. Previously this navigated to bare `/${id}`, which matched
            the top-level /:tenantSlug route with a slug of "clients". TD-008.
          */
          onNavItemClick={(id) => navigate(`/admin/${id}`)}
          onLogoutClick={handleLogout}
        />
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/people" element={<PeoplePage />} />
        {/*
          Every sidebar link this shell offers now resolves to a route defined
          here. Anything else lands on the dashboard rather than rendering an
          empty shell with no explanation.
        */}
        <Route path="*" element={<Navigate to="dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
};
