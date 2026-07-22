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
import { ChevronRight } from 'lucide-react';

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
      <SettingsLayout activeNavId="profile">
        <div style={{ maxWidth: '600px', margin: '0 auto', padding: '32px 16px' }}>
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', color: 'var(--color-on-surface-variant)', fontSize: 'var(--font-size-label-sm)', marginBottom: 'var(--spacing-xs)' }}>
              <ol style={{ display: 'flex', alignItems: 'center', listStyle: 'none', padding: 0, margin: 0, gap: '8px' }}>
                <li><a href="#settings" onClick={(e) => { e.preventDefault(); navigate(`/${tenantSlug}/settings/profile`); }} style={{ color: 'inherit', textDecoration: 'none' }}>Settings</a></li>
                <li><ChevronRight size={14} /></li>
                <li aria-current="page" style={{ color: 'var(--color-on-surface)', fontWeight: 600 }}>My Profile</li>
              </ol>
            </nav>
          </div>
          
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: 'var(--color-text)' }}>My Profile</h1>

      
      <Card padding="lg">
        {message && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: 'var(--color-success)', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
            {message}
          </div>
        )}
        {error && (
          <div style={{ padding: '12px', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', borderRadius: '4px', marginBottom: '16px', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ flex: 1 }}>
              <TextInput
                label="First Name"
                value={firstName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFirstName(e.target.value)}
                placeholder="John"
              />
            </div>
            <div style={{ flex: 1 }}>
              <TextInput
                label="Last Name"
                value={lastName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLastName(e.target.value)}
                placeholder="Doe"
              />
            </div>
          </div>

          <TextInput
            label="Email Address"
            type="email"
            value={email}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            disabled={!isBusinessOwner}
          />
          {!isBusinessOwner && (
            <p style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '-12px' }}>
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
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
