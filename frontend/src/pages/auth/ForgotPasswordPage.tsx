import React from 'react';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { Button } from '../../components/ui/Button/Button';

export const ForgotPasswordPage = () => {
  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to reset your password."
      logoIcon={<span className="material-symbols-outlined text-[32px] text-primary" style={{ fontSize: 32, color: 'var(--color-primary)' }}>lock_reset</span>}
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }} onSubmit={(e) => e.preventDefault()}>
        <TextInput 
          label="Email Address" 
          placeholder="name@company.com" 
          type="email"
          id="email"
        />
        
        <div style={{ paddingTop: 'var(--spacing-sm)', display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          <Button fullWidth variant="primary" type="submit">
            Send Reset Link
          </Button>
          
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <a 
              href="#login" 
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
            </a>
          </div>
        </div>
      </form>
    </AuthLayout>
  );
};
