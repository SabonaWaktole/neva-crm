import { Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { getUserDisplayName } from '../../utils/userUtils';
import { AppLayout } from '../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../components/layout/Sidebar/Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { useLogout } from '../../hooks/useLogout';
import { useNavigation } from '../../hooks/useNavigation';
import { SuperAdminDashboard } from '../dashboard/SuperAdminDashboard';

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
          onNavItemClick={(id) => navigate(`/${id}`)}
          onLogoutClick={handleLogout}
        />
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="/dashboard" element={<SuperAdminDashboard />} />
      </Routes>
    </AppLayout>
  );
};
