import React from 'react';
import { AppLayout } from '../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../components/layout/Sidebar/Sidebar';
import type { NavItem } from '../../components/layout/Sidebar/Sidebar';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';

const mockNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'tenants', label: 'Tenants', icon: 'domain', isActive: true },
  { id: 'subscriptions', label: 'Subscriptions', icon: 'credit_card' },
  { id: 'settings', label: 'Platform Settings', icon: 'settings_applications' },
  { id: 'logs', label: 'Audit Logs', icon: 'manage_search' },
];

export const SuperAdminShell = () => {
  return (
    <AppLayout
      logoText="Nexus CRM Admin"
      userName="Super Admin"
      userAvatarSrc="https://lh3.googleusercontent.com/aida-public/AB6AXuCR880OngkchwP8ajVhbjVgPIQDz634uTzV2OwuHy_o5cMjt8SPsOneVaXcWXon2_K_jqR5lYwaU7H9SqKUUgnv0kzpxmGg4nc9pIOGWIzLmmg8kTI5_8C6tGcXYtw-F2YMMHD9gKZOP7Q7XESPwOXMHHgyxipwTVoWt1CFe6j3XuESTJRXGUM-z1uOSSPOLZ4hWt9_6QjHbXtXI0xN3Uke4rPAd3LD6WOpuXYzIYZG1Syr4YvvzjW6oyfTIJnGSwiVKChUtRR_9uOl"
      sidebar={
        <Sidebar 
          orgName="Platform Admin" 
          orgTier="Global Control" 
          navItems={mockNavItems} 
        />
      }
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 'var(--spacing-lg)' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-family-headline-lg)', fontSize: 'var(--font-size-headline-lg)', fontWeight: 600, color: 'var(--color-on-surface)', margin: '0 0 var(--spacing-xs) 0' }}>
              Tenant Management
            </h1>
            <p style={{ fontFamily: 'var(--font-family-body-md)', fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface-variant)', margin: 0 }}>
              Overview and administration of all deployed instances.
            </p>
          </div>
          <Button variant="primary" icon={<span className="material-symbols-outlined" style={{ fontSize: '18px' }}>add</span>}>
            Provision Tenant
          </Button>
        </div>

        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
          <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '128px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Tenants</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-primary)' }}>domain_verification</span>
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-display)', fontWeight: 700, color: 'var(--color-on-surface)' }}>142</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--color-secondary-container)', fontSize: 'var(--font-size-label-sm)', fontWeight: 600, marginTop: 'var(--spacing-xs)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
                +12 this month
              </div>
            </div>
          </div>
          
          <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '128px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>MRR</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-tertiary)' }}>payments</span>
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-display)', fontWeight: 700, color: 'var(--color-on-surface)' }}>$124k</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--color-secondary-container)', fontSize: 'var(--font-size-label-sm)', fontWeight: 600, marginTop: 'var(--spacing-xs)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>trending_up</span>
                +5.4% this month
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-xl)', padding: 'var(--spacing-md)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '128px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <span style={{ fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Health</span>
              <span className="material-symbols-outlined" style={{ color: 'var(--color-error)' }}>monitor_heart</span>
            </div>
            <div>
              <span style={{ fontFamily: 'var(--font-family-display)', fontSize: 'var(--font-size-display)', fontWeight: 700, color: 'var(--color-on-surface)' }}>99.9%</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)', color: 'var(--color-error)', fontSize: 'var(--font-size-label-sm)', fontWeight: 600, marginTop: 'var(--spacing-xs)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>warning</span>
                2 minor alerts
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div style={{ backgroundColor: 'var(--color-surface-container-lowest)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ padding: 'var(--spacing-md)', borderBottom: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: 'var(--font-size-headline-md)', fontWeight: 600, color: 'var(--color-on-surface)', margin: 0 }}>Recent Deployments</h2>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Button variant="outline" icon={<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>filter_list</span>}>Filter</Button>
              <Button variant="outline" icon={<span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>}>Export</Button>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--color-surface-container-low)', borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <th style={{ padding: 'var(--spacing-md)', fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Tenant Name</th>
                  <th style={{ padding: 'var(--spacing-md)', fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Region</th>
                  <th style={{ padding: 'var(--spacing-md)', fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Tier</th>
                  <th style={{ padding: 'var(--spacing-md)', fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)', fontWeight: 500 }}>Status</th>
                  <th style={{ padding: 'var(--spacing-md)', fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface-variant)', fontWeight: 500, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontFamily: 'var(--font-family-body-md)', fontSize: 'var(--font-size-body-md)' }}>
                <tr style={{ borderBottom: '1px solid var(--color-outline-variant)' }}>
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-primary-container)', color: 'var(--color-on-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>AC</div>
                      <div>
                        <div style={{ fontWeight: 500, color: 'var(--color-on-surface)' }}>Acme Corp</div>
                        <div style={{ fontSize: 'var(--font-size-label-sm)', color: 'var(--color-on-surface-variant)' }}>acme.nexus-crm.com</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', color: 'var(--color-on-surface-variant)' }}>US-East (N. Virginia)</td>
                  <td style={{ padding: 'var(--spacing-md)' }}><Badge variant="primary">Enterprise</Badge></td>
                  <td style={{ padding: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--color-secondary-container)' }}></div>
                      <span style={{ color: 'var(--color-on-surface)' }}>Active</span>
                    </div>
                  </td>
                  <td style={{ padding: 'var(--spacing-md)', textAlign: 'right' }}>
                    <button style={{ background: 'none', border: 'none', color: 'var(--color-on-surface-variant)', cursor: 'pointer' }}>
                      <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>more_vert</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
