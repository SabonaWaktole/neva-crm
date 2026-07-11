import React from 'react';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { PasswordInput } from '../../components/ui/PasswordInput/PasswordInput';
import { Button } from '../../components/ui/Button/Button';

export const ResetPasswordPage = () => {
  return (
    <AuthLayout
      title="Create new password"
      subtitle="Your new password must be different from previously used passwords."
      logoIcon={<span className="material-symbols-outlined text-[32px] text-primary" style={{ fontSize: 32, color: 'var(--color-primary)' }}>password</span>}
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }} onSubmit={(e) => e.preventDefault()}>
        <PasswordInput 
          label="New Password" 
          placeholder="••••••••" 
          id="new-password"
          helperText="Must be at least 12 characters with a mix of letters, numbers & symbols."
        />
        
        <PasswordInput 
          label="Confirm Password" 
          placeholder="••••••••" 
          id="confirm-password"
        />
        
        <div style={{ paddingTop: 'var(--spacing-sm)' }}>
          <Button fullWidth variant="primary" type="submit">
            Reset Password
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
