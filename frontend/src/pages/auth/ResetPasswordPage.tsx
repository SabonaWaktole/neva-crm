import { useState } from 'react';
import {} from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { Key, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput';
import { Button } from '../../components/ui/Button/Button';
import { useResetPassword } from '../../hooks/useResetPassword';

export const ResetPasswordPage = () => {
  const { tenantSlug } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword, isLoading, error, isSuccess } = useResetPassword();
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
      await resetPassword(token, newPassword);
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <AuthLayout
      title="Create new password"
      subtitle="Your new password must be different from previously used passwords."
      logoIcon={<Key size={32} color="var(--color-primary)" />}
    >
      {isSuccess ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', alignItems: 'center', textAlign: 'center' }}>
          <CheckCircle2 size={48} color="#059669" />
          <p style={{ fontFamily: 'var(--font-family-base)', fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface)' }}>
            Your password has been reset successfully.
          </p>
          <Link 
            to={`/${tenantSlug || 'admin'}/login`}
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
            <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-label-sm)', background: 'var(--color-error-container)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-default)' }}>
              {error || localError}
            </div>
          )}
          <PasswordInput 
            label="New Password" 
            placeholder="••••••••" 
            id="new-password"
            helperText="Must be at least 12 characters with a mix of letters, numbers & symbols."
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
              Reset Password
            </Button>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
