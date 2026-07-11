import React from 'react';
import { AuthLayout } from '../../components/layout/AuthLayout/AuthLayout';
import { TextInput } from '../../components/ui/TextInput/TextInput';
import { Button } from '../../components/ui/Button/Button';

export const StaffInvitationPage = () => {
  return (
    <AuthLayout
      title="Join Workspace"
      subtitle="You've been invited to join Corporate Modern on Nexus CRM."
      logoIcon={<span className="material-symbols-outlined text-[32px] text-primary" style={{ fontSize: 32, color: 'var(--color-primary)' }}>handshake</span>}
    >
      <form style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }} onSubmit={(e) => e.preventDefault()}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
          <p style={{ fontFamily: 'var(--font-family-base)', fontSize: 'var(--font-size-label-sm)', color: 'var(--color-on-surface-variant)', margin: 0 }}>Invited Email</p>
          <div style={{ padding: '8px 12px', backgroundColor: 'var(--color-surface-container-highest)', borderRadius: 'var(--radius-default)', border: '1px solid var(--color-outline-variant)' }}>
            <span style={{ fontFamily: 'var(--font-family-base)', fontSize: 'var(--font-size-body-md)', color: 'var(--color-on-surface)', fontWeight: 500 }}>jane.doe@example.com</span>
          </div>
        </div>

        <TextInput 
          label="Full Name" 
          placeholder="Jane Doe" 
          id="fullname"
        />

        <div style={{ paddingTop: 'var(--spacing-sm)' }}>
          <Button fullWidth variant="primary" type="submit">
            Accept Invitation
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};
