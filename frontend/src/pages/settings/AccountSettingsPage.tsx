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
import styles from './AccountSettingsPage.module.css';

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

  const loadSettings = () => {
    fetchSettings().then((settings) => {
      setRequiresQuotationApproval(settings.requiresQuotationApproval);
    }).catch(console.error);
  };

  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      onSettingsClick={() => navigate(`/${tenantSlug}/settings/profile`)}
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
        <div className={styles.container}>
          {/* Page Header */}
          <div className={styles.headerBlock}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <ol className={styles.breadcrumbList}>
                <li><a href="#settings" className={styles.breadcrumbLink}>Settings</a></li>
                <li><ChevronRight size={14} /></li>
                <li aria-current="page" className={styles.breadcrumbCurrent}>Company Settings</li>
              </ol>
            </nav>
            <h1 className={styles.title}>Company Settings</h1>
            <p className={styles.subtitle}>
              Manage your organization's core details, localization, and preferences.
            </p>
          </div>

          <div className={styles.sectionsColumn}>
            {/* Company Profile Section — not yet backed by the API, shown disabled */}
            <Card padding="lg" className={`${styles.card} ${styles.disabledSection}`}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Company Profile</h2>
                <span className={styles.comingSoonBadge}>Coming soon</span>
              </div>

              <div className={styles.logoRow}>
                <div className={styles.logoBox}>
                  <ImagePlus color="var(--color-outline-variant)" />
                </div>
                <div>
                  <h3 className={styles.logoInfoTitle}>Company Logo</h3>
                  <p className={styles.logoInfoText}>Upload a square logo. JPG, PNG, or SVG. Maximum file size 5MB.</p>
                  <button className={styles.linkButton} disabled>Upload Image</button>
                </div>
              </div>

              <div className={styles.twoColGrid}>
                <TextInput label="Company Name *" placeholder="Your company name" disabled />
                <TextInput label="Registration Number" placeholder="e.g. 12345678" disabled />
              </div>

              <div>
                <TextInput label="Registered Address" placeholder="Street address" disabled />
                <div className={styles.addressRow}>
                  <TextInput placeholder="City" disabled />
                  <TextInput placeholder="State/Region" disabled />
                  <TextInput placeholder="Postal Code" disabled />
                </div>
              </div>

              <div className={styles.twoColGrid}>
                <TextInput label="Primary Contact Email *" type="email" placeholder="billing@yourcompany.com" disabled />
                <TextInput label="Contact Phone" type="tel" placeholder="+1 (555) 000-0000" disabled />
              </div>
            </Card>

            <div className={styles.localizationGrid}>
              {/* Localization — not yet backed by the API, shown disabled */}
              <Card padding="lg" className={styles.disabledSection}>
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Localization</h2>
                    <p className={styles.cardSubtitle}>Regional formats for the organization.</p>
                  </div>
                  <span className={styles.comingSoonBadge}>Coming soon</span>
                </div>

                <div className={styles.sectionsColumn} style={{ marginTop: 'var(--spacing-md)' }}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Timezone</label>
                    <select className={styles.nativeSelect} disabled>
                      <option>UTC-08:00 Pacific Time (US & Canada)</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Date Format</label>
                    <select className={styles.nativeSelect} disabled>
                      <option>MM/DD/YYYY (12/31/2023)</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Base Currency</label>
                    <select className={styles.nativeSelect} disabled>
                      <option>USD - US Dollar ($)</option>
                    </select>
                    <p className={styles.helperText}>Changing base currency affects all historical reporting.</p>
                  </div>
                </div>
              </Card>

              {/* Language — not yet backed by the API, shown disabled */}
              <Card padding="lg" className={styles.disabledSection}>
                <div className={styles.cardHeaderWithIcon} style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                  <Globe color="var(--color-on-surface-variant)" />
                  <h2 className={styles.cardTitle}>Language</h2>
                  <span className={styles.comingSoonBadge} style={{ marginLeft: 'auto' }}>Coming soon</span>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.fieldLabel}>Default System Language</label>
                  <select className={styles.nativeSelect} disabled>
                    <option>English (US)</option>
                  </select>
                </div>
              </Card>

              {/* Quotations — the only section actually wired to the backend */}
              <Card padding="lg">
                <div className={styles.cardHeader} style={{ borderBottom: '1px solid var(--color-outline-variant)', paddingBottom: 'var(--spacing-md)', marginBottom: 'var(--spacing-md)' }}>
                  <div>
                    <h2 className={styles.cardTitle}>Quotations</h2>
                    <p className={styles.cardSubtitle}>Manage quotation workflow settings.</p>
                  </div>
                </div>

                <div className={styles.fieldGroup}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={requiresQuotationApproval}
                      onChange={(e) => setRequiresQuotationApproval(e.target.checked)}
                      disabled={loading || roleName !== 'Business Owner'}
                      className={styles.checkbox}
                    />
                    <span className={styles.checkboxText}>Require Approval for Quotations</span>
                  </label>
                  <p className={styles.helperText} style={{ marginLeft: '26px' }}>
                    If enabled, Staff quotations must be approved by a Business Owner before sending.
                  </p>
                </div>
              </Card>
            </div>
          </div>

          {/* Page Action Footer */}
          <div className={styles.footer}>
            <Button variant="outline" onClick={loadSettings} disabled={loading}>Discard Changes</Button>
            <Button variant="primary" onClick={handleSave} isLoading={loading}>Save Changes</Button>
          </div>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
};
