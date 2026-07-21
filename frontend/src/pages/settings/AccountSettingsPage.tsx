import { ChevronRight, ImagePlus, Globe } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../components/layout/Sidebar/Sidebar';
import type { NavItem } from '../../components/layout/Sidebar/Sidebar';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { SettingsLayout } from '../../components/layout/SettingsLayout/SettingsLayout';
import { useAuthStore } from '../../store/useAuthStore';
import { useLogout } from '../../hooks/useLogout';
import { useTenantSettings } from '../../hooks/useTenantSettings';
import { useEffect, useState } from 'react';

const mockNavItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'clients', label: 'Clients', icon: 'group' },
  { id: 'appointments', label: 'Appointments', icon: 'event' },
  { id: 'inventory', label: 'Products & Stock', icon: 'inventory_2' },
  { id: 'quotations', label: 'Quotations', icon: 'description' },
  { id: 'reports', label: 'Reports', icon: 'bar_chart' },
  { id: 'settings', label: 'Settings', icon: 'settings', isActive: true },
];

export const AccountSettingsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { user } = useAuthStore();
  const { logout } = useLogout();
  const { fetchSettings, updateSettings, loading } = useTenantSettings();
  
  const [requiresQuotationApproval, setRequiresQuotationApproval] = useState(true);

  useEffect(() => {
    fetchSettings().then((settings) => {
      setRequiresQuotationApproval(settings.requiresQuotationApproval);
    }).catch(console.error);
  }, [fetchSettings]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSave = async () => {
    try {
      await updateSettings({ requiresQuotationApproval });
      alert('Settings saved successfully');
    } catch (err) {
      alert('Failed to save settings');
    }
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
          navItems={mockNavItems} 
          onLogoutClick={handleLogout}
          onNavItemClick={handleNavClick}
        />
      }
    >
      <SettingsLayout activeNavId="company">
        <div style={{ maxWidth: '1024px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          
          {/* Page Header */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-size-label-sm)', marginBottom: 'var(--spacing-xs)' }}>
              <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', padding: 0, margin: 0, gap: '8px' }}>
                <li><a href="#settings" style={{ color: 'inherit', textDecoration: 'none' }}>Settings</a></li>
                <li><ChevronRight size={14} /></li>
                <li aria-current="page" style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>Company Settings</li>
              </ol>
            </nav>
            <h1 style={{ fontFamily: 'var(--font-family-headline-lg)', fontSize: 'var(--font-size-headline-lg)', color: 'var(--color-on-surface)', margin: 0 }}>Company Settings</h1>
            <p style={{ fontFamily: 'var(--font-family-body-md)', fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface-variant)', margin: 'var(--spacing-xs) 0 0 0' }}>
              Manage your organization's core details, localization, and preferences.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
            {/* Left Column (Main Settings) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)', gridColumn: '1 / -1' }}>
              {/* Company Profile Section */}
              <Card padding="lg" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                <div style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <h2 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: 'var(--font-size-headline-md)', margin: 0, color: 'var(--color-on-surface)' }}>Company Profile</h2>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
                  {/* Logo Upload */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--spacing-lg)' }}>
                    <div style={{ 
                      width: '80px', height: '80px', backgroundColor: 'var(--color-surface-container)', 
                      border: '1px dashed var(--color-outline-variant)', borderRadius: 'var(--radius-lg)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' 
                    }}>
                      <ImagePlus color="var(--color-outline-variant)" />
                    </div>
                    <div>
                      <h3 style={{ fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', margin: '0 0 var(--spacing-xs) 0', color: 'var(--color-on-surface)' }}>Company Logo</h3>
                      <p style={{ fontFamily: 'var(--font-family-body-md)', fontSize: '13px', margin: '0 0 var(--spacing-sm) 0', color: 'var(--color-on-surface-variant)' }}>Upload a square logo. JPG, PNG, or SVG. Maximum file size 5MB.</p>
                      <button style={{ color: 'var(--color-primary)', background: 'none', border: 'none', padding: 0, fontSize: 'var(--font-size-label-sm)', cursor: 'pointer' }}>Upload Image</button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                    <TextInput label="Company Name *" defaultValue="Corporate Modern Inc." />
                    <TextInput label="Registration Number" placeholder="e.g. 12345678" />
                  </div>

                  <div>
                    <TextInput label="Registered Address" placeholder="Street address" style={{ marginBottom: 'var(--spacing-sm)' }} />
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 'var(--spacing-md)' }}>
                      <TextInput placeholder="City" />
                      <TextInput placeholder="State/Region" />
                      <TextInput placeholder="Postal Code" />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                    <TextInput label="Primary Contact Email *" type="email" defaultValue="billing@corporatemodern.com" />
                    <TextInput label="Contact Phone" type="tel" placeholder="+1 (555) 000-0000" />
                  </div>
                </div>
              </Card>

              {/* Localization Section */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
                <Card padding="lg">
                  <div style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: 'var(--font-size-headline-md)', margin: 0, color: 'var(--color-on-surface)' }}>Localization</h2>
                    <p style={{ fontFamily: 'var(--font-family-body-md)', fontSize: '13px', margin: 'var(--spacing-xs) 0 0 0', color: 'var(--color-on-surface-variant)' }}>Regional formats for the organization.</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                      <label style={{ fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface)' }}>Timezone</label>
                      <select style={{ height: '36px', padding: '0 var(--spacing-sm)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)', outline: 'none' }}>
                        <option>UTC-08:00 Pacific Time (US & Canada)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                      <label style={{ fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface)' }}>Date Format</label>
                      <select style={{ height: '36px', padding: '0 var(--spacing-sm)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)', outline: 'none' }}>
                        <option>MM/DD/YYYY (12/31/2023)</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                      <label style={{ fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface)' }}>Base Currency</label>
                      <select style={{ height: '36px', padding: '0 var(--spacing-sm)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)', outline: 'none' }}>
                        <option>USD - US Dollar ($)</option>
                      </select>
                      <p style={{ fontSize: '12px', color: 'var(--color-outline)', margin: 'var(--spacing-xs) 0 0 0' }}>Changing base currency affects all historical reporting.</p>
                    </div>
                  </div>
                </Card>

                <Card padding="lg">
                  <div style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                    <Globe color="var(--color-on-surface-variant)" />
                    <h2 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: 'var(--font-size-headline-md)', margin: 0, color: 'var(--color-on-surface)' }}>Language</h2>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label style={{ fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface)' }}>Default System Language</label>
                    <select style={{ height: '36px', padding: '0 var(--spacing-sm)', border: '1px solid var(--color-outline-variant)', borderRadius: 'var(--radius-default)', backgroundColor: 'var(--color-surface)', color: 'var(--color-on-surface)', outline: 'none' }}>
                      <option>English (US)</option>
                    </select>
                  </div>
                </Card>

                <Card padding="lg">
                  <div style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                    <h2 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: 'var(--font-size-headline-md)', margin: 0, color: 'var(--color-on-surface)' }}>Quotations</h2>
                    <p style={{ fontFamily: 'var(--font-family-body-md)', fontSize: '13px', margin: 'var(--spacing-xs) 0 0 0', color: 'var(--color-on-surface-variant)' }}>Manage quotation workflow settings.</p>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', cursor: 'pointer' }}>
                      <input 
                        type="checkbox" 
                        checked={requiresQuotationApproval}
                        onChange={(e) => setRequiresQuotationApproval(e.target.checked)}
                        disabled={loading || roleName !== 'Business Owner'}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--color-primary)' }}
                      />
                      <span style={{ fontFamily: 'var(--font-family-label-md)', fontSize: 'var(--font-size-label-md)', color: 'var(--color-on-surface)' }}>Require Approval for Quotations</span>
                    </label>
                    <p style={{ fontSize: '12px', color: 'var(--color-outline)', margin: 'var(--spacing-xs) 0 0 26px' }}>If enabled, Staff quotations must be approved by a Business Owner before sending.</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Page Action Footer */}
          <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-lg)', borderTop: '1px solid var(--color-outline-variant)', display: 'flex', justifyContent: 'flex-end', gap: 'var(--spacing-md)' }}>
            <Button variant="outline">Discard Changes</Button>
            <Button variant="primary" onClick={handleSave} isLoading={loading}>Save Changes</Button>
          </div>

        </div>
      </SettingsLayout>
    </AppLayout>
  );
};
