import { ChevronRight } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from '../../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../../components/layout/Sidebar/Sidebar';
import { SettingsLayout } from '../../../components/layout/SettingsLayout/SettingsLayout';
import { useAuthStore } from '../../../store/useAuthStore';
import { useLogout } from '../../../hooks/useLogout';
import { useNavigation } from '../../../hooks/useNavigation';
import { TeamSettingsContent } from './TeamSettingsContent';

export const TeamSettingsPage = () => {
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

  const userName = user?.userId ? `User ${user.userId.substring(0, 8)}` : 'Settings User';
  const roleName = user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'BUSINESS_OWNER' ? 'Business Owner' : 'Staff';

  const handleNavClick = (id: string) => {
    navigate(`/${tenantSlug || ''}/${id === 'dashboard' ? '' : id}`);
  };

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
          onNavItemClick={handleNavClick}
        />
      }
    >
      <SettingsLayout activeNavId="team">
        <div style={{ maxWidth: '1024px', margin: '0 auto', width: '100%' }}>
          
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-size-label-sm)', marginBottom: 'var(--spacing-xs)' }}>
              <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', padding: 0, margin: 0, gap: '8px' }}>
                <li><a href="#settings" onClick={(e) => { e.preventDefault(); navigate(`/${tenantSlug}/settings`); }} style={{ color: 'inherit', textDecoration: 'none' }}>Settings</a></li>
                <li><ChevronRight size={14} /></li>
                <li aria-current="page" style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>Team Settings</li>
              </ol>
            </nav>
          </div>

          <TeamSettingsContent />

        </div>
      </SettingsLayout>
    </AppLayout>
  );
};
