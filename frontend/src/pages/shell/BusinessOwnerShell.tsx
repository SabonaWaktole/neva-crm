import { Network, UserPlus } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../components/layout/Sidebar/Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { useLogout } from '../../hooks/useLogout';
import { useNavigation } from '../../hooks/useNavigation';
import { BusinessOwnerDashboard } from '../dashboard/BusinessOwnerDashboard';

export const BusinessOwnerShell = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const location = useLocation();

  const navItemsWithActiveState = useNavigation(user?.role, location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate(`/${tenantSlug || ''}/login`);
  };

  const userName = user?.userId ? `User ${user.userId.substring(0, 8)}` : 'Business Owner';

  return (
    <AppLayout
      userName={userName}
      onLogout={handleLogout}
      onSettingsClick={() => navigate(`/${tenantSlug}/settings`)}
      sidebar={
        <Sidebar 
          orgName="My Workspace" 
          orgTier="Enterprise Tier" 
          navItems={navItemsWithActiveState} 
          onNavItemClick={(id) => navigate(`/${tenantSlug}/${id}`)}
          onLogoutClick={handleLogout}
        />
      }
    >
      <BusinessOwnerDashboard />
    </AppLayout>
  );
};
