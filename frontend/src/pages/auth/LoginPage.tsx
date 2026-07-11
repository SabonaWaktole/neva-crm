import React from 'react';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput';
import { Button } from '../../components/ui/Button/Button';

export const LoginPage = () => {
  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Nexus CRM account"
      logoIcon={<span className="material-symbols-outlined text-[32px] text-primary" style={{ fontSize: 32, color: 'var(--color-primary)' }}>hub</span>}
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }} onSubmit={(e) => e.preventDefault()}>
        <TextInput 
          label="Email Address" 
          placeholder="name@company.com" 
          type="email"
          id="email"
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          <PasswordInput 
            label="Password" 
            placeholder="••••••••" 
            id="password"
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a 
              href="#forgot-password" 
              style={{ 
                fontFamily: 'var(--font-family-base)', 
                fontSize: 'var(--font-size-label-sm)', 
                color: 'var(--color-primary)', 
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              Forgot password?
            </a>
          </div>
        </div>

        <div style={{ paddingTop: 'var(--spacing-sm)' }}>
          <Button fullWidth variant="primary" type="submit">
            Sign In
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
