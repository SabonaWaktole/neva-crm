import React from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../components/layout/Sidebar/Sidebar';
import { useAuthStore } from '../../store/useAuthStore';
import { useLogout } from '../../hooks/useLogout';
import { ClientFormContent } from './ClientFormContent';
import { useNavigation } from '../../hooks/useNavigation';

export const ClientFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const location = useLocation();
  const navItems = useNavigation(user?.role, location.pathname);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userName = user?.userId ? `User ${user.userId.substring(0, 8)}` : 'Business Owner';
  const roleName = user?.role === 'STAFF' ? 'Sales Representative' : 'Enterprise Tier';

  return (
    <AppLayout
      userName={userName}
      onLogout={handleLogout}
      onSettingsClick={() => navigate(`/${tenantSlug}/settings`)}
      userAvatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuCUVO_U904UXtp4jWW0TlbxmzPuBGIREJnS7rJvUtLWgv77vYvS4vxvhNtsn7uCPM4v19ncCYsTNjqR9gmBTthGZKxWksFTi3WHzwUACJE3fdYz43ve1_UcjRrGN0DsSAnzWy8bcm_ue3gBSicCHOQXi3nTG59avgqC7yDJvl_xzAPCtNRbIGrfduLtU3kRkzKkv4b6G4JpGzlfYerk5A74tOh2EEID2ccvMJyWClcbv_w3W2yL1Gy2hiSvmpCVC63iIga-3SmPV8Nj"
      sidebar={
        <Sidebar 
          orgName={tenantSlug || 'Workspace'} 
          orgTier={roleName} 
          navItems={navItems} 
          onLogoutClick={handleLogout}
          onNavItemClick={(id) => navigate(`/${tenantSlug || ''}/${id === 'dashboard' ? '' : id}`)}
        />
      }
    >
      <ClientFormContent />
    </AppLayout>
  );
};
