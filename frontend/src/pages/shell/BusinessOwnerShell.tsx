import React from 'react';
import { AppLayout } from '../../components/layout/AppLayout/AppLayout';
import { Sidebar, NavItem } from '../../components/layout/Sidebar/Sidebar';
import { Button } from '../../components/ui/Button/Button';

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
  return (
    <AppLayout
      userName="Jane Doe"
      userAvatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuCUVO_U904UXtp4jWW0TlbxmzPuBGIREJnS7rJvUtLWgv77vYvS4vxvhNtsn7uCPM4v19ncCYsTNjqR9gmBTthGZKxWksFTi3WHzwUACJE3fdYz43ve1_UcjRrGN0DsSAnzWy8bcm_ue3gBSicCHOQXi3nTG59avgqC7yDJvl_xzAPCtNRbIGrfduLtU3kRkzKkv4b6G4JpGzlfYerk5A74tOh2EEID2ccvMJyWClcbv_w3W2yL1Gy2hiSvmpCVC63iIga-3SmPV8Nj"
      sidebar={
        <Sidebar 
          orgName="Corporate Modern" 
          orgTier="Enterprise Tier" 
          navItems={mockNavItems} 
        />
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', textAlign: 'center' }}>
        <div style={{ width: '256px', height: '256px', marginBottom: '16px', opacity: 0.8, backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuB00z6ndtEAp6bIUEee06YUTwTSaENCI8aGl8Vwbfv0VwlnE-nz76YF-1ATiSalKoGp2AnyW0ajxdKzbx0j3_jWB5JqXfeWDy8UuqpMCzwqi2Jgnf47sx5qqc6CkiQ-_T3Zg4Nf2ZLmK-10gZ6bmQsm_EM7bss4La3dSiValH1BCpbCIV5DUUaQa8MGeHKjd9AkMoE7znpc2s-1YMz4Rm_hCuDk5H6fdzmxxVp6jc3iJRPnNDScUPE5Eb1b4SmAJ2yrb5GHRTUft1Ky')", backgroundSize: 'cover' }}></div>
        <h1 style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-display)', fontWeight: 700, margin: '0 0 16px 0', color: 'var(--color-on-surface)' }}>Welcome to Nexus CRM</h1>
        <p style={{ fontFamily: 'var(--font-family-body-lg)', fontSize: 'var(--font-size-body-lg)', color: 'var(--color-on-surface-variant)', maxWidth: '600px', marginBottom: '32px' }}>
          Your workspace is ready. Let's get things set up so you can start managing your clients and growing your business efficiently.
        </p>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--spacing-md)', width: '100%', maxWidth: '800px', textAlign: 'left' }}>
          {/* We would typically use a grid system or flex layout here, but keeping it simple for the empty state placeholder */}
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
                <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>group_add</span>
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
