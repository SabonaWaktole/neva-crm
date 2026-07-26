import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../store/useAuthStore';
import { authService } from '../../../services/authService';
import { useLogout } from '../../../hooks/useLogout';
import { useNavigation } from '../../../hooks/useNavigation';
import { AppLayout } from '../../../components/layout/AppLayout/AppLayout';
import { Sidebar } from '../../../components/layout/Sidebar/Sidebar';
import { SettingsLayout } from '../../../components/layout/SettingsLayout/SettingsLayout';
import { Card } from '../../../components/ui/Card/Card';
import { TextInput } from '../../../components/ui/TextInput/TextInput';
import { Button } from '../../../components/ui/Button/Button';
import { ImagePicker } from '../../../components/ui/ImagePicker';
import { resolveMediaUrl } from '../../../services/mediaService';
import { ChevronRight } from 'lucide-react';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { logout } = useLogout();
  const location = useLocation();

  const { user, setUser } = useAuthStore();
  const navItems = useNavigation(user, location.pathname);
  
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isBusinessOwner = user?.role === 'BUSINESS_OWNER';

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || '');
      setLastName(user.lastName || '');
      setPhone(user.phone || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = (id: string) => {
    navigate(`/${tenantSlug || ''}/${id === 'dashboard' ? '' : id}`);
  };

  const userName = user?.userId ? `User ${user.userId.substring(0, 8)}` : 'Settings User';
  const roleName = user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'BUSINESS_OWNER' ? 'Business Owner' : 'Staff';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      await authService.updateProfile({
        firstName: firstName || null,
        lastName: lastName || null,
        phone: phone || null,
        email: isBusinessOwner ? email : undefined, // Only send email if Business Owner
      });
      
      // Update local state
      if (user) {
        setUser({
          ...user,
          firstName: firstName || null,
          lastName: lastName || null,
          phone: phone || null,
          email: isBusinessOwner ? email : user.email,
        });
      }
      
      setMessage('Profile updated successfully');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout
      userName={userName}
      onLogout={handleLogout}
      onSettingsClick={() => navigate(`/${tenantSlug}/settings/profile`)}
      userAvatarSrc={resolveMediaUrl(user?.avatarUrl)}
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
      <SettingsLayout activeNavId="profile">
        <div className={styles.container}>
          <div className={styles.breadcrumbWrapper}>
            <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
              <ol className={styles.breadcrumbList}>
                <li><a href="#settings" onClick={(e) => { e.preventDefault(); navigate(`/${tenantSlug}/settings/profile`); }} className={styles.breadcrumbLink}>Settings</a></li>
                <li><ChevronRight size={14} /></li>
                <li aria-current="page" className={styles.breadcrumbCurrent}>My Profile</li>
              </ol>
            </nav>
          </div>

          <h1 className={styles.title}>My Profile</h1>

          {/*
            Media lives in its own card and saves immediately on upload — it
            deliberately does not participate in the form below, because an
            image the user has already cropped and confirmed should not be
            waiting behind a "Save Changes" click.
          */}
          <Card padding="lg" className={styles.mediaCard}>
            <div className={styles.mediaHeader}>
              <h2 className={styles.mediaTitle}>Photos</h2>
              <p className={styles.mediaSubtitle}>
                Your profile photo appears next to your name across the workspace.
              </p>
            </div>

            <ImagePicker
              kind="avatar"
              tenantSlug={tenantSlug || ''}
              value={user?.avatarUrl ?? null}
              onChange={(url) => user && setUser({ ...user, avatarUrl: url })}
              label="Profile photo"
              hint="Square image, at least 256×256. JPEG, PNG, WebP, GIF or AVIF up to 8 MB."
            />

            <ImagePicker
              kind="user-cover"
              tenantSlug={tenantSlug || ''}
              value={user?.coverImageUrl ?? null}
              onChange={(url) => user && setUser({ ...user, coverImageUrl: url })}
              variant="banner"
              label="Cover photo"
              hint="Wide image, ideally 1600×400 or larger."
            />
          </Card>

          <Card padding="lg">
            {message && (
              <div className={`${styles.banner} ${styles.successBanner}`}>
                {message}
              </div>
            )}
            {error && (
              <div className={`${styles.banner} ${styles.errorBanner}`}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.nameRow}>
                <TextInput
                  label="First Name"
                  value={firstName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                  placeholder="John"
                />
                <TextInput
                  label="Last Name"
                  value={lastName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                  placeholder="Doe"
                />
              </div>

              <TextInput
                label="Email Address"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                disabled={!isBusinessOwner}
              />
              {!isBusinessOwner && (
                <p className={styles.helperText}>
                  Only Business Owners can change their email address.
                </p>
              )}

              <TextInput
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhone(e.target.value)}
                placeholder="+1 234 567 8900"
              />

              <div className={styles.formActions}>
                <Button type="submit" variant="primary" isLoading={loading}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </SettingsLayout>
    </AppLayout>
  );
};
