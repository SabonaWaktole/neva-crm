import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
      await login(email, password, tenantSlug || null);
      // Navigate to the dashboard after successful login
      navigate(`/${tenantSlug || ''}`);
    } catch (err) {
      // Error is handled by the hook
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Nexus CRM account"
      logoIcon={<span className="material-symbols-outlined text-[32px] text-primary" style={{ fontSize: 32, color: 'var(--color-primary)' }}>hub</span>}
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
