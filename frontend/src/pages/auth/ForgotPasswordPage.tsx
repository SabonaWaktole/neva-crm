import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { Button } from '../../components/ui/Button/Button';
import { useForgotPassword } from '../../hooks/useForgotPassword';

export const ForgotPasswordPage = () => {
  const { tenantSlug } = useParams();
  const { requestReset, isLoading, error, isSuccess } = useForgotPassword();
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await requestReset(email, tenantSlug || null);
    } catch (err) {
      // Error handled by hook
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset your password."
      logoIcon={<span className="material-symbols-outlined text-[32px] text-primary" style={{ fontSize: 32, color: 'var(--color-primary)' }}>lock_reset</span>}
    >
      {isSuccess ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', alignItems: 'center', textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--color-success)' }}>check_circle</span>
          <p style={{ fontFamily: 'var(--font-family-base)', fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface)' }}>
            If an account exists with that email, we've sent a password reset link.
          </p>
          <Link 
            to={`/${tenantSlug || 'admin'}/login`}
            style={{ 
              fontFamily: 'var(--font-family-base)', 
              fontSize: 'var(--font-size-label-md)', 
              color: 'var(--color-primary)', 
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
            Back to Login
          </Link>
        </div>
      ) : (
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
          
          <div style={{ paddingTop: 'var(--spacing-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <Button fullWidth variant="primary" type="submit" isLoading={isLoading}>
              Send Reset Link
            </Button>
            
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Link 
                to={`/${tenantSlug || 'admin'}/login`}
                style={{ 
                  fontFamily: 'var(--font-family-base)', 
                  fontSize: 'var(--font-size-label-md)', 
                  color: 'var(--color-on-surface-variant)', 
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-xs)'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                Back to Login
              </Link>
            </div>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};
