import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { Card } from '../../components/ui/Card/Card';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { Button } from '../../components/ui/Button/Button';
import { apiClient as api } from '../../api';

export const AcceptInvitationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [acceptedTenantSlug, setAcceptedTenantSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !email) {
      setError('Invalid invitation link. Missing token or email.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const response = await api.post('/auth/invitations/accept', {
        token,
        newPassword: password,
      });
      if (response.data.tenantSlug) {
        setAcceptedTenantSlug(response.data.tenantSlug);
      }
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Accept Invitation"
      subtitle={email ? `Join your team as ${email}` : 'Join your team'}
    >
      <Card padding="lg">
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ color: 'var(--color-primary)', marginBottom: '16px' }}>Invitation Accepted!</h3>
            <p style={{ marginBottom: '24px' }}>Your account has been created successfully.</p>
            <Button variant="primary" onClick={() => navigate(acceptedTenantSlug ? `/${acceptedTenantSlug}/login` : '/login')} fullWidth>
              Go to Login
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {error && (
              <div style={{ padding: '12px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '6px', fontSize: '14px' }}>
                {error}
              </div>
            )}
            

            <TextInput
              label="Create Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            
            <TextInput
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={loading}
              disabled={!token || !email}
              style={{ marginTop: '8px' }}
            >
              Accept Invitation
            </Button>
          </form>
        )}
      </Card>
    </AuthLayout>
  );
};
