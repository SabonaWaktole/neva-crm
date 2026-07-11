import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  { id: 'quotes', label: 'Quotations', icon: 'description' },
  { id: 'tasks', label: 'My Tasks', icon: 'task_alt' },
];

export const StaffShell = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { user } = useAuthStore();
  const { logout } = useLogout();

  const handleLogout = async () => {
    await logout();
    navigate(`/${tenantSlug || ''}/login`);
  };

  const userName = user?.userId ? `User ${user.userId.substring(0, 8)}` : 'Staff Member';

  return (
    <AppLayout
      userName={userName}
      onLogout={handleLogout}
      onSettingsClick={() => navigate(`/${tenantSlug}/settings`)}
      sidebar={
        <Sidebar 
          orgName="My Workspace" 
          orgTier="Sales Representative" 
          navItems={mockNavItems} 
        />
      }
    >
      <div style={{ padding: 'var(--spacing-lg)' }}>
        <h1 style={{ fontFamily: 'var(--font-family-headline-lg)', fontSize: 'var(--font-size-headline-lg)', fontWeight: 600, margin: '0 0 24px 0', color: 'var(--color-on-surface)' }}>
          Welcome back!
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
          {/* Quick Stat Cards */}
          <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-outline-variant)' }}>
             <p style={{ color: 'var(--color-on-surface-variant)', margin: '0 0 8px 0', fontSize: 'var(--font-size-label-md)' }}>Pending Quotes</p>
             <h2 style={{ color: 'var(--color-primary)', margin: 0, fontSize: 'var(--font-size-display)' }}>12</h2>
          </div>
          <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-outline-variant)' }}>
             <p style={{ color: 'var(--color-on-surface-variant)', margin: '0 0 8px 0', fontSize: 'var(--font-size-label-md)' }}>Today's Meetings</p>
             <h2 style={{ color: 'var(--color-primary)', margin: 0, fontSize: 'var(--font-size-display)' }}>3</h2>
          </div>
          <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', padding: 'var(--spacing-md)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-outline-variant)' }}>
             <p style={{ color: 'var(--color-on-surface-variant)', margin: '0 0 8px 0', fontSize: 'var(--font-size-label-md)' }}>New Clients (This Week)</p>
             <h2 style={{ color: 'var(--color-primary)', margin: 0, fontSize: 'var(--font-size-display)' }}>5</h2>
          </div>
        </div>

        <h2 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: 'var(--font-size-headline-md)', fontWeight: 600, margin: '0 0 16px 0', color: 'var(--color-on-surface)' }}>
          Upcoming Schedule
        </h2>
        
        <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', alignItems: 'center', gap: '16px' }}>
             <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
               <span style={{ fontSize: '12px', fontWeight: 600 }}>OCT</span>
               <span style={{ fontSize: '18px', fontWeight: 700 }}>24</span>
             </div>
             <div>
               <h4 style={{ margin: '0 0 4px 0', color: 'var(--color-on-surface)', fontSize: '16px', fontWeight: 500 }}>Introductory Call - Acme Corp</h4>
               <p style={{ margin: 0, color: 'var(--color-on-surface-variant)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                 <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>schedule</span>
                 10:00 AM - 10:30 AM
               </p>
             </div>
             <div style={{ marginLeft: 'auto' }}>
               <Button variant="outline">View</Button>
             </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
