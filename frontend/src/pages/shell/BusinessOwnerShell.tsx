import { Network, UserPlus } from 'lucide-react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../components/layout/Sidebar/Sidebar';
import type { NavItem } from '../../components/layout/Sidebar/Sidebar';
import { Button } from '../../components/ui/Button/Button';
import { useAuthStore } from '../../store/useAuthStore';
import { useLogout } from '../../hooks/useLogout';

const mockNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', isActive: true },
  { id: 'clients', label: 'Clients', icon: 'group' },
  { id: 'appointments', label: 'Appointments', icon: 'event' },
  { id: 'inventory', label: 'Products & Stock', icon: 'inventory_2' },
  { id: 'quotes', label: 'Quotations', icon: 'description' },
  { id: 'reports', label: 'Reports', icon: 'bar_chart' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export const BusinessOwnerShell = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const location = useLocation();

  const activeNavId = mockNavItems.find(item => location.pathname.includes(`/${tenantSlug}/${item.id}`))?.id || 'dashboard';

  const navItemsWithActiveState = mockNavItems.map(item => ({
    ...item,
    isActive: item.id === activeNavId
  }));

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
        <div style={{ width: '256px', height: '256px', marginBottom: '16px', opacity: 0.8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Network size={120} color="var(--color-primary)" style={{ opacity: 0.3 }} />
        </div>
        <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-display)', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--color-on-surface)' }}>Welcome to Nexus CRM</h1>
        <p style={{ fontFamily: 'var(--font-family-body-lg)', fontSize: 'var(--font-size-body-lg)', color: 'var(--color-on-surface-variant)', maxWidth: '600px', marginBottom: '32px' }}>
          Your workspace is ready. Let's get things set up so you can start managing your clients and growing your business efficiently.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)', width: '100%', maxWidth: '800px', textAlign: 'left' }}>
          <div style={{ 
            backgroundColor: 'var(--color-surface-container-lowest)', 
            border: '1px solid var(--color-outline-variant)', 
            borderRadius: 'var(--radius-lg)', 
            padding: 'var(--spacing-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            boxShadow: 'var(--elevation-1)'
          }}>
             <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserPlus size={24} />
             </div>
             <div>
               <h3 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: 'var(--font-size-headline-md)', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--color-on-surface)' }}>Add your first client</h3>
               <p style={{ fontFamily: 'var(--font-family-body-md)', fontSize: 'var(--font-size-body-md)', margin: 0, color: 'var(--color-on-surface-variant)' }}>Start building your database by adding contact details and organizational structure.</p>
             </div>
             <div style={{ marginTop: 'auto' }}>
               <Button variant="primary">Add Client</Button>
             </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
