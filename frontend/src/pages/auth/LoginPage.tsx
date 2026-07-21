import { useState } from 'react';
import {} from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Network } from 'lucide-react';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput';
import { Button } from '../../components/ui/Button/Button';
import { useLogin } from '../../hooks/useLogin';

export const LoginPage = () => {
  const { tenantSlug } = useParams();
  const navigate = useNavigate();
  const { login, isLoading, error } = useLogin();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const actualTenantSlug = await login(email, password, tenantSlug || null);
      if (actualTenantSlug) {
        navigate(`/${actualTenantSlug}/dashboard`);
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Nexus CRM account"
      logoIcon={<Network size={32} color="var(--color-primary)" />}
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }} onSubmit={handleSubmit}>
        {error && (
          <div style={{ color: 'var(--color-error)', fontSize: 'var(--font-size-label-sm)', background: 'var(--color-error-light)', padding: 'var(--spacing-sm)', borderRadius: 'var(--radius-sm)' }}>
            {error}
          </div>
        )}
        <TextInput 
          label="Email Address" 
          placeholder="name@company.com" 
          type="email"
          id="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          <PasswordInput 
            label="Password" 
            placeholder="••••••••" 
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link 
              to={`/${tenantSlug || 'admin'}/forgot-password`} 
              style={{ 
                fontFamily: 'var(--font-family-base)', 
                fontSize: 'var(--font-size-label-sm)', 
                color: 'var(--color-primary)', 
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div style={{ paddingTop: 'var(--spacing-sm)' }}>
          <Button fullWidth variant="primary" type="submit" isLoading={isLoading}>
            Sign In
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
