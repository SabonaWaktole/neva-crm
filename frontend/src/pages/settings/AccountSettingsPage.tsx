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
import { useTenantSettings, SUPPORTED_LOCALES } from '../../hooks/useTenantSettings';
import type { TenantSettings } from '../../hooks/useTenantSettings';
import { useToast } from '../../components/ui/Toast';
import { ImagePicker } from '../../components/ui/ImagePicker';
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

/**
 * The currencies offered in the picker.
 *
 * A short list rather than all 162 ISO codes: a dropdown of every currency on
 * earth is worse to use than a short one, and the server validates against the
 * full `Intl.supportedValuesOf('currency')` set regardless — so this list can
 * grow without any server change.
 */
const CURRENCY_OPTIONS = [
  { code: 'USD', label: 'USD — US Dollar ($)' },
  { code: 'EUR', label: 'EUR — Euro (€)' },
  { code: 'GBP', label: 'GBP — British Pound (£)' },
  { code: 'CAD', label: 'CAD — Canadian Dollar ($)' },
  { code: 'AUD', label: 'AUD — Australian Dollar ($)' },
  { code: 'ETB', label: 'ETB — Ethiopian Birr (Br)' },
  { code: 'KES', label: 'KES — Kenyan Shilling (KSh)' },
  { code: 'NGN', label: 'NGN — Nigerian Naira (₦)' },
  { code: 'INR', label: 'INR — Indian Rupee (₹)' },
  { code: 'JPY', label: 'JPY — Japanese Yen (¥)' },
];

const LOCALE_LABELS: Record<(typeof SUPPORTED_LOCALES)[number], string> = {
  'en-US': 'English (United States) — 1,234.56',
  'en-GB': 'English (United Kingdom) — 1,234.56',
};

/** The fields this form owns. Branding is deliberately not among them. */
type FormState = Pick<
  TenantSettings,
  | 'name'
  | 'currency'
  | 'locale'
  | 'requiresQuotationApproval'
  | 'registrationNumber'
  | 'addressLine'
  | 'addressCity'
  | 'addressState'
  | 'addressPostalCode'
  | 'contactEmail'
  | 'contactPhone'
>;

const EMPTY_FORM: FormState = {
  name: '',
  currency: 'USD',
  locale: 'en-US',
  requiresQuotationApproval: true,
  registrationNumber: '',
  addressLine: '',
  addressCity: '',
  addressState: '',
  addressPostalCode: '',
  contactEmail: '',
  contactPhone: '',
};

const toFormState = (settings: TenantSettings): FormState => ({
  name: settings.name ?? '',
  currency: settings.currency,
  locale: settings.locale,
  requiresQuotationApproval: settings.requiresQuotationApproval,
  // Null means "never set". The inputs are controlled, so it becomes '' here
  // and is normalised back to null server-side on save.
  registrationNumber: settings.registrationNumber ?? '',
  addressLine: settings.addressLine ?? '',
  addressCity: settings.addressCity ?? '',
  addressState: settings.addressState ?? '',
  addressPostalCode: settings.addressPostalCode ?? '',
  contactEmail: settings.contactEmail ?? '',
  contactPhone: settings.contactPhone ?? '',
});

export const AccountSettingsPage = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { user, setUser } = useAuthStore();
  const { logout } = useLogout();
  const toast = useToast();
  const { fetchSettings, updateSettings, loading } = useTenantSettings();

  // One expression for "may edit workspace settings", used by every control on
  // the page. There used to be two — an `isBusinessOwner` const and a separate
  // `roleName !== 'Business Owner'` string comparison — which could disagree
  // for SUPER_ADMIN. Same class of bug as the duplicated nav arrays.
  const isBusinessOwner = user?.role === 'BUSINESS_OWNER';

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saved, setSaved] = useState<TenantSettings | null>(null);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const loadSettings = () => {
    fetchSettings()
      .then((settings) => {
        setSaved(settings);
        setForm(toFormState(settings));
      })
      .catch(() => toast.error('Could not load settings.'));
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
      const updated = await updateSettings(form);
      setSaved(updated);
      setForm(toFormState(updated));

      // The money formatter reads currency and locale from the auth store, so
      // it has to learn about the change without waiting for a page reload.
      if (user) {
        setUser({ ...user, tenantCurrency: updated.currency, tenantLocale: updated.locale });
      }
      toast.success('Settings saved.');
    } catch {
      toast.error('Could not save settings.');
    }
  };

  const handleDiscard = () => {
    if (saved) setForm(toFormState(saved));
  };

  const userName = user?.userId ? `User ${user.userId.substring(0, 8)}` : 'Settings User';
  const roleName =
    user?.role === 'SUPER_ADMIN'
      ? 'Super Admin'
      : user?.role === 'BUSINESS_OWNER'
        ? 'Business Owner'
        : 'Staff';

  const handleNavClick = (id: string) => {
    navigate(`/${tenantSlug || ''}/${id === 'dashboard' ? '' : id}`);
  };

  return (
    <AppLayout
      userName={userName}
      onLogout={handleLogout}
      onSettingsClick={() => navigate(`/${tenantSlug}/settings/profile`)}
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
            {/*
              Branding uploads immediately and is therefore NOT governed by the
              Save/Discard footer below. Previously the page-wide footer implied
              it was, so "Discard Changes" appeared to offer a way back from a
              logo replacement that had in fact already been committed. Saying so
              on the card is the honest fix; making Save/Discard actually govern
              an upload would mean deferring the upload and deleting the orphaned
              asset on discard, which is a media-lifecycle feature, not this.
            */}
            <Card padding="lg" className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardHeaderWithIcon}>
                  <ImagePlus size={17} />
                  <h2 className={styles.cardTitle}>Branding</h2>
                </div>
                <span className={styles.comingSoonBadge}>Saved automatically</span>
              </div>

              <ImagePicker
                kind="logo"
                tenantSlug={tenantSlug || ''}
                value={user?.tenantLogoUrl ?? null}
                onChange={(url) => user && setUser({ ...user, tenantLogoUrl: url })}
                label="Company logo"
                hint="Square image, at least 256×256. Shown in the sidebar and on customer-facing documents."
                disabled={!isBusinessOwner}
              />

              <ImagePicker
                kind="company-cover"
                tenantSlug={tenantSlug || ''}
                value={user?.tenantCoverImageUrl ?? null}
                onChange={(url) => user && setUser({ ...user, tenantCoverImageUrl: url })}
                variant="banner"
                label="Company banner"
                hint="Wide image, ideally 1600×400 or larger."
                disabled={!isBusinessOwner}
              />

              <p className={styles.helperText}>
                Images are saved as soon as you upload them — the buttons at the bottom of
                this page do not apply to them.
              </p>

              {!isBusinessOwner && (
                <p className={styles.helperText}>
                  Only Business Owners can change workspace branding.
                </p>
              )}
            </Card>

            <Card padding="lg" className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>Company Profile</h2>
              </div>

              <div className={styles.twoColGrid}>
                <TextInput
                  label="Company Name *"
                  placeholder="Your company name"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  disabled={!isBusinessOwner}
                />
                <TextInput
                  label="Registration Number"
                  placeholder="e.g. 12345678"
                  value={form.registrationNumber ?? ''}
                  onChange={(e) => setField('registrationNumber', e.target.value)}
                  disabled={!isBusinessOwner}
                />
              </div>

              <div>
                <TextInput
                  label="Registered Address"
                  placeholder="Street address"
                  value={form.addressLine ?? ''}
                  onChange={(e) => setField('addressLine', e.target.value)}
                  disabled={!isBusinessOwner}
                />
                <div className={styles.addressRow}>
                  <TextInput
                    placeholder="City"
                    aria-label="City"
                    value={form.addressCity ?? ''}
                    onChange={(e) => setField('addressCity', e.target.value)}
                    disabled={!isBusinessOwner}
                  />
                  <TextInput
                    placeholder="State/Region"
                    aria-label="State or region"
                    value={form.addressState ?? ''}
                    onChange={(e) => setField('addressState', e.target.value)}
                    disabled={!isBusinessOwner}
                  />
                  <TextInput
                    placeholder="Postal Code"
                    aria-label="Postal code"
                    value={form.addressPostalCode ?? ''}
                    onChange={(e) => setField('addressPostalCode', e.target.value)}
                    disabled={!isBusinessOwner}
                  />
                </div>
              </div>

              {/*
                No asterisk on the contact email: every existing tenant has none,
                so requiring it would make the form unsubmittable for all of them.
                It is optional in the database and optional here.
              */}
              <div className={styles.twoColGrid}>
                <TextInput
                  label="Primary Contact Email"
                  type="email"
                  placeholder="billing@yourcompany.com"
                  value={form.contactEmail ?? ''}
                  onChange={(e) => setField('contactEmail', e.target.value)}
                  disabled={!isBusinessOwner}
                />
                <TextInput
                  label="Contact Phone"
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={form.contactPhone ?? ''}
                  onChange={(e) => setField('contactPhone', e.target.value)}
                  disabled={!isBusinessOwner}
                />
              </div>
            </Card>

            <div className={styles.localizationGrid}>
              <Card padding="lg">
                <div className={styles.cardHeader}>
                  <div>
                    <h2 className={styles.cardTitle}>Localization</h2>
                    <p className={styles.cardSubtitle}>Regional formats for the organization.</p>
                  </div>
                </div>

                <div className={styles.sectionsColumn} style={{ marginTop: 'var(--spacing-md)' }}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="currencySelect">Base Currency</label>
                    <select
                      id="currencySelect"
                      className={styles.nativeSelect}
                      value={form.currency}
                      onChange={(e) => setField('currency', e.target.value)}
                      disabled={!isBusinessOwner}
                    >
                      {/*
                        A tenant whose stored currency is outside the shortlist
                        still sees its own value rather than being silently
                        switched to the first option on the next save.
                      */}
                      {!CURRENCY_OPTIONS.some((c) => c.code === form.currency) && (
                        <option value={form.currency}>{form.currency}</option>
                      )}
                      {CURRENCY_OPTIONS.map((c) => (
                        <option key={c.code} value={c.code}>{c.label}</option>
                      ))}
                    </select>
                    <p className={styles.helperText}>
                      Used for prices, quotations and reports. Amounts already recorded are
                      not converted — only the symbol they are shown with changes.
                    </p>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel} htmlFor="localeSelect">Number &amp; Date Conventions</label>
                    <select
                      id="localeSelect"
                      className={styles.nativeSelect}
                      value={form.locale}
                      onChange={(e) => setField('locale', e.target.value as FormState['locale'])}
                      disabled={!isBusinessOwner}
                    >
                      {SUPPORTED_LOCALES.map((code) => (
                        <option key={code} value={code}>{LOCALE_LABELS[code]}</option>
                      ))}
                    </select>
                  </div>

                  {/*
                    Timezone and Date Format are stored but not yet read by
                    anything — every date in the app still renders with the
                    browser's own formatting. They stay disabled rather than
                    letting someone pick a value the app would then ignore, which
                    would be a new version of exactly the problem this page was
                    built to fix. Enabled when the date-consumption pass lands.
                  */}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Timezone</label>
                    <select className={styles.nativeSelect} disabled value={saved?.timezone ?? 'UTC'}>
                      <option value={saved?.timezone ?? 'UTC'}>{saved?.timezone ?? 'UTC'}</option>
                    </select>
                  </div>

                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Date Format</label>
                    <select className={styles.nativeSelect} disabled value={saved?.dateFormat ?? 'MM/DD/YYYY'}>
                      <option value={saved?.dateFormat ?? 'MM/DD/YYYY'}>{saved?.dateFormat ?? 'MM/DD/YYYY'}</option>
                    </select>
                    <p className={styles.helperText}>
                      Timezone and date format are not applied to displayed dates yet.
                    </p>
                  </div>
                </div>
              </Card>

              {/* Language switching is a separate piece of work — see the i18n item. */}
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
                      checked={form.requiresQuotationApproval}
                      onChange={(e) => setField('requiresQuotationApproval', e.target.checked)}
                      disabled={loading || !isBusinessOwner}
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

          {isBusinessOwner && (
            <div className={styles.footer}>
              <Button variant="outline" onClick={handleDiscard} disabled={loading || !saved}>
                Discard Changes
              </Button>
              <Button variant="primary" onClick={handleSave} isLoading={loading}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </SettingsLayout>
    </AppLayout>
  );
};
