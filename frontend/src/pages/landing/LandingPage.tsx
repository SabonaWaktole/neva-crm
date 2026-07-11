import { useNavigate } from 'react-router-dom';
import { Network, ArrowRight, Building2, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'var(--color-background)'
    }}>
      {/* Navigation Bar */}
      <nav style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--spacing-md) var(--spacing-2xl)',
        backgroundColor: 'var(--color-surface-container-lowest)',
        borderBottom: '1px solid var(--color-outline-variant)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Network size={28} color="var(--color-primary)" />
          <span style={{ 
            fontFamily: 'var(--font-family-display)', 
            fontSize: '20px', 
            fontWeight: 700, 
            color: 'var(--color-on-surface)' 
          }}>
            Nexus CRM
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Button variant="outline" onClick={() => navigate('/demo/login')}>
            Sign In Demo
          </Button>
          <Button variant="primary" onClick={() => navigate('/register-business')}>
            Start Free Trial
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '80px var(--spacing-xl)', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-primary-container)',
          color: 'var(--color-on-primary-container)',
          fontFamily: 'var(--font-family-label-md)',
          fontSize: 'var(--font-size-label-md)',
          fontWeight: 600,
          marginBottom: '32px'
        }}>
          <Zap size={14} />
          <span>Nexus v2.0 is now live!</span>
        </div>
        
        <h1 style={{
          maxWidth: '800px',
          fontFamily: 'var(--font-family-display)',
          fontSize: '64px',
          lineHeight: '1.1',
          fontWeight: 800,
          color: 'var(--color-on-surface)',
          margin: '0 0 24px 0',
          letterSpacing: '-0.03em'
        }}>
          Manage your enterprise with absolute clarity.
        </h1>
        
        <p style={{
          maxWidth: '600px',
          fontFamily: 'var(--font-family-body-lg)',
          fontSize: '20px',
          color: 'var(--color-on-surface-variant)',
          margin: '0 0 48px 0',
          lineHeight: '1.5'
        }}>
          The ultimate multi-tenant CRM designed for scale, speed, and security. 
          Empower your teams to do their best work in a unified workspace.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <Button 
            variant="primary" 
            icon={<ArrowRight size={18} />} 
            iconPosition="right"
            onClick={() => navigate('/register-business')}
            style={{ padding: '16px 32px', fontSize: '18px' }}
          >
            Create Your Workspace
          </Button>
        </div>

        {/* Feature Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '32px',
          marginTop: '80px',
          width: '100%',
          maxWidth: '1200px',
          textAlign: 'left'
        }}>
          <div style={{
            padding: '32px',
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: 'var(--elevation-1)'
          }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-primary-container)', color: 'var(--color-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Building2 size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: '20px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--color-on-surface)' }}>True Multi-Tenancy</h3>
            <p style={{ fontFamily: 'var(--font-family-body-md)', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1.6 }}>Isolated data environments ensuring complete privacy and dedicated branding for every workspace.</p>
          </div>

          <div style={{
            padding: '32px',
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: 'var(--elevation-1)'
          }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-secondary-container)', color: 'var(--color-on-secondary-container)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <ShieldCheck size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: '20px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--color-on-surface)' }}>Enterprise Security</h3>
            <p style={{ fontFamily: 'var(--font-family-body-md)', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1.6 }}>Bank-grade encryption, strict Role-Based Access Control (RBAC), and full compliance reporting.</p>
          </div>

          <div style={{
            padding: '32px',
            backgroundColor: 'var(--color-surface-container-lowest)',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--color-outline-variant)',
            boxShadow: 'var(--elevation-1)'
          }}>
            <div style={{ width: '48px', height: '48px', backgroundColor: 'var(--color-surface-variant)', color: 'var(--color-on-surface-variant)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
              <Zap size={24} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-family-headline-md)', fontSize: '20px', fontWeight: 600, margin: '0 0 12px 0', color: 'var(--color-on-surface)' }}>Lightning Fast</h3>
            <p style={{ fontFamily: 'var(--font-family-body-md)', color: 'var(--color-on-surface-variant)', margin: 0, lineHeight: 1.6 }}>Optimized API responses and instantaneous UI updates keep your team moving at the speed of thought.</p>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer style={{
        padding: '32px var(--spacing-2xl)',
        backgroundColor: 'var(--color-surface-container-lowest)',
        borderTop: '1px solid var(--color-outline-variant)',
        textAlign: 'center',
        color: 'var(--color-on-surface-variant)',
        fontFamily: 'var(--font-family-body-sm)',
        fontSize: '14px'
      }}>
        © 2026 Nexus CRM. All rights reserved.
      </footer>
    </div>
  );
};
