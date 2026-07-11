import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Handshake, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput';
import { Button } from '../../components/ui/Button/Button';
import { useAcceptInvitation } from '../../hooks/useAcceptInvitation';

export const StaffInvitationPage = () => {
  const { token } = useParams();
  const { acceptInvitation, isLoading, error, isSuccess } = useAcceptInvitation();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (newPassword !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    try {
      await acceptInvitation({
        token: token || '',
        newPassword,
      });
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <AuthLayout
      title="Join Workspace"
      subtitle="You've been invited to join a workspace on Nexus CRM. Create a password to get started."
      logoIcon={<Handshake size={32} color="var(--color-primary)" />}
    >
      {isSuccess ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', alignItems: 'center', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="var(--color-success)" />
          <p style={{ fontFamily: 'var(--font-family-base)', fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface)' }}>
            Your account has been created successfully. You can now log in.
          </p>
          <Link 
            to="/"
            style={{ 
              fontFamily: 'var(--font-family-base)', 
              fontSize: 'var(--font-size-label-md)', 
              color: 'var(--color-primary)', 
              textDecoration: 'none'
            }}
          >
            Go to Login
          </Link>
        </div>
      ) : (
        <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }} onSubmit={handleSubmit}>
          {(error || localError) && (
            <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-label-sm)', background: 'var(--color-error-light)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)' }}>
              {error || localError}
            </div>
          )}

          <PasswordInput
            label="Create Password"
            placeholder="••••••••"
            id="new-password"
            helperText="Min 8 chars, 1 uppercase, 1 lowercase, 1 digit."
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />

          <PasswordInput
            label="Confirm Password"
            placeholder="••••••••"
            id="confirm-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          <div style={{ paddingTop: 'var(--spacing-sm)' }}>
            <Button fullWidth variant="primary" type="submit" isLoading={isLoading}>
              Accept Invitation
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
