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
import { PlatformSettingsPage } from '../admin/PlatformSettingsPage';

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
      onSettingsClick={() => navigate('/admin/setting')}
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
        {/*
          This <Routes> has no ancestor Route with a "*" splat trimming the
          matched prefix (each entry in routes/index.tsx for /admin/dashboard,
          /admin/tenants etc. is its own exact-path route rendering this shell
          directly), so React Router gives it no "remaining path" context.
          Route paths here are matched against the FULL pathname, not a
          path relative to /admin — hence absolute /admin/... paths below
          instead of bare /dashboard, /tenants, etc.
        */}
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<SuperAdminDashboard />} />
        <Route path="/admin/tenants" element={<TenantsPage />} />
        <Route path="/admin/people" element={<PeoplePage />} />
        <Route path="/admin/setting" element={<PlatformSettingsPage />} />
        {/*
          Every sidebar link this shell offers now resolves to a route defined
          here. Anything else lands on the dashboard rather than rendering an
          empty shell with no explanation.
        */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AppLayout>
  );
};
